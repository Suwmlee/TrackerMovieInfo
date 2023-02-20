import {
    getDoubanInfo,
    getDoubanIntro,
} from '../douban'


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


export default async () => {
    console.log('Start BHD MovieInfo')
    const imdbSpan = $("span[title='IMDb Rating']");
    if (!imdbSpan) {
        return;
    }
    const imdbLink = imdbSpan[0].children[0].href
    if (!imdbLink) {
        return;
    }
    const imdbId = imdbLink.match(/tt\d+/);
    if (!imdbId)
        return;
    const data = await getDoubanInfo(imdbId);
    if (!data)
        return;
    console.log('GetDoubanInfo')
    insertBHDDoubanRating(imdbSpan[0].parentElement, data.url, data.rating.average)
    replaceBHDDoubanName(data.title)
    const detail = await getDoubanIntro(imdbId, data.url)
    if (!detail)
        return;
    replaceBHDDoubanIntro(detail.summary)
}
