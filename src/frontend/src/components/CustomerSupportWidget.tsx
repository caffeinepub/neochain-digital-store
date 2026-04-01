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
  quickReplies?: string[];
}

type TicketFlow =
  | "idle"
  | "ask_name"
  | "ask_email"
  | "ask_summary"
  | "creating"
  | "done";

function getBotResponse(msg: string): {
  text: string;
  quickReplies?: string[];
} {
  const m = msg.toLowerCase();

  if (/^(hello|hi|hey|namaste|hii|helo|start)/.test(m.trim()))
    return {
      text: "Namaste! 👋 Main NeoChain Support Bot hoon. Kya problem hai?\n\n• Plan buy\n• Withdrawal\n• Spin\n• Login/Register\n• Balance/Earnings\n• Referral",
      quickReplies: [
        "Plan buy problem",
        "Withdrawal issue",
        "Spin nahi ho raha",
        "Login problem",
      ],
    };

  if (/login|sign in|login nahi/.test(m))
    return {
      text: "Login problem ke liye:\n1. Email/username aur password sahi check karo\n2. Browser refresh karo (Ctrl+R)\n3. Cache clear karo\n4. Incognito mode try karo\n\nNaya account hai? Pehle 'Sign Up' karo.",
      quickReplies: [
        "Password bhool gaya",
        "Account band ho gaya",
        "Abhi bhi nahi ho raha",
      ],
    };

  if (/forgot.*password|password.*bhool|password reset/.test(m))
    return {
      text: "Password reset ke liye admin se contact karo via ticket. Main abhi ticket create kar sakta hoon.\n\nKya ticket create karoon?",
      quickReplies: ["Haan ticket banao", "Nahi, dusri problem hai"],
    };

  if (/register|sign up|registration|account.*bana/.test(m))
    return {
      text: "Registration ke liye:\n1. Header mein 'Sign Up' button click karo\n2. Username daalo\n3. Referral code optional hai\n4. Submit karo\n\nUID auto-generate hoga (USER0001 format).",
      quickReplies: [
        "Register nahi ho raha",
        "Duplicate account error",
        "Referral code kahan daalein",
      ],
    };

  if (/spin|wheel|free spin|daily spin/.test(m))
    return {
      text: "Daily Spin info:\n• Har 24h mein 1 FREE spin\n• Uske baad ₹30 per spin\n• Login zaroori hai\n• 7th spin = ₹50 bonus\n\nSpin nahi ho raha? Page refresh karke try karo.",
      quickReplies: [
        "Spin click nahi ho raha",
        "Spin hua par balance nahi aaya",
        "7th spin bonus nahi mila",
      ],
    };

  if (/withdraw|withdrawal|paise nikalna|withdraw.*nahi/.test(m))
    return {
      text: "Withdrawal steps:\n1. 3-dot menu → Wallet → Withdraw tab\n2. Payment method select karo\n3. Amount + bank details fill karo\n4. Submit karo\n\n⚠️ 12% fee kaati jaati hai\n⚠️ Admin 24-48h mein process karta hai\n⚠️ Minimum balance zaroori hai",
      quickReplies: [
        "Submit nahi ho raha",
        "Bank details kya daalen",
        "Withdrawal approve nahi hua",
        "Balance insufficient error",
      ],
    };

  if (/buy plan|plan.*nahi|plan.*fail|submit.*fail|request.*fail/.test(m))
    return {
      text: "Buy Plan steps:\n1. Home page → plan card → 'Buy Now'\n2. Payment method select karo\n3. QR scan karke payment karo\n4. Name + Transaction ID + Screenshot fill karo\n5. Submit karo\n\nAdmin 24h mein verify karta hai.",
      quickReplies: [
        "Submit button kaam nahi karta",
        "Screenshot upload nahi ho raha",
        "Transaction ID kahan milega",
        "Plan approve nahi hua",
      ],
    };

  if (/submit.*nahi|request.*nahi|button.*kaam nahi/.test(m))
    return {
      text: "Submit issue ke liye:\n1. Sare required fields (*) fill karo\n2. Screenshot upload karo (zaroori)\n3. Transaction ID sahi daalo\n4. Page refresh karke dobara try karo\n5. Incognito mode try karo\n\nAbhi bhi nahi ho raha? Ticket create karta hoon.",
      quickReplies: ["Haan ticket banao", "Kaunsa fields hai required"],
    };

  if (/balance.*nahi|balance.*update nahi|earning.*nahi/.test(m))
    return {
      text: "Balance update mein delay ho sakta hai:\n• Plan purchase: admin approve karne ke baad\n• Withdrawal: request pending hoti hai\n• Spin/Login bonus: turant milna chahiye\n• Referral commission: admin approve ke baad\n\nRefresh karke check karo.",
      quickReplies: [
        "Spin balance nahi aaya",
        "Referral commission pending",
        "Plan approve hua par balance nahi",
      ],
    };

  if (/referral|refer|commission|refer.*earn/.test(m))
    return {
      text: "Referral system:\n1. 3-dot → 'Referral to Earn' mein apna code milega\n2. Code share karo\n3. Friend plan buy kare toh commission milegi\n\nCommission rates:\n₹1500/₹3000 = 20%\n₹5000 = 17%\n₹8000 = 15%\n\n⚠️ Admin approve karne ke baad credit hoti hai.",
      quickReplies: [
        "Referral code copy karna hai",
        "Commission nahi mila",
        "Commission pending hai",
      ],
    };

  if (/qr.*nahi|qr.*show nahi|payment.*method.*nahi/.test(m))
    return {
      text: "QR code show nahi ho raha:\n1. Internet connection check karo\n2. Page hard refresh karo (Ctrl+Shift+R)\n3. Dusra browser try karo\n\nAdmin ne QR set kiya hai toh dikhna chahiye. Agar phir bhi nahi dikh raha, ticket create karo.",
      quickReplies: ["Haan ticket banao", "Dusra payment method use karunga"],
    };

  if (/ban|account.*band|banned/.test(m))
    return {
      text: "Account ban hone ke reasons:\n• Duplicate account\n• Fraud activity\n• Rules violation\n\nAgar galat ban hua hai toh admin se appeal karo. Main ticket create kar sakta hoon.",
      quickReplies: [
        "Haan ticket banao — galat ban hai",
        "Nahi, dusri problem hai",
      ],
    };

  if (/payment|qr|esewa|khalti|paytm|phonepay|google pay|upi|bybit/.test(m))
    return {
      text: "Payment methods available:\n• eSewa, Khalti\n• Paytm, PhonePe, Google Pay\n• USD Payment, Bybit Pay\n\nQR scan → payment karo → details submit karo.",
      quickReplies: ["QR nahi dikh raha", "Transaction ID kahan milega"],
    };

  if (/bonus|login bonus|daily bonus/.test(m))
    return {
      text: "Daily Login Bonus:\n• Har din login = ₹5 automatic\n• Earnings Hub mein dikhega\n• Spin se aur kamao!",
      quickReplies: ["Bonus nahi mila", "Spin karna hai"],
    };

  if (/admin|contact|ticket/.test(m))
    return {
      text: "Admin se contact karne ke liye main ek support ticket create kar sakta hoon. Admin 24h mein reply karta hai.\n\nKya ticket create karoon?",
      quickReplies: ["Haan ticket banao", "Nahi"],
    };

  if (/thank|thanks|shukriya|solved|ho gaya|theek hai/.test(m))
    return {
      text: "Bahut acha! Khushi hui madad karne mein. 😊 Koi aur problem ho toh batao!",
      quickReplies: ["Aur ek problem hai"],
    };

  return {
    text: "Mujhe aapki problem samajh aayi. Yeh issue main admin tak escalate karta hoon taaki woh personally help kar sakein.\n\nKya support ticket create karoon?",
    quickReplies: ["Haan ticket banao", "Nahi, manually try karunga"],
  };
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
      text: "Namaste! 👋 Main NeoChain ka Support Bot hoon. Aapki kya madad kar sakta hoon?",
      quickReplies: [
        "Plan buy problem",
        "Withdrawal issue",
        "Spin nahi ho raha",
        "Login problem",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [botMsgCount, setBotMsgCount] = useState(0);
  const [showResolutionPrompt, setShowResolutionPrompt] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [ticketFlow, setTicketFlow] = useState<TicketFlow>("idle");
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll trigger on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const addMessage = (
    role: "bot" | "user",
    text: string,
    quickReplies?: string[],
  ) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, role, text, quickReplies },
    ]);
    if (role === "bot") setBotMsgCount((c) => c + 1);
  };

  const addBotMessageWithTyping = (text: string, quickReplies?: string[]) => {
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      addMessage("bot", text, quickReplies);
    }, 800);
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
      addBotMessageWithTyping(
        "Theek hai! Aapka email address batao (optional — skip karna ho toh 'skip' likhein):",
      );
      return;
    }
    if (ticketFlow === "ask_email") {
      const email = msgText.toLowerCase() === "skip" ? "" : msgText;
      setTicketEmail(email);
      setTicketFlow("ask_summary");
      addBotMessageWithTyping(
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
        addBotMessageWithTyping(
          "Bahut acha! Khushi hui aapki madad karne mein. Koi aur help chahiye? 😊",
          ["Aur ek problem hai"],
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

    // Check for "haan ticket banao" or similar
    const lower = msgText.toLowerCase();
    if (
      lower.includes("haan ticket") ||
      lower.includes("han ticket") ||
      lower.includes("ticket banao") ||
      lower === "yes" ||
      lower === "yes ticket"
    ) {
      startTicketFlow();
      return;
    }
    if (lower === "no" || lower === "nahi") {
      addBotMessageWithTyping("Theek hai! Koi aur problem ho toh batao. 😊");
      return;
    }

    const response = getBotResponse(msgText);
    addBotMessageWithTyping(response.text, response.quickReplies);

    // After 1 bot message show resolution prompt (unless response already ends with ?)
    if (botMsgCount >= 1 && !showResolutionPrompt && ticketFlow === "idle") {
      setTimeout(() => {
        if (!response.text.endsWith("?")) {
          setShowResolutionPrompt(true);
          setTimeout(() => {
            addMessage("bot", "Kya aapki problem solve hui? (Yes / No)", [
              "Haan, solved!",
              "Nahi, ticket banao",
            ]);
          }, 1600);
        }
      }, 500);
    }
  };

  const startTicketFlow = () => {
    if (userProfile) {
      setTicketName(userProfile.username);
      setTicketEmail("");
      setTicketFlow("ask_summary");
      addBotMessageWithTyping(
        `Zaroor! ${userProfile.username} ke liye ticket create karunga. Apni problem detail mein batao:`,
      );
    } else {
      setTicketFlow("ask_name");
      addBotMessageWithTyping("Ticket create karne ke liye aapka naam batao:");
    }
  };

  const createTicket = async (name: string, email: string, summary: string) => {
    if (!actor) {
      addBotMessageWithTyping(
        "❌ Connection issue. Please refresh the page and try again.",
      );
      setTicketFlow("idle");
      return;
    }
    try {
      const ticketId = await actor.createSupportTicket(name, email, summary);
      setTicketFlow("done");
      addBotMessageWithTyping(
        `✅ Ticket #${ticketId} create ho gaya! Admin 24 hours mein reply karega. Aap 'My Tickets' section mein status check kar sakte ho.`,
      );
      toast.success(`Support Ticket #${ticketId} created!`);
    } catch {
      addBotMessageWithTyping(
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

  // Find the last bot message index to show quick replies on
  const lastBotMsgIdx = messages.reduce(
    (acc, msg, idx) => (msg.role === "bot" ? idx : acc),
    -1,
  );

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
            className="w-[340px] sm:w-[390px] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "rgba(6, 4, 20, 0.98)",
              border: "1px solid rgba(123, 77, 255, 0.35)",
              boxShadow:
                "0 0 40px rgba(123,77,255,0.2), 0 20px 60px rgba(0,0,0,0.8)",
              height: "540px",
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
              {messages.map((msg, idx) => (
                <div key={msg.id} className="flex flex-col">
                  <div
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="max-w-[88%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line"
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
                  {/* Quick reply chips on last bot message */}
                  {msg.role === "bot" &&
                    idx === lastBotMsgIdx &&
                    msg.quickReplies &&
                    msg.quickReplies.length > 0 &&
                    !botTyping && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5 pl-0">
                        {msg.quickReplies.map((qr) => (
                          <button
                            key={qr}
                            type="button"
                            onClick={() => handleSend(qr)}
                            className="text-xs px-2.5 py-1 rounded-full transition-all hover:scale-105"
                            style={{
                              background: "rgba(123,77,255,0.15)",
                              border: "1px solid rgba(123,77,255,0.4)",
                              color: "oklch(0.8 0.15 280)",
                            }}
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}

              {/* Typing indicator */}
              {botTyping && (
                <div className="flex justify-start">
                  <div
                    className="px-4 py-2.5 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(123,77,255,0.15)",
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{
                            background: "oklch(0.75 0.2 280)",
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
