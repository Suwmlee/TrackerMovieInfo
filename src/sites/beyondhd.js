import { getDoubanInfo } from '../douban'


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


export default () => {
    console.log('Start BHD MovieInfo')
    const imdbSpan = $("span[title='IMDb Rating']");
    if (!imdbSpan) {
        return;
    }
    const imdbLink = imdbSpan[0].children[0].href
    if (!imdbLink) {
        return;
    }
    getDoubanInfo(imdbLink, function (detail) {
        if (!detail)
            return;
        console.log('GetDoubanInfo')
        replaceBHDDoubanName(detail.title)
        insertBHDDoubanRating(imdbSpan[0].parentElement, detail.url, detail.average)
        replaceBHDDoubanIntro(detail.summary)
    })
}