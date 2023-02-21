import { clearExpired } from './common';
import siteinit from './sites';

(() => {
    siteinit()
    // 缓存5天
    clearExpired(5)
})();
