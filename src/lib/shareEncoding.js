// URL-safe compact encoding of the "My Instrument" state so it can be shared.
// Uses a hash fragment (#share=...) which is not sent to any server.

const toUrlSafeB64 = (str) => {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromUrlSafeB64 = (str) => {
  const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(escape(atob(b64)));
};

export const encodeShare = (state) => {
  const compact = {
    n: state.projectName,
    s: state.selected,
    r: state.results.map((r) => ({
      i: r.id,
      m: r.moduleId,
      mn: r.moduleName,
      t: r.savedAt,
      p: r.payload,
    })),
  };
  return toUrlSafeB64(JSON.stringify(compact));
};

export const decodeShare = (encoded) => {
  try {
    const json = fromUrlSafeB64(encoded);
    const parsed = JSON.parse(json);
    return {
      projectName: typeof parsed.n === 'string' ? parsed.n : 'Shared Instrument',
      selected: Array.isArray(parsed.s) ? parsed.s : [],
      results: Array.isArray(parsed.r) ? parsed.r.map((r) => ({
        id: r.i, moduleId: r.m, moduleName: r.mn, savedAt: r.t, payload: r.p,
      })) : [],
    };
  } catch (e) {
    return null;
  }
};

export const buildShareUrl = (state) => {
  const enc = encodeShare(state);
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#share=${enc}`;
};
