import {
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  type Camera,
} from "three";
import {
  CLIP_BITRATE,
  CLIP_ENDCARD_MS,
  CLIP_FORMATS,
  CLIP_FPS,
  CLIP_MAX_MS,
  clipExtension,
  pickRecorderMime,
  type ClipFormatId,
} from "@/lib/clip/formats";
import { drawClipFrame, type ClipOverlayState } from "@/lib/clip/overlay";

export interface ClipBlob {
  blob: Blob;
  mime: string;
  extension: "webm" | "mp4";
  width: number;
  height: number;
  durationMs: number;
}

const CAPTURE_INTERVAL_MS = 1000 / CLIP_FPS;

/**
 * Dedicated 1080p WebGL context for export so the live canvas is never resized.
 * Capture is capped at 30 fps (social standard) — display stays at 60.
 *
 * @example engine.start("reels", gl, onReady, onError)
 */
export class ClipEngine {
  private composite: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private offscreen: HTMLCanvasElement | null = null;
  private offGl: WebGLRenderer | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mime = "video/webm";
  private formatId: ClipFormatId = "reels";
  private startedAt = 0;
  private endcardAt = 0;
  private lastCaptureAt = 0;
  private logo: HTMLImageElement | null = null;
  private running = false;
  private onReady: ((clip: ClipBlob) => void) | null = null;
  private onError: ((message: string) => void) | null = null;

  /**
   * Warm the brand mark so the first recorded frame is not blank.
   *
   * @example await engine.preload()
   */
  async preload(): Promise<void> {
    if (this.logo) return;
    const image = new Image();
    image.decoding = "async";
    image.src = "/brand/vs-arena-mark.png";
    try {
      await image.decode();
      this.logo = image;
    } catch {
      this.logo = image;
    }
  }

  get elapsedMs(): number {
    if (!this.running) return 0;
    return performance.now() - this.startedAt;
  }

  get isActive(): boolean {
    return this.running;
  }

