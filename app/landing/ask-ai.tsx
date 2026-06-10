import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How do conflict checks work?",
  "Which colleges are supported?",
  "How do I publish a timetable?",
] as const;

const PREVIEW_REPLY =
  "I'm a preview — the GWC AI assistant isn't connected yet. Soon I'll be able to answer questions about schedules, rooms, sections, and faculty loads.";

export function AskAiPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && <PanelContent key="ask-ai-panel" onClose={onClose} />}
    </AnimatePresence>
  );
}

function PanelContent({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Freeze body scroll while the panel is open (same pattern as the mobile menu).
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Close on Escape, focus the input on open.
  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Keep the latest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  function send(text: string) {
    const content = text.trim();
    if (!content || thinking) return;
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: PREVIEW_REPLY }]);
      setThinking(false);
    }, 900);
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-navy-950/40"
        aria-hidden="true"
      />

      {/* Panel — full screen on mobile, right slide-over from sm up */}
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Ask AI"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-navy-900 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-105 sm:border-l sm:border-slate-200 sm:shadow-2xl dark:sm:border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-2xl tracking-wide text-navy-700 dark:text-white">
              Ask AI
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Ask AI"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-300 text-navy-700 transition-colors duration-200 hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/5"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <h2 className="mt-4 font-display text-2xl tracking-wide text-navy-700 dark:text-white">
                How can I help?
              </h2>
              <p className="mt-1.5 max-w-xs font-sans text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Ask anything about GWC Class Scheduling — conflicts, rooms, sections, or publishing.
              </p>
              <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-left font-sans text-sm text-slate-600 transition-colors duration-150 hover:border-gold-400/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-gold-400/40 dark:hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div
                    key={i}
                    className="ml-10 self-end rounded-2xl rounded-br-md bg-navy-800 px-4 py-2.5 font-sans text-sm leading-relaxed text-white dark:bg-white dark:text-navy-900"
                  >
                    {m.content}
                  </div>
                ) : (
                  <div
                    key={i}
                    className="mr-10 self-start rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5 font-sans text-sm leading-relaxed text-slate-700 dark:bg-white/10 dark:text-slate-200"
                  >
                    {m.content}
                  </div>
                ),
              )}
              {thinking && (
                <div
                  className="mr-10 flex items-center gap-1.5 self-start rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-white/10"
                  role="status"
                  aria-label="Thinking"
                >
                  <ThinkingDot delay="0ms" />
                  <ThinkingDot delay="150ms" />
                  <ThinkingDot delay="300ms" />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-slate-200 p-4 dark:border-white/10"
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              aria-label="Ask a question"
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-4 pr-12 font-sans text-base text-slate-900 placeholder-slate-400 outline-none transition-colors duration-150 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500 dark:focus:border-gold-400 dark:focus:ring-gold-400/25"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label="Send"
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md bg-navy-800 text-white transition-colors duration-150 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
            >
              <ArrowUpIcon />
            </button>
          </div>
          <p className="mt-2 text-center font-sans text-xs text-slate-400 dark:text-slate-500">
            AI responses are a preview.
          </p>
        </form>
      </motion.aside>
    </>
  );
}

function ThinkingDot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-slate-300"
      style={{ animationDelay: delay }}
    />
  );
}

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}
