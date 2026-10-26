import type { Attachment } from "./types";

export interface QuickPrompt {
  label: string;
  prompt: string;
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "Check agreement for guaranteed return clauses",
    prompt: "Check this investment agreement for guaranteed return clauses.",
  },
  {
    label: "What does FINRA 2210 require for client emails?",
    prompt: "What does FINRA Rule 2210 require for client communications?",
  },
  {
    label: "How long do we keep advisor chat records?",
    prompt: "How long must we retain advisor chat and email records under SEC 17a-4?",
  },
  {
    label: "Can we use a client testimonial in an ad?",
    prompt: "Can we use a client testimonial in our advertising?",
  },
];

interface Finding {
  file: string;
  passage: string;
}

const RISKY = /(guarantee[sd]?|risk[- ]free|no risk|assured return|fixed return|cannot lose|can't lose)/i;

function scanAttachments(attachments: Attachment[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of attachments) {
    if (!file.text) continue;
    for (const raw of file.text.split(/\r?\n/)) {
      const line = raw.trim();
      if (line && RISKY.test(line)) {
        const passage = line.length > 90 ? `${line.slice(0, 89)}…` : line;
        findings.push({ file: file.name, passage: passage.replace(/\|/g, "/") });
      }
      if (findings.length >= 6) return findings;
    }
  }
  return findings;
}

const NOTE =
  "> Simulated answer for demonstration. Excerpts are paraphrased, so check the linked source before acting.";

function intro(seed: number, options: string[]): string {
  return options[seed % options.length];
}

function agreementReply(attachments: Attachment[], seed: number): string {
  const findings = scanAttachments(attachments);
  const readable = attachments.filter((a) => a.text);
  const opaque = attachments.filter((a) => !a.text);
  const lines: string[] = [];

  if (attachments.length === 0) {
    lines.push(
      intro(seed, [
        "I don't see an attachment yet, so here is what I would look for.",
        "Attach the agreement and I'll scan it. Until then, these are the red flags.",
        "No file is attached, so this is a general checklist.",
      ]),
      "",
      "**Wording that usually needs review**",
      "- Fixed or assured returns, such as \"guaranteed 12% annually\". [[cite:finra-2210-d1]]",
      "- Language that implies past results will repeat. [[cite:finra-2210-d1f]]",
      "- \"Risk-free\" or \"cannot lose\" phrasing without balancing risk disclosure. [[cite:finra-2210-d1]]",
    );
  } else {
    lines.push(
      intro(seed, [
        "I scanned the attached file for return promises.",
        "Here is what stood out in the attached document.",
        "I reviewed the readable text of your attachment.",
      ]),
      "",
    );
    if (findings.length > 0) {
      lines.push(
        `**Short answer:** yes. I found ${findings.length} passage${findings.length > 1 ? "s" : ""} that read like guaranteed-return language.`,
        "",
        "| File | Passage | Concern |",
        "| --- | --- | --- |",
        ...findings.map((f) => `| ${f.file} | ${f.passage} | Promissory claim |`),
        "",
        "**Why it matters**",
        "- Promising specific results is treated as a promissory claim. [[cite:finra-2210-d1]]",
        "- Projecting returns or implying past results will recur is restricted. [[cite:finra-2210-d1f]]",
        "- Retail communications generally need principal approval before first use. [[cite:finra-2210-b1]]",
      );
    } else if (readable.length > 0) {
      lines.push(
        "**Short answer:** I did not find explicit guaranteed-return wording in the readable text.",
        "",
        "That doesn't clear the document. Look for softer phrasing such as \"expected to deliver\" or \"stable income\" that could still imply a result. [[cite:finra-2210-d1]]",
      );
    }
    if (opaque.length > 0) {
      lines.push(
        "",
        `I can see ${opaque.map((a) => a.name).join(", ")} is attached, but this demo can't read PDF or Word contents, so ${opaque.length > 1 ? "those files were" : "it was"} not scanned.`,
      );
    }
  }

  lines.push(
    "",
    "**Suggested next steps**",
    "1. Replace fixed-return wording with a plain statement of risk.",
    "2. Send the revised draft to a principal for approval.",
    "3. Keep the reviewed copy and the sign-off on file. [[cite:sec-17a4-b4]]",
    "",
    NOTE,
  );
  return lines.join("\n");
}

function communicationsReply(seed: number): string {
  return [
    intro(seed, [
      "FINRA Rule 2210 sets the standard for most written client communications.",
      "In short, anything you send to clients has to be fair, balanced, and approved.",
      "Here is the practical version of Rule 2210.",
    ]),
    "",
    "**What every communication must do**",
    "- Be fair and balanced, with a sound basis for any claim. [[cite:finra-2210-d1]]",
    "- Avoid exaggerated, promissory, or misleading statements. [[cite:finra-2210-d1]]",
    "- Not predict or project performance. [[cite:finra-2210-d1f]]",
    "",
    "**Approval**",
    "Retail communications need sign-off from a qualified principal before first use. [[cite:finra-2210-b1]]",
    "",
    "**Quick checklist for a client email**",
    "1. Is every claim supported and balanced with risk?",
    "2. Does it avoid promises or projections?",
    "3. Has a principal approved it?",
    "",
    NOTE,
  ].join("\n");
}

function recordsReply(seed: number): string {
  return [
    intro(seed, [
      "Advisor chats and emails that relate to the business are records you have to keep.",
      "Short version: three years, with the first two easy to retrieve.",
      "Business communications fall under the books-and-records rules.",
    ]),
    "",
    "**Retention period**",
    "Keep communications relating to the business for three years, with the first two years in an easily accessible place. [[cite:sec-17a4-b4]]",
    "",
    "**How to store them**",
    "Electronic records must use a write-once format or a system with a complete, time-stamped audit trail. [[cite:sec-17a4-f]]",
    "",
    "An illustrative policy entry:",
    "",
    "```json",
    "{",
    "  \"recordType\": \"advisor_chat\",",
    "  \"retentionYears\": 3,",
    "  \"easilyAccessibleYears\": 2,",
    "  \"storage\": \"audit-trail\"",
    "}",
    "```",
    "",
    "Your own policy may need to be stricter, so confirm with your compliance lead.",
    "",
    NOTE,
  ].join("\n");
}

function testimonialReply(seed: number): string {
  return [
    intro(seed, [
      "Testimonials are allowed for advisers, but only with the right disclosures.",
      "Yes, under conditions. The Marketing Rule is the one to follow.",
      "It can be done, and the rule spells out what you must show.",
    ]),
    "",
    "**What to include**",
    "- Clear disclosure that the person is a client and whether they were paid. [[cite:sec-marketing-rule]]",
    "- Any material conflicts of interest. [[cite:sec-marketing-rule]]",
    "- Nothing untrue or unsubstantiated. [[cite:sec-marketing-rule]]",
    "",
    "**If the ad also reaches retail customers**",
    "Treat the wording as a communication too, so avoid promises and keep it balanced. [[cite:finra-2210-d1]]",
    "",
    NOTE,
  ].join("\n");
}

function bestInterestReply(seed: number): string {
  return [
    intro(seed, [
      "For retail recommendations, the best-interest standard applies.",
      "Here is how Regulation Best Interest works in practice.",
      "The core test is whether the recommendation serves the customer first.",
    ]),
    "",
    "**The core duty**",
    "Recommend what is in the retail customer's best interest and never put the firm's interest ahead. [[cite:sec-reg-bi]]",
    "",
    "**What to document**",
    "1. The customer's goals, risk tolerance, and situation.",
    "2. Why the product fits, and which alternatives were considered.",
    "3. Any conflicts of interest and how they were handled.",
    "",
    NOTE,
  ].join("\n");
}

function supervisionReply(seed: number): string {
  return [
    intro(seed, [
      "Supervision comes down to having written procedures and actually following them.",
      "Rule 3110 expects a working supervisory system, not just a policy binder.",
      "Here is the short version of the supervision requirement.",
    ]),
    "",
    "**What the system needs**",
    "- Written supervisory procedures that fit your business. [[cite:finra-3110]]",
    "- Named people responsible for review. [[cite:finra-3110]]",
    "- Evidence that reviews happen, such as dated sign-offs. [[cite:sec-17a4-b4]]",
    "",
    NOTE,
  ].join("\n");
}

function defaultReply(prompt: string, seed: number): string {
  const topic = prompt.length > 60 ? `${prompt.slice(0, 59)}…` : prompt;
  return [
    intro(seed, [
      "I can help with that, though I'm strongest on a few topics in this demo.",
      "That's outside my sample knowledge, so here is where I can help.",
      "I don't have a specific answer for that one yet.",
    ]),
    "",
    `You asked: *${topic}*`,
    "",
    "Try one of these instead:",
    "- Guaranteed return wording in agreements [[cite:finra-2210-d1]]",
    "- Client email and advertising rules [[cite:finra-2210-b1]]",
    "- Record retention [[cite:sec-17a4-b4]]",
    "- Best-interest recommendations [[cite:sec-reg-bi]]",
    "",
    NOTE,
  ].join("\n");
}

/** Picks a canned answer for the prompt. `seed` varies the opening line on regenerate. */
export function buildReply(prompt: string, attachments: Attachment[], seed: number): string {
  const p = prompt.toLowerCase();
  const wantsGuarantee = /guarantee|promissory|risk[- ]free|return clause/.test(p);
  const wantsReview = attachments.length > 0 && /agreement|check|review|scan|clause|flag/.test(p);

  if (wantsGuarantee || wantsReview) return agreementReply(attachments, seed);
  if (/testimonial|endorse/.test(p)) return testimonialReply(seed);
  if (/retention|retain|17a-4|record|archive|chat log/.test(p)) return recordsReply(seed);
  if (/2210|advertis|communication|email|social|marketing/.test(p)) return communicationsReply(seed);
  if (/suitab|best interest|reg bi|recommend/.test(p)) return bestInterestReply(seed);
  if (/supervis|3110|procedure/.test(p)) return supervisionReply(seed);
  return defaultReply(prompt, seed);
}
