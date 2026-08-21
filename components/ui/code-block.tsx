"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  label?: string;
}

/**
 * Copyable snippet for docs and submit.
 *
 * @example <CodeBlock label="python" code="from vsarena import Agent" />
 */
export function CodeBlock({ code, label = "code" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <span className="font-mono text-[11px] text-arena-muted">{label}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="text-xs text-arena-muted hover:text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-arena-fg">
        <code>{code}</code>
      </pre>
    </div>
  );
}
