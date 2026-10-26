"use client";

import { ArrowUp, FileText, Paperclip, Square, X } from "lucide-react";
import { useRef, useState } from "react";
import type { QuickPrompt } from "@/lib/assistant";
import { ACCEPT } from "@/lib/files";
import type { Attachment } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

interface ComposerProps {
  attachments: Attachment[];
  notices: string[];
  streaming: boolean;
  suggestions?: QuickPrompt[];
  onPick: (prompt: string) => void;
  onFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function Composer({ attachments, notices, streaming, suggestions, onPick, onFiles, onRemove, onSend, onStop }: ComposerProps) {
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const canSend = !streaming && (text.trim().length > 0 || attachments.length > 0);

  function resize() {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function submit() {
    if (!canSend) return;
    onSend(text);
    setText("");
    if (input.current) input.current.style.height = "auto";
  }

  return (
    <div className="px-4 pb-4 pt-2 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {suggestions && (
          <ul className="mb-2 flex gap-2 overflow-x-auto pb-1" aria-label="Suggested prompts">
            {suggestions.map((item) => (
              <li key={item.label} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onPick(item.prompt)}
                  className="rounded-full border border-line bg-surface px-3 py-1 text-xs transition-colors hover:border-accent hover:bg-accent-soft"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {notices.length > 0 && (
          <ul role="alert" className="mb-2 space-y-1 text-xs text-danger">
            {notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        )}
        <div className="rounded-2xl border border-line bg-surface shadow-sm transition-colors focus-within:border-accent">
          {attachments.length > 0 && (
            <ul className="flex flex-wrap gap-2 px-3 pt-3" aria-label="Attached files">
              {attachments.map((file) => (
                <li
                  key={file.id}
                  className="rise flex items-center gap-2 rounded-lg border border-line bg-surface-2 py-1 pl-2 pr-1 text-xs"
                >
                  <FileText size={14} className="text-accent" aria-hidden />
                  <span className="max-w-44 truncate font-medium">{file.name}</span>
                  <span className="text-muted">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(file.id)}
                    aria-label={`Remove ${file.name}`}
                    className="rounded p-1 text-muted hover:bg-line hover:text-ink"
                  >
                    <X size={13} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-end gap-1 p-2">
            <input
              ref={picker}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                onFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => picker.current?.click()}
              aria-label="Attach files"
              title="Attach files"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Paperclip size={18} aria-hidden />
            </button>
            <textarea
              ref={input}
              value={text}
              rows={1}
              placeholder="Ask about a rule, or attach a document"
              aria-label="Message"
              onChange={(e) => {
                setText(e.target.value);
                resize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              className="max-h-52 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-[0.95rem] leading-5 outline-none placeholder:text-muted"
            />
            {streaming ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                title="Stop generating"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink text-bg transition-opacity hover:opacity-85"
              >
                <Square size={13} fill="currentColor" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                aria-label="Send message"
                title="Send message"
                aria-disabled={!canSend}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-ink transition-opacity hover:bg-accent-hover",
                  !canSend && "cursor-not-allowed opacity-40 hover:bg-accent",
                )}
              >
                <ArrowUp size={18} aria-hidden />
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          Simulated assistant for demonstration. Verify answers against the cited source.
        </p>
      </div>
    </div>
  );
}