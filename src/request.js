
const getURL_GM = (url, callback) => {
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: function (response) {
            if (response.status >= 200 && response.status < 400) {
                callback(response.responseText, response)
            } else {
                console.error(`Error getting ${url}:`, response.status, response.statusText, response.responseText);
                callback('error', response)
            }
        },
        onerror: function (error) {
            console.error(`Error during GM_xmlHttpRequest to ${url}:`, error.statusText);
            callback(error.statusText, error);
        }
    });
}

const getJSON_GM = (url, callback) => {
    getURL_GM(url, function (data) {
        if (data) {
            callback(JSON.parse(data));
        } else {
            callback(null)
        }
    });
}

export {
    getURL_GM,
    getJSON_GM,
}
