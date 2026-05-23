import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a warm, insightful executive coach named Sage. You are coaching Jim Juliano, AVP of Data & Analytics at Berkshire Group, a multifamily real estate investment firm in Massachusetts where he has worked for 29 years.

About Jim:
- Leads a small team: two data analysts and a business analyst/project manager
- Working on Microsoft Fabric modernization, Power BI reporting, data governance, and AI strategy
- Navigating a complex org structure with CITO, VP, SVP Infrastructure, VP Applications, and COO
- Prefers hands-on, impact-visible work over people management
- Values fit and meaning over compensation
- Has experienced burnout and disconnect from his role, alongside positive external signals (bonus, raise, CITO support)
- Strengths: Flexibility/Adaptability, Emotional Control
- Development areas: Planning & Prioritization, Goal-Directed Persistence
- Family background in business ownership; entrepreneurship education
- Interests: cars (driving experience), travel (discovery, food, culture), art

Current focus areas:
- BPC to Microsoft Fabric integration project
- AI adoption strategy for the organization
- Strategic visibility with the CITO
- Managing a complex direct-report situation
- Career meaning and long-term fit

Coaching philosophy:
- Ask one powerful, focused question at a time — never multiple questions at once
- Be curious, not clinical. Hold space without judgment
- Reflect insights back to Jim; name what you notice
- Alternate between leadership/career, habits/accountability, and self-awareness themes naturally
- Keep responses concise — 2-4 sentences max, then one clear coaching question
- Use Jim's context naturally but don't over-reference it mechanically
- Avoid bullet points; speak in warm, direct prose
- When Jim shares something meaningful, reflect before asking
- Occasionally offer a reframe or brief insight, then invite his reaction
- Start sessions by checking in on what's alive for Jim today

Do NOT:
- Ask multiple questions at once
- Use generic coaching clichés
- Give long speeches
- Sound robotic or list-heavy
- Ignore his professional context — you know him