  /**
   * Begin encoding. `mainGl` is only used to copy color/shadow settings.
   *
   * @example engine.start("reels", gl, onReady, onError)
   */
  start(
    format: ClipFormatId,
    mainGl: WebGLRenderer,
    onReady: (clip: ClipBlob) => void,
    onError: (message: string) => void,
  ): void {
    this.disposeRecorder();
    const mime = pickRecorderMime();
    if (!mime) {
      onError("This browser cannot encode a clip. Use Chrome or Edge.");
      return;
    }
    const spec = CLIP_FORMATS[format];
    const composite = document.createElement("canvas");
    composite.width = spec.width;
    composite.height = spec.height;
    const ctx = composite.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) {
      onError("Could not create the export canvas.");
      return;
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = spec.width;
    offscreen.height = spec.height;
    let offGl: WebGLRenderer;
    try {
      offGl = new WebGLRenderer({
        canvas: offscreen,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not create the 1080p capture renderer.");
      return;
    }
    offGl.setPixelRatio(1);
    offGl.setSize(spec.width, spec.height, false);
    offGl.setClearColor("#0a0e14", 1);
    offGl.outputColorSpace = mainGl.outputColorSpace ?? SRGBColorSpace;
    offGl.toneMapping = mainGl.toneMapping;
    offGl.toneMappingExposure = mainGl.toneMappingExposure;
    offGl.shadowMap.enabled = mainGl.shadowMap.enabled;
    offGl.shadowMap.type = mainGl.shadowMap.type;

    this.composite = composite;
    this.ctx = ctx;
    this.offscreen = offscreen;
    this.offGl = offGl;
    this.mime = mime;
    this.formatId = format;
    this.chunks = [];
    this.startedAt = performance.now();
    this.endcardAt = 0;
    this.lastCaptureAt = 0;
    this.onReady = onReady;
    this.onError = onError;

    const stream = composite.captureStream(CLIP_FPS);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: CLIP_BITRATE });
    } catch (error) {
      this.disposeOffscreen();
      onError(error instanceof Error ? error.message : "MediaRecorder failed to start.");
      return;
    }
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    recorder.onerror = () => {
      this.onError?.("Recording failed mid-clip.");
      this.disposeRecorder();
    };
    recorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.mime });
      const durationMs = Math.max(0, performance.now() - this.startedAt);
      const specNow = CLIP_FORMATS[this.formatId];
      const ready = this.onReady;
      this.recorder = null;
      this.running = false;
      this.disposeOffscreen();
      this.composite = null;
      this.ctx = null;
      this.chunks = [];
      this.endcardAt = 0;
      ready?.({
        blob,
        mime: this.mime,
        extension: clipExtension(this.mime),
        width: specNow.width,
        height: specNow.height,
        durationMs,
      });
    };
    this.recorder = recorder;
    this.running = true;
    recorder.start(250);
  }

  beginEndCard(): void {
    if (!this.running || this.endcardAt > 0) return;
    this.endcardAt = performance.now();
  }

  /**
   * Render at most 30 clip frames/sec onto the encoder canvas. Safe to call every rAF.
   *
   * @example engine.tick(scene, camera, hud)
   */
  tick(scene: Scene, camera: Camera, hud: ClipOverlayState): "ok" | "max" | "endcard-done" {
    if (!this.running || !this.ctx || !this.composite) return "ok";
    const now = performance.now();
    const elapsed = now - this.startedAt;
    const phase = this.endcardAt > 0 ? "endcard" : "recording";

    if (this.endcardAt > 0 && now - this.endcardAt >= CLIP_ENDCARD_MS) {
      this.stop();
      return "endcard-done";
    }
    if (this.endcardAt === 0 && elapsed >= CLIP_MAX_MS) return "max";

    if (now - this.lastCaptureAt < CAPTURE_INTERVAL_MS) return "ok";
    this.lastCaptureAt = now;

    const spec = CLIP_FORMATS[this.formatId];
    if (phase === "recording" && this.offGl && this.offscreen) {
      this.renderOffscreen(scene, camera, spec.width, spec.height);
      drawClipFrame(this.ctx, this.offscreen, this.logo, spec, { ...hud, phase, elapsedMs: elapsed });
    } else {
      drawClipFrame(this.ctx, this.offscreen ?? this.composite, this.logo, spec, { ...hud, phase, elapsedMs: elapsed });
    }
    return "ok";
  }

  stop(): void {
    const recorder = this.recorder;
    if (!recorder) return;
    if (recorder.state === "recording" || recorder.state === "paused") {
      try {
        recorder.stop();
      } catch {
        this.onError?.("Could not finalize the clip.");
        this.disposeRecorder();
      }
    }
  }

  dispose(): void {
    this.onReady = null;
    this.onError = null;
    this.disposeRecorder();
    this.logo = null;
  }

  private renderOffscreen(scene: Scene, camera: Camera, width: number, height: number): void {
    const offGl = this.offGl;
    if (!offGl) return;
    const perspective = camera instanceof PerspectiveCamera ? camera : null;
    const prevAspect = perspective?.aspect;
    if (perspective) {
      perspective.aspect = width / height;
      perspective.updateProjectionMatrix();
    }
    offGl.render(scene, camera);
    if (perspective && prevAspect !== undefined) {
      perspective.aspect = prevAspect;
      perspective.updateProjectionMatrix();
    }
  }

  private disposeOffscreen(): void {
    this.offGl?.dispose();
    this.offGl?.forceContextLoss();
    this.offGl = null;
    this.offscreen = null;
  }

  private disposeRecorder(): void {
    if (this.recorder && this.recorder.state !== "inactive") {
      try {
        this.recorder.stop();
      } catch {
        /* already stopped */
      }
    }
    this.recorder = null;
    this.running = false;
    this.endcardAt = 0;
    this.disposeOffscreen();
    this.composite = null;
    this.ctx = null;
    this.chunks = [];
  }
}
