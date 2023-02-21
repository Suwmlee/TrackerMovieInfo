
const isTodayGreater = (d1, days) => {
    d1 = new Date(d1);
    return +new Date() > d1.setDate(d1.getDate() + (days || 0))
}

const getFormattedDate = (date) => {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    return month + '/' + day + '/' + year;
}

const setValue_GM = (key, value) => {
    GM_setValue(key, value);
    let now = getFormattedDate(new Date())
    GM_setValue(key + "-expired", now);
}

/**
 * 清除过期缓存数据
 * @param {Integer} expiredday 过期时间
 */
const clearExpired = (expiredday) => {
    let TMIlist = GM_listValues()
    // console.log(TMIlist)
    for (const skey of TMIlist) {
        if (skey.startsWith("tmi-")) {
            if (skey.endsWith("-expired")) {
                continue
            }
            let data = GM_getValue(skey + "-expired")
            if (!data) {
                GM_deleteValue(skey);
            }
            // cache
            if (isTodayGreater(data, expiredday)) {
                console.log("clean " + skey)
                GM_deleteValue(skey);
                GM_deleteValue(skey + "-expired");
            }
        }
    }
}

const isEmpty = (s) => {
    return !s || s === 'N/A';
}

export {
    isTodayGreater,
    getFormattedDate,
    setValue_GM,
    clearExpired,
    isEmpty,
}
