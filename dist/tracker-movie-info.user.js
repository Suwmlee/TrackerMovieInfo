// ==UserScript==
// @name         TrackerMovieInfo
// @namespace    https://github.com/Suwmlee/TrackerMovieInfo
// @version      0.7.11
// @description  增强PT站显示更多影片信息
// @author       suwmlee
// @match        *://movie.douban.com/subject/*
// @match        *://beyond-hd.me/torrents/*
// @match        *://beyond-hd.me/library/title/*
// @match        *://passthepopcorn.me/torrents*
// @match        *://passthepopcorn.me/torrents.php?id*
// @match        *://hdbits.org/browse.php*
// @match        *://hdbits.org/film/info?id=*
// @match        *://hdbits.org/details.php?id=*
// @require      https://code.jquery.com/jquery-1.12.4.js
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @connect      api.douban.com
// @connect      movie.douban.com
// @connect      m.douban.com
// @run-at       document-end
// ==/UserScript==
(() => {
  // src/common.js
  var isTodayGreater = (d1, days) => {
    d1 = new Date(d1);
    return +new Date() > d1.setDate(d1.getDate() + (days || 0));
  };
  var getFormattedDate = (date) => {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, "0");
    let day = date.getDate().toString().padStart(2, "0");
    return month + "/" + day + "/" + year;
  };
  var setValue_GM = (key, value) => {
    GM_setValue(key, value);
    let now = getFormattedDate(new Date());
    GM_setValue(key + "-added", now);
  };
  var clearExpired = (expiredday) => {
    let TMIlist = GM_listValues();
    for (const skey of TMIlist) {
      if (skey.startsWith("douban-")) {
        if (skey.endsWith("-added")) {
          continue;
        }
        let data = GM_getValue(skey + "-added");
        if (!data) {
          GM_deleteValue(skey);
        }
        if (isTodayGreater(data, expiredday)) {
          console.log("[TMI] \u6E05\u7406 " + skey);
          GM_deleteValue(skey);
          GM_deleteValue(skey + "-added");
        }
      }
    }
  };

  // src/request.js
  var getURL_GM = (url, callback) => {
    GM_xmlhttpRequest({
      method: "GET",
      url,
      onload: function(response) {
        if (response.status >= 200 && response.status < 400) {
          callback(response.responseText, response);
        } else {
          console.error(`Error getting ${url}:`, response.status, response.statusText, response.responseText);
          callback("error", response);
        }
      },
      onerror: function(error) {
        console.error(`Error during GM_xmlHttpRequest to ${url}:`, error.statusText);
        callback(error.statusText, error);
      }
    });
  };

  // src/douban.js
  function parseDoubanDetail(html) {
    var raw_data = {};
    raw_data.title = $(html).filter("title").text().replace("(\u8C46\u74E3)", "").trim();
    try {
      raw_data.image = $("#mainpic img", html)[0].src.replace(
        /^.+(p\d+).+$/,
        (_, p1) => `https://img9.doubanio.com/view/photo/l_ratio_poster/public/${p1}.jpg`
      );
    } catch (e) {
      raw_data.image = "null";
    }
    try {
      raw_data.year = parseInt($("#content>h1>span.year", html).text().slice(1, -1));
    } catch (e) {
      raw_data.year = "";
    }
    try {
      raw_data.aka = $('#info span.pl:contains("\u53C8\u540D")', html)[0].nextSibling.textContent.trim();
    } catch (e) {
      raw_data.aka = "null";
    }
    try {
      raw_data.average = parseFloat($("#interest_sectl", html).find('[property="v:average"]').text());
    } catch (e) {
      raw_data.average = "";
    }
    try {
      raw_data.votes = parseInt($("#interest_sectl", html).find('[property="v:votes"]').text());
    } catch (e) {
      raw_data.votes = "";
    }
    try {
      raw_data.genre = $('#info span[property="v:genre"]', html).toArray().map((e) => e.innerText.trim()).join("/");
    } catch (e) {
      raw_data.genre = "";
    }
    try {
      raw_data.region = $('#info span.pl:contains("\u5236\u7247\u56FD\u5BB6/\u5730\u533A")', html)[0].nextSibling.textContent.trim();
    } catch (e) {
      raw_data.region = "";
    }
    try {
      raw_data.director = $('#info span.pl:contains("\u5BFC\u6F14")', html)[0].nextSibling.nextSibling.textContent.trim();
    } catch (e) {
      raw_data.director = "";
    }
    try {
      raw_data.language = $('#info span.pl:contains("\u8BED\u8A00")', html)[0].nextSibling.textContent.trim();
    } catch (e) {
      raw_data.language = "";
    }
    try {
      raw_data.releaseDate = $('#info span[property="v:initialReleaseDate"]', html).toArray().map((e) => e.innerText.trim()).sort((a, b) => new Date(a) - new Date(b)).join("/");
    } catch (e) {
      raw_data.releaseDate = "";
    }
    try {
      raw_data.runtime = $('span[property="v:runtime"]', html).text();
    } catch (e) {
      raw_data.runtime = "";
    }
    try {
      raw_data.cast = $('#info span.pl:contains("\u4E3B\u6F14")', html)[0].nextSibling.nextSibling.textContent.trim();
    } catch (e) {
      raw_data.cast = "";
    }
    try {
      let description = Array.from($('#link-report-intra>[property="v:summary"],#link-report-intra>span.all.hidden', html)[0].childNodes).filter((e) => e.nodeType === 3).map((e) => e.textContent.trim()).join("\n");
      let fix = description.replace(/^|\n/g, "<br>\n\u3000\u3000") + "\n\n";
      if (fix.indexOf("<br>") == 0)
        fix = fix.substring(4);
      raw_data.summary = fix;
    } catch (e) {
      raw_data.summary = "";
    }
    return raw_data;
  }
  var queryDoubanIDByImdbID = (imdbId, callback) => {
    console.log("[TMI]\u4F7F\u7528imdb id\u67E5\u8BE2\u8C46\u74E3id...");
    var search_url = "https://m.douban.com/search/?query=" + imdbId + "&type=movie";
    getURL_GM(search_url, function(doc) {
      if ($("ul.search_results_subjects", doc).length) {
        var douban_id = $("ul.search_results_subjects", doc).find("a").attr("href").match(/subject\/(\d+)/)[1];
        callback(douban_id);
      } else {
        callback();
      }
    });
  };
  var getDoubanInfo = (imdbLink, callback) => {
    let imdbId = imdbLink.match(/tt\d+/)[0];
    let data = GM_getValue("douban-" + imdbId);
    if (data) {
      console.log("[TMI]\u5DF2\u7ECF\u5B58\u50A8\u6B64\u8C46\u74E3\u8BCD\u6761");
      callback(data);
    } else {
      console.log("[TMI]\u67E5\u8BE2\u8C46\u74E3\u8BCD\u6761...");
      queryDoubanIDByImdbID(imdbId, function(douban_id) {
        var douban_url = "https://movie.douban.com/subject/" + douban_id;
        let data2 = {
          id: douban_id,
          url: douban_url
        };
        getURL_GM(douban_url, function(html) {
          if (html) {
            let details = parseDoubanDetail(html);
            details.id = data2.id;
            details.url = data2.url;
            setValue_GM("douban-" + imdbId, details);
            callback(details);
          }
        });
      });
    }
  };
  var doubaninit = () => {
    var site_url = decodeURI(location.href);
    var subject_url = site_url.match(/https?:\/\/movie.douban.com\/subject\/\d+/);
    if (subject_url) {
      try {
        let imdbId = $('#info span.pl:contains("IMDb")', document)[0].nextSibling.textContent.trim();
        if (!imdbId) {
          imdbId = $('#info span.pl:contains("IMDb")', document)[0].nextSibling.nextSibling.textContent.trim();
          if (!imdbId)
            return;
        }
        let data = GM_getValue("douban-" + imdbId);
        if (data) {
          console.log("[TMI]\u5DF2\u7ECF\u5B58\u50A8\u6B64\u8C46\u74E3\u8BCD\u6761");
        } else {
          console.log("[TMI]\u8C46\u74E3\u9875\u9762\u5185,\u5C1D\u8BD5\u83B7\u53D6\u8BCD\u6761\u4FE1\u606F...");
          let details = parseDoubanDetail(document);
          details.id = subject_url[0].match(/\d+/);
          details.url = subject_url[0];
          details.title = document.title.replace("(\u8C46\u74E3)", "").trim();
          setValue_GM("douban-" + imdbId, details);
        }
      } catch (error) {
      }
    }
  };

  // src/sites/beyondhd.js
  function insertBHDDoubanRating(parent, url, rating) {
    parent.insertAdjacentHTML(
      "beforeend",
      `<span class="badge-meta2" title="\u8C46\u74E3\u8BC4\u5206">
        <a href="${url}" target="_blank">
            <span style="color:green">
                <i class="fal fa-star"></i>
            </span>
        ${rating}</a>
    </span>`
    );
  }
  function replaceBHDDoubanName(data) {
    const bhdtitle = $("h1[class='bhd-title-h1']");
    bhdtitle.prepend(`<a  target='_blank' href="https://movie.douban.com/subject/${data.id}">${data.title.split(" ")[0]} </a>`);
  }
  function replaceBHDDoubanIntro(intro) {
    const detail = $("div[class='movie-overview']")[0];
    detail.innerHTML = intro;
  }
  var beyondhd_default = () => {
    const imdbSpan = $("span[title='IMDb Rating']");
    if (!imdbSpan) {
      return;
    }
    const imdbLink = imdbSpan[0].children[0].href;
    if (!imdbLink) {
      return;
    }
    getDoubanInfo(imdbLink, function(detail) {
      if (!detail)
        return;
      replaceBHDDoubanName(detail);
      insertBHDDoubanRating(imdbSpan[0].parentElement, detail.url, detail.average);
      replaceBHDDoubanIntro(detail.summary);
    });
  };

  // src/sites/passthepopcorn.js
  var passthepopcorn_default = () => {
    var site_url = decodeURI(location.href);
    if (site_url.match(/^https?:\/\/passthepopcorn.me\/torrents.php.*/)) {
      let formatText = function(str, color) {
        var style = [];
        if (boldfont)
          style.push("font-weight:bold");
        if (coloredfont && color)
          style.push(`color:${groupnamecolor}`);
        return `<span style="${style.join(";")}">${str}</span>`;
      }, setGroupName = function(groupname, target) {
        var color = true;
        if ($(target).parent().find(".golden-popcorn-character").length) {
          color = false;
        }
        if ($(target).parent().find(".torrent-info__download-modifier--free").length) {
          color = true;
        }
        if ($(target).parent().find(".torrent-info-link--user-leeching").length) {
          color = false;
        }
        if ($(target).parent().find(".torrent-info-link--user-seeding").length) {
          color = false;
        }
        if ($(target).parent().find(".torrent-info-link--user-downloaded").length) {
          color = false;
        }
        if (isEmptyOrBlockedGroup(groupname)) {
          if ($(target).text().split(delimiter).includes(blockedgroup)) {
            $(target).html(function(i, htmlsource) {
              return htmlsource.replace(delimiter + blockedgroup, "");
            });
            groupname = blockedgroup;
          } else if (showblankgroups) {
            groupname = placeholder;
          }
        }
        if (!isEmpty(groupname)) {
          var location2 = 1;
          if (location2 == 1) {
            return $(target).append(delimiter).append(formatText(groupname, color));
          } else {
            return $(target).prepend(delimiter).prepend(formatText(groupname, color));
          }
        }
      }, setDoubanLink = function(imdb_id, target) {
        if (!isEmpty(imdb_id)) {
          try {
            if (!imdb_id.startsWith("tt")) {
              imdb_id = "tt" + imdb_id;
            }
            var td = target.parentNode.parentNode.getElementsByTagName("td")[1];
            var div = td.getElementsByClassName("basic-movie-list__movie__ratings-and-tags")[0];
            var new_div = document.createElement("div");
            new_div.setAttribute("class", "basic-movie-list__movie__rating-container");
            new_div.style.fontweight = "bold";
            var span = document.createElement("span");
            span.setAttribute("class", "basic-movie-list__movie__rating__title");
            var a = document.createElement("a");
            a.href = douban_prex + imdb_id;
            a.text = "Douban";
            a.target = "_blank";
            span.appendChild(a);
            new_div.appendChild(span);
            div.insertBefore(new_div, div.firstElementChild);
            a.onclick = function(e) {
              e.preventDefault();
              queryDoubanIDByImdbID(imdb_id, function(douban_id) {
                if (douban_id) {
                  console.log(douban_id);
                  a.href = `https://movie.douban.com/subject/${douban_id}/`;
                  window.open(a.href, target = "_blank");
                } else {
                  alert("\u65E0\u5339\u914D\u8C46\u74E3\u8BCD\u6761,\u53EF\u80FD\u672A\u6DFB\u52A0\u6216\u5DF2\u88AB\u5C4F\u853D...");
                }
              });
            };
          } catch (err) {
          }
        }
      }, isEmpty = function(str) {
        return !str || String(str).trim().length === 0;
      }, isEmptyOrBlockedGroup = function(str) {
        return isEmpty(str) || str === blockedgroup;
      };
      const boldfont = true;
      const coloredfont = true;
      const groupnamecolor = "#20B2AA";
      const showblankgroups = false;
      const placeholder = "Null";
      const delimiter = " / ";
      const blockedgroup = "TBB";
      const moviesearchtitle = "Browse Torrents ::";
      const douban_prex = "https://movie.douban.com/j/subject_suggest?q=tt";
      if (document.title.indexOf(moviesearchtitle) !== -1) {
        var movies = PageData.Movies;
        var releases = [];
        var imdb_urls = [];
        movies.forEach(function(movie) {
          imdb_urls[movie.GroupId] = movie.ImdbId;
          movie.GroupingQualities.forEach(function(torrentgroup) {
            torrentgroup.Torrents.forEach(function(torrent) {
              releases[torrent.TorrentId] = torrent.ReleaseGroup;
            });
          });
        });
        if (PageData.ClosedGroups != 1) {
          releases.forEach(function(groupname, index) {
            $(`tbody a.torrent-info-link[href$="torrentid=${index}"]`).each(function() {
              setGroupName(groupname, this);
            });
          });
          imdb_urls.forEach(function(imdbid, groupid) {
            $(`tbody a.basic-movie-list__movie__cover-link[href$="id=${groupid}"]`).each(function() {
              setDoubanLink(imdbid, this);
            });
          });
        } else {
          let mutationHandler = function(mutationRecords) {
            mutationRecords.forEach(function(mutation) {
              if (mutation.addedNodes.length > 0) {
                $(mutation.addedNodes).find("a.torrent-info-link").each(function() {
                  var mutatedtorrentid = this.href.match(/\btorrentid=(\d+)\b/)[1];
                  var groupname = releases[mutatedtorrentid];
                  setGroupName(groupname, this);
                });
              }
            });
          };
          var targetNodes = $("tbody");
          var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
          var myObserver = new MutationObserver(mutationHandler);
          var obsConfig = { childList: true, characterData: false, attributes: false, subtree: false };
          targetNodes.each(function() {
            myObserver.observe(this, obsConfig);
          });
        }
      } else if (document.title.indexOf("upload") !== -1) {
        try {
          $(".torrent-info-link").map((index, e) => {
            var groupname = $(e).attr("title");
            groupname = get_group_name(groupname, "");
            setGroupName(groupname, e);
          });
        } catch (err) {
        }
      } else {
        $("table#torrent-table a.torrent-info-link").each(function() {
          var groupname = $(this).parent().parent().data("releasegroup");
          setGroupName(groupname, this);
        });
      }
      $(".torrent-info__download-modifier--free").each(function() {
        $(this).css("color", "#039AFF");
      });
      if (location.href.match(/id=\d+/)) {
        $(".group_torrent_header").each(function() {
          var $img = $(this).find("a").eq(3).find("img");
          var $old_url = $img.prop("src");
          $img.prop("src", $old_url);
        });
      }
    }
    if (site_url.match(/^https?:\/\/passthepopcorn.me\/torrents.php\?id.*/)) {
      const addInfoToPage = (data) => {
        if (isChinese(data.title)) {
          $(".page__title").prepend(`<a  target='_blank' href="https://movie.douban.com/subject/${data.id}">[${data.title.split(" ")[0]}] </a>`);
        }
        if (data.summary) {
          var tmp = data.summary.split("   ");
          data.summary = "";
          for (var i = 0; i < tmp.length; i++) {
            var tmp_str = tmp[i].trim();
            if (tmp_str) {
              data.summary += "	" + tmp_str + "\n";
            }
          }
          $("#movieinfo").before(`<div class="panel">
                <div class="panel__heading"><span class="panel__heading__title">\u7B80\u4ECB</span></div>
                <div class="panel__body"  id="intro">&nbsp&nbsp&nbsp&nbsp${data.summary.trim()}</div></div>`);
        }
        $("#torrent-table").parent().prepend($("#movie-ratings-table").parent());
        try {
          $("#movieinfo").before(`
                    <div class="panel">
                    <div class="panel__heading"><span class="panel__heading__title">\u7535\u5F71\u4FE1\u606F</span></div>
                    <div class="panel__body">
                    <div><strong>\u5BFC\u6F14:</strong> ${data.director}</div>
                    <div><strong>\u6F14\u5458:</strong> ${data.cast}</div>
                    <div><strong>\u7C7B\u578B:</strong> ${data.genre}</div>
                    <div><strong>\u5236\u7247\u56FD\u5BB6/\u5730\u533A:</strong> ${data.region}</div>
                    <div><strong>\u8BED\u8A00:</strong> ${data.language}</div>
                    <div><strong>\u65F6\u957F:</strong> ${data.runtime}</div>
                    <div><strong>\u53C8\u540D:</strong>  ${data.aka}</div>
                    </div>
                `);
        } catch (err) {
        }
        var total = 10;
        var split = "/";
        if (!data.average) {
          data.average = "\u6682\u65E0\u8BC4\u5206";
          total = "";
          data.votes = 0;
          split = "";
        }
        $("#movie-ratings-table tr").prepend(
          `<td colspan="1" style="width: 95px;">
                <center>
                <a target="_blank" class="rating" href="https://movie.douban.com/subject/${data.id}" rel="noreferrer">
                <div>
                    <span class="icon-pt1" style="font-size: 25px;
                    display: inline-block;
                    text-align: center;
                    border: 1px solid #41be57;
                    background-color: #41be57;
                    color: white;
                    border-radius: 10px;
                    width: 40px;
                    height: 40px;
                    line-height: 36px;">\u8C46</span>
                </div>
                </a>
                </center>
                </td>
                <td style="width: 120px;">
                <span class="rating">${data.average}</span>
                <span class="mid">${split}</span>
                <span class="outof"> ${total} </span>
                <br>(${data.votes} votes)</td>`
        );
      };
      const isChinese = (title) => {
        return /[\u4e00-\u9fa5]+/.test(title);
      };
      const imdbLink = $("#imdb-title-link").attr("href");
      if (!imdbLink) {
        return;
      }
      getDoubanInfo(imdbLink, function(detail) {
        if (detail) {
          addInfoToPage(detail);
        } else {
          return;
        }
      });
    }
  };

  // src/sites/hdbits.js
  var hdbits_default = () => {
    var site_url = decodeURI(location.href);
    if (site_url.match(/^https?:\/\/hdbits.org\/details.php\?id=.*/)) {
      try {
        const addInfoToPage = (data) => {
          if (data.cast.split("/").length > 8) {
            data.cast = data.cast.split("/").slice(0, 8).join("/");
          }
          if (data.director.split("/").length > 8) {
            data.director = data.director.split("/").slice(0, 8).join("/");
          }
          var label = "- ";
          var status = "block";
          var image_snippet = "";
          var douban_collapse = false;
          if (douban_collapse) {
            label = "+ ";
            status = "none";
          }
          try {
            var a_element = $("table.contentlayout").find('a[href^="/film/info?id"]')[0];
            a_element.firstChild.setAttribute("style", "max-height: 660px; width: 250px;");
            image_snippet = a_element.outerHTML;
          } catch (e) {
            image_snippet = "";
          }
          $("#details > tbody > tr").eq(1).after(`
                    <tr><td>
                    <div id="l20201117" class="label collapsable" onclick="showHideEl(20201117)"><span class="plusminus">${label}</span>\u5173\u4E8E\u672C\u7247 (\u8C46\u74E3\u4FE1\u606F)</div>
                    <div id="c20201117" class="hideablecontent" style="display: ${status};">
                        <table class="contentlayout" cellspacing="0"><tbody>
                            <tr>
                                <td rowspan="3" width="2">${image_snippet}</td>
                                <td colspan="2"><h1><a href="https://movie.douban.com/subject/${data.id}" target="_blank">${data.title}</a> (${data.year})</h1><h3>${data.aka}</h3></td>
                            </tr>
                            <tr>
                                <td><table class="content" cellspacing="0" id="imdbinfo" style="white-space: nowrap;"><tbody>
                                    <tr><th>\u8BC4\u5206</th><td>${data.average} (${data.votes}\u4EBA\u8BC4\u4EF7)</td></tr>
                                    <tr><th>\u7C7B\u578B</th><td>${data.genre}</td></tr>
                                    <tr><th>\u56FD\u5BB6/\u5730\u533A</th><td>${data.region}</td></tr>
                                    <tr><th>\u5BFC\u6F14</th><td>${data.director.replace(/\//g, "<br>    ")}</td></tr>
                                    <tr><th>\u8BED\u8A00</th><td>${data.language}</td></tr>
                                    <tr><th>\u4E0A\u6620\u65E5\u671F</th><td>${data.releaseDate.replace(/\//g, "<br>    ")}</td></tr>
                                    <tr><th>\u7247\u957F</th><td>${data.runtime}</td></tr>
                                    <tr><th>\u6F14\u5458</th><td>${data.cast.replace(/\//g, "<br>    ")}</td></tr>
                                </tbody></table></td>
                                <td id="plotcell"><table class="content" cellspacing="0"><tbody>
                                    <tr><th>\u7B80\u4ECB</th></tr><tr><td>${data.summary == "" ? "\u672C\u7247\u6682\u65E0\u7B80\u4ECB" : data.summary.replace(/ 　　/g, "<br>\u3000\u3000")}</td></tr>
                                </tbody></table></td>
                            </tr>
                            <tr>
                                <td colspan="2" id="actors"></td>
                            </tr>
                        </tbody></table>
                    </div>
                    </td></tr>
                `);
          $('div.collapsable:contains("About this film (from IMDB)")').parent().find("img").first().css({ "width": "250px", "max-height": "660px" });
          if (!douban_collapse) {
            $('div.collapsable:contains("About this film (from IMDB)")').click();
          }
        };
        var links = $("table.contentlayout").find('a[href^="https://www.imdb.com/title/"]');
        if (links.length == 0) {
          links = $(".showlinks").find('a[href^="https://www.imdb.com/title/"]');
          if (links.length == 0) {
            return;
          }
        }
        getDoubanInfo(links[0].href, function(detail) {
          if (detail) {
            addInfoToPage(detail);
          } else {
            return;
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
    if (site_url.match(/^https?:\/\/hdbits.org\/film\/info\?id=.*/)) {
      try {
        const addInfoToPage = (data) => {
          const hdbtitle = $("table.contentlayout").find('a[href^="https://www.imdb.com/title/"]');
          hdbtitle.prepend(`<a  target='_blank' href="https://movie.douban.com/subject/${data.id}">[${data.title.split(" ")[0]}] </a>`);
          $("#plotcell")[0].innerHTML = `<table class="content" cellspacing="0"><tbody>
                <tr><th>\u7B80\u4ECB</th></tr><tr><td>${data.summary == "" ? "\u672C\u7247\u6682\u65E0\u7B80\u4ECB" : data.summary.replace(/ 　　/g, "<br>\u3000\u3000")}</td></tr>
            </tbody></table>`;
        };
        var links = $("table.contentlayout").find('a[href^="https://www.imdb.com/title/"]');
        if (links.length == 0) {
          links = $(".showlinks").find('a[href^="https://www.imdb.com/title/"]');
          if (links.length == 0) {
            return;
          }
        }
        getDoubanInfo(links[0].href, function(detail) {
          if (detail) {
            addInfoToPage(detail);
          } else {
            return;
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
    if (site_url.match(/^https?:\/\/hdbits.org\/browse.php/)) {
      try {
        $("#torrent-list>thead>tr>th:first-child").after('<th colspan="1" class="center" style="width:42px">Poster</th>');
        $("#torrent-list>tbody>tr").each(function() {
          var imagesrc = $(this).find("td>div>img").attr("src");
          $(this).find("td:eq(2)").before(`<td class="center catcell"><img style="max-height:45px;max-width:100%" src=${imagesrc} alt></td>`);
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  // src/sites/index.js
  var siteinit = () => {
    let host = location.hostname;
    if (host === "beyond-hd.me") {
      beyondhd_default();
    } else if (host === "passthepopcorn.me") {
      passthepopcorn_default();
    } else if (host === "hdbits.org") {
      hdbits_default();
    }
  };
  var sites_default = siteinit;

  // src/index.js
  (() => {
    doubaninit();
    sites_default();
    clearExpired(90);
  })();
})();
