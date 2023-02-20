

const getURL_GM = (url) => {
    return new Promise(resolve => GM.xmlHttpRequest({
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
            console.error(`Error during GM.xmlHttpRequest to ${url}:`, response.statusText);
            resolve();
        }
    }));
}

const getJSON_GM = async (url) => {
    const data = await getURL_GM(url);
    if (data) {
        return JSON.parse(data);
    }
}

const getJSONP_GM = async (url) => {
    const data = await getURL_GM(url);
    if (data) {
        const end = data.lastIndexOf(')');
        const [, json] = data.substring(0, end).split('(', 2);
        return JSON.parse(json);
    }
}

const getJSON = async (url) => {
    try {
        const response = await fetch(url);
        if (response.status >= 200 && response.status < 400)
            return await response.json();
        console.error(`Error fetching ${url}:`, response.status, response.statusText, await response.text());
    }
    catch (e) {
        console.error(`Error fetching ${url}:`, e);
    }
}

export{
    getURL_GM,
    getJSON_GM,
    getJSONP_GM,
    getJSON,
}

