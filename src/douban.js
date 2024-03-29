import { setValue_GM } from './common';
import { getURL_GM } from './request';

/**
 * 解析页面数据(不包含 id/url )
 */
function parseDoubanDetail(html) {
    var raw_data = {};
    raw_data.title = $(html).filter('title').text().replace("(豆瓣)", "").trim();
    try {
        raw_data.image = $('#mainpic img', html)[0].src.replace(
            /^.+(p\d+).+$/,
            (_, p1) => `https://img9.doubanio.com/view/photo/l_ratio_poster/public/${p1}.jpg`
        );
    } catch (e) { raw_data.image = 'null' }
    try { raw_data.year = parseInt($('#content>h1>span.year', html).text().slice(1, -1)); } catch (e) { raw_data.year = '' }
    try { raw_data.aka = $('#info span.pl:contains("又名")', html)[0].nextSibling.textContent.trim(); } catch (e) { raw_data.aka = 'null' }
    try { raw_data.average = parseFloat($('#interest_sectl', html).find('[property="v:average"]').text()); } catch (e) { raw_data.average = '' }
    try { raw_data.votes = parseInt($('#interest_sectl', html).find('[property="v:votes"]').text()); } catch (e) { raw_data.votes = '' }
    try { raw_data.genre = $('#info span[property="v:genre"]', html).toArray().map(e => e.innerText.trim()).join('/'); } catch (e) { raw_data.genre = '' }
    try { raw_data.region = $('#info span.pl:contains("制片国家/地区")', html)[0].nextSibling.textContent.trim(); } catch (e) { raw_data.region = '' }
    try { raw_data.director = $('#info span.pl:contains("导演")', html)[0].nextSibling.nextSibling.textContent.trim(); } catch (e) { raw_data.director = '' }
    try { raw_data.language = $('#info span.pl:contains("语言")', html)[0].nextSibling.textContent.trim(); } catch (e) { raw_data.language = '' }
    try { raw_data.releaseDate = $('#info span[property="v:initialReleaseDate"]', html).toArray().map(e => e.innerText.trim()).sort((a, b) => new Date(a) - new Date(b)).join('/'); } catch (e) { raw_data.releaseDate = '' }
    try { raw_data.runtime = $('span[property="v:runtime"]', html).text(); } catch (e) { raw_data.runtime = '' }
    try { raw_data.cast = $('#info span.pl:contains("主演")', html)[0].nextSibling.nextSibling.textContent.trim(); } catch (e) { raw_data.cast = '' }
    try {
        let description = Array.from($('#link-report-intra>[property="v:summary"],#link-report-intra>span.all.hidden', html)[0].childNodes)
            .filter(e => e.nodeType === 3)
            .map(e => e.textContent.trim())
            .join('\n');
        let fix = description.replace(/^|\n/g, '<br>\n　　') + '\n\n'
        if (fix.indexOf("<br>") == 0)
            fix = fix.substring(4);
        raw_data.summary = fix
    } catch (e) {
        raw_data.summary = '';
    }
    return raw_data;
}

const queryDoubanIDByImdbID = (imdbId, callback) => {
    console.log("[TMI]使用imdb id查询豆瓣id...")
    var search_url = 'https://m.douban.com/search/?query=' + imdbId + '&type=movie'
    getURL_GM(search_url, function (doc) {
        if ($('ul.search_results_subjects', doc).length) {
            var douban_id = $('ul.search_results_subjects', doc).find('a').attr('href').match(/subject\/(\d+)/)[1];
            callback(douban_id)
        }else{
            callback();
        }
    })
}

const getDoubanInfo = (imdbLink, callback) => {
    let imdbId = imdbLink.match(/tt\d+/)[0];
    let data = GM_getValue("douban-" + imdbId)
    if (data) {
        console.log("[TMI]已经存储此豆瓣词条")
        callback(data);
    } else {
        console.log("[TMI]查询豆瓣词条...")
        queryDoubanIDByImdbID(imdbId, function (douban_id) {
            var douban_url = 'https://movie.douban.com/subject/' + douban_id

            let data = {
                id: douban_id,
                url: douban_url,
            }
            getURL_GM(douban_url, function (html) {
                if (html) {
                    let details = parseDoubanDetail(html);
                    details.id = data.id;
                    details.url = data.url;
                    setValue_GM("douban-" + imdbId, details);
                    callback(details);
                }
            });

        })
    }
}

const doubaninit = () => {
    var site_url = decodeURI(location.href);
    var subject_url = site_url.match(/https?:\/\/movie.douban.com\/subject\/\d+/)
    if (subject_url) {
        try {
            let imdbId = $('#info span.pl:contains("IMDb")', document)[0].nextSibling.textContent.trim();
            if (!imdbId) {
                imdbId = $('#info span.pl:contains("IMDb")', document)[0].nextSibling.nextSibling.textContent.trim();
                if (!imdbId) return;
            }
            let data = GM_getValue("douban-" + imdbId)
            if (data) {
                console.log("[TMI]已经存储此豆瓣词条")
            } else {
                console.log("[TMI]豆瓣页面内,尝试获取词条信息...")
                let details = parseDoubanDetail(document);
                details.id = subject_url[0].match(/\d+/);
                details.url = subject_url[0];
                details.title = document.title.replace("(豆瓣)", "").trim();

                setValue_GM("douban-" + imdbId, details);
            }
        } catch (error) {

        }
    }
}

export {
    queryDoubanIDByImdbID,
    getDoubanInfo,
    doubaninit,
}
