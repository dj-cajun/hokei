/** YouTube watch / share / embed URL → 영상 ID (임베드용) */

/**
 * 게시판 본문 등에서 잡아내는 표준 패턴 (프로토콜·www 생략, youtu.be, /v/, /embed/ 등)
 * @see convertYoutubeLinks
 */
export const YOUTUBE_URL_IN_TEXT =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^\s#&]*&)*v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s]*/gi;

const WATCH_OR_SHARE =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^&\s#]*&)*v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;

const IFRAME_SRC =
  /<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i;

export type ParsedYouTube = {
  videoId: string;
  startSeconds?: number;
};

export function parseStartSecondsFromQuery(query: string): number | undefined {
  const t = query.match(/(?:^|[?&])t=(\d+)/i)?.[1];
  if (t) {
    const n = Number.parseInt(t, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  const start = query.match(/(?:^|[?&])start=(\d+)/i)?.[1];
  if (start) {
    const n = Number.parseInt(start, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
}

export function parseYouTubeFromUrl(url: string): ParsedYouTube | null {
  const trimmed = url.trim();
  const m = trimmed.match(WATCH_OR_SHARE);
  if (!m) return null;
  const videoId = m[1]!;
  const qIndex = trimmed.indexOf("?");
  const startSeconds =
    qIndex >= 0 ? parseStartSecondsFromQuery(trimmed.slice(qIndex)) : undefined;
  return { videoId, startSeconds };
}

export function parseYouTubeFromIframeHtml(html: string): ParsedYouTube | null {
  const src = html.match(IFRAME_SRC)?.[1];
  if (!src) return null;
  return parseYouTubeFromUrl(src);
}

export type YouTubeEmbedOptions = {
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  startSeconds?: number;
  modestbranding?: boolean;
};

/** 퍼가기(Embed)용 URL — watch 주소를 iframe src에 넣으면 재생되지 않음 */
export function buildYouTubeEmbedSrc(
  videoId: string,
  options: YouTubeEmbedOptions = {}
): string {
  const params = new URLSearchParams({ rel: "0" });
  if (options.autoplay) params.set("autoplay", "1");
  if (options.mute) params.set("mute", "1");
  if (options.loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }
  if (options.modestbranding !== false) params.set("modestbranding", "1");
  params.set("playsinline", "1");
  const start = options.startSeconds;
  if (start != null && start > 0) params.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
}

export type ContentPart =
  | { type: "text"; value: string }
  | { type: "youtube"; videoId: string; startSeconds?: number };

/** 게시글 본문: 유튜브 URL → 임베드 파트 목록 (React에서 iframe 렌더) */
export function splitContentWithYouTubeEmbeds(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const re = new RegExp(YOUTUBE_URL_IN_TEXT.source, YOUTUBE_URL_IN_TEXT.flags);
  while ((match = re.exec(content)) !== null) {
    const raw = match[0];
    const index = match.index;
    if (index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, index) });
    }
    const parsed = parseYouTubeFromUrl(raw);
    if (parsed) {
      parts.push({
        type: "youtube",
        videoId: parsed.videoId,
        startSeconds: parsed.startSeconds,
      });
    } else {
      parts.push({ type: "text", value: raw });
    }
    lastIndex = index + raw.length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  if (parts.length === 0 && content) {
    parts.push({ type: "text", value: content });
  }

  return parts;
}

/**
 * 게시판 Auto-Embed: 일반 주소·공유 링크만 있어도 임베드로 표시할 수 있게 본문을 정규화.
 * (HTML 문자열 치환 대신 React 컴포넌트 렌더 — XSS 안전)
 */
export function convertYoutubeLinks(text: string): ContentPart[] {
  return splitContentWithYouTubeEmbeds(stripRawIframeHtml(text));
}

/** 사용자가 붙여넣은 iframe HTML → watch 링크로 바꿔 convert 단계에서 처리 */
export function stripRawIframeHtml(content: string): string {
  return content.replace(/<iframe[\s\S]*?<\/iframe>/gi, (block) => {
    const parsed = parseYouTubeFromIframeHtml(block);
    if (!parsed) return "";
    const t =
      parsed.startSeconds != null && parsed.startSeconds > 0
        ? `&t=${parsed.startSeconds}`
        : "";
    return `\nhttps://www.youtube.com/watch?v=${parsed.videoId}${t}\n`;
  });
}
