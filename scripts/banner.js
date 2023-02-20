
const { version, author, description = '' } = require('../package.json');

exports.userScriptComment = `// ==UserScript==
// @name         TrackerMovieInfo
// @namespace    https://github.com/Suwmlee/TrackerMovieInfo
// @version      ${version}
// @description  ${description}
// @author       ${author}
// @match        *://beyond-hd.me/torrents/*
// @match        *://beyond-hd.me/library/title/*
// @match        *://passthepopcorn.me/torrents*
// @match        *://passthepopcorn.me/torrents.php?id*
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.listValues
// @grant        GM.deleteValue
// @connect      api.douban.com
// @connect      movie.douban.com
// @connect      m.douban.com
// ==/UserScript==`;
