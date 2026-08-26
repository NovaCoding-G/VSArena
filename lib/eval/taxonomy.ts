/** Published failure taxonomy: policy vs protocol vs harness. Assumption: codes are stable for ingest/docs. */

export const FAILURE_DOMAINS = ["policy", "protocol", "harness"] as const;
export type FailureDomain = (typeof FAILURE_DOMAINS)[number];

export const FAILURE_CODES = [
  "policy.task_complete",
  "policy.task_incomplete",
  "policy.timeout",
  "protocol.hello_timeout",
  "protocol.api_key_required",
  "protocol.invalid_api_key",
  "protocol.invalid_task",
  "protocol.invalid_action",
  "protocol.schema_violation",
  "harness.busy",
  "harness.misconfigured",
  "harness.disconnect",
] as const;

export type FailureCode = (typeof FAILURE_CODES)[number];

export interface FailureRecord {
  code: FailureCode;
  domain: FailureDomain;
  /** Human message; agents should key off `code`. */
  message: string;
  recoverable: boolean;
}

export interface EvalCounters {
  action_timeouts: number;
  consecutive_timeouts: number;
  invalid_actions: number;
}

/**
 * Domain from a dotted code.
 *
 * @example failureDomain("policy.timeout") // "policy"
 */
export function failureDomain(code: FailureCode): FailureDomain {
  return code.split(".")[0] as FailureDomain;
}

/**
 * Wire error payload (agent socket). Always includes `code`.
 *
 * @example harnessError("harness.busy", "one match at a time")
 */
export function harnessError(
  code: FailureCode,
  message: string,
  recoverable = false,
): FailureRecord & { type: "error" } {
  return {
    type: "error",
    code,
    domain: failureDomain(code),
    message: `${code}: ${message}`,
    recoverable,
  };
}

/**
 * End-of-match failure from scores + timeout budget.
 *
 * @example matchFailure({ completion: 1, timeouts: 0, maxConsecutive: 0, disconnected: false })
 */
export function matchFailure(input: {
  completion: number;
  consecutiveTimeouts: number;
  timeoutBudget: number;
  invalidActions: number;
  invalidBudget: number;
  disconnected: boolean;
}): FailureRecord {
  if (input.disconnected) {
    return {
      code: "harness.disconnect",
      domain: "harness",
      message: "harness.disconnect: socket closed before result",
      recoverable: true,
    };
  }
  if (input.consecutiveTimeouts >= input.timeoutBudget) {
    return {
      code: "policy.timeout",
      domain: "policy",
      message: `policy.timeout: ${input.consecutiveTimeouts} consecutive late actions`,
      recoverable: false,
    };
  }
  if (input.invalidActions >= input.invalidBudget) {
    return {
      code: "protocol.invalid_action",
      domain: "protocol",
      message: `protocol.invalid_action: ${input.invalidActions} contract violations`,
      recoverable: false,
    };
  }
  if (input.completion >= 1) {
    return {
      code: "policy.task_complete",
      domain: "policy",
      message: "policy.task_complete: stack slots filled",
      recoverable: false,
    };
  }
  return {
    code: "policy.task_incomplete",
    domain: "policy",
    message: "policy.task_incomplete: horizon reached without a full stack",
    recoverable: false,
  };
}

export function emptyCounters(): EvalCounters {
  return { action_timeouts: 0, consecutive_timeouts: 0, invalid_actions: 0 };
}

/** Consecutive late-action budget before the match is a policy.timeout. */
export function timeoutStrikeBudget(mode: "vla" | "state"): number {
  return mode === "vla" ? 8 : 20;
}

export const INVALID_ACTION_BUDGET = 5;

/**
 * Leaderboard status. Horizon-end incomplete stays `completed` so ELO uses
 * task_completion_score (same as pre-0.5). Aborts are `failed`.
 */
export function officialMatchStatus(code: FailureCode): "completed" | "failed" {
  return code === "policy.task_complete" || code === "policy.task_incomplete" ? "completed" : "failed";
}

/** Disconnect / misconfig / busy never write the public board. */
export function shouldIngestOfficialResult(failure: FailureRecord): boolean {
  return failure.domain !== "harness";
}