Begin the conversation with a warm, brief check-in question about what's on Jim's mind today. Keep it to 1-2 sentences.`;

const MOOD_OPTIONS = [
  { label: "Energized", emoji: "⚡", color: "#f59e0b" },
  { label: "Focused", emoji: "🎯", color: "#3b82f6" },
  { label: "Uncertain", emoji: "🌫️", color: "#8b5cf6" },
  { label: "Drained", emoji: "🌊", color: "#6b7280" },
  { label: "Motivated", emoji: "🔥", color: "#ef4444" },
  { label: "Reflective", emoji: "🌙", color: "#0ea5e9" },
];

export default function App() {
  const [phase, setPhase] = useState("welcome");
  const [mood, setMood] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase === "chat") {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const callAPI = async (msgs) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: msgs,
      }),
    });
    const data = await res.json();
    return data.content?.find(b => b.type === "text")?.text || "I lost the thread for a moment. Please try again.";
  };

  const startSession = async (selectedMood) => {
    setMood(selectedMood);
    setPhase("chat");
    setLoading(true);
    try {
      const moodNote = `(Jim's mood entering this session: ${selectedMood.label}. Let it subtly inform your tone — don't name it explicitly.)`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT + "\n\n" + moodNote,
          messages: [{ role: "user", content: "Begin the session." }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      setMessages([{ role: "assistant", content: text }]);
    } catch {
      setMessages([{ role: "assistant", content: "Something went wrong. Please refresh and try again." }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const reply = await callAPI(newMessages);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection hiccup. Please try again." }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (phase === "welcome") return (
    <div style={s.page}>
      <div style={s.welcomeWrap}>
        <div style={s.logoMark}>✦</div>
        <h1 style={s.welcomeTitle}>Good to see you, Jim.</h1>
        <p style={s.welcomeSub}>Your space to think clearly, lead well,<br />and stay grounded in what matters.</p>
        <button style={s.beginBtn} onClick={() => setPhase("mood")}>Begin session →</button>
      </div>
    </div>
  );

  if (phase === "mood") return (
    <div style={s.page}>
      <div style={s.moodWrap}>
        <p style={s.moodPrompt}>How are you arriving today?</p>
        <div style={s.moodGrid}>
          {MOOD_OPTIONS.map(m => (
            <button
              key={m.label}
              style={{ ...s.moodBtn, borderColor: m.color + "60" }}
              onClick={() => startSession(m)}
            >
              <span style={{ fontSize: 26 }}>{m.emoji}</span>
              <span style={{ ...s.moodLabel, color: m.color }}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.chatContainer}>
        <div style={s.chatHeader}>
          <div style={s.headerLeft}>
            <div style={s.sageAvatar}>S</div>
            <div>
              <div style={s.sageName}>Sage</div>
              <div style={s.sageRole}>Your coach</div>
            </div>
          </div>
          <div style={s.headerRight}>
            {mood && <span style={s.moodBadge}>{mood.emoji} {mood.label}</span>}
            <span style={s.timer}>{formatTime(sessionTime)}</span>
          </div>
        </div>

        <div style={s.messagesArea}>
          {messages.map((m, i) => (
            <div key={i} style={m.role === "user" ? s.userRow : s.assistantRow}>
              {m.role === "assistant" && <div style={s.avatarSmall}>S</div>}
              <div style={m.role === "user" ? s.userBubble : s.assistantBubble}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={s.assistantRow}>
              <div style={s.avatarSmall}>S</div>
              <div style={s.typingIndicator}>
                {[0, 200, 400].map(delay => (
                  <span key={delay} style={{ ...s.dot, animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={s.inputArea}>
          <textarea
            ref={inputRef}
            style={s.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Share what's on your mind…"
            rows={2}
            disabled={loading}
          />
          <button
            style={{ ...s.sendBtn, opacity: input.trim() && !loading ? 1 : 0.35 }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >↑</button>
        </div>
        <p style={s.hint}>Enter to send · Shift+Enter for new line</p>
      </div>

      <style>{`
        @keyframes pulse {
          0%,80%,100%{transform:scale(0.7);opacity:0.4}
          40%{transform:scale(1);opacity:1}
        }
        textarea:focus{outline:none;}
        textarea::placeholder{color:#9ca3af;}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:2px;}
        button:active{opacity:0.8;}
      `}</style>
    </div>
  );
}

const s = {
  page: { minHeight:"100vh", background:"#faf9f7", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:16 },
  welcomeWrap: { textAlign:"center", maxWidth:380 },
  logoMark: { fontSize:32, color:"#4f7c5f", marginBottom:24, display:"block" },
  welcomeTitle: { fontFamily:"'Lora',serif", fontSize:30, fontWeight:400, color:"#1c1c1c", margin:"0 0 12px", letterSpacing:"-0.5px" },
  welcomeSub: { fontSize:16, color:"#6b7280", lineHeight:1.6, margin:"0 0 36px", fontWeight:300 },
  beginBtn: { background:"#1c1c1c", color:"#fff", border:"none", borderRadius:100, padding:"14px 32px", fontSize:15, fontFamily:"'DM Sans',sans-serif", fontWeight:500, cursor:"pointer" },
  moodWrap: { textAlign:"center", maxWidth:420, width:"100%" },
  moodPrompt: { fontFamily:"'Lora',serif", fontSize:22, color:"#1c1c1c", marginBottom:28, fontWeight:400, fontStyle:"italic" },
  moodGrid: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 },
  moodBtn: { background:"transparent", border:"1px solid", borderRadius:14, padding:"16px 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8 },
  moodLabel: { fontSize:13, fontWeight:500 },
  chatContainer: { width:"100%", maxWidth:620, background:"#fff", borderRadius:20, boxShadow:"0 4px 40px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", overflow:"hidden", height:"92vh", border:"1px solid #f0ede8" },
  chatHeader: { padding:"16px 20px", borderBottom:"1px solid #f0ede8", display:"flex", alignItems:"center", justifyContent:"space-between" },
  headerLeft: { display:"flex", alignItems:"center", gap:12 },
  sageAvatar: { width:38, height:38, borderRadius:"50%", background:"#4f7c5f", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontFamily:"'Lora',serif", fontWeight:500 },
  sageName: { fontFamily:"'Lora',serif", fontSize:15, fontWeight:500, color:"#1c1c1c" },
  sageRole: { fontSize:12, color:"#9ca3af", fontWeight:300 },
  headerRight: { display:"flex", alignItems:"center", gap:12 },
  moodBadge: { fontSize:12, color:"#6b7280", background:"#f9fafb", borderRadius:100, padding:"4px 10px", border:"1px solid #f0ede8" },
  timer: { fontSize:12, color:"#9ca3af", fontVariantNumeric:"tabular-nums" },
  messagesArea: { flex:1, overflowY:"auto", padding:"20px 16px 8px", display:"flex", flexDirection:"column", gap:16 },
  assistantRow: { display:"flex", alignItems:"flex-start", gap:10, maxWidth:"90%" },
  userRow: { display:"flex", justifyContent:"flex-end" },
  avatarSmall: { width:28, height:28, minWidth:28, borderRadius:"50%", background:"#4f7c5f", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontFamily:"'Lora',serif", fontWeight:500, marginTop:2 },
  assistantBubble: { background:"#f9f7f4", borderRadius:"4px 16px 16px 16px", padding:"12px 16px", fontSize:15, lineHeight:1.65, color:"#1c1c1c", fontWeight:300, flex:1 },
  userBubble: { background:"#1c1c1c", color:"#fff", borderRadius:"16px 4px 16px 16px", padding:"12px 16px", fontSize:15, lineHeight:1.65, maxWidth:"80%", fontWeight:300 },
  typingIndicator: { background:"#f9f7f4", borderRadius:"4px 16px 16px 16px", padding:"14px 18px", display:"flex", gap:5, alignItems:"center" },
  dot: { display:"inline-block", width:7, height:7, borderRadius:"50%", background:"#9ca3af", animation:"pulse 1.4s ease-in-out infinite" },
  inputArea: { padding:"12px 16px", borderTop:"1px solid #f0ede8", display:"flex", gap:10, alignItems:"flex-end" },
  textarea: { flex:1, border:"1px solid #e5e7eb", borderRadius:14, padding:"10px 14px", fontSize:15, fontFamily:"'DM Sans',sans-serif", fontWeight:300, color:"#1c1c1c", resize:"none", lineHeight:1.5, background:"#faf9f7" },
  sendBtn: { width:40, height:40, borderRadius:"50%", background:"#1c1c1c", color:"#fff", border:"none", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  hint: { textAlign:"center", fontSize:11, color:"#d1d5db", margin:"0 0 10px", fontWeight:300 },
};
