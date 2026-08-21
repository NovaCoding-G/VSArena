// Assumption: extra-MVP growth slice — visual export only; physics/scoring unchanged.

export type ClipFormatId = "reels" | "square" | "wide";

export interface ClipFormat {
  id: ClipFormatId;
  label: string;
  platforms: string;
  ratio: string;
  width: number;
  height: number;
}

/**
 * Native 1080 social sizes. The recorder re-renders the scene at this resolution
 * instead of upscaling the dashboard viewport.
 *
 * @example CLIP_FORMATS.reels.width // 1080
 */
export const CLIP_FORMATS: Record<ClipFormatId, ClipFormat> = {
  reels: {
    id: "reels",
    label: "9:16",
    platforms: "Reels · TikTok · Shorts",
    ratio: "9:16",
    width: 1080,
    height: 1920,
  },
  square: {
    id: "square",
    label: "1:1",
    platforms: "IG feed · LinkedIn",
    ratio: "1:1",
    width: 1080,
    height: 1080,
  },
  wide: {
    id: "wide",
    label: "16:9",
    platforms: "X · YouTube",
    ratio: "16:9",
    width: 1920,
    height: 1080,
  },
};

export const CLIP_FORMAT_LIST = Object.values(CLIP_FORMATS);

export const CLIP_MAX_MS = 45_000;
export const CLIP_ENDCARD_MS = 1_800;
export const CLIP_FPS = 30;
export const CLIP_BITRATE = 16_000_000;

/**
 * Center-crop source into destination aspect (object-fit: cover).
 *
 * @example coverRect(1920, 1080, 720, 1280)
 */
export function coverRect(
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
): { sx: number; sy: number; sw: number; sh: number } {
  if (srcW <= 0 || srcH <= 0) return { sx: 0, sy: 0, sw: Math.max(1, srcW), sh: Math.max(1, srcH) };
  const srcRatio = srcW / srcH;
  const destRatio = destW / destH;
  if (srcRatio > destRatio) {
    const sw = srcH * destRatio;
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH };
  }
  const sh = srcW / destRatio;
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh };
}

/**
 * First MediaRecorder MIME the browser can actually encode.
 *
 * @example pickRecorderMime() // "video/webm;codecs=vp9"
 */
export function pickRecorderMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export function clipExtension(mime: string): "webm" | "mp4" {
  return mime.includes("mp4") ? "mp4" : "webm";
}

export function formatClipClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
