/** YouTube IFrame Player API (최소 타입) */
declare namespace YT {
  type PlayerEvent = { target: Player };

  class Player {
    constructor(
      elementId: string | HTMLElement,
      options: {
        host?: string;
        videoId?: string;
        width?: string | number;
        height?: string | number;
        playerVars?: Record<string, string | number>;
        events?: {
          onReady?: (event: PlayerEvent) => void;
          onStateChange?: (event: { data: number; target: Player }) => void;
        };
      }
    );
    mute(): void;
    playVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    destroy(): void;
  }

  const PlayerState: {
    ENDED: number;
    PLAYING: number;
  };
}

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
