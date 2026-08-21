/** Assumption: public identity is the handle NovaCoding-G; mailbox is the Gmail below. Legal name stays off the site. */

import { GITHUB_ORG } from "@/lib/content";

export const LEGAL_UPDATED_ISO = "2026-08-21";

const DEFAULT_CONTROLLER = "NovaCoding-G";
const DEFAULT_EMAIL = "novacodingg@gmail.com";

/**
 * Public display name of the controller (handle, not legal name).
 *
 * @example legalController()
 */
export function legalController(): string {
  const fromEnv = process.env.NEXT_PUBLIC_LEGAL_CONTROLLER?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_CONTROLLER;
}

/**
 * Contact mailbox for privacy requests.
 *
 * @example legalEmail()
 */
export function legalEmail(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_LEGAL_EMAIL?.trim();
  if (fromEnv && fromEnv.includes("@")) return fromEnv;
  return DEFAULT_EMAIL;
}

export function legalGithub(): string {
  return GITHUB_ORG;
}

export interface LegalVars {
  controller: string;
  email: string;
  github: string;
  updatedIt: string;
  updatedEn: string;
}

/**
 * Values interpolated into legal copy (`{controller}`, `{email}`, `{github}`).
 *
 * @example legalVars().controller
 */
export function legalVars(): LegalVars {
  const email = legalEmail();
  return {
    controller: legalController(),
    email: email ?? legalGithub(),
    github: legalGithub(),
    updatedIt: "21 agosto 2026",
    updatedEn: "21 August 2026",
  };
}

/**
 * Replace `{controller}` / `{email}` / `{github}` in a legal string.
 *
 * @example fillLegal("Titolare: {controller}", legalVars())
 */
export function fillLegal(template: string, vars: LegalVars): string {
  return template
    .replace(/\{controller\}/g, vars.controller)
    .replace(/\{email\}/g, vars.email)
    .replace(/\{github\}/g, vars.github);
}
