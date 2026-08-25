"use client";

/** Read-only 3D mirror of the hosted harness. Assumption: no Rapier here — poses come from /spectate. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import Link from "next/link";
import { ArenaSet } from "@/components/simulation/ArenaSet";
import { Blocks } from "@/components/simulation/Blocks";
import { RobotArm } from "@/components/simulation/RobotArm";
import { Table } from "@/components/simulation/Table";
import { TargetZone } from "@/components/simulation/TargetZone";
import type { SpectateFrameMessage, SpectateMessage } from "@/lib/harness/spectate";
import { harnessHealthUrl, harnessSpectateUrl } from "@/lib/live/harnessWs";
import { TABLE_TOP_Y } from "@/simulation/constants";
import type { BlockState, JointState } from "@/simulation/types";

type LiveStatus = "connecting" | "idle" | "live" | "result" | "error";

interface ResultBanner {
  agent: string;
  spatial: number;
  task: number;
}

const ZERO_JOINTS: JointState = {
  baseYaw: 0,
  shoulderPitch: 0.6,
  elbowPitch: -1.2,
  wristPitch: -0.4,
  gripper: 0,
};

/**
 * Spectator HUD + Canvas driven by harness /spectate.
 *
 * @example <LiveViewer />
 */
export function LiveViewer() {
  const jointsRef = useRef<JointState>({ ...ZERO_JOINTS });
  const blocksRef = useRef<BlockState[]>([]);
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [agent, setAgent] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [taskScore, setTaskScore] = useState(0);
  const [result, setResult] = useState<ResultBanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const applyFrame = useCallback((frame: SpectateFrameMessage) => {
    jointsRef.current = { ...frame.joints };
    blocksRef.current = frame.blocks.map((b) => ({
      id: b.id,
      position: b.position,
      rotation: b.rotation,
      color: b.color,
    }));
    setAgent(frame.agent);
    setTick(frame.tick);
    setTaskScore(frame.task_completion_score);
    setStatus("live");
    setResult(null);
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;
      setStatus((s) => (s === "live" ? s : "connecting"));
      const url = harnessSpectateUrl();
      try {
        socket = new WebSocket(url);
      } catch {
        setStatus("error");
        setError("Could not open spectator socket");
        return;
      }

      socket.onopen = () => {
        attempt = 0;
        if (!cancelled) setError(null);
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        let msg: SpectateMessage;
        try {
          msg = JSON.parse(String(event.data)) as SpectateMessage;
        } catch {
          return;
        }
        if (msg.type === "spectate_frame") {
          applyFrame(msg);
          return;
        }
        if (msg.type === "spectate_idle") {
          setStatus("idle");
          setAgent(null);
          setTick(0);
          setTaskScore(0);
          return;
        }
        if (msg.type === "spectate_result") {
          setStatus("result");
          setResult({
            agent: msg.agent,
            spatial: msg.scores.spatial_accuracy,
            task: msg.scores.task_completion_score,
          });
          return;
        }
        if (msg.type === "spectate_error") {
          setStatus("error");
          setError(msg.message);
        }
      };

      socket.onerror = () => {
        // onclose handles retry
      };

      socket.onclose = () => {
        if (cancelled) return;
        setStatus("connecting");
        attempt += 1;
        const delay = Math.min(12_000, 1500 * attempt);
        retryTimer = setTimeout(connect, delay);
      };
    };

    // Wake free-tier Render before WS when possible.
    void fetch(harnessHealthUrl()).catch(() => undefined);
    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [applyFrame]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "connecting":
        return "Connecting…";
      case "idle":
        return "Waiting for a live match";
      case "live":
        return "LIVE";
      case "result":
        return "Match finished";
      case "error":
        return "Offline";
      default:
        return "";
    }
  }, [status]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-arena-cyan">Spectator</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Live harness</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-arena-muted">
              Watch the official judge in real time. Scoring and ELO stay on the harness — this page
              only mirrors poses.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={
                status === "live"
                  ? "rounded-full bg-emerald-500/15 px-3 py-1 font-medium text-emerald-300"
                  : "rounded-full bg-white/5 px-3 py-1 text-arena-muted"
              }
            >
              {status === "live" ? (
                <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              ) : null}
              {statusLabel}
            </span>
            {agent ? <span className="text-white">{agent}</span> : null}
            {status === "live" ? (
              <span className="text-arena-muted">
                tick {tick} · task {(taskScore * 100).toFixed(0)}%
              </span>
            ) : null}
          </div>
        </div>
        {result ? (
          <div className="mx-auto mt-4 w-full max-w-6xl rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-arena-muted">
            <span className="text-white">{result.agent}</span> finished — spatial{" "}
            {(result.spatial * 100).toFixed(0)}% · task {(result.task * 100).toFixed(0)}%.{" "}
            <Link href="/leaderboard" className="text-arena-cyan hover:text-white">
              Leaderboard
            </Link>
          </div>
        ) : null}
        {error ? (
          <p className="mx-auto mt-3 w-full max-w-6xl text-sm text-amber-300/90">{error}</p>
        ) : null}
        {status === "idle" || status === "connecting" ? (
          <p className="mx-auto mt-3 w-full max-w-6xl text-sm text-arena-muted">
            Run a live agent with{" "}
            <code className="text-white">VSARENA_HARNESS_URL=wss://vsarena-harness.onrender.com</code>{" "}
            to fill this view. Free tier may take ~30–60s to wake.
          </p>
        ) : null}
      </div>

      <div className="relative min-h-[420px] flex-1 bg-[#07080b]">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [1.72, 1.18, 1.55], fov: 42, near: 0.05, far: 40 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.outputColorSpace = SRGBColorSpace;
          }}
        >
          <color attach="background" args={["#07080b"]} />
          <ambientLight intensity={0.45} />
          <directionalLight
            castShadow
            intensity={1.15}
            position={[2.4, 4.2, 1.8]}
            shadow-mapSize={[1024, 1024]}
          />
          <ArenaSet />
          <Table />
          <TargetZone />
          {ready ? (
            <>
              <RobotArm jointsRef={jointsRef} />
              <Blocks blocksRef={blocksRef} />
            </>
          ) : null}
          <ContactShadows
            position={[0, 0.002, 0]}
            opacity={0.45}
            scale={8}
            blur={2.2}
            far={4}
          />
          <OrbitControls
            makeDefault
            target={[0.08, TABLE_TOP_Y + 0.08, 0]}
            minDistance={0.95}
            maxDistance={4.2}
            minPolarAngle={0.18}
            maxPolarAngle={Math.PI / 2 - 0.12}
          />
        </Canvas>
      </div>
    </div>
  );
}
