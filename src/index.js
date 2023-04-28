import { clearExpired } from './common';
import { doubaninit } from './douban';
import siteinit from './sites';

(() => {
    doubaninit();
    siteinit();
    // 缓存90天
    clearExpired(90);
})();
