export type Role = "user" | "assistant";
export type MessageStatus = "streaming" | "complete" | "stopped";
export type Feedback = "up" | "down";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mime: string;
  /** Extracted text for readable file types (txt, md, json, csv). */
  text?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  status: MessageStatus;
  attachments: Attachment[];
  feedback?: Feedback;
  edited?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface ChatState {
  threads: Thread[];
  activeId: string | null;
}

export interface Citation {
  id: string;
  label: string;
  title: string;
  source: string;
  excerpt: string;
  url: string;
}
