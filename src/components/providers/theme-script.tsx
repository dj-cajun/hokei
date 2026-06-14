/** 다크 모드 깜빡임 방지 — root layout <head>에서만 사용 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='hokei-theme';var t=localStorage.getItem(k);var d=t==='dark'||(!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
