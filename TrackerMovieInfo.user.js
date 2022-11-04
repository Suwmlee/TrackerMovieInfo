// ==UserScript==
// @name         TrackerMovieInfo
// @namespace    https://github.com/Suwmlee/TrackerMovieInfo
// @version      0.3.3
// @description  Show Douban ratings on Trackers
// @description: zh-CN 在tracker站点显示豆瓣信息
// @author       Suwmlee
// @match        *://beyond-hd.me/torrents/*
// @match        *://beyond-hd.me/library/title/*
// @grant        GM.xmlHttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.listValues
// @grant        GM.deleteValue
// @connect      api.douban.com
// @connect      movie.douban.com
// @connect      p.media-imdb.com
// @connect      www.omdbapi.com
// ==/UserScript==

'use strict';

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
    let data = await GM.getValue("tmi-"+id)
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
        setValue_GM("tmi-"+id, data);
        return data
    }
}

async function getDoubanIntro(id, url){
    let data = await GM.getValue("tmi-"+id+"-intro")
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
        if(fix.indexOf("<br>") == 0)
            fix = fix.substring(4);
        setValue_GM("tmi-"+id+"-intro", fix);
        return fix
    }
}

function isTodayGreater(d1, days){
    d1 = new Date(d1);
    return +new Date() > d1.setDate(d1.getDate() + (days||0))
}

function getFormattedDate(date){
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    return month + '/' + day + '/' + year;
}

function setValue_GM(key, value){
    GM.setValue(key, value);
    let now = getFormattedDate(new Date())
    GM.setValue(key+"-expired", now);
}

/**
 * 清除过期缓存数据
 * @param {Integer} expiredday 过期时间
 */
async function clearExpired(expiredday){
    let TMIlist = await GM.listValues()
    // console.log(TMIlist)
    for (const skey of TMIlist) {
        if (skey.startsWith("tmi-")){
            if (skey.endsWith("-expired")) {
                continue
            }
            let data = await GM.getValue(skey+"-expired")
            if (!data) {
                GM.deleteValue(skey);
            }
            // cache 
            if (isTodayGreater(data, expiredday)){
                console.log("clean tmi" + skey)
                GM.deleteValue(skey);
                GM.deleteValue(skey+"-expired");
            }
        }
    }
}

function isEmpty(s) {
    return !s || s === 'N/A';
}

function insertBHDDoubanRating(parent, url, rating){
    parent.insertAdjacentHTML('beforeend', 
    `<span class="badge-meta2" title="豆瓣评分">
        <a href="${url}" target="_blank">
            <span style="color:green">
                <i class="fal fa-star"></i>
            </span>
        ${rating}</a>
    </span>`);

    const detail = $("a[title='IMDB']")[0].parentElement;
    detail.insertAdjacentHTML('afterend',
    `<span class="badge-meta2"><a href="${url}" title="豆瓣" target="_blank">
        <i class="fab" style="vertical-align: middle;">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="12px" height="11px" enable-background="new 0 0 12 12" xml:space="preserve">
                <image width="100%" height="100%" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAA2FBMVEUWgSUAdQ4AdA0AdQ0NfR1sr3aZyKCWx50KexlUn110r3tyrnlWn14LehoAdhAegiuGuYuRwJaOvpOOv5OGuowhgiwCdhEAdg8wjT3j7+WgyqRdo2Fgpmadx5/i7+QHdRR3sn8efyojgi9zsHvf7eIJdRUpiTbS5dWz1biv0rRipmnw9/FPmlgngzPu9e9cpWYMdRcHehcdhCtLnVbY6dp1r3wthTZInVQihC4VeR8oizaq0LDR5dTY6dvV59jO49Gr0LApizYhhjAwjz07lUg6lUc6lUj///+7fLO6AAAAAWJLR0RHYL3JewAAAAd0SU1FB+UEDxExDPWxFNkAAAB/SURBVAjXFcbZAoFAAAXQWyqEKEtDTMJUyF7WCm3//0nMeTqAINY4UQAkWalziiyh0VRbnNruQOv2dKNv6IPhCCYZT6ypNaPE/p/OnYWzXBEG0/Wov/ap5zJo9mYb7IL9gR1xOl/C6BqFt/sDz1ecpO80iT9fZHlRVkVVFnn2A2t6DyUkoLRcAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIxLTA0LTE1VDE3OjQ5OjEyKzAwOjAw+Ka3VAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMS0wNC0xNVQxNzo0OToxMiswMDowMIn7D+gAAAAASUVORK5CYII="></image>
            </svg>
        </i> 豆瓣
    </a></span>`
    )

}

function replaceBHDDoubanName(name){
    console.log(name)
    const bhdtitle = $("h1[class='movie-heading']")[0];
    bhdtitle.children[0].text = name
}

function replaceBHDDoubanIntro(intro){
    console.log(intro)
    let introPos = document.querySelector('#torrentBigBookmarkExtension')
    introPos.childNodes[0].nodeValue = ''
    introPos.insertAdjacentHTML('afterbegin', intro);
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
