#!/usr/bin/env python3
"""Helper to update outreach/tracking.csv from the command line.

Examples:
  python3 outreach/update_tracking.py --rank 1 --status sent
  python3 outreach/update_tracking.py --rank 3 --status replied --response-type positive
  python3 outreach/update_tracking.py --list
"""

from __future__ import annotations

import argparse
import csv
from datetime import date
from pathlib import Path

TRACKING = Path(__file__).resolve().parent / "tracking.csv"


def load_rows() -> tuple[list[str], list[dict[str, str]]]:
    with TRACKING.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        return fieldnames, list(reader)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rank", type=int, help="Row rank to update")
    parser.add_argument("--status", help="queued | eml_ready | sent | replied | followup_sent | closed")
    parser.add_argument("--response-type", dest="response_type", help="positive | neutral | negative | no_reply")
    parser.add_argument("--notes", help="Free-text notes")
    parser.add_argument("--list", action="store_true", help="Print tracking table")
    args = parser.parse_args()

    fieldnames, rows = load_rows()

    if args.list:
        for row in rows:
            print(
                f"#{row['rank']} {row['organization'][:24]:24} "
                f"{row['status']:12} sent={row.get('sent_date') or '-':10} "
                f"followup={row.get('followup_date') or '-'}"
            )
        return

    if args.rank is None:
        parser.error("--rank required unless --list")

    found = False
    for row in rows:
        if int(row["rank"]) != args.rank:
            continue
        found = True
        if args.status:
            row["status"] = args.status
            if args.status == "sent" and not row.get("sent_date"):
                row["sent_date"] = date.today().isoformat()
            if args.status == "followup_sent":
                row["followup_date"] = date.today().isoformat()
        if args.response_type:
            row["response_type"] = args.response_type
            row["response_date"] = date.today().isoformat()
            row["status"] = "replied"
        if args.notes:
            row["notes"] = args.notes

    if not found:
        raise SystemExit(f"Rank {args.rank} not found")

    with TRACKING.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Updated rank {args.rank}")


if __name__ == "__main__":
    main()
