import { COURSES, type Course } from "@/lib/courses-data";

export type ProgramLevelId =
  | "starter"
  | "novice"
  | "intermediate"
  | "high"
  | "expert";

export interface AudienceSegment {
  id: string;
  title: string;
  description: string;
  focus: string[];
}

export interface LessonFlowStep {
  id: string;
  title: string;
  description: string;
}

export interface LearningFeature {
  title: string;
  description: string;
  status: "available" | "strengthened";
}

export interface ProgramLevel {
  id: ProgramLevelId;
  title: string;
  subtitle: string;
  description: string;
  ratingLabel: string;
  ageGroups: string[];
  goals: string[];
  assessment: string;
  progressGate: string;
  courseIds: string[];
  color: string;
}

export const AUDIENCE_SEGMENTS: AudienceSegment[] = [
  {
    id: "kids-6-8",
    title: "Діти 6-8 років",
    description: "Перший контакт із шахами через короткі пояснення, візуальні приклади та малі практичні задачі.",
    focus: ["правила гри", "ходи фігур", "увага й пам'ять"],
  },
  {
    id: "kids-9-12",
    title: "Діти 9-12 років",
    description: "Перехід від правил до перших системних тактик, дебютних принципів і аналізу партій.",
    focus: ["тактика", "стратегія", "турнірна база"],
  },
  {
    id: "teens-13-plus",
    title: "Підлітки 13+",
    description: "Поглиблені теми, аналітичне мислення, самостійна робота з прикладами й розборами.",
    focus: ["дебюти", "мітельшпіль", "підготовка до змагань"],
  },
  {
    id: "adults-beginner",
    title: "Дорослі початківці",
    description: "Структурований шлях від базових правил до впевненого розуміння типових планів і помилок.",
    focus: ["базова техніка", "домашня практика", "стабільний прогрес"],
  },
  {
    id: "self-taught",
    title: "Самоучки та досвідчені",
    description: "Систематизація вже набутих знань, закриття прогалин та вихід на вищий рівень гри.",
    focus: ["структура знань", "аналіз партій", "складні кінцівки"],
  },
];

export const LESSON_FLOW: LessonFlowStep[] = [
  {
    id: "intro",
    title: "Вступ",
    description: "Що вивчаємо, для кого урок і який результат має бути наприкінці.",
  },
  {
    id: "theory",
    title: "Теорія",
    description: "Короткі пояснення без перевантаження, розбиті на логічні кроки.",
  },
  {
    id: "diagram",
    title: "Діаграма",
    description: "Інтерактивна позиція з навігацією між прикладами та поясненням ідей.",
  },
  {
    id: "practice",
    title: "Практика",
    description: "Розв'язання позицій, самостійне відтворення плану або пошук найкращого ходу.",
  },
  {
    id: "quiz",
    title: "Вікторина",
    description: "Контрольне питання або тест для перевірки розуміння матеріалу.",
  },
  {
    id: "homework",
    title: "Домашнє завдання",
    description: "Коротка самостійна робота для закріплення уроку між сесіями.",
  },
];

export const LEARNING_FEATURES: LearningFeature[] = [
  {
    title: "Послідовний lesson-flow",
    description: "Кожен урок має єдину структуру: вступ, теорія, діаграма, практика, вікторина і домашнє завдання.",
    status: "available",
  },
  {
    title: "Інтерактивна дошка",
    description: "Учень рухається по прикладах на шахівниці і може досліджувати позиції без виходу зі сторінки.",
    status: "available",
  },
  {
    title: "Контроль переходу",
    description: "Критерії завершення уроку залежать від вікторини, практики та базового self-check.",
    status: "available",
  },
  {
    title: "Адаптація під аудиторії",
    description: "Рівні програми орієнтовані на дітей, підлітків, дорослих початківців та гравців із досвідом.",
    status: "strengthened",
  },
];

export const COURSE_CATEGORY_LABELS: Record<
  NonNullable<Course["category"]>,
  string
> = {
  basics: "Основи",
  openings: "Дебюти",
  tactics: "Тактика",
  strategy: "Стратегія",
  endgame: "Кінцівки",
  attack: "Атакуюча гра",
  psychology: "Психологія",
  master: "Експертний рівень",
};

