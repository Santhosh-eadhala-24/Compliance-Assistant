"use client";

import { isValidElement, memo } from "react";
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCitation } from "@/lib/citations";
import { CitationPill } from "./CitationPill";
import { CopyButton } from "./CopyButton";

const CITE_MARKER = /\[\[cite:([a-z0-9-]+)\]\]/g;
const PARTIAL_MARKER = /\[\[[^\]]*$/;
// A bold line followed directly by text would merge into one paragraph, so give it its own.
const BOLD_HEADING = /^(\*\*[^*\n]+\*\*)\n(?!\n)/gm;

/** Turns [[cite:id]] markers into cite: links and hides a marker that is still streaming in. */
function prepare(content: string): string {
  return content
    .replace(PARTIAL_MARKER, "")
    .replace(BOLD_HEADING, "$1\n\n")
    .replace(CITE_MARKER, (_, id: string) => {
    const label = getCitation(id)?.label ?? id;
    return `[${label}](cite:${id})`;
  });
}

function safeUrl(url: string): string {
  return /^(https?:|mailto:|cite:|#)/i.test(url) ? url : "";
}

function textOf(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const child = isValidElement(children) ? (children as ReactElement<{ className?: string; children?: ReactNode }>) : null;
  const language = /language-([\w-]+)/.exec(child?.props.className ?? "")?.[1] ?? "text";
  const code = textOf(child?.props.children ?? children).replace(/\n$/, "");

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-line bg-surface-2" data-no-search>
      <div className="flex items-center justify-between border-b border-line px-3 py-1">
        <span className="font-mono text-xs text-muted">{language}</span>
        <CopyButton text={code} label="Copy code" showLabel />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[0.82rem] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  a({ href = "", children }) {
    if (href.startsWith("cite:")) {
      return <CitationPill id={href.slice(5)} fallback={textOf(children)} />;
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline underline-offset-2">
        {children}
      </a>
    );
  },
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 marker:text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-muted">{children}</ol>,
  h1: ({ children }) => <h3 className="mb-1 mt-4 text-base font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-1 mt-4 text-base font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1 mt-3 text-sm font-semibold">{children}</h4>,
  hr: () => <hr className="my-4 border-line" />,
  blockquote: ({ children }) => (
    <blockquote className="my-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-muted [&>p]:my-0">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  code: ({ children, className }: ComponentPropsWithoutRef<"code">) => (
    <code className={className ?? "rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em]"}>{children}</code>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-2 text-xs text-muted">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-t border-line px-3 py-2 align-top">{children}</td>,
};

function MarkdownImpl({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={safeUrl}>
      {prepare(content)}
    </ReactMarkdown>
  );
}

export const Markdown = memo(MarkdownImpl);