import {
    setValue_GM,
} from './common';
import {
    getURL_GM,
    getJSON_GM,
} from './request';

function parseDoubanDetail(html){
    var raw_data = {};
    raw_data.title = $("title", html).text().replace("(豆瓣)", "").trim();
    try {
        raw_data.image = $('#mainpic img', html)[0].src.replace(
            /^.+(p\d+).+$/,
            (_, p1) => `https://img9.doubanio.com/view/photo/l_ratio_poster/public/${p1}.jpg`
        );
    } catch(e) {raw_data.image = 'null'}

    // raw_data.id = douban_url.match(/subject\/(\d+)/)[1];
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
        let description = Array.from($('#link-report-intra>[property="v:summary"],#link-report-intra>span.all.hidden', html)[0].childNodes)
            .filter(e => e.nodeType === 3)
            .map(e => e.textContent.trim())
            .join('\n');
        let fix = description.replace(/^|\n/g, '<br>\n　　') + '\n\n'
        if (fix.indexOf("<br>") == 0)
            fix = fix.substring(4);
        raw_data.summary = fix
    } catch(e) {
        raw_data.summary = '';
    }
    return raw_data;
}

const getDoubanInfo = async (id) => {
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

const getDoubanIntro = async (id, url) => {
    let data = await GM.getValue("tmi-" + id + "-detail")
    if (data) {
        console.log("already queried Douban Intro")
        return data;
    }
    let html = await getURL_GM(url);
    if (html) {
        data = parseDoubanDetail(html)
        setValue_GM("tmi-" + id + "-detail", data);
        return data;
    }
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

const getData = (imdb_url, callback) => {
    var imdb_id = imdb_url.match(/tt\d+/)[0];
    var search_url = 'https://m.douban.com/search/?query=' + imdb_id + '&type=movie';
    getDoc(search_url, null, function(doc) {
        if ($('ul.search_results_subjects', doc).length) {
            var douban_url = 'https://movie.douban.com/subject/' + $('ul.search_results_subjects', doc).find('a').attr('href').match(/subject\/(\d+)/)[1];
            if (douban_url.search('35580200') > -1) {
                return;
            }
            getDoc(douban_url, null, function(html) {
                raw_data = parseDoubanDetail(html)
                var data = {'data':raw_data};
                callback(data)
            });
        }
    });
}



export {
    getDoubanInfo,
    getDoubanIntro,
    getData,
}
