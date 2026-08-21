export type LegalBlock = { p: string } | { ul: string[] };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  kicker: string;
  title: string;
  updatedLine: string;
  intro: string[];
  sections: LegalSection[];
}
