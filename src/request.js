

const getURL_GM = (url) => {
    return new Promise(resolve => GM_xmlHttpRequest({
        method: 'GET',
        url: url,
        onload: function (response) {
            if (response.status >= 200 && response.status < 400) {
                resolve(response.responseText);
            } else {
                console.error(`Error getting ${url}:`, response.status, response.statusText, response.responseText);
                resolve();
            }
        },
        onerror: function (response) {
            console.error(`Error during GM_xmlHttpRequest to ${url}:`, response.statusText);
            resolve();
        }
    }));
}

const getJSON_GM = (url) => {
    const data = getURL_GM(url);
    if (data) {
        return JSON.parse(data);
    }
}

const getJSONP_GM = (url) => {
    const data = getURL_GM(url);
    if (data) {
        const end = data.lastIndexOf(')');
        const [, json] = data.substring(0, end).split('(', 2);
        return JSON.parse(json);
    }
}

export{
    getURL_GM,
    getJSON_GM,
    getJSONP_GM,
}

