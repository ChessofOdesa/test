import ChessBoard from "@/components/ChessBoard";
import { Progress } from "@/components/ui/progress";
import { LessonsIcon } from "@/components/icons/chess";
import { LESSON_LEVEL_META, LESSON_LEVELS, type LessonLevel, type LessonProgressState, type LessonRecord } from "@/data/lesson-levels";
import { createCleanLessonDiagramFen, firstAvailableLesson, getLessonAction, getLessonEntryStep, getLevelLessons, isLessonUnlocked, LEVEL_ORDER } from "@/features/lessons/model";
import { ArrowRight, BarChart3, BookOpen, Check, ChevronRight, Clock3, Flame, Heart, Layers3, LayoutGrid, List, LockKeyhole, MoreHorizontal, Play, Repeat2, Trophy, Zap } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

type LessonsHomeProps = {
  progress: LessonProgressState;
  onOpenCatalog: () => void;
  onOpenLevels: () => void;
  onChooseLevel: (level: LessonLevel) => void;
  onStartLesson: (lesson: LessonRecord) => void;
};

const actionLabel = { start: "Почати", continue: "Продовжити", repeat: "Повторити" } as const;
const favoritesKey = "chessmaster.lessons.favorites.v1";

function readFavorites(): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
    return Array.isArray(value) ? [...new Set(value.filter((id): id is number => Number.isInteger(id) && LESSON_LEVELS.some(lesson => lesson.id === id)))] : [];
  } catch { return []; }
}

function LessonPreview({ lesson, size }: { lesson: LessonRecord; size: number }) {
  const fen = lesson.steps[0]?.fen || lesson.fen;
  return <ChessBoard initialFen={fen} displayFen={createCleanLessonDiagramFen(fen, lesson.id)} size={size}
    interactive={false} allowArrows={false} showLegalMoves={false} showChecks={false} showLastMove={false}
    customLightSquareStyle={{ background: "#e8f0f0" }} customDarkSquareStyle={{ background: "#6390ac" }}
    customBoardStyle={{ borderRadius: 6, overflow: "hidden" }} />;
}

function DirectoryGroup({ title, detail, lessons, completed, progress, onStartLesson }: {
  title: string;
  detail: string;
  lessons: LessonRecord[];
  completed: Set<number>;
  progress: LessonProgressState;
  onStartLesson: (lesson: LessonRecord) => void;
}) {
  return <details className="lessons-home-directory-group">
    <summary><Layers3 size={20} aria-hidden="true" /><strong>{title}</strong><span>{detail}</span><ChevronRight size={19} aria-hidden="true" /></summary>
    <div>{lessons.map(lesson => {
      const unlocked = isLessonUnlocked(lesson, progress.completedLessonIds);
      return <button type="button" key={lesson.id} disabled={!unlocked} onClick={() => onStartLesson(lesson)}>
        <span>Урок {lesson.id}</span><strong>{lesson.title}</strong>{completed.has(lesson.id) ? <Check size={17} aria-hidden="true" /> : unlocked ? <Play size={15} aria-hidden="true" /> : <LockKeyhole size={17} aria-hidden="true" />}
      </button>;
    })}</div>
  </details>;
}

