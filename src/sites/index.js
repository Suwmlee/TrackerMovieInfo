
import bhdinit from './beyondhd'
import ptpinit from './passthepopcorn'


let siteinit = () => {

    let host = location.hostname;
    if (host === 'beyond-hd.me') {
        bhdinit()
    } else if (host === 'passthepopcorn.me'){
        ptpinit()
    }
}

export default siteinit;
