import { getDoubanInfo } from "../douban";

export default () => {
    var site_url = decodeURI(location.href);

    if (site_url.match(/^https?:\/\/hdbits.org\/details.php\?id=.*/)){
        try{

            const addInfoToPage = (data) => {
                if (data.cast.split('/').length > 8) {
                    data.cast = data.cast.split('/').slice(0,8).join('/');
                }
                if (data.director.split('/').length > 8) {
                    data.director = data.director.split('/').slice(0,8).join('/');
                }

                var label = '- ';
                var status = 'block';
                var douban_collapse = false;
                if (douban_collapse) {
                    label = '+ ';
                    status = 'none';
                }

                $('#details > tbody > tr').eq(1).after(`
                    <tr><td>
                    <div id="l20201117" class="label collapsable" onclick="showHideEl(20201117)"><span class="plusminus">${label}</span>关于本片 (豆瓣信息)</div>
                    <div id="c20201117" class="hideablecontent" style="display: ${status};">
                        <table class="contentlayout" cellspacing="0"><tbody>
                            <tr>
                                <td rowspan="3" width="2"><img src="${data.image}" style="max-width:250px;border:0px;" alt></td>
                                <td colspan="2"><h1><a href="https://movie.douban.com/subject/${data.id}" target="_blank">${data.title}</a> (${data.year})</h1><h3>${data.aka}</h3></td>
                            </tr>
                            <tr>
                                <td><table class="content" cellspacing="0" id="imdbinfo" style="white-space: nowrap;"><tbody>
                                    <tr><th>评分</th><td>${data.average} (${data.votes}人评价)</td></tr>
                                    <tr><th>类型</th><td>${data.genre}</td></tr>
                                    <tr><th>国家/地区</th><td>${data.region}</td></tr>
                                    <tr><th>导演</th><td>${data.director.replace(/\//g, '<br>    ')}</td></tr>
                                    <tr><th>语言</th><td>${data.language}</td></tr>
                                    <tr><th>上映日期</th><td>${data.releaseDate.replace(/\//g, '<br>    ')}</td></tr>
                                    <tr><th>片长</th><td>${data.runtime}</td></tr>
                                    <tr><th>演员</th><td>${data.cast.replace(/\//g, '<br>    ')}</td></tr>
                                </tbody></table></td>
                                <td id="plotcell"><table class="content" cellspacing="0"><tbody>
                                    <tr><th>简介</th></tr><tr><td>${data.summary == "" ? '本片暂无简介' : data.summary.replace(/ 　　/g, '<br>　　')}</td></tr>
                                </tbody></table></td>
                            </tr>
                            <tr>
                                <td colspan="2" id="actors"></td>
                            </tr>
                        </tbody></table>
                    </div>
                    </td></tr>
                `);
                $('div.collapsable:contains("About this film (from IMDB)")').parent().find('img').first().css({"width": "250px", "max-height": "660px"});
                if (!douban_collapse) {
                    $('div.collapsable:contains("About this film (from IMDB)")').click();
                }
            }
            var links = $('table.contentlayout').find('a[href^="https://www.imdb.com/title/"]');
            if (links.length == 0) {
                links = $('.showlinks').find('a[href^="https://www.imdb.com/title/"]');
                if (links.length == 0) {
                    return;
                }
            }
            getDoubanInfo(links[0].href, function (detail) {
                if (detail) {
                    addInfoToPage(detail);
                } else {
                    return;
                }
            });
        } catch(err){ console.log(err) }
    }

    if (site_url.match(/^https?:\/\/hdbits.org\/film\/info\?id=.*/)){
        try{

            const addInfoToPage = (data) => {
                const hdbtitle = $('table.contentlayout').find('a[href^="https://www.imdb.com/title/"]');
                hdbtitle.prepend(`<a  target='_blank' href="https://movie.douban.com/subject/${data.id}">[${data.title.split(' ')[0]}] </a>`);

                $("#plotcell")[0].innerHTML = `<table class="content" cellspacing="0"><tbody>
                <tr><th>简介</th></tr><tr><td>${data.summary == "" ? '本片暂无简介' : data.summary.replace(/ 　　/g, '<br>　　')}</td></tr>
            </tbody></table>`
            }
            var links = $('table.contentlayout').find('a[href^="https://www.imdb.com/title/"]');
            if (links.length == 0) {
                links = $('.showlinks').find('a[href^="https://www.imdb.com/title/"]');
                if (links.length == 0) {
                    return;
                }
            }
            getDoubanInfo(links[0].href, function (detail) {
                if (detail) {
                    addInfoToPage(detail);
                } else {
                    return;
                }
            });
        } catch(err){ console.log(err) }
    }

}
