import type { Citation } from "./types";

/**
 * Reference library used by the simulated assistant.
 * Excerpts are short paraphrases written for this demo, not verbatim rule text.
 * Always verify against the linked source.
 */
export const CITATIONS: Record<string, Citation> = {
  "finra-2210-d1": {
    id: "finra-2210-d1",
    label: "FINRA 2210(d)(1)",
    title: "Content standards",
    source: "FINRA Rule 2210",
    excerpt:
      "Communications must be fair and balanced and give a sound basis for evaluating the facts. They may not leave out material facts or make exaggerated, unwarranted, promissory, or misleading claims.",
    url: "https://www.finra.org/rules-guidance/rulebooks/finra-rules/2210",
  },
  "finra-2210-d1f": {
    id: "finra-2210-d1f",
    label: "FINRA 2210(d)(1)(F)",
    title: "Predictions and projections",
    source: "FINRA Rule 2210",
    excerpt:
      "Communications generally may not predict or project performance or imply that past performance will recur. Narrow exceptions exist, such as hypothetical illustrations of mathematical principles.",
    url: "https://www.finra.org/rules-guidance/rulebooks/finra-rules/2210",
  },
  "finra-2210-b1": {
    id: "finra-2210-b1",
    label: "FINRA 2210(b)(1)",
    title: "Principal approval",
    source: "FINRA Rule 2210",
    excerpt:
      "An appropriately qualified registered principal must approve each retail communication before the firm uses it or files it with FINRA.",
    url: "https://www.finra.org/rules-guidance/rulebooks/finra-rules/2210",
  },
  "sec-17a4-b4": {
    id: "sec-17a4-b4",
    label: "SEC 17a-4(b)(4)",
    title: "Communications retention",
    source: "SEC Rule 17a-4",
    excerpt:
      "Broker-dealers must keep originals of communications received and copies of those sent that relate to their business for three years, the first two in an easily accessible place.",
    url: "https://www.ecfr.gov/current/title-17/section-240.17a-4",
  },
  "sec-17a4-f": {
    id: "sec-17a4-f",
    label: "SEC 17a-4(f)",
    title: "Electronic recordkeeping",
    source: "SEC Rule 17a-4",
    excerpt:
      "Electronic records must be preserved either in a non-rewriteable, non-erasable format or in a system that keeps a complete time-stamped audit trail of changes.",
    url: "https://www.ecfr.gov/current/title-17/section-240.17a-4",
  },
  "sec-reg-bi": {
    id: "sec-reg-bi",
    label: "SEC Reg BI",
    title: "Regulation Best Interest",
    source: "SEC Rule 15l-1",
    excerpt:
      "When recommending a securities transaction or strategy to a retail customer, a broker-dealer must act in the customer's best interest and not place its own interest ahead of the customer's.",
    url: "https://www.ecfr.gov/current/title-17/section-240.15l-1",
  },
  "finra-3110": {
    id: "finra-3110",
    label: "FINRA 3110",
    title: "Supervision",
    source: "FINRA Rule 3110",
    excerpt:
      "Each firm must maintain a supervisory system, including written supervisory procedures, that is reasonably designed to achieve compliance with securities laws and FINRA rules.",
    url: "https://www.finra.org/rules-guidance/rulebooks/finra-rules/3110",
  },
  "sec-marketing-rule": {
    id: "sec-marketing-rule",
    label: "SEC 206(4)-1",
    title: "Investment adviser marketing",
    source: "SEC Marketing Rule",
    excerpt:
      "Adviser advertisements must avoid untrue or unsubstantiated statements. Testimonials and endorsements require clear disclosures, and performance must be presented fairly.",
    url: "https://www.ecfr.gov/current/title-17/section-275.206(4)-1",
  },
};

export function getCitation(id: string): Citation | undefined {
  return CITATIONS[id];
}
