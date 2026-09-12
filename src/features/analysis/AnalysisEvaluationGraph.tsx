import { formatCp, type AnalysisRecord, type MoveClassification } from "@/features/analysis/model";
import { ChevronRight, TrendingUp } from "lucide-react";
import { type KeyboardEvent, useMemo } from "react";
import "@/styles/analysis-evaluation-graph.css";

const CLASSIFICATION_LABELS: Record<MoveClassification, string> = {
    best: "Найкращий",
    excellent: "Чудовий",
    good: "Добрий",
    inaccuracy: "Неточність",
    mistake: "Помилка",
    blunder: "Груба помилка",
};

type EvaluationPoint = {
    index: number;
    score: number;
    moveLabel: string;
    san: string;
    classification: MoveClassification | null;
    evalLoss: number | null;
    bestMoveSan: string | null;
};

const WIDTH = 720;
const HEIGHT = 176;
const PAD_X = 18;
const PAD_Y = 17;
const VISUAL_LIMIT = 600;

function clampScore(score: number) {
    return Math.max(-VISUAL_LIMIT, Math.min(VISUAL_LIMIT, score));
}

function pointX(index: number, count: number) {
    if (count <= 1) return WIDTH / 2;
    return PAD_X + (index / (count - 1)) * (WIDTH - PAD_X * 2);
}

function pointY(score: number) {
    const normalized = (clampScore(score) + VISUAL_LIMIT) / (VISUAL_LIMIT * 2);
    return HEIGHT - PAD_Y - normalized * (HEIGHT - PAD_Y * 2);
}

function activatePoint(event: KeyboardEvent<SVGCircleElement>, callback: () => void) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    callback();
}

export default function AnalysisEvaluationGraph({
    record,
    currentPath,
    onNavigate,
}: {
    record: AnalysisRecord;
    currentPath: number[] | null;
    onNavigate: (path: number[] | null) => void;
}) {
    const points = useMemo<EvaluationPoint[]>(() => record.mainline
        .map((node, index) => ({
            index,
            score: node.engineEval,
            moveLabel: `${node.moveNumber}${node.color === "w" ? "." : "..."}`,
            san: node.san,
            classification: node.classification,
            evalLoss: node.evalLoss,
            bestMoveSan: node.bestMoveSan,
        }))
        .filter((point): point is EvaluationPoint => point.score != null), [record.mainline]);

    const turningPoint = useMemo(() => points.reduce<EvaluationPoint | null>((best, point) => {
        if (point.evalLoss == null || point.evalLoss <= 0) return best;
        if (!best || (point.evalLoss || 0) > (best.evalLoss || 0)) return point;
        return best;
    }, null), [points]);

    if (points.length < 2) {
        return (
            <section className="analysis-evaluation-card is-empty" aria-label="Графік оцінки">
                <div className="analysis-evaluation-heading">
                    <div><TrendingUp size={15} /><strong>Графік оцінки</strong></div>
                    <span>Stockfish</span>
                </div>
                <p>Потрібні щонайменше дві перевірені позиції, щоб побудувати графік.</p>
            </section>
        );
    }

    const path = points.map((point, index) => `${pointX(index, points.length)},${pointY(point.score)}`).join(" ");
    const zeroY = pointY(0);

    return (
        <section className="analysis-evaluation-card" aria-label="Графік оцінки">
            <div className="analysis-evaluation-heading">
                <div><TrendingUp size={15} /><strong>Графік оцінки</strong></div>
                <span>за ходами · Stockfish</span>
            </div>

            <div className="analysis-evaluation-chart-wrap">
                <span className="analysis-evaluation-side is-white">Білі</span>
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Зміна оцінки Stockfish протягом партії" preserveAspectRatio="none">
                    <line className="analysis-evaluation-zero" x1={PAD_X} y1={zeroY} x2={WIDTH - PAD_X} y2={zeroY} />
                    <line className="analysis-evaluation-guide" x1={PAD_X} y1={pointY(300)} x2={WIDTH - PAD_X} y2={pointY(300)} />
                    <line className="analysis-evaluation-guide" x1={PAD_X} y1={pointY(-300)} x2={WIDTH - PAD_X} y2={pointY(-300)} />
                    <polyline className="analysis-evaluation-line" points={path} />
                    {points.map((point, index) => {
                        const selected = currentPath?.length === 1 && currentPath[0] === point.index;
                        const turning = turningPoint?.index === point.index;
                        const label = `${point.moveLabel} ${point.san}, оцінка ${formatCp(point.score)}${point.classification ? `, ${CLASSIFICATION_LABELS[point.classification]}` : ""}`;
                        return (
                            <circle
                                key={`${point.index}-${point.san}`}
                                cx={pointX(index, points.length)}
                                cy={pointY(point.score)}
                                r={selected ? 7 : turning ? 6 : 4.5}
                                className={`analysis-evaluation-point${selected ? " is-selected" : ""}${turning ? " is-turning" : ""}`}
                                role="button"
                                tabIndex={0}
                                aria-label={label}
                                onClick={() => onNavigate([point.index])}
                                onKeyDown={event => activatePoint(event, () => onNavigate([point.index]))}
                            >
                                <title>{label}</title>
                            </circle>
                        );
                    })}
                </svg>
                <span className="analysis-evaluation-side is-black">Чорні</span>
            </div>

            <div className="analysis-evaluation-legend">
                <span><i />0.00</span>
                <small>Шкала графіка обмежена ±6.00 для читабельності; значення ходів залишаються реальними.</small>
            </div>

            {turningPoint && (
                <button type="button" className="analysis-turning-point" onClick={() => onNavigate([turningPoint.index])}>
                    <div>
                        <span>Переломний момент</span>
                        <strong>{turningPoint.moveLabel} {turningPoint.san}</strong>
                    </div>
                    <div className="analysis-turning-point-detail">
                        {turningPoint.classification && <span>{CLASSIFICATION_LABELS[turningPoint.classification]}</span>}
                        <span>Втрата {(turningPoint.evalLoss! / 100).toFixed(2)}</span>
                        {turningPoint.bestMoveSan && <span>Краще: {turningPoint.bestMoveSan}</span>}
                    </div>
                    <ChevronRight size={15} />
                </button>
            )}
        </section>
    );
}
