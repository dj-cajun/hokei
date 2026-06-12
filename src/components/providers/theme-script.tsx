/** 다크 모드 깜빡임 방지 — hydration 전에 html.dark 적용 */
export function ThemeScript() {
  const script = `(function(){try{var k='hokei-theme';var t=localStorage.getItem(k);var d=t==='dark'||(!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
