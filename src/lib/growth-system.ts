export type GrowthMoveClassification =
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export type NotebookStatus = "new" | "practiced" | "fixed";
export type TrainingPlanCategory = "tactics" | "opening" | "endgame" | "king-safety" | "review";
export type CoachHelpLevel = "light" | "balanced" | "deep";
export type CoachExplanationStyle = "short" | "balanced" | "detailed";

export type ReviewedMove = {
  id: string;
  ply: number;
  moveNumber: number;
  color: "w" | "b";
  san: string;
  fenBefore: string;
  fenAfter: string;
  classification: GrowthMoveClassification | null;
  evalLoss: number | null;
  engineEval: number | null;
  bestMoveSan: string | null;
  explanation: string;
};

export type ReviewSession = {
  id: string;
  createdAt: string;
  title: string;
  source: string;
  openingName: string;
  eco: string;
  result: string;
  accuracy: number;
  acpl: number;
  counts: Record<GrowthMoveClassification, number>;
  reviewedMoves: ReviewedMove[];
  keyMomentIds: string[];
  pgnPreview: string;
};

export type MistakeNotebookEntry = {
  id: string;
  reviewId: string;
  moveId: string;
  createdAt: string;
  updatedAt: string;
  moveNumber: number;
  color: "w" | "b";
  san: string;
  classification: Extract<GrowthMoveClassification, "inaccuracy" | "mistake" | "blunder">;
  fenBefore: string;
  fenAfter: string;
  bestMoveSan: string | null;
  explanation: string;
  openingName: string;
  status: NotebookStatus;
  tags: TrainingPlanCategory[];
};

export type TrainingPlanItem = {
  id: string;
  createdAt: string;
  title: string;
  category: TrainingPlanCategory;
  priority: "high" | "medium" | "low";
  description: string;
  target: string;
  completed: boolean;
  sourceIds: string[];
};

export type AchievementProgress = {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unlocked: boolean;
  updatedAt: string;
};

export type CoachProfile = {
  name: string;
  helpLevel: CoachHelpLevel;
  explanationStyle: CoachExplanationStyle;
  language: "en" | "uk";
  focus: TrainingPlanCategory;
};

export type ThemeUnlock = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  reason: string;
};

export type OpeningTrainerProgress = {
  openingName: string;
  lineName: string;
  attempts: number;
  completed: number;
  mistakes: number;
  lastPracticedAt: string;
};

export type StudyRoom = {
  id: string;
  title: string;
  createdAt: string;
  pgnPreview: string;
  commentCount: number;
  status: "draft" | "shared";
};

export type GrowthState = {
  version: 1;
  reviewSessions: ReviewSession[];
  mistakeNotebook: MistakeNotebookEntry[];
  trainingPlan: TrainingPlanItem[];
  achievements: AchievementProgress[];
  coachProfile: CoachProfile;
  themeUnlocks: ThemeUnlock[];
  openingProgress: OpeningTrainerProgress[];
  studyRooms: StudyRoom[];
};

export type ReviewSessionInput = Omit<ReviewSession, "id" | "createdAt" | "keyMomentIds">;

const STORAGE_KEY = "chessmaster.training.v1";

const DEFAULT_COACH_PROFILE: CoachProfile = {
  name: "Coach AI",
  helpLevel: "balanced",
  explanationStyle: "balanced",
  language: "en",
  focus: "review",
};

const DEFAULT_THEMES: ThemeUnlock[] = [
  {
    id: "analysis-cinematic-blue",
    name: "Cinematic Analysis",
    description: "Unlocked from the professional analysis workspace.",
    unlocked: true,
    reason: "Default analysis board theme",
  },
  {
    id: "mistake-lab",
    name: "Mistake Lab",
    description: "A focused dark board for repairing tactical errors.",
    unlocked: false,
    reason: "Fix 5 notebook mistakes",
  },
  {
    id: "opening-map",
    name: "Opening Map",
    description: "A clean blue-green study board for opening drills.",
    unlocked: false,
    reason: "Complete 5 opening drills",
  },
];

