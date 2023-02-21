import { clearExpired } from './common';
import { doubaninit } from './douban';
import siteinit from './sites';

(() => {
    doubaninit();
    siteinit();
    // 缓存5天
    clearExpired(5);
})();