export const PROGRAM_LEVELS: ProgramLevel[] = [
  {
    id: "starter",
    title: "Початковий",
    subtitle: "Перші кроки і правила",
    description: "Для дітей 6-8 років, дорослих з нуля та всіх, хто хоче спокійно розібратися з фігурами, шахом, матом і базовими принципами.",
    ratingLabel: "0-400",
    ageGroups: ["6-8 років", "дорослі з нуля"],
    goals: [
      "знати правила та координати дошки",
      "розуміти ходи всіх фігур і базові мати",
      "вміти пояснити шах, мат, пат і рокіровку",
    ],
    assessment: "міні-вікторини, розпізнавання полів, базові матові вправи",
    progressGate: "перехід далі після засвоєння правил і успішної самоперевірки по базових темах",
    courseIds: ["basics"],
    color: "from-emerald-500/20 via-green-500/10 to-lime-500/20",
  },
  {
    id: "novice",
    title: "Новачок",
    subtitle: "Початок осмисленої гри",
    description: "Для дітей 9-12 років і гравців, які вже знають правила, але ще не мають системної дебютної та навчальної бази.",
    ratingLabel: "400-800",
    ageGroups: ["9-12 років", "новачки після стартового курсу"],
    goals: [
      "опанувати три принципи дебюту",
      "почати грати осмислені перші ходи без типових помилок",
      "закріпити дисципліну розвитку та безпеки короля",
    ],
    assessment: "короткі тести, оцінка стартових позицій, вправи на вибір правильного плану",
    progressGate: "перехід далі після правильної відповіді на контрольні питання та виконаної практики",
    courseIds: ["opening-principles"],
    color: "from-sky-500/20 via-cyan-500/10 to-blue-500/20",
  },
  {
    id: "intermediate",
    title: "Середній",
    subtitle: "Тактика та перші кінцівки",
    description: "Для підлітків 13+ і гравців, які вже впевнено стартують партію й готові розвивати бачення комбінацій і техніку реалізації переваги.",
    ratingLabel: "800-1200",
    ageGroups: ["13+", "самоучки після базових курсів"],
    goals: [
      "бачити виделки, зв'язки, відкриті напади й пронизування",
      "знати типові кінцівки король+пішак і базові ладейні сценарії",
      "почати стабільно конвертувати перевагу в простих позиціях",
    ],
    assessment: "тактичні задачі, розпізнавання мотивів, контрольні кінцівки",
    progressGate: "мінімум 80% у вікторинах або впевнене проходження практичних позицій",
    courseIds: ["tactics", "endgame"],
    color: "from-violet-500/20 via-purple-500/10 to-fuchsia-500/20",
  },
  {
    id: "high",
    title: "Високий",
    subtitle: "Стратегія, дебюти, атака",
    description: "Для досвідченіших учнів, які хочуть перейти від окремих прийомів до змістовних планів у мітельшпілі, дебютних схем та атакуючої гри.",
    ratingLabel: "1200-1600",
    ageGroups: ["підлітки 13+", "дорослі з турнірними амбіціями"],
    goals: [
      "розуміти стратегічні плани і пішакові структури",
      "орієнтуватися в типових схемах Іспанської та Сицилійської",
      "вміти будувати атаку на короля та доводити ініціативу",
    ],
    assessment: "аналіз позицій, дебютні сценарії, пояснення плану своїми словами",
    progressGate: "успішна самостійна практика й правильне рішення контрольних позицій",
    courseIds: ["strategy", "spanish", "sicilian", "attack"],
    color: "from-amber-500/20 via-orange-500/10 to-rose-500/20",
  },
  {
    id: "expert",
    title: "Експерт",
    subtitle: "Аналітичний і турнірний рівень",
    description: "Для сильніших гравців і самоучок, яким потрібна систематизація стратегічних знань, психології та гросмейстерських ідей.",
    ratingLabel: "1600+",
    ageGroups: ["дорослі з досвідом", "учні, що готуються до турнірів"],
    goals: [
      "опанувати профілактику, метод двох слабкостей і складні структури",
      "керувати турнірним стресом і планом підготовки",
      "працювати з партіями майстрів як із навчальним матеріалом",
    ],
    assessment: "аналітичні питання, пояснення плану, глибші рефлексивні домашні завдання",
    progressGate: "перехід між темами після осмисленого розбору та стабільних результатів у контрольних блоках",
    courseIds: ["psychology", "master"],
    color: "from-red-500/20 via-rose-500/10 to-pink-500/20",
  },
];

export function getProgramLevelById(id: ProgramLevelId): ProgramLevel | undefined {
  return PROGRAM_LEVELS.find((level) => level.id === id);
}

export function getCoursesForProgramLevel(levelId: ProgramLevelId): Course[] {
  const level = getProgramLevelById(levelId);
  if (!level) return [];

  return level.courseIds
    .map((courseId) => COURSES.find((course) => course.id === courseId))
    .filter((course): course is Course => Boolean(course));
}
