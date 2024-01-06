import { getDoubanInfo } from '../douban'


export default () => {
    
    //修复friend页面两个表列宽不等的问题
    if (location.href == 'https://broadcasthe.net/friends.php' || location.href == 'https://backup.landof.tv/friends.php') {
        $('.main_column').find('td:contains("Last seen")').css({'width':'150px'});
        return;
    }
    
    const addInfoToPage = (data) => {
        if (data.cast.split('/').length > 8) {
            data.cast = data.cast.split('/').slice(0,8).join('/');
        }
        if (data.director.split('/').length > 8) {
            data.director = data.director.split('/').slice(0,8).join('/');
        }

        var label = '- ';
        var status = 'block';
        var image_snippet = '';
        var douban_collapse = false;
        if (douban_collapse) {
            label = '+ ';
            status = 'none';
        }
        try {
            var a_element = $("table.contentlayout").find('a[href^="/film/info?id"]')[0];
            a_element.firstChild.setAttribute('style', 'max-height: 660px; width: 250px;');
            image_snippet = a_element.outerHTML;
        } catch (e) { image_snippet = '' }
        $('div.thin > center').after(`
            <div id="c20201117" class="hideablecontent" style="display: ${status};">
                <table class="contentlayout" cellspacing="0"><tbody>
                    <tr>
                        <td rowspan="3" width="2">${image_snippet}</td>
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
        `);
    }

    var links = $('ul[class="stats nobullet"]').find('a[href^="https://www.imdb.com/title/"]');
    console.log(links)
    getDoubanInfo(links[0].href, function (detail) {
        if (detail) {
            addInfoToPage(detail);
        } else {
            return;
        }
    });
}
