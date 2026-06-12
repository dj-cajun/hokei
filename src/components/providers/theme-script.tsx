const THEME_INIT = `(function(){try{var k='hokei-theme';var t=localStorage.getItem(k);var d=t==='dark'||(!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

/** 다크 모드 깜빡임 방지 — hydration 전에 html.dark 적용 (루트 layout <head> 전용) */
export function ThemeScript() {
  return (
    <script
      id="hokei-theme-init"
      dangerouslySetInnerHTML={{ __html: THEME_INIT }}
    />
  );
}
