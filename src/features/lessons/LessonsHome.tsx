import { Progress } from "@/components/ui/progress";
import { LessonsIcon } from "@/components/icons/chess";
import { LESSON_LEVEL_META, LESSON_LEVELS, type LessonLevel, type LessonProgressState, type LessonRecord } from "@/data/lesson-levels";
import { firstAvailableLesson, getLessonAction, getLessonEntryStep, getLevelLessons, isLessonUnlocked, LEVEL_ORDER } from "@/features/lessons/model";
import { ArrowRight, BookOpen, Check, Clock3, Flame, GraduationCap, LayoutGrid, Lock, Play, Trophy, Zap } from "lucide-react";

type LessonsHomeProps = {
  progress: LessonProgressState;
  onOpenCatalog: () => void;
  onOpenLevels: () => void;
  onChooseLevel: (level: LessonLevel) => void;
  onStartLesson: (lesson: LessonRecord) => void;
};

const actionLabel = { start: "Почати", continue: "Продовжити", repeat: "Повторити" } as const;

export function LessonsHome({ progress, onOpenCatalog, onOpenLevels, onChooseLevel, onStartLesson }: LessonsHomeProps) {
  const level = progress.selectedLevel;
  const lessons = getLevelLessons(level);
  const completed = new Set(progress.completedLessonIds);
  const levelDone = lessons.filter(lesson => completed.has(lesson.id)).length;
  const next = level ? firstAvailableLesson(level, progress.completedLessonIds) : null;
  const nextIndex = next ? lessons.findIndex(lesson => lesson.id === next.id) : 0;
  const cardStart = Math.min(nextIndex, Math.max(0, lessons.length - 3));
  const suggestions = lessons.slice(cardStart, cardStart + 3);
  const action = next ? getLessonAction(next, progress) : "start";
  const totalDone = LESSON_LEVELS.filter(lesson => completed.has(lesson.id)).length;
  const totalPercent = Math.round(totalDone / LESSON_LEVELS.length * 100);
  const levelPercent = lessons.length ? Math.round(levelDone / lessons.length * 100) : 0;

  return <section className="lessons-home" aria-label="Головне меню уроків">
    <header className="lessons-home-intro">
      <span>НАВЧАННЯ · CHESS OF ODESA</span>
      <h1>Уроки</h1>
      <p>Рухайтеся від основ до складніших позицій у власному темпі.</p>
    </header>

    <div className="lessons-home-grid">
      <aside className="lessons-home-nav" aria-label="Меню навчання">
        <h2>Навчання</h2>
        <span className="lessons-home-current"><LayoutGrid size={18} aria-hidden="true" /> Огляд</span>
        <button type="button" onClick={onOpenCatalog}><BookOpen size={18} aria-hidden="true" /> Усі уроки</button>
        <button type="button" onClick={onOpenLevels}><GraduationCap size={18} aria-hidden="true" /> Рівні курсу</button>
        <div className="lessons-home-nav-course">
          <strong>Поточний курс</strong>
          <span>{level ? LESSON_LEVEL_META[level].title : "Рівень ще не обрано"}</span>
          <small>{level ? `${levelDone} із ${lessons.length} уроків пройдено` : `${LESSON_LEVELS.length} уроків у програмі`}</small>
        </div>
      </aside>

      <main className="lessons-home-main">
        <article className="lessons-home-feature">
          <span className="lessons-home-feature-icon"><LessonsIcon size={28} aria-hidden="true" /></span>
          <div className="lessons-home-feature-copy">
            <span className="lessons-home-eyebrow">{next ? action === "repeat" ? "ПОВТОРИТИ МАТЕРІАЛ" : "НАСТУПНИЙ УРОК" : "ПОЧАТИ НАВЧАННЯ"}</span>
            <h2>{next?.title || "Оберіть свій рівень"}</h2>
            <p>{next?.shortDescription || "Ми покажемо уроки вашого рівня й збережемо прогрес на цьому пристрої."}</p>
            {next ? <span className="lessons-home-facts">Урок {next.id} · {next.durationMinutes} хв · {next.xp} XP{getLessonEntryStep(next, progress) > 0 ? ` · крок ${getLessonEntryStep(next, progress) + 1} із ${next.steps.length}` : ""}</span> : null}
          </div>
          <button type="button" className="lessons-home-primary" onClick={() => next ? onStartLesson(next) : onOpenLevels()}>
            <Play size={16} aria-hidden="true" /> {next ? `${actionLabel[action]} урок` : "Обрати рівень"}
          </button>
        </article>

        <section className="lessons-home-path" aria-labelledby="lessons-path-title">
          <div className="lessons-home-section-heading"><h2 id="lessons-path-title">Ваш навчальний шлях</h2><span>3 рівні · {LESSON_LEVELS.length} уроків</span></div>
          <div className="lessons-home-levels">
            {LEVEL_ORDER.map((item, index) => {
              const group = getLevelLessons(item);
              const done = group.filter(lesson => completed.has(lesson.id)).length;
              return <button type="button" key={item} className={level === item ? "is-selected" : ""} onClick={() => onChooseLevel(item)} aria-label={`Обрати рівень ${LESSON_LEVEL_META[item].title}`} aria-current={level === item ? "step" : undefined}>
                <span className="lessons-home-level-number">{index + 1}</span>
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
              return <article key={lesson.id} className="lessons-home-suggestion">
                <span className="lessons-home-suggestion-icon">{completed.has(lesson.id) ? <Check size={21} aria-hidden="true" /> : unlocked ? <BookOpen size={21} aria-hidden="true" /> : <Lock size={20} aria-hidden="true" />}</span>
                <span className="lessons-home-suggestion-type">{lesson.topic} · урок {lesson.id}</span>
                <h3>{lesson.title}</h3>
                <p>{lesson.shortDescription}</p>
                <small><Clock3 size={14} aria-hidden="true" /> {lesson.durationMinutes} хв <Zap size={14} aria-hidden="true" /> {lesson.xp} XP</small>
                <button type="button" disabled={!unlocked} onClick={() => onStartLesson(lesson)} aria-label={`${actionLabel[lessonAction]} урок ${lesson.id}: ${lesson.title}`}>
                  {unlocked ? actionLabel[lessonAction] : "Відкриється після попереднього"} <ArrowRight size={16} aria-hidden="true" />
                </button>
              </article>;
            })}
          </div>
        </section> : null}
      </main>

      <aside className="lessons-home-summary" aria-label="Прогрес навчання">
        <h2>Ваш прогрес</h2>
        <div className="lessons-home-stats">
          <span><Check size={19} aria-hidden="true" /><strong>{totalDone}</strong><small>уроків</small></span>
          <span><Zap size={19} aria-hidden="true" /><strong>{progress.xp}</strong><small>XP</small></span>
          <span><Flame size={19} aria-hidden="true" /><strong>{progress.streakDates.length}</strong><small>днів занять</small></span>
        </div>
        <div className="lessons-home-meter"><div><strong>Весь курс</strong><span>{totalDone} / {LESSON_LEVELS.length} · {totalPercent}%</span></div><Progress value={totalPercent} /></div>
        {level ? <div className="lessons-home-meter"><div><strong>{LESSON_LEVEL_META[level].title}</strong><span>{levelDone} / {lessons.length} · {levelPercent}%</span></div><Progress value={levelPercent} /></div> : null}
        <div className="lessons-home-summary-note"><Trophy size={21} aria-hidden="true" /><p>{next ? `Далі: урок ${next.id} «${next.title}».` : "Оберіть рівень, щоб побачити наступний урок."}</p></div>
        <button type="button" onClick={onOpenCatalog}>Відкрити каталог <ArrowRight size={17} aria-hidden="true" /></button>
      </aside>
    </div>
  </section>;
}
