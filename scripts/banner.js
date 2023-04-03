
const { version, author, description = '' } = require('../package.json');

exports.userScriptComment = `// ==UserScript==
// @name         TrackerMovieInfo
// @namespace    https://github.com/Suwmlee/TrackerMovieInfo
// @version      ${version}
// @description  ${description}
// @author       ${author}
// @match        *://movie.douban.com/subject/*
// @match        *://beyond-hd.me/torrents/*
// @match        *://beyond-hd.me/library/title/*
// @match        *://passthepopcorn.me/torrents*
// @match        *://passthepopcorn.me/torrents.php?id*
// @match        *://hdbits.org/film/info?id=*
// @match        *://hdbits.org/details.php?id=*
// @require      https://code.jquery.com/jquery-1.12.4.js
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @connect      api.douban.com
// @connect      movie.douban.com
// @connect      m.douban.com
// ==/UserScript==`;