function makeEmptyState(): GrowthState {
  return {
    version: 1,
    reviewSessions: [],
    mistakeNotebook: [],
    trainingPlan: [],
    achievements: [],
    coachProfile: DEFAULT_COACH_PROFILE,
    themeUnlocks: DEFAULT_THEMES,
    openingProgress: [],
    studyRooms: [],
  };
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeState(value: Partial<GrowthState> | null | undefined): GrowthState {
  const base = makeEmptyState();
  if (!value) {
    return withDerivedGrowth(base);
  }

  return withDerivedGrowth({
    version: 1,
    reviewSessions: safeArray<ReviewSession>(value.reviewSessions).slice(0, 30),
    mistakeNotebook: safeArray<MistakeNotebookEntry>(value.mistakeNotebook).slice(0, 120),
    trainingPlan: safeArray<TrainingPlanItem>(value.trainingPlan).slice(0, 12),
    achievements: safeArray<AchievementProgress>(value.achievements),
    coachProfile: { ...DEFAULT_COACH_PROFILE, ...(value.coachProfile || {}) },
    themeUnlocks: mergeThemeUnlocks(value.themeUnlocks),
    openingProgress: safeArray<OpeningTrainerProgress>(value.openingProgress).slice(0, 80),
    studyRooms: safeArray<StudyRoom>(value.studyRooms).slice(0, 16),
  });
}

export function readGrowthState(): GrowthState {
  if (typeof window === "undefined") {
    return makeEmptyState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeState(raw ? JSON.parse(raw) : null);
  } catch {
    return makeEmptyState();
  }
}

export function writeGrowthState(state: GrowthState): GrowthState {
  const next = normalizeState(state);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function updateCoachProfile(patch: Partial<CoachProfile>): GrowthState {
  const state = readGrowthState();
  return writeGrowthState({
    ...state,
    coachProfile: {
      ...state.coachProfile,
      ...patch,
    },
  });
}

export function recordOpeningDrill(openingName: string, lineName: string, success: boolean): GrowthState {
  const state = readGrowthState();
  const now = new Date().toISOString();
  const key = `${openingName}::${lineName || "Main line"}`;
  const nextProgress = [...state.openingProgress];
  const existingIndex = nextProgress.findIndex((item) => `${item.openingName}::${item.lineName}` === key);
  const existing =
    existingIndex >= 0
      ? nextProgress[existingIndex]
      : {
          openingName,
          lineName: lineName || "Main line",
          attempts: 0,
          completed: 0,
          mistakes: 0,
          lastPracticedAt: now,
        };

  const updated: OpeningTrainerProgress = {
    ...existing,
    attempts: existing.attempts + 1,
    completed: existing.completed + (success ? 1 : 0),
    mistakes: existing.mistakes + (success ? 0 : 1),
    lastPracticedAt: now,
  };

  if (existingIndex >= 0) {
    nextProgress[existingIndex] = updated;
  } else {
    nextProgress.unshift(updated);
  }

  return writeGrowthState({
    ...state,
    openingProgress: nextProgress,
  });
}

export function markNotebookEntryStatus(entryId: string, status: NotebookStatus): GrowthState {
  const now = new Date().toISOString();
  const state = readGrowthState();
  return writeGrowthState({
    ...state,
    mistakeNotebook: state.mistakeNotebook.map((entry) =>
      entry.id === entryId ? { ...entry, status, updatedAt: now } : entry,
    ),
  });
}

export function recordGameReview(input: ReviewSessionInput): GrowthState {
  const now = new Date().toISOString();
  const reviewId = `review-${now}-${simpleHash(`${input.title}|${input.pgnPreview}|${input.accuracy}`)}`;
  const reviewedMoves = input.reviewedMoves.filter((move) => move.classification);
  const keyMomentIds = reviewedMoves
    .filter((move) =>
      move.classification === "blunder" ||
      move.classification === "mistake" ||
      move.classification === "inaccuracy" ||
      move.classification === "best",
    )
    .slice(0, 12)
    .map((move) => move.id);

  const session: ReviewSession = {
    ...input,
    id: reviewId,
    createdAt: now,
    reviewedMoves,
    keyMomentIds,
  };

  const state = readGrowthState();
  const nextNotebook = [...state.mistakeNotebook];

  reviewedMoves
    .filter(
      (move): move is ReviewedMove & {
        classification: Extract<GrowthMoveClassification, "inaccuracy" | "mistake" | "blunder">;
      } =>
        move.classification === "inaccuracy" ||
        move.classification === "mistake" ||
        move.classification === "blunder",
    )
    .forEach((move) => {
      const id = `mistake-${simpleHash(`${move.fenBefore}|${move.san}|${move.classification}`)}`;
      const existingIndex = nextNotebook.findIndex((entry) => entry.id === id);
      const entry: MistakeNotebookEntry = {
        id,
        reviewId,
        moveId: move.id,
        createdAt: existingIndex >= 0 ? nextNotebook[existingIndex].createdAt : now,
        updatedAt: now,
        moveNumber: move.moveNumber,
        color: move.color,
        san: move.san,
        classification: move.classification,
        fenBefore: move.fenBefore,
        fenAfter: move.fenAfter,
        bestMoveSan: move.bestMoveSan,
        explanation: move.explanation || "Review this move and compare it with the engine line.",
        openingName: input.openingName || "Unknown opening",
        status: existingIndex >= 0 ? nextNotebook[existingIndex].status : "new",
        tags: classifyMistakeTags(move, input.openingName),
      };

      if (existingIndex >= 0) {
        nextNotebook[existingIndex] = entry;
      } else {
        nextNotebook.unshift(entry);
      }
    });

  return writeGrowthState({
    ...state,
    reviewSessions: [session, ...state.reviewSessions.filter((item) => item.id !== reviewId)].slice(0, 30),
    mistakeNotebook: nextNotebook.slice(0, 120),
    studyRooms: ensureStudyRoomDraft(state.studyRooms, session),
  });
}

export function buildGrowthSummary(state: GrowthState) {
  const openMistakes = state.mistakeNotebook.filter((entry) => entry.status !== "fixed");
  const fixedMistakes = state.mistakeNotebook.filter((entry) => entry.status === "fixed");
  const completedOpeningDrills = state.openingProgress.reduce((sum, item) => sum + item.completed, 0);
  const bestAccuracy = state.reviewSessions.reduce((best, session) => Math.max(best, session.accuracy), 0);

  return {
    reviewCount: state.reviewSessions.length,
    openMistakeCount: openMistakes.length,
    fixedMistakeCount: fixedMistakes.length,
    completedOpeningDrills,
    bestAccuracy,
    nextTask: state.trainingPlan.find((item) => !item.completed) || null,
  };
}

function withDerivedGrowth(state: GrowthState): GrowthState {
  const trainingPlan = deriveTrainingPlan(state);
  const achievements = deriveAchievements({ ...state, trainingPlan });
  const themeUnlocks = deriveThemeUnlocks({ ...state, trainingPlan, achievements });
  return {
    ...state,
    trainingPlan,
    achievements,
    themeUnlocks,
  };
}

function deriveTrainingPlan(state: GrowthState): TrainingPlanItem[] {
  const now = new Date().toISOString();
  const openMistakes = state.mistakeNotebook.filter((entry) => entry.status !== "fixed");
  const blunders = openMistakes.filter((entry) => entry.classification === "blunder");
  const openingMistakes = openMistakes.filter((entry) => entry.tags.includes("opening"));
  const kingMistakes = openMistakes.filter((entry) => entry.tags.includes("king-safety"));
  const endgameMistakes = openMistakes.filter((entry) => entry.tags.includes("endgame"));
  const plan: TrainingPlanItem[] = [];

  if (blunders.length > 0) {
    plan.push({
      id: "plan-blunder-repair",
      createdAt: now,
      title: "Repair critical blunders",
      category: "tactics",
      priority: "high",
      description: `Review ${Math.min(3, blunders.length)} forcing mistakes and replay the better move.`,
      target: "Fix the highest-value blunder first",
      completed: false,
      sourceIds: blunders.slice(0, 5).map((entry) => entry.id),
    });
  }

  if (openingMistakes.length > 0) {
    plan.push({
      id: "plan-opening-cleanup",
      createdAt: now,
      title: "Clean up opening decisions",
      category: "opening",
      priority: "medium",
      description: "Drill the line where your early move left theory or lost tempo.",
      target: openingMistakes[0].openingName,
      completed: false,
      sourceIds: openingMistakes.slice(0, 5).map((entry) => entry.id),
    });
  }

  if (kingMistakes.length > 0) {
    plan.push({
      id: "plan-king-safety",
      createdAt: now,
      title: "King safety check",
      category: "king-safety",
      priority: "high",
      description: "Replay positions where checks, mate threats, or unsafe king moves appeared.",
      target: "Keep king safe before attacking",
      completed: false,
      sourceIds: kingMistakes.slice(0, 5).map((entry) => entry.id),
    });
  }

  if (endgameMistakes.length > 0) {
    plan.push({
      id: "plan-endgame-focus",
      createdAt: now,
      title: "Endgame technique",
      category: "endgame",
      priority: "medium",
      description: "Review late-game inaccuracies and compare them with the engine plan.",
      target: "Convert small advantages cleanly",
      completed: false,
      sourceIds: endgameMistakes.slice(0, 5).map((entry) => entry.id),
    });
  }

  plan.push({
    id: "plan-next-review",
    createdAt: now,
    title: state.reviewSessions.length > 0 ? "Review one key moment" : "Run your first Game Review",
    category: "review",
    priority: state.reviewSessions.length > 0 ? "low" : "high",
    description:
      state.reviewSessions.length > 0
        ? "Open the latest review and jump through key moments until the best move is clear."
        : "Import a PGN in Analysis and create your first complete review.",
    target: "Build a review habit",
    completed: false,
    sourceIds: state.reviewSessions.slice(0, 1).map((session) => session.id),
  });

  return plan.slice(0, 5);
}

function deriveAchievements(state: GrowthState): AchievementProgress[] {
  const now = new Date().toISOString();
  const summary = buildRawSummary(state);
  const achievements: Array<Omit<AchievementProgress, "updatedAt">> = [
    {
      id: "review-first-game",
      title: "First Game Review",
      description: "Run a complete review from the Analysis tab.",
      progress: Math.min(summary.reviewCount, 1),
      target: 1,
      unlocked: summary.reviewCount >= 1,
    },
    {
      id: "review-10-games",
      title: "Review 10 games",
      description: "Build a real analysis routine.",
      progress: Math.min(summary.reviewCount, 10),
      target: 10,
      unlocked: summary.reviewCount >= 10,
    },
    {
      id: "fix-5-mistakes",
      title: "Fix 5 mistakes",
      description: "Move notebook errors from new to fixed.",
      progress: Math.min(summary.fixedMistakeCount, 5),
      target: 5,
      unlocked: summary.fixedMistakeCount >= 5,
    },
    {
      id: "opening-5-drills",
      title: "Opening trainee",
      description: "Complete five opening trainer drills.",
      progress: Math.min(summary.completedOpeningDrills, 5),
      target: 5,
      unlocked: summary.completedOpeningDrills >= 5,
    },
    {
      id: "accuracy-80",
      title: "80% accuracy",
      description: "Score 80 accuracy or higher in any reviewed game.",
      progress: Math.min(summary.bestAccuracy, 80),
      target: 80,
      unlocked: summary.bestAccuracy >= 80,
    },
  ];

  return achievements.map((achievement) => ({
    ...achievement,
    updatedAt: now,
  }));
}

function deriveThemeUnlocks(state: GrowthState): ThemeUnlock[] {
  const summary = buildRawSummary(state);
  return mergeThemeUnlocks(state.themeUnlocks).map((theme) => {
    if (theme.id === "mistake-lab") {
      return { ...theme, unlocked: theme.unlocked || summary.fixedMistakeCount >= 5 };
    }

    if (theme.id === "opening-map") {
      return { ...theme, unlocked: theme.unlocked || summary.completedOpeningDrills >= 5 };
    }

    return theme;
  });
}

function mergeThemeUnlocks(value: unknown): ThemeUnlock[] {
  const existing = safeArray<ThemeUnlock>(value);
  return DEFAULT_THEMES.map((theme) => {
    const saved = existing.find((item) => item.id === theme.id);
    return saved ? { ...theme, ...saved } : theme;
  });
}

function ensureStudyRoomDraft(rooms: StudyRoom[], session: ReviewSession): StudyRoom[] {
  const draft: StudyRoom = {
    id: `study-${session.id}`,
    title: `${session.title} study room`,
    createdAt: session.createdAt,
    pgnPreview: session.pgnPreview,
    commentCount: session.keyMomentIds.length,
    status: "draft",
  };

  return [draft, ...rooms.filter((room) => room.id !== draft.id)].slice(0, 16);
}

function classifyMistakeTags(move: ReviewedMove, openingName: string): TrainingPlanCategory[] {
  const tags = new Set<TrainingPlanCategory>(["tactics"]);
  const text = `${move.san} ${move.explanation} ${move.bestMoveSan || ""}`.toLowerCase();

  if (move.ply <= 16 || openingName) {
    tags.add("opening");
  }

  if (move.moveNumber >= 35) {
    tags.add("endgame");
  }

  if (/king|check|mate|castle|m#|#/.test(text)) {
    tags.add("king-safety");
  }

  return [...tags];
}

function buildRawSummary(state: GrowthState) {
  return {
    reviewCount: state.reviewSessions.length,
    fixedMistakeCount: state.mistakeNotebook.filter((entry) => entry.status === "fixed").length,
    completedOpeningDrills: state.openingProgress.reduce((sum, item) => sum + item.completed, 0),
    bestAccuracy: state.reviewSessions.reduce((best, session) => Math.max(best, session.accuracy), 0),
  };
}

function simpleHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}
