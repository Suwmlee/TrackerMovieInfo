// ==UserScript==
// @name         TrackerMovieInfo
// @namespace    https://github.com/Suwmlee/TrackerMovieInfo
// @version      0.4.1
// @description  Show Douban ratings on Trackers
// @description: zh-CN 在tracker站点显示豆瓣信息
// @author       Suwmlee
// @match        *://beyond-hd.me/torrents/*
// @match        *://beyond-hd.me/library/title/*
// @match        *://passthepopcorn.me/torrents*
// @match        *://passthepopcorn.me/torrents.php?id*
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.listValues
// @grant        GM.deleteValue
// @connect      api.douban.com
// @connect      movie.douban.com
// @connect      m.douban.com
// @connect      p.media-imdb.com
// @connect      www.omdbapi.com
// ==/UserScript==


function getURL_GM(url) {
    return new Promise(resolve => GM.xmlHttpRequest({
        method: 'GET',
        url: url,
        onload: function (response) {
            if (response.status >= 200 && response.status < 400) {
                resolve(response.responseText);
            } else {
                console.error(`Error getting ${url}:`, response.status, response.statusText, response.responseText);
                resolve();
            }
        },
        onerror: function (response) {
            console.error(`Error during GM.xmlHttpRequest to ${url}:`, response.statusText);
            resolve();
        }
    }));
}

async function getJSON_GM(url) {
    const data = await getURL_GM(url);
    if (data) {
        return JSON.parse(data);
    }
}

async function getJSONP_GM(url) {
    const data = await getURL_GM(url);
    if (data) {
        const end = data.lastIndexOf(')');
        const [, json] = data.substring(0, end).split('(', 2);
        return JSON.parse(json);
    }
}

async function getJSON(url) {
    try {
        const response = await fetch(url);
        if (response.status >= 200 && response.status < 400)
            return await response.json();
        console.error(`Error fetching ${url}:`, response.status, response.statusText, await response.text());
    }
    catch (e) {
        console.error(`Error fetching ${url}:`, e);
    }
}

async function getDoubanInfo(id) {
    let data = await GM.getValue("tmi-" + id)
    if (data) {
        console.log("already queried Douban Info")
        return data;
    }
    const search = await getJSON_GM(`https://movie.douban.com/j/subject_suggest?q=${id}`);
    if (search && search.length > 0 && search[0].id) {
        const abstract = await getJSON_GM(`https://movie.douban.com/j/subject_abstract?subject_id=${search[0].id}`);
        const average = abstract && abstract.subject && abstract.subject.rate ? abstract.subject.rate : '?';
        data = {
            url: `https://movie.douban.com/subject/${search[0].id}/`,
            rating: { numRaters: '', max: 10, average },
            title: search[0].title,
        };
        setValue_GM("tmi-" + id, data);
        return data
    }
}

async function getDoubanIntro(id, url) {
    let data = await GM.getValue("tmi-" + id + "-intro")
    if (data) {
        console.log("already queried Douban Intro")
        return data;
    }
    data = await getURL_GM(url);
    if (data) {
        let description = Array.from($('#link-report-intra>[property="v:summary"],#link-report-intra>span.all.hidden', data)[0].childNodes)
            .filter(e => e.nodeType === 3)
            .map(e => e.textContent.trim())
            .join('\n');
        let fix = description.replace(/^|\n/g, '<br>\n　　') + '\n\n'
        if (fix.indexOf("<br>") == 0)
            fix = fix.substring(4);
        setValue_GM("tmi-" + id + "-intro", fix);
        return fix
    }
}

function isTodayGreater(d1, days) {
    d1 = new Date(d1);
    return +new Date() > d1.setDate(d1.getDate() + (days || 0))
}

function getFormattedDate(date) {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    return month + '/' + day + '/' + year;
}

function setValue_GM(key, value) {
    GM.setValue(key, value);
    let now = getFormattedDate(new Date())
    GM.setValue(key + "-expired", now);
}

/**
 * 清除过期缓存数据
 * @param {Integer} expiredday 过期时间
 */
