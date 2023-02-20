import {
    setValue_GM,
} from './common';
import {
    getURL_GM,
    getJSON_GM,
} from './request';


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

export {
    getDoubanInfo,
    getDoubanIntro,
}
