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

        $('div.thin > center').after(`
            <div id="doubaninfo" style="margin-right: 5px;margin-top: 10px;">
                <table cellspacing="0"><tbody>
                    <tr>
                        <td colspan="2"><h1 style="text-align: center;">
                        <a href="https://movie.douban.com/subject/${data.id}" target="_blank">${data.title}</a> (${data.year})</h1><h3>${data.aka}</h3></td>
                    </tr>
                    <tr>
                        <td style="padding: 0;width: 33%;"><table cellspacing="0" style="white-space: nowrap;"><tbody>
                            <tr><th>评分</th><td>${data.average} (${data.votes}人评价)</td></tr>
                            <tr><th>类型</th><td>${data.genre}</td></tr>
                            <tr><th>国家/地区</th><td>${data.region}</td></tr>
                            <tr><th>导演</th><td style="white-space: normal;">${data.director}</td></tr>
                            <tr><th>语言</th><td>${data.language}</td></tr>
                            <tr><th>上映日期</th><td>${data.releaseDate}</td></tr>
                            <tr><th>演员</th><td style="white-space: normal;">${data.cast}</td></tr>
                        </tbody></table></td>
                        <td id="plotcell" style="padding: 10px;vertical-align: top;">${data.summary == "" ? '本片暂无简介' : data.summary.replace(/ 　　/g, '<br>　　')}</td>
                    </tr>
                </tbody></table>
            </div>
        `);
    }

    var links = $('ul[class="stats nobullet"]').find('a[href^="https://www.imdb.com/title/"]');
    if (links.length > 0) {
        getDoubanInfo(links[0].href, function (detail) {
            if (detail) {
                addInfoToPage(detail);
            } else {
                return;
            }
        });
    }
}
