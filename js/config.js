
/* ==========================================
   ALLCOACH — APP CONFIGURATION
   Version: 0.1.0
   ========================================== */

export const APP_CONFIG = Object.freeze({
  name: "AllCoach",
  version: "0.1.0",
  storageKey: "allcoach-app-v1",
  defaultRoute: "today"
});

/* ---------- Navigation ---------- */

export const ROUTES = Object.freeze({
  today: {
    title: "Heute",
    eyebrow: "DEIN LEISTUNGSZENTRUM"
  },

  training: {
    title: "Training",
    eyebrow: "BESSER WERDEN. JEDEN TAG."
  },

  analysis: {
    title: "Analyse",
    eyebrow: "VERSTEHE DEIN SPIEL"
  },

  coach: {
    title: "Coach-KI",
    eyebrow: "DEIN DIGITALER COACH"
  },

  development: {
    title: "Entwicklung",
    eyebrow: "DEIN FORTSCHRITT"
  },

  profile: {
    title: "Spielerprofil",
    eyebrow: "DEIN SPIELERPROFIL"
  }
});

/* ---------- Standard-Spielerprofil ---------- */

export const DEFAULT_STATE = Object.freeze({
  profile: {
    name: "Yosief",
    position: "Außenverteidiger",
    club: "SG Bad Soden",
    season: "2026/27",
    mainGoal: "Mein Spiel verbessern",
    preferredFoot: "Rechts",
    trainingDays: 3
  },

  goals: [
    {
      id: "crossing",
      title: "Flanken verbessern",
      category: "Technik",
      progress: 20
    },
    {
      id: "duels",
      title: "Zweikämpfe gewinnen",
      category: "Defensive",
      progress: 25
    },
    {
      id: "decisions",
      title: "Schneller entscheiden",
      category: "Spielverständnis",
      progress: 15
    }
  ],

  completedSessions: 0,
  lastCompletedDate: "",
  lastReflection: "",

  ratings: {
    technique: 5,
    tactics: 5,
    fitness: 5,
    decisions: 5
  },

  chatHistory: [
    {
      role: "coach",
      text: "Hey Yosief! Ich bin dein AllCoach. Was möchtest du heute verbessern?"
    }
  ]
});

/* ---------- App-Konstanten ---------- */

export const STORAGE_VERSION = 1;

export const LIMITS = Object.freeze({
  maxChatCharacters: 1000,
  maxChatMessages: 30,
  maxGoalProgress: 100,
  minRating: 1,
  maxRating: 10
});

/* ---------- Navigation-Hilfsfunktion ---------- */

export function isValidRoute(route) {
  return Object.prototype.hasOwnProperty.call(ROUTES, route);
}

/* ---------- Standarddaten erstellen ---------- */

export function createDefaultState() {
  // Neue Objekte erzeugen, damit Änderungen an den
  // App-Daten nicht das ursprüngliche Profil verändern.
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}
