import { buildReply } from "./assistant";
import type { Attachment, ChatState, Feedback, Message, MessageStatus, Thread } from "./types";
import { titleFrom, uid } from "./utils";

const STORAGE_KEY = "glynac-chat:v1";
const EMPTY: ChatState = { threads: [], activeId: null };

type Action =
  | { type: "select"; id: string | null }
  | { type: "create"; thread: Thread }
  | { type: "rename"; id: string; title: string }
  | { type: "pin"; id: string }
  | { type: "delete"; id: string }
  | { type: "addMessages"; threadId: string; messages: Message[] }
  | { type: "append"; threadId: string; messageId: string; chunk: string }
  | { type: "finish"; threadId: string; messageId: string; status: MessageStatus }
  | { type: "feedback"; threadId: string; messageId: string; value: Feedback | undefined }
  | { type: "truncate"; threadId: string; fromMessageId: string }
  | { type: "edit"; threadId: string; messageId: string; content: string };

function mapThread(state: ChatState, id: string, fn: (t: Thread) => Thread): ChatState {
  return { ...state, threads: state.threads.map((t) => (t.id === id ? fn(t) : t)) };
}

function mapMessage(thread: Thread, id: string, fn: (m: Message) => Message): Thread {
  return { ...thread, messages: thread.messages.map((m) => (m.id === id ? fn(m) : m)) };
}

function dropFrom(thread: Thread, messageId: string, keepSelf: boolean): Thread {
  const index = thread.messages.findIndex((m) => m.id === messageId);
  if (index === -1) return thread;
  return { ...thread, messages: thread.messages.slice(0, keepSelf ? index + 1 : index) };
}

export function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "select":
      return { ...state, activeId: action.id };
    case "create":
      return { threads: [action.thread, ...state.threads], activeId: action.thread.id };
    case "rename":
      return mapThread(state, action.id, (t) => ({ ...t, title: titleFrom(action.title) }));
    case "pin":
      return mapThread(state, action.id, (t) => ({ ...t, pinned: !t.pinned }));
    case "delete":
      return {
        threads: state.threads.filter((t) => t.id !== action.id),
        activeId: state.activeId === action.id ? null : state.activeId,
      };
    case "addMessages":
      return mapThread(state, action.threadId, (t) => ({
        ...t,
        messages: [...t.messages, ...action.messages],
        updatedAt: Date.now(),
      }));
    case "append":
      return mapThread(state, action.threadId, (t) =>
        mapMessage(t, action.messageId, (m) => ({ ...m, content: m.content + action.chunk })),
      );
    case "finish":
      return mapThread(state, action.threadId, (t) =>
        mapMessage(t, action.messageId, (m) => ({ ...m, status: action.status })),
      );
    case "feedback":
      return mapThread(state, action.threadId, (t) =>
        mapMessage(t, action.messageId, (m) => ({ ...m, feedback: action.value })),
      );
    case "truncate":
      return mapThread(state, action.threadId, (t) => dropFrom(t, action.fromMessageId, false));
    case "edit":
      return mapThread(state, action.threadId, (t) =>
        dropFrom(
          mapMessage(t, action.messageId, (m) => ({ ...m, content: action.content, edited: true })),
          action.messageId,
          true,
        ),
      );
    default:
      return state;
  }
}

/* ---------- Seed data (first visit only) ---------- */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function seedThread(title: string, prompt: string, ageMs: number, pinned = false): Thread {
  const at = Date.now() - ageMs;
  const reply = buildReply(prompt, [], 0);
  return {
    id: uid(),
    title,
    pinned,
    createdAt: at,
    updatedAt: at,
    messages: [
      { id: uid(), role: "user", content: prompt, createdAt: at, status: "complete", attachments: [] },
      { id: uid(), role: "assistant", content: reply, createdAt: at + 4000, status: "complete", attachments: [] },
    ],
  };
}

function seedState(): ChatState {
  return {
    activeId: null,
    threads: [
      seedThread("FINRA 2210 basics", "What does FINRA Rule 2210 require for client communications?", 20 * 60 * 1000, true),
      seedThread("Advisor chat retention", "How long must we retain advisor chat and email records under SEC 17a-4?", 2 * HOUR),
      seedThread("Best-interest checks", "How do I document a Reg BI recommendation?", DAY + 3 * HOUR),
      seedThread("Testimonials in ads", "Can we use a client testimonial in our advertising?", 4 * DAY),
      seedThread("Supervision procedures", "What do written supervisory procedures need under 3110?", 16 * DAY),
    ],
  };
}

/* ---------- Persistence ---------- */

function load(): ChatState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as ChatState;
    if (!Array.isArray(parsed.threads)) return seedState();
    // A reload interrupts any in-flight stream, so close those messages out.
    const threads = parsed.threads.map((t) => ({
      ...t,
      messages: t.messages.map((m) => (m.status === "streaming" ? { ...m, status: "stopped" as const } : m)),
    }));
    const activeId = threads.some((t) => t.id === parsed.activeId) ? parsed.activeId : null;
    return { threads, activeId };
  } catch {
    return seedState();
  }
}

