# Glynac Compliance Chat

Real-time compliance chat with a simulated AI assistant. Built with Next.js (App Router), TypeScript, and Tailwind CSS.

Live demo: https://compliance-assistant-five.vercel.app/

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Checks: `npm run check` (typecheck + lint), `npm test`, `npm run build`.

## Features

- **Thread sidebar**: grouped by Pinned, Today, Yesterday, Previous 7 Days, and Older. Create and switch threads, and use the three-dot menu to pin, rename, or delete. The sidebar can be hidden, resized by dragging its edge (the width is remembered), and is a drawer on mobile.
- **Persistence**: threads and messages are saved to `localStorage` and restored on reload. A reply interrupted by a reload is closed out as "stopped".
- **Streaming feed**: simulated token streaming with a typing indicator, blinking cursor, Stop button, and auto-scroll that pauses when you scroll up.
- **Markdown**: tables, lists, bold, and code blocks with a copy button.
- **Citations**: clickable pills open a popover with the excerpt and a link to the source.
- **Attachments**: attach by button or drag and drop. Chips show name and size before sending and stay on the sent message. TXT, MD, JSON, and CSV are read and scanned for guaranteed-return wording. PDF and DOCX attach but are not parsed, and the assistant says so.
- **Search, quick prompts, actions**: in-chat search with match navigation, suggested prompt chips (on the start screen and above the input), and Copy, Regenerate, Thumbs up/down, and Edit prompt.
- **Dark mode** and reduced-motion support.

## How it works

| Piece | File |
| --- | --- |
| State, reducer, persistence, streaming | `src/lib/store.ts` |
| Simulated answers | `src/lib/assistant.ts` |
| Citation library | `src/lib/citations.ts` |
| Markdown and `[[cite:id]]` handling | `src/components/Markdown.tsx` |
| Citation popover | `src/components/CitationPill.tsx` |
| Search highlighting (CSS Custom Highlight API) | `src/hooks/useSearchHighlight.ts` |

The store is a small external store read with `useSyncExternalStore`. Streaming is a timer that dispatches token chunks, so no WebSocket server is needed. The assistant writes `[[cite:id]]` markers, and the renderer turns them into pills.

Search highlighting needs a browser with the CSS Custom Highlight API (current Chrome, Edge, Safari, Firefox).

## Notes

Answers are simulated and citation excerpts are paraphrased for the demo. They are not legal advice or verbatim rule text.

## Demo script

1. Attach a `.txt` file containing a line like "Investor receives a guaranteed 12% return".
2. Click the "Check agreement for guaranteed return clauses" chip and watch it stream.
3. Click a citation pill, then try Copy, Regenerate, and Thumbs.
4. Edit the prompt, then search for a word in the conversation.
5. Pin, rename, and delete a thread, then reload to show persistence.