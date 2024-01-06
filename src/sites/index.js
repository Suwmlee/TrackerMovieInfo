
import bhdinit from './beyondhd'
import ptpinit from './passthepopcorn'
import btninit from './broadcasthenet'
import hdbinit from './hdbits'


let siteinit = () => {

    let host = location.hostname;
    if (host === 'beyond-hd.me') {
        bhdinit()
    } else if (host === 'passthepopcorn.me') {
        ptpinit()
    } else if (host === 'broadcasthe.net') {
        btninit()
    } else if (host === 'hdbits.org') {
        hdbinit()
    }
}

export default siteinit;
