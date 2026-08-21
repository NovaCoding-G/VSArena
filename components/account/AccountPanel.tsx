"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/i18n/messages";

interface AgentRow {
  id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  elo_rating: number;
}

interface AccountPanelProps {
  username: string;
  githubUrl: string | null;
  apiKey: string;
  agents: AgentRow[];
}

/**
 * Reveal/copy/rotate API key and register an agent for the leaderboard.
 *
 * @example <AccountPanel username="novacoding" apiKey="…" agents={[]} githubUrl={null} />
 */
export function AccountPanel({ username, githubUrl, apiKey, agents }: AccountPanelProps) {
  const { m } = useI18n();
  const [key, setKey] = useState(apiKey);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState(agents);
  const [name, setName] = useState("");
  const [repo, setRepo] = useState(githubUrl ?? "");

  const masked = `${key.slice(0, 8)}…${key.slice(-4)}`;

  async function rotate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rotate" }),
      });
      const json = (await res.json()) as { api_key?: string; error?: string };
      if (!res.ok || !json.api_key) throw new Error(json.error ?? "rotate failed");
      setKey(json.api_key);
      setShown(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "rotate failed");
    } finally {
      setBusy(false);
    }
  }

  async function createAgent() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-agent", name, repo_url: repo }),
      });
      const json = (await res.json()) as { agent?: AgentRow; error?: string };
      if (!res.ok || !json.agent) throw new Error(json.error ?? "create failed");
      setMine((rows) => [json.agent as AgentRow, ...rows]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyKey() {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-8">
      <section className="panel p-5">
        <p className="text-sm font-medium text-arena-cyan">{m.account.apiKey}</p>
        <p className="mt-2 font-mono text-xs text-arena-muted">{m.account.apiHelp}</p>
        <p className="mt-4 break-all font-mono text-sm text-white">{shown ? key : masked}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setShown((v) => !v)}>
            {shown ? m.account.hide : m.account.reveal}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void copyKey()}>
            {copied ? m.account.copied : m.account.copy}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void rotate()}>
            {m.account.rotate}
          </Button>
        </div>
      </section>

      <section className="panel p-5">
        <p className="text-sm font-medium text-arena-cyan">{m.account.register}</p>
        <p className="mt-2 font-mono text-xs text-arena-muted">{fill(m.account.registerHelp, { name: username })}</p>
        <div className="mt-4 grid gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={m.account.namePlaceholder}
            className="h-9 rounded-lg border border-white/15 bg-black/40 px-3 font-mono text-sm text-white outline-none focus:border-arena-cyan"
          />
          <input
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
            placeholder="https://github.com/you/your-agent"
            className="h-9 rounded-lg border border-white/15 bg-black/40 px-3 font-mono text-sm text-white outline-none focus:border-arena-cyan"
          />
          <Button size="sm" disabled={busy || name.trim().length < 2} onClick={() => void createAgent()}>
            {m.account.create}
          </Button>
        </div>
        {mine.length > 0 ? (
          <ul className="mt-4 space-y-2 font-mono text-sm">
            {mine.map((agent) => (
              <li key={agent.id} className="flex justify-between gap-3 border-b border-white/5 py-2">
                <span className="text-arena-cyan">{agent.name}</span>
                <span className="text-arena-muted">ELO {agent.elo_rating}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {error ? <p className="font-mono text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
