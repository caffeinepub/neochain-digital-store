import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { SupportTicket } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useUserProfile } from "../hooks/useQueries";

interface ChatMessage {
  id: number;
  role: "bot" | "user";
  text: string;
}

type TicketFlow =
  | "idle"
  | "ask_name"
  | "ask_email"
  | "ask_summary"
  | "creating"
  | "done";

function getBotResponse(msg: string): string {
  const m = msg.toLowerCase();
  if (/login|sign in|login nahi|login problem/.test(m))
    return `Login karne ke liye pehle 'Login' button click karo. Agar problem hai toh:\n1. Browser refresh karo\n2. Internet connection check karo\n3. Agar naya account hai toh pehle 'Sign Up' karo\nAbhi bhi problem hai? 'No' bolo toh ticket create karta hoon.`;
  if (/register|sign up|registration/.test(m) && !/no/.test(m))
    return `Registration ke liye:\n1. 'Sign Up' button click karo header mein\n2. Username daalo (max 30 characters)\n3. Referral code optional hai\nKoi problem hai toh batao!`;
  if (/spin|daily spin|wheel|free spin/.test(m))
    return "Daily Spin ke baare mein:\n• Har 24 ghante mein 1 FREE spin milta hai\n• Uske baad ₹30 per extra spin\n• Spin karne ke liye logged in hona zaroori hai\n• 7th spin par ₹50 special bonus milta hai\nSpin nahi ho raha? Browser refresh karke try karo.";
  if (/withdraw|withdrawal|paise nikalna/.test(m))
    return "Withdrawal ke liye:\n1. 3-dot menu → Wallet → Withdraw\n2. Amount daalo (minimum balance zaroori)\n3. Bank/UPI details fill karo\n4. Submit karo — Admin 24-48 hours mein approve karega\nNote: 12% withdrawal fee lagti hai.\nKoi specific problem hai?";
  if (/buy plan|plan buy|purchase/.test(m) && !/referral|commission/.test(m))
    return `Plan kharidne ke liye:\n1. Home page par plan cards dekhein\n2. 'Buy Now' click karo\n3. Payment method select karo\n4. Transaction ID + screenshot submit karo\nPlans: ₹1500 (20%), ₹3000 (20%), ₹5000 (17%), ₹8000 (15%)\nSubmit fail ho raha hai? Details sahi fill karo.`;
  if (/balance|earnings|income/.test(m))
    return "Balance Dashboard mein dikhta hai. Earnings sources:\n• Plan referral commissions\n• Daily spin rewards\n• Daily login bonus (₹5)\n• Ads promotion tasks\nBalance update hone mein thoda time lag sakta hai.";
  if (/referral|refer|commission/.test(m))
    return "Referral system:\n1. Dashboard → Referral to Earn section mein apna code copy karo\n2. Friend ko code share karo\n3. Woh plan buy kare toh commission milti hai\nCommission rates: ₹1500/₹3000 = 20%, ₹5000 = 17%, ₹8000 = 15%\nCommission pending hoti hai — admin approve karne par credit hoti hai.";
  if (/payment|qr|esewa|khalti|paytm|phonepay|google pay|upi|bybit/.test(m))
    return "Payment methods: eSewa, Khalti, Paytm, PhonePe, Google Pay, USD Payment, Bybit Pay\nQR code scan karke payment karo, phir:\n• Transaction ID daalo\n• Screenshot upload karo\n• Submit karo\nAdmin verify karke approve karega.";
  if (/bonus|login bonus|daily bonus/.test(m))
    return "Daily Login Bonus:\n• Har din login karne par ₹5 automatic milta hai\n• Earnings Hub section mein dikhega\n• Spin karke aur zyada kamao!";
  if (/admin|support team|contact/.test(m))
    return "Admin se directly contact ke liye support ticket create karo. Main abhi ek ticket create kar sakta hoon. Apni problem detail mein batao.";
  if (/thank|thanks|shukriya|dhanyawad/.test(m))
    return "Khushi hui madad karne mein! Koi aur problem ho toh zaroor batao. 😊";
  if (/^(hello|hi|hey|namaste|hii|helo)/.test(m.trim()))
    return "Namaste! 👋 Main NeoChain ka Support Bot hoon. Aapki kya madad kar sakta hoon?\n• Login/Register issue\n• Spin problem\n• Withdrawal help\n• Buy Plan help\n• Balance query\nKoi bhi topic pe puchh sakte ho!";
  return "Mujhe samajh aa gaya. Is issue ko resolve karne ke liye main aapka support ticket create karta hoon jisse admin directly aapko help karega. Kya aap confirm karte hain? (Yes / No)";
}

