import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, Send } from "lucide-react";

const AI_COMMENTS = {
  excellent: ["🔥 Блискучий хід!", "⭐ Найсильніший хід у позиції!", "🎯 Відмінне рішення!"],
  good: ["✅ Гарний хід!", "👍 Правильне рішення", "📈 Позиція покращується"],
  neutral: ["↔️ Рівна позиція", "🤝 Збалансована гра", "📊 Нормальний розвиток"],
  inaccuracy: ["⚠️ Неточність — є краще", "🤔 Можна було сильніше", "📉 Невелике погіршення"],
  capture: ["⚔️ Взяття!", "🎯 Взяли фігуру", "⚡ Тактика!"],
  check: ["♟ Шах!", "👑 Шах королю!", "⚡ Атака!"],
  castle: ["🏰 Рокіровка!", "🛡️ Захист короля!", "✅ Правильно — рокіровка!"],
  opening: ["📖 Дебютна стадія", "🎭 Розвивайте фігури", "🏁 Боротьба за центр"],
  gameEnd: ["Гарна партія! 🤝", "Дякую за гру! ♟️", "Цікава партія! 👏"],
};

interface ChatMessage {
  text: string;
  type: "bot" | "user" | "system";
  time: string;
}

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTime() {
  return new Date().toLocaleTimeString("uk", { hour: "2-digit", minute: "2-digit" });
}

interface BotChatProps {
  movesSan: string[];
  botName: string;
  gameOver: boolean;
}

export default function BotChat({ movesSan, botName, gameOver }: BotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: `Привіт! Я ${botName}. Давайте зіграємо! 🎯`, type: "bot", time: getTime() },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMoveCount = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // React to moves
  useEffect(() => {
    if (movesSan.length <= lastMoveCount.current) return;
    lastMoveCount.current = movesSan.length;

    const lastMove = movesSan[movesSan.length - 1];
    const moveNum = movesSan.length;

    // Bot comments on moves (not every move)
    if (moveNum % 3 === 0 || moveNum <= 2) {
      setTimeout(() => {
        let comment: string;
        if (lastMove.includes("O-O")) comment = rnd(AI_COMMENTS.castle);
        else if (lastMove.includes("+") || lastMove.includes("#")) comment = rnd(AI_COMMENTS.check);
        else if (lastMove.includes("x")) comment = rnd(AI_COMMENTS.capture);
        else if (moveNum <= 6) comment = rnd(AI_COMMENTS.opening);
        else comment = rnd(AI_COMMENTS.neutral);
        
        setMessages((prev) => [...prev, { text: comment, type: "bot", time: getTime() }]);
      }, 500 + Math.random() * 1000);
    }
  }, [movesSan]);

  // Game over message
  useEffect(() => {
    if (gameOver) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { text: rnd(AI_COMMENTS.gameEnd), type: "bot", time: getTime() }]);
      }, 1000);
    }
  }, [gameOver]);

  const BOT_REPLIES = [
    "Цікавий хід! 🤔",
    "Давайте побачимо що вийде...",
    "Гарна ідея! 👍",
    "Хм, треба подумати... 🧐",
    "Продовжуємо! ♟️",
    "Це буде складна партія!",
    "Ви граєте цікаво! 🎯",
    "Зосередимось на грі! 💪",
  ];

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { text: input.trim(), type: "user", time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Bot auto-reply
    setTimeout(() => {
      setMessages((prev) => [...prev, { text: rnd(BOT_REPLIES), type: "bot", time: getTime() }]);
    }, 800 + Math.random() * 1200);
  }, [input]);

  return (
    <div className="bg-card rounded-lg border border-border flex flex-col" style={{ height: 280 }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <MessageSquare size={13} className="text-primary" />
        <span className="text-xs font-bold text-foreground">Чат · {botName}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs rounded-lg px-2.5 py-1.5 max-w-[85%] ${
              msg.type === "bot"
                ? "bg-secondary text-secondary-foreground self-start"
                : msg.type === "user"
                ? "bg-primary/15 text-foreground ml-auto"
                : "text-muted-foreground italic text-center w-full"
            }`}
            style={{ display: "block", marginLeft: msg.type === "user" ? "auto" : undefined }}
          >
            {msg.type === "bot" && (
              <span className="text-[10px] font-bold text-primary block mb-0.5">🤖 {botName}</span>
            )}
            {msg.text}
            <span className="text-[9px] text-muted-foreground ml-2">{msg.time}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 p-2 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Повідомлення..."
          className="flex-1 bg-secondary border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none"
        />
        <button
          onClick={sendMessage}
          className="px-2.5 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary/90 transition-colors"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}
