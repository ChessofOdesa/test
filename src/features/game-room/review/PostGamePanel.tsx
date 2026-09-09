import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Flag, Loader2, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoveHistory } from "../MoveHistory";
import type { GamePanelProps } from "../GamePanel";
import type { Color, RoomResult } from "../types";
import { formatReviewScore, parseReviewGame, REVIEW_CONFIG, REVIEW_LABELS, REVIEW_MARKS, type ReviewedMove } from "./model";
import type { MoveClassification } from "@/features/analysis/scoring";
import { useGameReview } from "./useGameReview";

const rows: MoveClassification[] = ["best", "excellent", "good", "inaccuracy", "mistake", "blunder"];
const errors: MoveClassification[] = ["inaccuracy", "mistake", "blunder"];
const moveLabel = (move: ReviewedMove) => `${move.moveNumber}.${move.color === "b" ? ".." : ""}${move.san}${REVIEW_MARKS[move.classification]}`;

function duration(start?: string, end?: string) {
  if (!start || !end) return null;
  const seconds = Math.round((Date.parse(end) - Date.parse(start)) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PostGamePanel({ result, moves, cursor, onCursor, info, chat, notice }: GamePanelProps & { result: RoomResult }) {
  const [tab, setTab] = useState("overview");
  const review = useGameReview(result.pgn);
  const { report } = review;
  const game = useMemo(() => { try { return parseReviewGame(result.pgn); } catch { return null; } }, [result.pgn]);
  const time = duration(result.startedAt, result.finishedAt);
  const annotations = report?.moves.map(move => ({ mark: REVIEW_MARKS[move.classification], label: REVIEW_LABELS[move.classification], classification: move.classification }));
  const mistakes = report?.moves.filter(move => errors.includes(move.classification)) || [];
  const selected = cursor != null && cursor >= 0 ? report?.moves[cursor] : undefined;
  const key = selected || report?.keyMove;
  const jump = (move: ReviewedMove | undefined) => { if (move) onCursor(move.index); };
  const nextMistake = () => jump(mistakes.find(move => move.index > (cursor ?? -1)) || mistakes[0]);
  const Icon = result.tone === "win" ? Trophy : Flag;
  const start = () => { setTab("overview"); void review.start(); };

  return <aside className="room-panel room-postgame" aria-label="Огляд завершеної партії">
    <header className={`review-result is-${result.tone}`}>
      <div className="review-result-title"><div><span className="review-eyebrow"><Icon size={14}/>Партію завершено</span><h2>{result.title}</h2><p>{result.reason}</p></div><strong className="review-score">{result.result === "1/2-1/2" ? "½–½" : result.result.replace("-", "–")}</strong></div>
      <div className="review-players">{(["w", "b"] as Color[]).map(color => <div key={color}><span className={`room-color is-${color === "w" ? "white" : "black"}`} aria-label={color === "w" ? "Білі" : "Чорні"}/><div><strong title={result.players[color].name}>{result.players[color].name}</strong>{(result.players[color].subtitle || result.players[color].rating != null) && <span>{result.players[color].subtitle || result.players[color].rating}</span>}</div></div>)}</div>
      {result.rating && <div className="review-rating">{result.rating}</div>}
    </header>
    {notice && <div className="room-notices">{notice}</div>}
    <Tabs value={tab} onValueChange={setTab} className="room-panel-tabs">
      <TabsList className="room-tab-list"><TabsTrigger value="overview">Огляд</TabsTrigger><TabsTrigger value="moves">Ходи</TabsTrigger><TabsTrigger value="info">Деталі</TabsTrigger></TabsList>
      <TabsContent value="overview" className="room-tab-content review-overview">
        <dl className="review-facts"><div><dt>Півходів</dt><dd>{moves.length}</dd></div>{time && <div><dt>Тривалість</dt><dd>{time}</dd></div>}<div><dt>Аналіз</dt><dd>{review.status === "done" ? "Готово" : review.status === "running" ? "Триває" : "Не виконано"}</dd></div></dl>
        {review.status === "running" && <div className="review-progress" role="status"><div><Loader2 size={18} className="animate-spin"/><strong>Аналізуємо партію…</strong></div><Progress value={review.total ? review.completed / review.total * 100 : 0} aria-label="Прогрес аналізу"/><p>{review.completed} / {review.total || moves.length} півходів</p><span>Можна переглядати ходи, поки працює аналіз.</span></div>}
        {review.status === "error" && <p className="review-error" role="alert">{review.error}</p>}
        {review.status === "cancelled" && <p className="review-description" role="status">Аналіз зупинено. Його можна запустити знову.</p>}
        {!report && review.status !== "running" && <div className="review-empty"><Search size={24}/><h3>Знайдіть ключовий момент</h3><p>{moves.length ? "Stockfish перевірить ходи, покаже помилки та кращі продовження." : "У цій партії не було ходів для аналізу."}</p></div>}
        {report && <>
          <div className="review-ready"><CheckCircle2 size={15}/><span>{review.cached ? "Збережений огляд на цьому пристрої" : "Аналіз завершено"}</span></div>
          <table className="review-counts"><caption className="sr-only">Якість ходів за аналізом рушія</caption><thead><tr><th scope="col">Ходи</th><th scope="col">Білі</th><th scope="col">Чорні</th></tr></thead><tbody>{rows.map(kind => <tr key={kind}><th scope="row"><span className={`review-category is-${kind}`} aria-hidden="true">{REVIEW_MARKS[kind] || "·"}</span>{REVIEW_LABELS[kind]}</th>{(["w", "b"] as Color[]).map(color => <td key={color}>{errors.includes(kind) && report.sides[color].counts[kind] > 0 ? <button aria-label={`${REVIEW_LABELS[kind]}, ${color === "w" ? "білі" : "чорні"}: ${report.sides[color].counts[kind]}`} onClick={() => jump(report.moves.find(move => move.color === color && move.classification === kind))}>{report.sides[color].counts[kind]}</button> : report.sides[color].counts[kind]}</td>)}</tr>)}</tbody></table>
          {report.opening && <div className="review-opening"><BookOpen size={17}/><div><span>Дебют · {report.opening.eco}</span><strong>{report.opening.name}</strong></div></div>}
          {key && <div className="review-key"><div className="review-section-heading"><h3>{selected ? "Вибраний хід" : "Ключовий момент"}</h3><span>{key.color === "w" ? "Білі" : "Чорні"}</span></div><strong>{moveLabel(key)}</strong><p>{formatReviewScore(key.before)} <ArrowRight size={13}/> {formatReviewScore(key.after)} <small>від білих</small></p>{key.bestMoveSan && <p>Рекомендація рушія: <b>{key.bestMoveSan}</b></p>}<div className="review-key-actions"><Button variant="outline" size="sm" onClick={() => jump(key)}>Показати хід</Button>{mistakes.length > 0 && <Button variant="ghost" size="sm" onClick={nextMistake}>Наступна помилка<ArrowRight size={14}/></Button>}</div></div>}
          {!report.keyMove && !selected && <p className="review-description">За цим аналізом значних помилок не знайдено.</p>}
        </>}
      </TabsContent>
      <TabsContent value="moves" className="room-tab-content room-move-content"><MoveHistory moves={moves} cursor={cursor} onCursor={onCursor} annotations={annotations} finished startColor={game?.moves[0]?.color} startMoveNumber={game ? Number(game.startFen.split(" ")[5]) : 1}/></TabsContent>
      <TabsContent value="info" className="room-tab-content">
        {info}
        {report && <div className="review-method"><h3>Про аналіз</h3><p>{REVIEW_CONFIG.engine}. Ліміт пошуку: глибина {REVIEW_CONFIG.depth} або {REVIEW_CONFIG.movetime} мс на позицію.{report.minDepth != null ? ` Мінімальна досягнута глибина: ${report.minDepth}.` : ""}</p><p>Неточність: від 45, помилка: від 120, груба помилка: від 260 сотих пішака. Це швидкий огляд; детальні варіанти доступні в повному аналізі.</p><dl>{(["w", "b"] as Color[]).map(color => <div key={color}><dt>Середня втрата · {color === "w" ? "білі" : "чорні"}</dt><dd>{report.sides[color].averageLoss == null ? "Немає нематових оцінок" : `${report.sides[color].averageLoss} сотих пішака · ${report.sides[color].cpMoves} півходів`}</dd></div>)}</dl><p>Матові оцінки не входять у середню втрату. Огляд кешується на цьому пристрої.</p></div>}
        {chat && <details className="review-chat-details"><summary>Чат партії</summary><div>{chat}</div></details>}
      </TabsContent>
    </Tabs>
    <footer className="room-panel-footer review-actions">
      {review.status === "running" ? <Button variant="outline" onClick={review.cancel}>Зупинити аналіз</Button> : report ? <Button onClick={result.onFullAnalysis}><Search size={17}/>Повний аналіз<ArrowRight size={16}/></Button> : <Button disabled={!moves.length || !game} onClick={start}><Search size={17}/>{review.status === "error" ? "Повторити аналіз" : "Аналіз партії"}</Button>}
      <div className="review-secondary-actions">{result.actions}</div>
    </footer>
  </aside>;
}
