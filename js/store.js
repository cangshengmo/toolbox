/* 百宝箱 · 存储层：localStorage 封装，键统一 bx:<toolId>:<key> 命名空间 */
window.App = window.App || {};

const K = (t, k) => 'bx:' + t + ':' + k;

App.store = {
  get(toolId, key, fallback) {
    try {
      const raw = localStorage.getItem(K(toolId, key));
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },

  set(toolId, key, value) {
    try {
      localStorage.setItem(K(toolId, key), JSON.stringify(value));
    } catch (e) { console.error('[store] set failed:', key, e); }
  },

  remove(toolId, key) {
    localStorage.removeItem(K(toolId, key));
  },

  clear(toolId) {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('bx:' + toolId + ':')) localStorage.removeItem(k);
    }
  },

  appGet(key, fallback) { return this.get('app', key, fallback); },
  appSet(key, value) { this.set('app', key, value); },

  /* 备份：导出全部 bx:* 数据 */
  exportAll() {
    const out = {};
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith('bx:')) continue;
      try { out[k] = JSON.parse(localStorage.getItem(k)); }
      catch (e) { out[k] = localStorage.getItem(k); }
    }
    return out;
  },

  /* 备份：批量写入 bx:* 键值（跳过非法键） */
  importAll(obj) {
    let n = 0;
    for (const k in obj) {
      if (typeof k === 'string' && k.startsWith('bx:')) {
        localStorage.setItem(k, JSON.stringify(obj[k]));
        n++;
      }
    }
    return n;
  },

  /* 备份：清空全部 bx:* 数据 */
  clearAll() {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('bx:')) localStorage.removeItem(k);
    }
  },
};