async function clearExpired(expiredday) {
    let TMIlist = await GM.listValues()
    // console.log(TMIlist)
    for (const skey of TMIlist) {
        if (skey.startsWith("tmi-")) {
            if (skey.endsWith("-expired")) {
                continue
            }
            let data = await GM.getValue(skey + "-expired")
            if (!data) {
                GM.deleteValue(skey);
            }
            // cache 
            if (isTodayGreater(data, expiredday)) {
                console.log("clean tmi" + skey)
                GM.deleteValue(skey);
                GM.deleteValue(skey + "-expired");
            }
        }
    }
}

function isEmpty(s) {
    return !s || s === 'N/A';
}

function insertBHDDoubanRating(parent, url, rating) {
    parent.insertAdjacentHTML('beforeend',
        `<span class="badge-meta2" title="豆瓣评分">
        <a href="${url}" target="_blank">
            <span style="color:green">
                <i class="fal fa-star"></i>
            </span>
        ${rating}</a>
    </span>`);
}

function replaceBHDDoubanName(name) {
    console.log(name)
    const bhdtitle = $("h1[class='bhd-title-h1']")[0];
    var origin = bhdtitle.children[0].text;
    bhdtitle.children[0].text = origin + " | " + name
}

function replaceBHDDoubanIntro(intro) {
    console.log(intro)
    const detail = $("div[class='movie-overview']")[0];
    detail.innerHTML = intro
}


function page_parser(responseText) {
    responseText = responseText.replace(/s+src=/ig, ' data-src=');
    responseText = responseText.replace(/<script[^>]*?>[\S\s]*?<\/script>/ig, '');
    return (new DOMParser()).parseFromString(responseText, 'text/html');
}
function getDoc(url, meta, callback) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: function (responseDetail) {
            if (responseDetail.status === 200) {
                let doc = page_parser(responseDetail.responseText);
                callback(doc, responseDetail, meta);
            } else {
                callback('error', null, null);
            }
        }
    });
}

function getData(imdb_url, callback) {
    var imdb_id = imdb_url.match(/tt\d+/)[0];
    var search_url = 'https://m.douban.com/search/?query=' + imdb_id + '&type=movie';
    getDoc(search_url, null, function(doc) {
        if ($('ul.search_results_subjects', doc).length) {
            var douban_url = 'https://movie.douban.com/subject/' + $('ul.search_results_subjects', doc).find('a').attr('href').match(/subject\/(\d+)/)[1];
            if (douban_url.search('35580200') > -1) {
                return;
            }
            getDoc(douban_url, null, function(html) {
                var raw_data = {};
                var data = {'data': {}};
                raw_data.title = $("title", html).text().replace("(豆瓣)", "").trim();
                try {
                    raw_data.image = $('#mainpic img', html)[0].src.replace(
                        /^.+(p\d+).+$/,
                        (_, p1) => `https://img9.doubanio.com/view/photo/l_ratio_poster/public/${p1}.jpg`
                    );
                } catch(e) {raw_data.image = 'null'}

                raw_data.id = douban_url.match(/subject\/(\d+)/)[1];
                try { raw_data.year = parseInt($('#content>h1>span.year', html).text().slice(1, -1)); } catch(e) {raw_data.year = ''}
                try { raw_data.aka = $('#info span.pl:contains("又名")', html)[0].nextSibling.textContent.trim(); } catch(e) {raw_data.aka = 'null'}
                try { raw_data.average = parseFloat($('#interest_sectl', html).find('[property="v:average"]').text()); } catch(e) {raw_data.average = ''}
                try { raw_data.votes = parseInt($('#interest_sectl', html).find('[property="v:votes"]').text()); } catch(e) {raw_data.votes = ''}
                try { raw_data.genre = $('#info span[property="v:genre"]', html).toArray().map(e => e.innerText.trim()).join('/');  } catch(e) {raw_data.genre = ''}
                try { raw_data.region = $('#info span.pl:contains("制片国家/地区")', html)[0].nextSibling.textContent.trim(); } catch(e) {raw_data.region = ''}
                try { raw_data.director = $('#info span.pl:contains("导演")', html)[0].nextSibling.nextSibling.textContent.trim(); } catch(e) {raw_data.director = ''}
                try { raw_data.language = $('#info span.pl:contains("语言")', html)[0].nextSibling.textContent.trim(); } catch(e) {raw_data.language = ''}
                try { raw_data.releaseDate = $('#info span[property="v:initialReleaseDate"]', html).toArray().map(e => e.innerText.trim()).sort((a, b) => new Date(a) - new Date(b)).join('/'); } catch(e) {raw_data.releaseDate = ''}
                try { raw_data.runtime = $('span[property="v:runtime"]', html).text(); } catch(e) {raw_data.runtime = ''}
                try { raw_data.cast = $('#info span.pl:contains("主演")', html)[0].nextSibling.nextSibling.textContent.trim(); } catch(e) {raw_data.cast = ''}
                try {
                    raw_data.summary = Array.from($('#link-report-intra>[property="v:summary"],#link-report-intra>span.all.hidden', html)[0].childNodes)
                        .filter(e => e.nodeType === 3)
                        .map(e => e.textContent.trim())
                        .join('\n');
                } catch(e) {
                    raw_data.summary = '';
                }
                data.data = raw_data;
                callback(data)
            });
        }
    });
}

