import type { Attachment } from "./types";
import { uid } from "./utils";

export const MAX_FILES = 5;
export const MAX_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 20_000;
const ALLOWED = /\.(pdf|txt|md|json|csv|docx)$/i;
const READABLE = /\.(txt|md|json|csv)$/i;

export const ACCEPT = ".pdf,.txt,.md,.json,.csv,.docx";

export interface ReadResult {
  attachments: Attachment[];
  errors: string[];
}

export async function readFiles(files: File[], existingCount: number): Promise<ReadResult> {
  const attachments: Attachment[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (existingCount + attachments.length >= MAX_FILES) {
      errors.push(`You can attach up to ${MAX_FILES} files.`);
      break;
    }
    if (!ALLOWED.test(file.name)) {
      errors.push(`${file.name} isn't supported. Use PDF, TXT, MD, JSON, CSV, or DOCX.`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name} is larger than 5 MB.`);
      continue;
    }
    const text = READABLE.test(file.name) ? (await file.text()).slice(0, MAX_TEXT_CHARS) : undefined;
    attachments.push({ id: uid(), name: file.name, size: file.size, mime: file.type, text });
  }

  return { attachments, errors };
}
