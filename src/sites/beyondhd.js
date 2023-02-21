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

function replaceBHDDoubanName(data) {
    const bhdtitle = $("h1[class='bhd-title-h1']");
    bhdtitle.prepend(`<a  target='_blank' href="https://movie.douban.com/subject/${data.id}">${data.title.split(' ')[0]} </a>`);
}

function replaceBHDDoubanIntro(intro) {
    const detail = $("div[class='movie-overview']")[0];
    detail.innerHTML = intro
}


export default () => {
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
        replaceBHDDoubanName(detail)
        insertBHDDoubanRating(imdbSpan[0].parentElement, detail.url, detail.average)
        replaceBHDDoubanIntro(detail.summary)
    })
}