export function LessonsHome({ progress, onOpenCatalog, onOpenLevels, onChooseLevel, onStartLesson }: LessonsHomeProps) {
  const [section, setSection] = useState<"overview" | "topics" | "series" | "favorites">("overview");
  const [favorites, setFavorites] = useState<number[]>(readFavorites);
  useEffect(() => { try { localStorage.setItem(favoritesKey, JSON.stringify(favorites)); } catch { /* Favorites still work for this visit. */ } }, [favorites]);
  const toggleFavorite = (id: number) => setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const level = progress.selectedLevel;
  const lessons = getLevelLessons(level);
  const completed = new Set(progress.completedLessonIds);
  const levelDone = lessons.filter(lesson => completed.has(lesson.id)).length;
  const next = level ? firstAvailableLesson(level, progress.completedLessonIds) : null;
  const nextIndex = next ? lessons.findIndex(lesson => lesson.id === next.id) : 0;
  const cardStart = Math.min(nextIndex, Math.max(0, lessons.length - 6));
  const suggestions = lessons.slice(cardStart, cardStart + 6);
  const action = next ? getLessonAction(next, progress) : "start";
  const totalDone = LESSON_LEVELS.filter(lesson => completed.has(lesson.id)).length;
  const totalPercent = Math.round(totalDone / LESSON_LEVELS.length * 100);
  const levelPercent = lessons.length ? Math.round(levelDone / lessons.length * 100) : 0;
  const previewLesson = next || LESSON_LEVELS[0];

  return <section className="lessons-home" aria-label="Головне меню уроків">
    <header className="lessons-home-intro">
      <span>НАВЧАННЯ · CHESS OF ODESA</span>
      <h1>Уроки</h1>
      <p>Рухайтеся від основ до складніших позицій у власному темпі.</p>
    </header>

    <div className="lessons-home-grid">
      <aside className="lessons-home-nav" aria-label="Меню навчання">
        <button type="button" className={section === "overview" ? "is-current" : ""} aria-current={section === "overview" ? "page" : undefined} onClick={() => setSection("overview")}><LayoutGrid size={20} aria-hidden="true" /> Огляд</button>
        <button type="button" onClick={onOpenCatalog}><BookOpen size={20} aria-hidden="true" /> Усі уроки</button>
        <button type="button" onClick={onOpenLevels}><BarChart3 size={20} aria-hidden="true" /> Рівні курсу</button>
        <button type="button" className={section === "topics" ? "is-current" : ""} onClick={() => setSection("topics")}><Layers3 size={20} aria-hidden="true" /> Теми уроків</button>
        <button type="button" className={section === "series" ? "is-current" : ""} onClick={() => setSection("series")}><List size={20} aria-hidden="true" /> Серії уроків</button>
        <div className="lessons-home-nav-course">
          <strong>Поточний курс</strong>
          <span className="lessons-home-course-name"><span className="lessons-home-course-icon"><LessonsIcon size={18} aria-hidden="true" /></span>{level ? LESSON_LEVEL_META[level].title : "Оберіть курс"}</span>
          <Progress value={levelPercent} aria-label="Прогрес поточного курсу" />
          <small>{level ? `${levelDone} із ${lessons.length} уроків пройдено` : "Курс ще не обрано"}</small>
          <button type="button" onClick={onOpenLevels}><Repeat2 size={18} aria-hidden="true" /> Змінити курс</button>
        </div>
      </aside>

      <div className="lessons-home-main">
        {section === "overview" ? <>
        <article className="lessons-home-feature">
          <div className="lessons-home-feature-body">
            <span className="lessons-home-feature-icon"><LessonsIcon size={28} aria-hidden="true" /></span>
            <div className="lessons-home-feature-copy">
              <span className="lessons-home-eyebrow">{next ? action === "repeat" ? "Повторити матеріал" : "Наступний урок" : "Почати навчання"}</span>
              <h2>{next?.title || "Оберіть свій рівень"}</h2>
              <p>{next?.shortDescription || "Оберіть курс, щоб побачити уроки вашого рівня."}</p>
              {next ? <span className="lessons-home-facts">Урок {next.id} · {next.durationMinutes} хв · {next.xp} XP{getLessonEntryStep(next, progress) > 0 ? ` · крок ${getLessonEntryStep(next, progress) + 1} із ${next.steps.length}` : ""}</span> : null}
            </div>
            <div className="lessons-home-feature-actions">
              <button type="button" className="lessons-home-primary" onClick={() => next ? onStartLesson(next) : onOpenLevels()}><Play size={18} fill="currentColor" aria-hidden="true" /> {next ? `${actionLabel[action]} урок` : "Обрати рівень"}</button>
              {next ? <button type="button" className="lessons-home-secondary" aria-pressed={favorites.includes(next.id)} onClick={() => toggleFavorite(next.id)}><Heart size={20} fill={favorites.includes(next.id) ? "currentColor" : "none"} aria-hidden="true" /> {favorites.includes(next.id) ? "В улюблених" : "Улюблені"}</button> : null}
              <details className="lessons-home-more"><summary aria-label="Додаткові дії з уроком"><MoreHorizontal size={22} aria-hidden="true" /></summary><div><button type="button" onClick={onOpenCatalog}>Всі уроки</button><button type="button" aria-label="Вибрати інший курс" onClick={onOpenLevels}>Змінити курс</button><button type="button" aria-label="Показати улюблені уроки" onClick={() => setSection("favorites")}>Улюблені</button></div></details>
            </div>
          </div>
          <div className="lessons-home-hero-board" role="img" aria-label={`Попередній перегляд: ${previewLesson.title}`}><LessonPreview lesson={previewLesson} size={264} /></div>
        </article>

        <section className="lessons-home-path" aria-labelledby="lessons-path-title">
          <div className="lessons-home-section-heading"><h2 id="lessons-path-title">Ваш навчальний шлях</h2><span>3 рівні · {LESSON_LEVELS.length} уроків</span></div>
          <div className="lessons-home-levels">
            {LEVEL_ORDER.map((item, index) => {
              const group = getLevelLessons(item);
              const done = group.filter(lesson => completed.has(lesson.id)).length;
              return <button type="button" key={item} onClick={() => onChooseLevel(item)} aria-label={`Обрати рівень ${LESSON_LEVEL_META[item].title}`}>
                <span className={`lessons-home-level-icon ${done === group.length ? "is-complete" : ""}`}>{done === group.length ? <Check size={14} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}</span>
                <span className="lessons-home-level-number">{index + 1}</span>
                <span className="lessons-home-level-arrow"><ChevronRight size={21} aria-hidden="true" /></span>
                <strong>{LESSON_LEVEL_META[item].title}</strong>
                <small>{done} із {group.length} уроків</small>
                <Progress value={Math.round(done / group.length * 100)} aria-label={`Прогрес рівня ${LESSON_LEVEL_META[item].title}`} />
              </button>;
            })}
          </div>
        </section>

        {level ? <section className="lessons-home-recommendations" aria-labelledby="lessons-recommendations-title">
          <div className="lessons-home-section-heading"><h2 id="lessons-recommendations-title">Уроки вашого рівня</h2><button type="button" onClick={onOpenCatalog}>Дивитися всі <ArrowRight size={16} aria-hidden="true" /></button></div>
          <div className="lessons-home-suggestions">
            {suggestions.map(lesson => {
              const unlocked = isLessonUnlocked(lesson, progress.completedLessonIds);
              const lessonAction = getLessonAction(lesson, progress);
              return <button type="button" key={lesson.id} className={`lessons-home-suggestion ${next?.id === lesson.id ? "is-next" : ""}`} disabled={!unlocked} onClick={() => onStartLesson(lesson)} aria-label={`${actionLabel[lessonAction]} урок ${lesson.id}: ${lesson.title}`}>
                <span className="lessons-home-suggestion-preview" aria-hidden="true"><LessonPreview lesson={lesson} size={100} /></span>
                <span className="lessons-home-suggestion-copy"><span>Урок {lesson.id}</span><strong>{lesson.title}</strong><span className="lessons-home-suggestion-description">{lesson.shortDescription}</span><small><Clock3 size={15} aria-hidden="true" /> {lesson.durationMinutes} хв <BarChart3 size={15} aria-hidden="true" /> {lesson.xp} XP</small></span>
                <span className={`lessons-home-suggestion-action ${unlocked ? "is-unlocked" : ""}`}>{unlocked ? <Play size={15} fill="currentColor" aria-hidden="true" /> : <LockKeyhole size={16} aria-hidden="true" />}</span>
              </button>;
            })}
          </div>
        </section> : null}
        </> : <section className="lessons-home-directory" aria-live="polite">
          <div className="lessons-home-section-heading"><h2>{section === "topics" ? "Теми уроків" : section === "series" ? "Серії уроків" : "Улюблені уроки"}</h2><button type="button" onClick={() => setSection("overview")}>До огляду <ArrowRight size={18} aria-hidden="true" /></button></div>
          <div className="lessons-home-directory-list">
            {section === "topics" ? [...new Set(LESSON_LEVELS.map(lesson => lesson.topic))].map(topic => {
              const group = LESSON_LEVELS.filter(lesson => lesson.topic === topic);
              return <DirectoryGroup key={topic} title={topic} detail={`${group.length} уроків`} lessons={group} completed={completed} progress={progress} onStartLesson={onStartLesson} />;
            }) : null}
            {section === "series" ? Array.from({ length: Math.ceil(LESSON_LEVELS.length / 5) }, (_, index) => {
              const group = LESSON_LEVELS.slice(index * 5, index * 5 + 5);
              return <DirectoryGroup key={group[0].id} title={`Уроки ${group[0].id}–${group[group.length - 1].id}`} detail={`${group.filter(lesson => completed.has(lesson.id)).length} із ${group.length} пройдено`} lessons={group} completed={completed} progress={progress} onStartLesson={onStartLesson} />;
            }) : null}
            {section === "favorites" ? favorites.map(id => {
              const lesson = LESSON_LEVELS.find(item => item.id === id)!;
              const unlocked = isLessonUnlocked(lesson, progress.completedLessonIds);
              return <button type="button" key={id} disabled={!unlocked} onClick={() => onStartLesson(lesson)}><Heart size={21} aria-hidden="true" /><strong>{lesson.title}</strong><span>Урок {id} · {LESSON_LEVEL_META[lesson.level].title}</span>{unlocked ? <ChevronRight size={19} aria-hidden="true" /> : <LockKeyhole size={17} aria-hidden="true" />}</button>;
            }) : null}
            {section === "favorites" && favorites.length === 0 ? <p>Тут з’являться уроки, які ви додасте до улюблених.</p> : null}
          </div>
        </section>}
      </div>

      <aside className="lessons-home-summary" aria-label="Прогрес навчання">
        <h2>Ваш прогрес</h2>
        <div className="lessons-home-overall"><div className="lessons-home-donut" style={{ "--lessons-percent": `${totalPercent}%` } as CSSProperties}><strong>{totalPercent}%</strong></div><p><strong>{totalDone} / {LESSON_LEVELS.length}</strong><span>уроків пройдено</span></p></div>
        <div className="lessons-home-stats">
          <span><Check size={22} aria-hidden="true" /><strong>{totalDone}</strong><small>уроків</small></span>
          <span><Zap size={22} aria-hidden="true" /><strong>{progress.xp}</strong><small>XP</small></span>
          <span><Flame size={22} aria-hidden="true" /><strong>{progress.streakDates.length}</strong><small>днів занять</small></span>
        </div>
        <div className="lessons-home-meter"><div><strong>Весь курс</strong><span>{totalDone} / {LESSON_LEVELS.length} · {totalPercent}%</span></div><Progress value={totalPercent} aria-label="Прогрес усього курсу" /></div>
        {level ? <div className="lessons-home-meter"><div><strong>{LESSON_LEVEL_META[level].title}</strong><span>{levelDone} / {lessons.length} · {levelPercent}%</span></div><Progress value={levelPercent} aria-label="Прогрес вибраного рівня" /></div> : null}
        <button type="button" onClick={onOpenCatalog}><Trophy size={20} aria-hidden="true" /> Відкрити каталог <ArrowRight size={20} aria-hidden="true" /></button>
      </aside>
    </div>
  </section>;
}