export default function CustomerSupportWidget() {
  const { actor } = useActor();
  const { data: userProfile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "bot",
      text: "Namaste! 👋 Main NeoChain ka Support Bot hoon. Aapki kya madad kar sakta hoon?\n• Login/Register issue\n• Spin problem\n• Withdrawal help\n• Buy Plan help\n• Balance query",
    },
  ]);
  const [input, setInput] = useState("");
  const [botMsgCount, setBotMsgCount] = useState(0);
  const [showResolutionPrompt, setShowResolutionPrompt] = useState(false);
  const [ticketFlow, setTicketFlow] = useState<TicketFlow>("idle");
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll trigger on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: "bot" | "user", text: string) => {
    setMessages((prev) => [...prev, { id: nextId.current++, role, text }]);
    if (role === "bot") setBotMsgCount((c) => c + 1);
  };

  const handleSend = async (text?: string) => {
    const msgText = text ?? input.trim();
    if (!msgText) return;
    setInput("");
    addMessage("user", msgText);

    // Ticket flow handling
    if (ticketFlow === "ask_name") {
      setTicketName(msgText);
      setTicketFlow("ask_email");
      addMessage(
        "bot",
        "Theek hai! Aapka email address batao (optional — skip karna ho toh 'skip' likhein):",
      );
      return;
    }
    if (ticketFlow === "ask_email") {
      const email = msgText.toLowerCase() === "skip" ? "" : msgText;
      setTicketEmail(email);
      setTicketFlow("ask_summary");
      addMessage(
        "bot",
        "Accha! Ab apni problem detail mein batao taaki admin aapki puri baat samajh sake:",
      );
      return;
    }
    if (ticketFlow === "ask_summary") {
      setTicketFlow("creating");
      await createTicket(ticketName, ticketEmail, msgText);
      return;
    }

    // Resolution prompt responses
    if (showResolutionPrompt) {
      const lower = msgText.toLowerCase();
      if (
        lower.includes("yes") ||
        lower.includes("han") ||
        lower.includes("haan")
      ) {
        setShowResolutionPrompt(false);
        addMessage(
          "bot",
          "Bahut acha! Khushi hui aapki madad karne mein. Koi aur help chahiye? 😊",
        );
        return;
      }
      if (
        lower.includes("no") ||
        lower.includes("nahi") ||
        lower.includes("nai")
      ) {
        setShowResolutionPrompt(false);
        startTicketFlow();
        return;
      }
    }

    // Check for "yes create ticket" confirmation
    const lower = msgText.toLowerCase();
    if (
      lower === "yes" ||
      lower === "yes ticket" ||
      lower.includes("ticket banao")
    ) {
      startTicketFlow();
      return;
    }
    if (lower === "no") {
      addMessage("bot", "Theek hai! Koi aur problem ho toh batao. 😊");
      return;
    }

    const response = getBotResponse(msgText);
    addMessage("bot", response);

    // After 2 bot messages show resolution prompt
    if (botMsgCount >= 2 && !showResolutionPrompt && ticketFlow === "idle") {
      setTimeout(() => {
        setShowResolutionPrompt(true);
        addMessage("bot", "Kya aapki problem solve hui? (Yes / No)");
      }, 800);
    }
  };

  const startTicketFlow = () => {
    if (userProfile) {
      // Logged in — skip name/email
      setTicketName(userProfile.username);
      setTicketEmail("");
      setTicketFlow("ask_summary");
      addMessage(
        "bot",
        `Zaroor! ${userProfile.username} ke liye ticket create karunga. Apni problem detail mein batao:`,
      );
    } else {
      setTicketFlow("ask_name");
      addMessage("bot", "Ticket create karne ke liye aapka naam batao:");
    }
  };

  const createTicket = async (name: string, email: string, summary: string) => {
    if (!actor) {
      addMessage(
        "bot",
        "❌ Connection issue. Please refresh the page and try again.",
      );
      setTicketFlow("idle");
      return;
    }
    try {
      const ticketId = await actor.createSupportTicket(name, email, summary);
      setTicketFlow("done");
      addMessage(
        "bot",
        `✅ Ticket #${ticketId} create ho gaya! Admin 24 hours mein reply karega. Aap 'My Tickets' section mein status check kar sakte ho.`,
      );
      toast.success(`Support Ticket #${ticketId} created!`);
    } catch {
      addMessage(
        "bot",
        "❌ Ticket create karne mein error aaya. Please dobara try karo.",
      );
      setTicketFlow("idle");
    }
  };

  const loadMyTickets = async () => {
    if (!actor || !userProfile) return;
    try {
      const tickets = await actor.getMyTickets();
      setMyTickets(tickets);
    } catch {
      toast.error("Could not load tickets");
    }
  };

  const handleMyTicketsToggle = () => {
    if (!showMyTickets) loadMyTickets();
    setShowMyTickets((v) => !v);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[340px] sm:w-[380px] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "rgba(6, 4, 20, 0.98)",
              border: "1px solid rgba(123, 77, 255, 0.35)",
              boxShadow:
                "0 0 40px rgba(123,77,255,0.2), 0 20px 60px rgba(0,0,0,0.8)",
              height: "520px",
            }}
            data-ocid="support.panel"
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between flex-shrink-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(123,77,255,0.5) 0%, rgba(0,210,255,0.3) 100%)",
                borderBottom: "1px solid rgba(123,77,255,0.3)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "oklch(0.96 0.01 280)" }}
                  >
                    NeoChain Support
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.7 0.15 200)" }}
                  >
                    Online • Hinglish mein help
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: "oklch(0.7 0.05 280)" }}
                data-ocid="support.close_button"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-3 flex flex-col gap-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(123,77,255,0.3) transparent",
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line"
                    style={{
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, rgba(123,77,255,0.7), rgba(0,210,255,0.4))"
                          : "rgba(255,255,255,0.05)",
                      color:
                        msg.role === "user"
                          ? "oklch(0.97 0.01 280)"
                          : "oklch(0.85 0.08 200)",
                      border:
                        msg.role === "bot"
                          ? "1px solid rgba(123,77,255,0.15)"
                          : "none",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* My Tickets section */}
            {userProfile && (
              <div
                className="flex-shrink-0"
                style={{ borderTop: "1px solid rgba(123,77,255,0.15)" }}
              >
                <button
                  type="button"
                  onClick={handleMyTicketsToggle}
                  className="w-full px-4 py-2 text-xs font-medium text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                  style={{ color: "oklch(0.7 0.15 200)" }}
                  data-ocid="support.open_modal_button"
                >
                  <span>🎫 My Tickets ({myTickets.length})</span>
                  <span>{showMyTickets ? "▲" : "▼"}</span>
                </button>
                {showMyTickets && (
                  <div
                    className="max-h-28 overflow-y-auto px-3 pb-2"
                    style={{ scrollbarWidth: "thin" }}
                  >
                    {myTickets.length === 0 ? (
                      <p
                        className="text-xs text-center py-2"
                        style={{ color: "oklch(0.5 0.05 280)" }}
                      >
                        Koi ticket nahi mila
                      </p>
                    ) : (
                      myTickets.map((t, i) => (
                        <div
                          key={String(t.ticketId)}
                          className="rounded-lg p-2 mb-1"
                          style={{
                            background: "rgba(123,77,255,0.08)",
                            border: "1px solid rgba(123,77,255,0.15)",
                          }}
                          data-ocid={`support.item.${i + 1}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-xs font-bold"
                              style={{ color: "oklch(0.85 0.1 280)" }}
                            >
                              #{String(t.ticketId)}
                            </span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{
                                background:
                                  String(t.status) === "resolved"
                                    ? "rgba(0,200,100,0.15)"
                                    : "rgba(255,180,0,0.15)",
                                color:
                                  String(t.status) === "resolved"
                                    ? "oklch(0.75 0.15 150)"
                                    : "oklch(0.85 0.15 80)",
                              }}
                            >
                              {String(t.status) === "resolved"
                                ? "Resolved"
                                : "Open"}
                            </span>
                          </div>
                          <p
                            className="text-xs"
                            style={{ color: "oklch(0.6 0.05 280)" }}
                          >
                            {t.problemSummary.substring(0, 60)}
                            {t.problemSummary.length > 60 ? "..." : ""}
                          </p>
                          {t.adminReply && (
                            <p
                              className="text-xs mt-1 italic"
                              style={{ color: "oklch(0.75 0.1 200)" }}
                            >
                              Admin: {t.adminReply}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div
              className="px-3 py-3 flex gap-2 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(123,77,255,0.2)" }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Apna message likhein..."
                className="flex-1 text-xs rounded-xl px-3 py-2 outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(123,77,255,0.25)",
                  color: "oklch(0.9 0.05 280)",
                }}
                data-ocid="support.input"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #7b4dff, #00d2ff)",
                  boxShadow: input.trim()
                    ? "0 0 12px rgba(123,77,255,0.5)"
                    : "none",
                }}
                data-ocid="support.submit_button"
              >
                <span className="text-white text-sm">➤</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm"
        style={{
          background: "linear-gradient(135deg, #7b4dff 0%, #00d2ff 100%)",
          boxShadow:
            "0 0 25px rgba(123,77,255,0.5), 0 4px 20px rgba(0,0,0,0.4)",
          color: "white",
        }}
        data-ocid="support.open_modal_button"
      >
        <span className="text-base">💬</span>
        <span>Support</span>
      </motion.button>
    </div>
  );
}
