import { prisma } from "@/lib/prisma";
import { parseYouTubeFromUrl } from "@/lib/youtube/video-id";

export const HOME_YOUTUBE_URL_KEY = "home.youtubeUrl";

const DEFAULT_VIDEO_ID = "d-fY16xMeT4";
const DEFAULT_START_SECONDS = 12;

export type HomeYouTubeHighlight = {
  videoId: string;
  startSeconds: number;
  source: "db" | "env" | "default";
  rawUrl?: string;
};

function envHighlight(): HomeYouTubeHighlight | null {
  const videoId = process.env.NEXT_PUBLIC_YOUTUBE_HIGHLIGHT_ID?.trim();
  if (!videoId) return null;

  const rawStart = process.env.NEXT_PUBLIC_YOUTUBE_HIGHLIGHT_START?.trim();
  let startSeconds = DEFAULT_START_SECONDS;
  if (rawStart) {
    const n = Number.parseInt(rawStart, 10);
    if (Number.isFinite(n) && n >= 0) startSeconds = n;
  }

  return {
    videoId,
    startSeconds,
    source: "env",
  };
}

export function resolveHomeYouTubeHighlight(
  storedUrl?: string | null
): HomeYouTubeHighlight {
  const trimmed = storedUrl?.trim();
  if (trimmed) {
    const parsed = parseYouTubeFromUrl(trimmed);
    if (parsed) {
      return {
        videoId: parsed.videoId,
        startSeconds: parsed.startSeconds ?? 0,
        source: "db",
        rawUrl: trimmed,
      };
    }
  }

  const fromEnv = envHighlight();
  if (fromEnv) return fromEnv;

  return {
    videoId: DEFAULT_VIDEO_ID,
    startSeconds: DEFAULT_START_SECONDS,
    source: "default",
  };
}

export async function getHomeYouTubeHighlight(): Promise<HomeYouTubeHighlight> {
  const row = await prisma.appSetting.findUnique({
    where: { key: HOME_YOUTUBE_URL_KEY },
    select: { value: true },
  });
  return resolveHomeYouTubeHighlight(row?.value);
}

export async function setHomeYouTubeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    await prisma.appSetting.deleteMany({ where: { key: HOME_YOUTUBE_URL_KEY } });
    return resolveHomeYouTubeHighlight(null);
  }

  const parsed = parseYouTubeFromUrl(trimmed);
  if (!parsed) {
    throw new Error("올바른 YouTube URL을 입력해 주세요.");
  }

  await prisma.appSetting.upsert({
    where: { key: HOME_YOUTUBE_URL_KEY },
    create: { key: HOME_YOUTUBE_URL_KEY, value: trimmed },
    update: { value: trimmed },
  });

  return resolveHomeYouTubeHighlight(trimmed);
}
