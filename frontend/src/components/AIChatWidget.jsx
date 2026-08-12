import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { aiApi } from "../api/endpoints";

function getSessionId() {
  let id = sessionStorage.getItem("ai_session_id");
  if (!id) {
    id = `sess-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("ai_session_id", id);
  }
  return id;
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I'm the Circuitry assistant. Ask me things like \"best monitor for a Kubernetes engineer\"." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [products, setProducts] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const { data } = await aiApi.chat({ session_id: getSessionId(), message: text });
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
      setProducts(data.suggested_products || []);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Something went wrong reaching the assistant. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-copper text-ink shadow-card transition hover:bg-copper-light"
      >
        {open ? <CloseIcon /> : <TerminalIcon />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-lg border border-line bg-[#0D1013] shadow-card">
          {/* Terminal chrome */}
          <div className="flex items-center gap-2 border-b border-line bg-slate px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-2 font-mono text-xs text-fog">ai-assistant — zsh</span>
          </div>

          <div ref={scrollRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto p-3 font-mono text-[13px] leading-relaxed">
            {messages.map((m, i) => (
              <div key={i}>
                <span className={m.role === "user" ? "text-signal" : "text-copper"}>
                  {m.role === "user" ? "you@circuitry $" : "assistant $"}
                </span>{" "}
                <span className="text-white/90">{m.text}</span>
              </div>
            ))}
            {sending && <div className="text-fog">assistant $ thinking…</div>}

            {products.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-line pt-3">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded border border-line bg-slate p-2 hover:border-copper/60"
                  >
                    <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-white">{p.name}</p>
                      <p className="text-xs text-fog">${Number(p.price).toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-line bg-slate p-2">
            <span className="pl-1 font-mono text-signal">$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a product…"
              className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-fog focus:outline-none"
            />
            <button type="submit" disabled={sending} className="rounded bg-copper px-2.5 py-1 font-mono text-xs font-medium text-ink disabled:opacity-50">
              run
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function TerminalIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 15h4" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