var site_url = decodeURI(location.href);
// && extra_settings.ptp_show_group_name.enable
if (site_url.match(/^https?:\/\/passthepopcorn.me\/torrents.php.*/) ) {
    const boldfont = true;
    const coloredfont = true;
    const groupnamecolor = '#20B2AA';

    const showblankgroups = true;
    const placeholder = 'Null';

    const delimiter = ' / ';
    const blockedgroup = 'TBB';
    const moviesearchtitle = 'Browse Torrents ::';
    const douban_prex = 'https://api.iyuu.cn/ptgen/?imdb=tt';

    function formatText(str, color){
        var style = [];
        if(boldfont) style.push('font-weight:bold');
        if(coloredfont && color) style.push(`color:${groupnamecolor}`);
        return `<span style="${style.join(';')}">${str}</span>`;
    }

    function setGroupName(groupname, target){
        var color = true;
        if ($(target).parent().find('.golden-popcorn-character').length) {
            color = false;
        }
        if ($(target).parent().find('.torrent-info__download-modifier--free').length) {
            color = false;
        }
        if ($(target).parent().find('.torrent-info-link--user-leeching').length) {
            color = false;
        }
        if ($(target).parent().find('.torrent-info-link--user-seeding').length) {
            color = false;
        }
        if ($(target).parent().find('.torrent-info-link--user-downloaded').length) {
            color = false;
        }

        if(isEmptyOrBlockedGroup(groupname)){
            if($(target).text().split(delimiter).includes(blockedgroup)){
                $(target).html(function(i, htmlsource){
                    return htmlsource.replace(delimiter + blockedgroup, '');
                });
                groupname = blockedgroup;
            }
            else if(showblankgroups){
                groupname = placeholder;
            }
        }
        if(!isEmpty(groupname)){
            var location = 1;
            if (location == 1) {
                return $(target).append(delimiter).append(formatText(groupname, color));
            } else {
                return $(target).prepend(delimiter).prepend(formatText(groupname, color));
            }
        }
    }

    function setDoubanLink(imdb_id, target){
        if(!isEmpty(imdb_id)){
            try{
                var td = target.parentNode.parentNode.getElementsByTagName('td')[1];
                var div = td.getElementsByClassName('basic-movie-list__movie__ratings-and-tags')[0];
                var new_div = document.createElement('div');
                new_div.setAttribute('class', 'basic-movie-list__movie__rating-container');
                new_div.style.fontweight = 'bold';
                var span = document.createElement('span');
                span.setAttribute('class', 'basic-movie-list__movie__rating__title');
                var a = document.createElement('a');
                a.href = douban_prex + imdb_id;
                a.text = 'PtGen';
                a.target = "_blank";
                span.appendChild(a);
                new_div.appendChild(span);
                div.insertBefore(new_div, div.firstElementChild);
                a.onclick = function(e){
                    e.preventDefault();
                    var req = `https://movie.douban.com/j/subject_suggest?q=tt${imdb_id}`;
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: req,
                        onload: function(res) {
                            var response = JSON.parse(res.responseText);
                            if (response.length > 0) {
                                a.href = 'https://api.iyuu.cn/ptgen/?imdb=' + response[0].id;
                            } else {
                                a.href = douban_prex + imdb_id;
                            }
                            window.open(a.href, target="_blank")
                        }
                    });
                }
            } catch(err){}
        }
    }

    function isEmpty(str){
        return (!str || String(str).trim().length === 0);
    }
    function isEmptyOrBlockedGroup(str){
        return (isEmpty(str) || str === blockedgroup);
    }

    if (document.title.indexOf(moviesearchtitle) !== -1){
        var movies = PageData.Movies;
        var releases = [];
        var imdb_urls = [];
        movies.forEach(function(movie){
            imdb_urls[movie.GroupId] = movie.ImdbId;
            movie.GroupingQualities.forEach(function(torrentgroup){
                torrentgroup.Torrents.forEach(function(torrent){
                    releases[torrent.TorrentId] = torrent.ReleaseGroup;
                });
            });
        });
        if(PageData.ClosedGroups != 1){
            releases.forEach(function(groupname, index){
                $(`tbody a.torrent-info-link[href$="torrentid=${index}"]`).each(function(){
                    setGroupName(groupname, this);
                });
            });
            imdb_urls.forEach(function(imdbid, groupid){
                $(`tbody a.basic-movie-list__movie__cover-link[href$="id=${groupid}"]`).each(function(){
                    setDoubanLink(imdbid, this);
                });
            })
        }
        else{
            var targetNodes = $('tbody');
            var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
            var myObserver = new MutationObserver(mutationHandler);
            var obsConfig = {childList: true, characterData: false, attributes: false, subtree: false};

            targetNodes.each(function (){
                myObserver.observe (this, obsConfig);
            });

            function mutationHandler (mutationRecords) {
                mutationRecords.forEach ( function (mutation) {
                    if (mutation.addedNodes.length > 0) {
                        $(mutation.addedNodes).find('a.torrent-info-link').each(function(){
                            var mutatedtorrentid = this.href.match(/\btorrentid=(\d+)\b/)[1];
                            var groupname = releases[mutatedtorrentid];
                            setGroupName(groupname, this);
                        });
                    }
                });
            }

        }
    } else if (document.title.indexOf('upload') !== -1) {
        try {
            $('.torrent-info-link').map((index,e)=>{
                var groupname = $(e).attr('title');
                groupname = get_group_name(groupname, '');
                setGroupName(groupname, e);
            })
        } catch (err) {}
    } else{
        $('table#torrent-table a.torrent-info-link').each(function(){
            var groupname = $(this).parent().parent().data('releasegroup');
            setGroupName(groupname, this);
        });
    }

    $('.torrent-info__reported').each(function(){
        $(this).css('color', '#FFAD86');
    });

    $('.torrent-info__download-modifier--free').each(function(){
        $(this).parent().css('color', '#4DFFFF');
    });

    $('.golden-popcorn-character').each(function(){
        var val=$(this).next().attr("class");
        if (val && !val.match(/torrent-info-link--user-leeching|torrent-info-link--user-seeding|torrent-info-link--user-downloaded/i)){
            $(this).parent().css('color', '#FFD700');
            $(this).next().css('color', '#FFD700');
        }else {
             $(this).attr('class', val)
        }
    });

    $('.torrent-info__trumpable').each(function(){
        $(this).css('color', '#E8FFC4');
    });

    $('.torrent-info-link--user-seeding').each(function(){
        $(this).css('color', 'red');
    });

    $('.torrent-info-link--user-downloaded').each(function(){
        $(this).css('color', 'green');
    });

    $('.torrent-info-link--user-leeching').each(function(){
        $(this).css('color', 'MediumSpringGreen');
    });

    if (location.href.match(/id=\d+/)){
        $('.group_torrent_header').each(function(){
            var $img = $(this).find('a').eq(3).find('img');
            var $old_url = $img.prop('src');
            $img.prop('src', $old_url)
        })
    }
}

