import { getDoubanInfo, queryDoubanIDByImdbID } from "../douban";

export default () => {
    var site_url = decodeURI(location.href);
    // torrents页面
    if (site_url.match(/^https?:\/\/passthepopcorn.me\/torrents.php.*/)) {
        const boldfont = true;
        const coloredfont = true;
        const groupnamecolor = '#20B2AA';

        const showblankgroups = false;
        const placeholder = 'Null';

        const delimiter = ' / ';
        const blockedgroup = 'TBB';
        const moviesearchtitle = 'Browse Torrents ::';
        const douban_prex = 'https://movie.douban.com/j/subject_suggest?q=tt';

        function formatText(str, color) {
            var style = [];
            if (boldfont) style.push('font-weight:bold');
            if (coloredfont && color) style.push(`color:${groupnamecolor}`);
            return `<span style="${style.join(';')}">${str}</span>`;
        }

        function setGroupName(groupname, target) {
            var color = true;
            if ($(target).parent().find('.golden-popcorn-character').length) {
                color = false;
            }
            if ($(target).parent().find('.torrent-info__download-modifier--free').length) {
                color = true;
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

            if (isEmptyOrBlockedGroup(groupname)) {
                if ($(target).text().split(delimiter).includes(blockedgroup)) {
                    $(target).html(function (i, htmlsource) {
                        return htmlsource.replace(delimiter + blockedgroup, '');
                    });
                    groupname = blockedgroup;
                }
                else if (showblankgroups) {
                    groupname = placeholder;
                }
            }
            if (!isEmpty(groupname)) {
                var location = 1;
                if (location == 1) {
                    return $(target).append(delimiter).append(formatText(groupname, color));
                } else {
                    return $(target).prepend(delimiter).prepend(formatText(groupname, color));
                }
            }
        }

        function setDoubanLink(imdb_id, target) {
            if (!isEmpty(imdb_id)) {
                try {
                    if (!imdb_id.startsWith("tt")) {
                        imdb_id = "tt" + imdb_id;
                    }
                    var td = target.parentNode.parentNode.getElementsByTagName('td')[1];
                    var div = td.getElementsByClassName('basic-movie-list__movie__ratings-and-tags')[0];
                    var new_div = document.createElement('div');
                    new_div.setAttribute('class', 'basic-movie-list__movie__rating-container');
                    new_div.style.fontweight = 'bold';
                    var span = document.createElement('span');
                    span.setAttribute('class', 'basic-movie-list__movie__rating__title');
                    var a = document.createElement('a');
                    a.href = douban_prex + imdb_id;
                    a.text = 'Douban';
                    a.target = "_blank";
                    span.appendChild(a);
                    new_div.appendChild(span);
                    div.insertBefore(new_div, div.firstElementChild);
                    a.onclick = function (e) {
                        e.preventDefault();
                        queryDoubanIDByImdbID(imdb_id, function (douban_id) {
                            if (douban_id) {
                                console.log(douban_id)
                                a.href = `https://movie.douban.com/subject/${douban_id}/`;
                                window.open(a.href, target = "_blank")
                            } else {
                                alert("无匹配豆瓣词条,可能未添加或已被屏蔽...")
                            }
                        })
                    }
                } catch (err) { }
            }
        }

        function isEmpty(str) {
            return (!str || String(str).trim().length === 0);
        }
        function isEmptyOrBlockedGroup(str) {
            return (isEmpty(str) || str === blockedgroup);
        }

        if (document.title.indexOf(moviesearchtitle) !== -1) {
            var movies = PageData.Movies;
            var releases = [];
            var imdb_urls = [];
            movies.forEach(function (movie) {
                imdb_urls[movie.GroupId] = movie.ImdbId;
                movie.GroupingQualities.forEach(function (torrentgroup) {
                    torrentgroup.Torrents.forEach(function (torrent) {
                        releases[torrent.TorrentId] = torrent.ReleaseGroup;
                    });
                });
            });
            if (PageData.ClosedGroups != 1) {
                releases.forEach(function (groupname, index) {
                    $(`tbody a.torrent-info-link[href$="torrentid=${index}"]`).each(function () {
                        setGroupName(groupname, this);
                    });
                });
                imdb_urls.forEach(function (imdbid, groupid) {
                    $(`tbody a.basic-movie-list__movie__cover-link[href$="id=${groupid}"]`).each(function () {
                        setDoubanLink(imdbid, this);
                    });
                })
            }
            else {
                var targetNodes = $('tbody');
                var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
                var myObserver = new MutationObserver(mutationHandler);
                var obsConfig = { childList: true, characterData: false, attributes: false, subtree: false };

                targetNodes.each(function () {
                    myObserver.observe(this, obsConfig);
                });

                function mutationHandler(mutationRecords) {
                    mutationRecords.forEach(function (mutation) {
                        if (mutation.addedNodes.length > 0) {
                            $(mutation.addedNodes).find('a.torrent-info-link').each(function () {
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
                $('.torrent-info-link').map((index, e) => {
                    var groupname = $(e).attr('title');
                    groupname = get_group_name(groupname, '');
                    setGroupName(groupname, e);
                })
            } catch (err) { }
        } else {
            $('table#torrent-table a.torrent-info-link').each(function () {
                var groupname = $(this).parent().parent().data('releasegroup');
                setGroupName(groupname, this);
            });
        }
        $('.torrent-info__download-modifier--free').each(function () {
            $(this).css('color', '#039AFF');
        });
        if (location.href.match(/id=\d+/)) {
            $('.group_torrent_header').each(function () {
                var $img = $(this).find('a').eq(3).find('img');
                var $old_url = $img.prop('src');
                $img.prop('src', $old_url)
            })
        }
    }

    // page 详情页面
    if (site_url.match(/^https?:\/\/passthepopcorn.me\/torrents.php\?id.*/)) {

        const addInfoToPage = (data) => {
            if (isChinese(data.title)) {
                $('.page__title').prepend(`<a  target='_blank' href="https://movie.douban.com/subject/${data.id}">[${data.title.split(' ')[0]}] </a>`);
            }
            if (data.summary) {
                var tmp = data.summary.split('   ');
                data.summary = '';
                for (var i = 0; i < tmp.length; i++) {
                    var tmp_str = tmp[i].trim();
                    if (tmp_str) {
                        data.summary += '\t' + tmp_str + '\n';
                    }
                }
                $('#movieinfo').before(`<div class="panel">
                <div class="panel__heading"><span class="panel__heading__title">简介</span></div>
                <div class="panel__body"  id="intro">&nbsp&nbsp&nbsp&nbsp${data.summary.trim()}</div></div>`);
            }
            $('#torrent-table').parent().prepend($('#movie-ratings-table').parent())
            try {
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
            } catch (err) { }

            var total = 10;
            var split = '/';
            if (!data.average) {
                data.average = '暂无评分';
                total = '';
                data.votes = 0;
                split = '';
            }

            $('#movie-ratings-table tr').prepend(
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
                    line-height: 36px;">豆</span>
                </div>
                </a>
                </center>
                </td>
                <td style="width: 120px;">
                <span class="rating">${data.average}</span>
                <span class="mid">${split}</span>
                <span class="outof"> ${total} </span>
                <br>(${data.votes} votes)</td>`
            )
        }
        const isChinese = (title) => {
            return /[\u4e00-\u9fa5]+/.test(title)
        }

        const imdbLink = $('#imdb-title-link').attr('href');
        if (!imdbLink) {
            return;
        }
        getDoubanInfo(imdbLink, function (detail) {
            if (detail) {
                addInfoToPage(detail);
            } else {
                return;
            }
        });
    }
}
