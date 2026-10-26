import { describe, expect, it } from "vitest";
import { buildReply } from "../assistant";
import { reducer } from "../store";
import type { ChatState, Message, Thread } from "../types";
import { groupThreads } from "../utils";

const msg = (id: string, role: Message["role"], content: string): Message => ({
  id,
  role,
  content,
  createdAt: 0,
  status: "complete",
  attachments: [],
});

const thread = (id: string, over: Partial<Thread> = {}): Thread => ({
  id,
  title: id,
  pinned: false,
  createdAt: 0,
  updatedAt: 0,
  messages: [],
  ...over,
});

describe("reducer", () => {
  const base: ChatState = {
    activeId: "a",
    threads: [thread("a", { messages: [msg("1", "user", "hi"), msg("2", "assistant", "yo"), msg("3", "user", "more")] })],
  };

  it("toggles pin", () => {
    expect(reducer(base, { type: "pin", id: "a" }).threads[0].pinned).toBe(true);
  });

  it("clears the active thread when it is deleted", () => {
    const next = reducer(base, { type: "delete", id: "a" });
    expect(next.threads).toHaveLength(0);
    expect(next.activeId).toBeNull();
  });

  it("appends streamed chunks", () => {
    const next = reducer(base, { type: "append", threadId: "a", messageId: "2", chunk: "!" });
    expect(next.threads[0].messages[1].content).toBe("yo!");
  });

  it("edit keeps the edited message and drops everything after it", () => {
    const next = reducer(base, { type: "edit", threadId: "a", messageId: "1", content: "changed" });
    expect(next.threads[0].messages.map((m) => m.id)).toEqual(["1"]);
    expect(next.threads[0].messages[0]).toMatchObject({ content: "changed", edited: true });
  });

  it("truncate removes the target message and the ones after it", () => {
    const next = reducer(base, { type: "truncate", threadId: "a", fromMessageId: "2" });
    expect(next.threads[0].messages.map((m) => m.id)).toEqual(["1"]);
  });
});

describe("groupThreads", () => {
  it("buckets by date and puts pinned first", () => {
    const now = new Date(2026, 9, 23, 15, 0).getTime();
    const day = 24 * 60 * 60 * 1000;
    const groups = groupThreads(
      [
        thread("today", { updatedAt: now - 60_000 }),
        thread("yesterday", { updatedAt: now - day }),
        thread("week", { updatedAt: now - 4 * day }),
        thread("old", { updatedAt: now - 20 * day }),
        thread("pinned", { updatedAt: now - 20 * day, pinned: true }),
      ],
      now,
    );
    expect(groups.map((g) => g.label)).toEqual(["Pinned", "Today", "Yesterday", "Previous 7 Days", "Older"]);
  });
});

describe("buildReply", () => {
  const file = {
    id: "f",
    name: "deal.txt",
    size: 10,
    mime: "text/plain",
    text: "Section 4: Investor receives a guaranteed 12% return.\nSection 5: Fees apply.",
  };

  it("flags guaranteed-return wording in an attached readable file", () => {
    const reply = buildReply("Check this agreement for guaranteed return clauses", [file], 0);
    expect(reply).toContain("deal.txt");
    expect(reply).toContain("[[cite:finra-2210-d1]]");
  });

  it("says it cannot read PDFs instead of pretending to", () => {
    const pdf = { id: "p", name: "deal.pdf", size: 10, mime: "application/pdf" };
    expect(buildReply("Check this agreement", [pdf], 0)).toContain("can't read PDF");
  });

  it("only cites sources that exist", async () => {
    const { CITATIONS } = await import("../citations");
    const prompts = ["testimonial", "retention 17a-4", "2210 email", "reg bi", "supervision", "random"];
    for (const p of prompts) {
      for (const [, id] of buildReply(p, [], 1).matchAll(/\[\[cite:([a-z0-9-]+)\]\]/g)) {
        expect(CITATIONS[id]).toBeDefined();
      }
    }
  });
});
