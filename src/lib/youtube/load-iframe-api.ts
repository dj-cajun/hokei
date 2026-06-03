/** YouTube IFrame API 스크립트 1회 로드 */
export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const done = () => {
      if (window.YT?.Player) resolve();
    };

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      done();
    };

    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const poll = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(poll);
          resolve();
        }
      }, 40);
      window.setTimeout(() => {
        window.clearInterval(poll);
        if (!window.YT?.Player) {
          reject(new Error("YouTube IFrame API timeout"));
        }
      }, 12_000);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("YouTube IFrame API load failed"));
    document.head.appendChild(script);
  });
}
