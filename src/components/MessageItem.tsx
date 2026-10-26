"use client";

import { Check, FileText, Pencil, RefreshCw, ShieldCheck, ThumbsDown, ThumbsUp } from "lucide-react";
import { memo, useState } from "react";
import { editAndResend, regenerate, setFeedback } from "@/lib/store";
import type { Message } from "@/lib/types";
import { cn, formatBytes, formatTime } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import { IconButton } from "./IconButton";
import { Markdown } from "./Markdown";

interface MessageItemProps {
  threadId: string;
  message: Message;
  busy: boolean;
}

function TypingDots() {
  return (
    <div className="flex h-6 items-center gap-1" role="status" aria-label="Assistant is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-muted"
          style={{ animation: "dot 1.2s infinite", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function AttachmentChips({ message }: { message: Message }) {
  if (message.attachments.length === 0) return null;
  return (
    <ul className="mb-2 flex flex-wrap justify-end gap-1.5">
      {message.attachments.map((file) => (
        <li
          key={file.id}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1 text-xs"
        >
          <FileText size={13} className="text-accent" aria-hidden />
          <span className="max-w-40 truncate font-medium">{file.name}</span>
          <span className="text-muted">{formatBytes(file.size)}</span>
        </li>
      ))}
    </ul>
  );
}

function UserMessage({ threadId, message, busy }: MessageItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  function save() {
    if (!draft.trim()) return;
    editAndResend(threadId, message.id, draft);
    setEditing(false);
  }

  return (
    <div className="group flex flex-col items-end" data-message-id={message.id}>
      <AttachmentChips message={message} />
      {editing ? (
        <div className="w-full max-w-[85%] rounded-2xl border border-accent bg-surface p-3">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
              if (e.key === "Escape") setEditing(false);
            }}
            rows={Math.min(8, Math.max(2, draft.split("\n").length))}
            aria-label="Edit your message"
            className="w-full resize-none bg-transparent text-[0.95rem] leading-relaxed outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(message.content);
                setEditing(false);
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim()}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-50"
            >
              Save and resend
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5 text-[0.95rem] leading-relaxed">
          {message.content}
        </div>
      )}
      {!editing && (
        <div className="mt-1 flex items-center gap-0.5 text-xs text-muted opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
          <span className="mr-1">
            {message.edited && "Edited · "}
            {formatTime(message.createdAt)}
          </span>
          <CopyButton text={message.content} label="Copy message" />
          <IconButton
            label="Edit prompt"
            className="size-7"
            disabled={busy}
            onClick={() => {
              setDraft(message.content);
              setEditing(true);
            }}
          >
            <Pencil size={14} aria-hidden />
          </IconButton>
        </div>
      )}
    </div>
  );
}

function AssistantMessage({ threadId, message, busy }: MessageItemProps) {
  const streaming = message.status === "streaming";
  const waiting = streaming && message.content === "";

  return (
    <div className="group flex gap-3" data-message-id={message.id}>
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-ink">
        <ShieldCheck size={17} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-muted">Compliance Assistant</p>
        {waiting ? (
          <TypingDots />
        ) : (
          <div className={cn("text-[0.95rem] leading-relaxed", streaming && "streaming")}>
            <Markdown content={message.content} />
          </div>
        )}
        {message.status === "stopped" && (
          <p className="mt-2 text-xs text-muted">Response stopped.</p>
        )}
        {!streaming && (
          <div className="mt-2 flex items-center gap-0.5 text-muted">
            <CopyButton text={message.content.replace(/\[\[cite:[a-z0-9-]+\]\]/g, "")} label="Copy response" />
            <IconButton
              label="Regenerate"
              className="size-7"
              disabled={busy}
              onClick={() => regenerate(threadId, message.id)}
            >
              <RefreshCw size={14} aria-hidden />
            </IconButton>
            <IconButton
              label="Good response"
              className={cn("size-7", message.feedback === "up" && "bg-accent-soft text-accent")}
              aria-pressed={message.feedback === "up"}
              onClick={() => setFeedback(threadId, message.id, message.feedback, "up")}
            >
              <ThumbsUp size={14} aria-hidden />
            </IconButton>
            <IconButton
              label="Bad response"
              className={cn("size-7", message.feedback === "down" && "bg-accent-soft text-accent")}
              aria-pressed={message.feedback === "down"}
              onClick={() => setFeedback(threadId, message.id, message.feedback, "down")}
            >
              <ThumbsDown size={14} aria-hidden />
            </IconButton>
            {message.feedback && (
              <span className="ml-1 flex items-center gap-1 text-xs">
                <Check size={12} aria-hidden /> Thanks for the feedback
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageItemImpl(props: MessageItemProps) {
  return props.message.role === "user" ? <UserMessage {...props} /> : <AssistantMessage {...props} />;
}

export const MessageItem = memo(MessageItemImpl);