let persistTimer: number | undefined;

function persist(state: ChatState) {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be full or blocked. The app keeps working in memory.
    }
  }, 250);
}

/* ---------- External store (read with useSyncExternalStore) ---------- */

let state: ChatState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): ChatState {
  if (!loaded && typeof window !== "undefined") {
    state = load();
    loaded = true;
  }
  return state;
}

export function getServerSnapshot(): ChatState {
  return EMPTY;
}

export function dispatch(action: Action) {
  state = reducer(getSnapshot(), action);
  persist(state);
  listeners.forEach((l) => l());
}

/* ---------- Chat actions with simulated streaming ---------- */

const streams = new Map<string, { messageId: string; timer: number }>();

function findThread(id: string): Thread | undefined {
  return getSnapshot().threads.find((t) => t.id === id);
}

export function isStreaming(thread: Thread | undefined): boolean {
  return !!thread && thread.messages.some((m) => m.status === "streaming");
}

function startAssistant(threadId: string, prompt: string, attachments: Attachment[]) {
  const messageId = uid();
  dispatch({
    type: "addMessages",
    threadId,
    messages: [
      { id: messageId, role: "assistant", content: "", createdAt: Date.now(), status: "streaming", attachments: [] },
    ],
  });

  const tokens = buildReply(prompt, attachments, Date.now()).match(/\S+\s*|\s+/g) ?? [];
  let index = 0;

  const tick = () => {
    const take = 1 + Math.floor(Math.random() * 3);
    dispatch({ type: "append", threadId, messageId, chunk: tokens.slice(index, index + take).join("") });
    index += take;
    if (index >= tokens.length) {
      streams.delete(threadId);
      dispatch({ type: "finish", threadId, messageId, status: "complete" });
      return;
    }
    streams.set(threadId, { messageId, timer: window.setTimeout(tick, 22 + Math.random() * 28) });
  };

  streams.set(threadId, { messageId, timer: window.setTimeout(tick, 650) });
}

export function stopStreaming(threadId: string) {
  const stream = streams.get(threadId);
  if (!stream) return;
  window.clearTimeout(stream.timer);
  streams.delete(threadId);
  dispatch({ type: "finish", threadId, messageId: stream.messageId, status: "stopped" });
}

export function newChat() {
  dispatch({ type: "select", id: null });
}

export function selectThread(id: string) {
  dispatch({ type: "select", id });
}

export function renameThread(id: string, title: string) {
  dispatch({ type: "rename", id, title });
}

export function togglePin(id: string) {
  dispatch({ type: "pin", id });
}

export function deleteThread(id: string) {
  stopStreaming(id);
  dispatch({ type: "delete", id });
}

export function setFeedback(threadId: string, messageId: string, current: Feedback | undefined, value: Feedback) {
  dispatch({ type: "feedback", threadId, messageId, value: current === value ? undefined : value });
}

export function sendMessage(text: string, attachments: Attachment[]) {
  const trimmed = text.trim();
  if (!trimmed && attachments.length === 0) return;

  const prompt = trimmed || "Review the attached file.";
  const snapshot = getSnapshot();
  let threadId = snapshot.activeId;
  const now = Date.now();

  if (!threadId || !findThread(threadId)) {
    threadId = uid();
    dispatch({
      type: "create",
      thread: { id: threadId, title: titleFrom(prompt), pinned: false, createdAt: now, updatedAt: now, messages: [] },
    });
  }
  if (isStreaming(findThread(threadId))) return;

  dispatch({
    type: "addMessages",
    threadId,
    messages: [{ id: uid(), role: "user", content: prompt, createdAt: now, status: "complete", attachments }],
  });
  startAssistant(threadId, prompt, attachments);
}

export function regenerate(threadId: string, assistantMessageId: string) {
  const thread = findThread(threadId);
  if (!thread || isStreaming(thread)) return;
  const index = thread.messages.findIndex((m) => m.id === assistantMessageId);
  const prompt = thread.messages.slice(0, index).reverse().find((m) => m.role === "user");
  if (!prompt) return;
  dispatch({ type: "truncate", threadId, fromMessageId: assistantMessageId });
  startAssistant(threadId, prompt.content, prompt.attachments);
}

export function editAndResend(threadId: string, userMessageId: string, content: string) {
  const thread = findThread(threadId);
  const original = thread?.messages.find((m) => m.id === userMessageId);
  const text = content.trim();
  if (!thread || !original || !text || isStreaming(thread)) return;
  dispatch({ type: "edit", threadId, messageId: userMessageId, content: text });
  startAssistant(threadId, text, original.attachments);
}