// && extra_settings.ptp_show_douban.enable
if (site_url.match(/^https?:\/\/passthepopcorn.me\/torrents.php\?id.*/) ){
    $(function () {
        const imdbLink = $('#imdb-title-link').attr('href');
        if (!imdbLink) {
            return;
        }
        console.log('正在获取数据……');
        getData(imdbLink, function(data){
            console.log(data);
            if (data.data) {
                addInfoToPage(data['data']);
            } else {
                return;
            }
        });
    })

    const addInfoToPage = (data) => {
        if (isChinese(data.title)) {
            $('.page__title').prepend(`<a  target='_blank' href="https://movie.douban.com/subject/${data.id}">[${data.title.split(' ')[0]}] </a>`);
        }
        if (data.summary) {
            var tmp = data.summary.split('   ');
            data.summary = '';
            for (var i=0; i<tmp.length; i++){
                var tmp_str = tmp[i].trim();
                if (tmp_str){
                    data.summary += '\t' + tmp_str + '\n';
                }
            }
            $('#movieinfo').before(`<div class="panel">
            <div class="panel__heading"><span class="panel__heading__title">简介</span></div>
            <div class="panel__body"  id="intro">&nbsp&nbsp&nbsp&nbsp${data.summary.trim()}</div></div>`);
        }
        $('#torrent-table').parent().prepend($('#movie-ratings-table').parent())
        try{
            $('#movieinfo').before(`
                <div class="panel">
                <div class="panel__heading"><span class="panel__heading__title">电影信息</span></div>
                <div class="panel__body">
                <div><strong>导演:</strong> ${data.director}</div>
                <div><strong>演员:</strong> ${data.cast}</div>
                <div><strong>类型:</strong> ${data.genre}</div>
                <div><strong>制片国家/地区:</strong> ${data.region}</div>
                <div><strong>语言:</strong> ${data.language}</div>
                <div><strong>时长:</strong> ${data.runtime}</div>
                <div><strong>又名:</strong>  ${data.aka}</div>
                </div>
            `)
        } catch(err){}

        var total = 10;
        var split = '/';
        if (!data.average) {
            data.average = '暂无评分';
            total = '';
            data.votes = 0;
            split = '';
        }

        $('#movie-ratings-table tr').prepend(
            `<td colspan="1" style="width: 152px;">
            <center>
            <a target="_blank" class="rating" href="https://movie.douban.com/subject/${data.id}" rel="noreferrer">
            <div style="font-size: 0;min-width: 105px;">
                <span class="icon-pt1" style="font-size: 14px;
                display: inline-block;
                text-align: center;
                border: 1px solid #41be57;
                background-color: #41be57;
                color: white;
                border-top-left-radius: 4px;
                border-bottom-left-radius: 4px;
                width: 24px;
                height: 24px;
                line-height: 24px;">豆</span>
                <span class="icon-pt2" style="font-size: 14px;
                display: inline-block;
                text-align: center;
                border: 1px solid #41be57;
                color: #3ba94d;
                background: #ffffff;
                border-top-right-radius: 4px;
                border-bottom-right-radius: 4px;
                width: 69px;
                height: 24px;
                line-height: 24px;">豆瓣评分</span>
            </div>
            </a>
            </center>
            </td>
            <td style="width: 153px;">
            <span class="rating">${data.average}</span>
            <span class="mid">${split}</span>
            <span class="outof"> ${total} </span>
            <br>(${data.votes} votes)</td>`
        )
    }
    const isChinese = (title) => {
        return /[\u4e00-\u9fa5]+/.test(title)
    }
}



(async () => {
    let host = location.hostname;
    if (host === 'beyond-hd.me') {
        console.log('Start BHD MovieInfo')
        const imdbSpan = $("span[title='IMDb Rating']");
        if (!imdbSpan) {
            return;
        }
        const imdbLink = imdbSpan[0].children[0].href
        if (!imdbLink) {
            return;
        }
        const id = imdbLink.match(/tt\d+/);
        if (!id)
            return;
        const data = await getDoubanInfo(id);
        if (!data)
            return;
        console.log('GetDoubanInfo')
        insertBHDDoubanRating(imdbSpan[0].parentElement, data.url, data.rating.average)
        replaceBHDDoubanName(data.title)
        const intro = await getDoubanIntro(id, data.url)
        if (!intro)
            return;
        replaceBHDDoubanIntro(intro)
    }
    // 缓存5天
    clearExpired(5)

})();
