#!/usr/bin/env python3
"""Generate .eml files for Wave 1 outreach and optionally send via SMTP.

Usage:
  python3 outreach/send_wave1.py              # generate EML only (default)
  python3 outreach/send_wave1.py --send       # send if SMTP_* env vars set
  python3 outreach/send_wave1.py --dry-run    # print summary only

Required env for --send:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
  FROM_EMAIL (default: novacodingg@gmail.com)
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import smtplib
import ssl
from dataclasses import dataclass
from datetime import date
from email.message import EmailMessage
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DRAFTS = ROOT / "wave1-drafts.md"
TRACKING = ROOT / "tracking.csv"
EML_DIR = ROOT / "eml"
FROM_DEFAULT = "novacodingg@gmail.com"


@dataclass
class Wave1Email:
    rank: int
    organization: str
    to_addr: str
    subject: str
    body: str


def parse_drafts(path: Path) -> list[Wave1Email]:
    text = path.read_text(encoding="utf-8")
    blocks = re.split(r"\n---\n", text)
    emails: list[Wave1Email] = []

    for block in blocks:
        rank_m = re.search(r"^## (\d+)\.", block, re.M)
        org_m = re.search(r"^## \d+\. (.+?) —", block, re.M)
        to_m = re.search(r"^\*\*A:\*\* (.+)$", block, re.M)
        subj_m = re.search(r"^\*\*Oggetto:\*\* `(.+?)`", block, re.M)
        if not all([rank_m, org_m, to_m, subj_m]):
            continue

        body_start = block.find(subj_m.group(0)) + len(subj_m.group(0))
        body = block[body_start:].strip()
        # drop CC lines from body if they leaked
        body_lines = []
        for line in body.splitlines():
            if line.startswith("**CC"):
                continue
            if line.startswith("**Variante"):
                continue
            if line.startswith("**A:") or line.startswith("**Oggetto:"):
                continue
            body_lines.append(line)
        body = "\n".join(body_lines).strip()

        emails.append(
            Wave1Email(
                rank=int(rank_m.group(1)),
                organization=org_m.group(1).strip(),
                to_addr=to_m.group(1).strip(),
                subject=subj_m.group(1).strip(),
                body=body,
            )
        )

    return sorted(emails, key=lambda e: e.rank)


def build_message(email: Wave1Email, from_addr: str) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = from_addr
    msg["To"] = email.to_addr
    msg["Subject"] = email.subject
    msg.set_content(email.body)
    return msg


def write_eml(email: Wave1Email, from_addr: str, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    safe_org = re.sub(r"[^a-zA-Z0-9]+", "-", email.organization).strip("-").lower()
    path = out_dir / f"{email.rank:02d}-{safe_org}.eml"
    msg = build_message(email, from_addr)
    path.write_bytes(msg.as_bytes())
    return path


def send_smtp(msg: EmailMessage, host: str, port: int, user: str, password: str) -> None:
    context = ssl.create_default_context()
    with smtplib.SMTP(host, port, timeout=30) as server:
        server.ehlo()
        server.starttls(context=context)
        server.ehlo()
        server.login(user, password)
        server.send_message(msg)


def update_tracking(sent_ranks: list[int], status: str) -> None:
    if not TRACKING.exists():
        return
    rows: list[dict[str, str]] = []
    with TRACKING.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        for row in reader:
            rank = int(row.get("rank", "0"))
            if rank in sent_ranks:
                row["status"] = status
                if status == "sent":
                    row["sent_date"] = date.today().isoformat()
            rows.append(row)
    with TRACKING.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Wave 1 VsArena outreach sender")
    parser.add_argument("--send", action="store_true", help="Send via SMTP (requires env vars)")
    parser.add_argument("--dry-run", action="store_true", help="Print summary only")
    args = parser.parse_args()

    emails = parse_drafts(DRAFTS)
    from_addr = os.environ.get("FROM_EMAIL", FROM_DEFAULT)

    if args.dry_run:
        for e in emails:
            print(f"{e.rank:2d}. {e.to_addr} — {e.subject[:60]}...")
        print(f"\nTotal: {len(emails)} emails")
        return

    generated: list[Path] = []
    for email in emails:
        path = write_eml(email, from_addr, EML_DIR)
        generated.append(path)
        print(f"Generated {path.name} -> {email.to_addr}")

    if not args.send:
        print(f"\n{len(generated)} EML files in {EML_DIR}/")
        print("Import into Gmail (Settings > See all settings > Accounts > Import) or send manually.")
        update_tracking([e.rank for e in emails], "eml_ready")
        return

    host = os.environ.get("SMTP_HOST")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    if not all([host, user, password]):
        raise SystemExit(
            "Missing SMTP_HOST, SMTP_USER, or SMTP_PASSWORD. "
            "Set Gmail App Password env vars or send EML files manually."
        )

    sent: list[int] = []
    for email in emails:
        msg = build_message(email, from_addr)
        send_smtp(msg, host, port, user, password)
        sent.append(email.rank)
        print(f"Sent #{email.rank} to {email.to_addr}")

    update_tracking(sent, "sent")
    print(f"\nSent {len(sent)} emails. Tracking updated.")


if __name__ == "__main__":
    main()
