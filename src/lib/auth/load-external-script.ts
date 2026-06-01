const loadedScripts = new Map<string, Promise<void>>();

/**
 * 외부 SDK script를 한 번만 로드 (Next.js 클라이언트용)
 */
export function loadExternalScript(src: string, id?: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadExternalScript: browser only"));
  }

  const key = id ?? src;
  const existing = loadedScripts.get(key);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    if (id) script.id = id;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

  loadedScripts.set(key, promise);
  return promise;
}
