"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { PageFrame } from "@/components/layout/PageFrame";
import { fillLegal, legalVars } from "@/lib/legal/meta";
import { privacyDocument } from "@/lib/legal/privacy";
import { termsDocument } from "@/lib/legal/terms";
import type { LegalBlock, LegalDocument } from "@/lib/legal/types";

interface LegalViewProps {
  kind: "privacy" | "terms";
}

/**
 * Full privacy or terms text in the active language.
 *
 * @example <LegalView kind="privacy" />
 */
export function LegalView({ kind }: LegalViewProps) {
  const { locale } = useI18n();
  const vars = legalVars();
  const doc: LegalDocument = kind === "privacy" ? privacyDocument(locale) : termsDocument(locale);
  const fill = (text: string) => fillLegal(text, vars);

  return (
    <PageFrame kicker={doc.kicker} title={doc.title}>
      <div className="max-w-2xl">
        <p className="text-sm text-arena-muted">{doc.updatedLine}</p>
        <div className="mt-6 space-y-4 text-base leading-7 text-arena-muted">
          {doc.intro.map((p) => (
            <p key={p.slice(0, 48)}>{fill(p)}</p>
          ))}
        </div>
        {doc.sections.map((section) => (
          <section key={section.title} className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight text-white">{section.title}</h2>
            <div className="mt-4 space-y-4 text-base leading-7 text-arena-muted">
              {section.blocks.map((block, index) => (
                <LegalBlockView key={`${section.title}-${index}`} block={block} fill={fill} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageFrame>
  );
}

function LegalBlockView({ block, fill }: { block: LegalBlock; fill: (text: string) => string }) {
  if ("p" in block) {
    return <p>{fill(block.p)}</p>;
  }
  return (
    <ul className="list-disc space-y-2 pl-5">
      {block.ul.map((item) => (
        <li key={item.slice(0, 64)}>{fill(item)}</li>
      ))}
    </ul>
  );
}
