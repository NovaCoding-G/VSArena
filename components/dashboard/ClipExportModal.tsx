"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildClipCaption } from "@/lib/clip/caption";
import { CLIP_FORMATS } from "@/lib/clip/formats";
import { useClipStore } from "@/lib/clip/store";
import { useHudStore } from "@/lib/store";

/**
 * Preview + download + copy-caption after a clip finishes encoding.
 *
 * @example <ClipExportModal />
 */
export function ClipExportModal() {
  const phase = useClipStore((s) => s.phase);
  const url = useClipStore((s) => s.objectUrl);
  const fileName = useClipStore((s) => s.fileName);
  const format = useClipStore((s) => s.format);
  const dismiss = useClipStore((s) => s.dismiss);
  const result = useHudStore((s) => s.matchResult);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (phase !== "ready") setCopied(false);
  }, [phase]);

  if (phase !== "ready" || !url) return null;

  const spec = CLIP_FORMATS[format];
  const caption = buildClipCaption({
    agent: result ? "Baseline-IK" : "TELEOP",
    format,
    result,
  });
  const aspect = spec.width / spec.height;

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="panel max-h-[92vh] w-full max-w-3xl overflow-y-auto p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-arena-cyan">Clip</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Download</h2>
            <p className="mt-1 text-xs text-arena-muted">
              {spec.platforms} · {spec.ratio} · {spec.width}×{spec.height} · 1080p
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Close
          </Button>
        </div>

        <div className="mt-4 flex justify-center bg-black">
          <video
            src={url}
            controls
            playsInline
            autoPlay
            loop
            className="max-h-[52vh] w-full bg-black"
            style={{ aspectRatio: String(aspect), maxWidth: aspect < 1 ? 320 : 720 }}
          />
        </div>

        <pre className="mt-4 max-h-36 overflow-auto whitespace-pre-wrap border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-arena-muted">
          {caption}
        </pre>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <a href={url} download={fileName}>
              Download {fileName.endsWith(".mp4") ? "MP4" : "WebM"}
            </a>
          </Button>
          <Button variant="outline" onClick={() => void copyCaption()}>
            {copied ? "Caption copied" : "Copy caption"}
          </Button>
          <Button variant="ghost" onClick={dismiss}>
            Discard
          </Button>
        </div>
        <p className="mt-3 font-mono text-[10px] text-arena-muted">MP4/WebM + caption</p>
      </div>
    </div>
  );
}
