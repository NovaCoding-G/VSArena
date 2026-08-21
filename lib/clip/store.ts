"use client";

import { create } from "zustand";
import { CLIP_FORMATS, type ClipFormatId } from "@/lib/clip/formats";
import type { ClipBlob } from "@/lib/clip/engine";

export type ClipPhase = "idle" | "recording" | "endcard" | "ready";

interface ClipState {
  phase: ClipPhase;
  format: ClipFormatId;
  error: string | null;
  objectUrl: string | null;
  fileName: string;
  mime: string;
  startedAt: number;
  startRecording: (format?: ClipFormatId) => void;
  requestStop: () => void;
  markEndCard: () => void;
  complete: (clip: ClipBlob, agent: string) => void;
  fail: (message: string) => void;
  setFormat: (format: ClipFormatId) => void;
  dismiss: () => void;
}

function revoke(url: string | null): void {
  if (url) URL.revokeObjectURL(url);
}

function stampName(agent: string, format: ClipFormatId, extension: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const slug = agent.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `vsarena-${slug}-${CLIP_FORMATS[format].ratio.replace(":", "x")}-${day}.${extension}`;
}

/**
 * Clip export session. The R3F recorder is the only writer of `complete`.
 *
 * @example useClipStore.getState().startRecording("reels")
 */
export const useClipStore = create<ClipState>((set, get) => ({
  phase: "idle",
  format: "reels",
  error: null,
  objectUrl: null,
  fileName: "vsarena-clip.webm",
  mime: "video/webm",
  startedAt: 0,
  setFormat: (format) => {
    if (get().phase === "recording" || get().phase === "endcard") return;
    set({ format });
  },
  startRecording: (format) => {
    const nextFormat = format ?? get().format;
    revoke(get().objectUrl);
    set({
      phase: "recording",
      format: nextFormat,
      error: null,
      objectUrl: null,
      startedAt: performance.now(),
    });
  },
  requestStop: () => {
    if (get().phase !== "recording") return;
    set({ phase: "endcard" });
  },
  markEndCard: () => {
    if (get().phase !== "recording") return;
    set({ phase: "endcard" });
  },
  complete: (clip, agent) => {
    revoke(get().objectUrl);
    set({
      phase: "ready",
      objectUrl: URL.createObjectURL(clip.blob),
      fileName: stampName(agent, get().format, clip.extension),
      mime: clip.mime,
      error: null,
    });
  },
  fail: (message) => {
    revoke(get().objectUrl);
    set({ phase: "idle", error: message, objectUrl: null, startedAt: 0 });
  },
  dismiss: () => {
    revoke(get().objectUrl);
    set({ phase: "idle", objectUrl: null, error: null, startedAt: 0 });
  },
}));
