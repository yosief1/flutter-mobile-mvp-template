
/* ==========================================
   ALLCOACH — STORAGE MODULE
   Version: 0.1.0
   Speichern und Laden lokaler App-Daten
   ========================================== */

import {
  APP_CONFIG,
  createDefaultState
} from "./config.js";

/**
 * Prüft, ob ein Wert ein gewöhnliches Objekt ist.
 */
function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Begrenzt eine Zahl auf einen gültigen Bereich.
 */
function clampNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
}

/**
 * Liefert den lokalen Speicher.
 * Kann in manchen Browsern gesperrt sein.
 */
function getStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn(
      "AllCoach: Der lokale Speicher ist nicht verfügbar.",
      error
    );

    return null;
  }
}

/**
 * Bereinigt einzelne Chat-Nachrichten.
 */
function sanitizeChatHistory(value, defaults) {
  if (!Array.isArray(value)) {
    return defaults;
  }

  const messages = value
    .filter(
      item =>
        isObject(item) &&
        (item.role === "user" || item.role === "coach") &&
        typeof item.text === "string"
    )
    .slice(-30)
    .map(item => ({
      role: item.role,
      text: item.text.slice(0, 1000)
    }));

  return messages.length > 0 ? messages : defaults;
}

/**
 * Bereinigt Entwicklungsziele.
 */
function sanitizeGoals(value, defaults) {
  if (!Array.isArray(value)) {
    return defaults;
  }

  const validGoals = value
    .filter(
      goal =>
        isObject(goal) &&
        typeof goal.id === "string" &&
        typeof goal.title === "string"
    )
    .slice(0, 30)
    .map(goal => ({
      id: goal.id.slice(0, 80),
      title: goal.title.slice(0, 120),
      category:
        typeof goal.category === "string"
          ? goal.category.slice(0, 80)
          : "Allgemein",
      progress: clampNumber(
        goal.progress,
        0,
        100,
        0
      )
    }));

  return validGoals;
}

/**
 * Bringt gespeicherte Daten in eine gültige Grundform.
 *
 * Neue Felder aus der Standardkonfiguration werden
 * automatisch ergänzt, wenn ältere Daten sie nicht haben.
 */
export function normalizeState(savedState) {
  const defaults = createDefaultState();

  if (!isObject(savedState)) {
    return defaults;
  }

  const savedProfile = isObject(savedState.profile)
    ? savedState.profile
    : {};

  const savedRatings = isObject(savedState.ratings)
    ? savedState.ratings
    : {};

  const ratings = {};

  for (const key of Object.keys(defaults.ratings)) {
    ratings[key] = clampNumber(
      savedRatings[key],
      1,
      10,
      defaults.ratings[key]
    );
  }

  const profile = {
    ...defaults.profile,
    ...savedProfile
  };

  for (const key of [
    "name",
    "position",
    "club",
    "season",
    "mainGoal",
    "preferredFoot"
  ]) {
    if (typeof profile[key] !== "string") {
      profile[key] = defaults.profile[key];
    }

    profile[key] = profile[key].slice(0, 120);
  }

  profile.trainingDays = clampNumber(
    profile.trainingDays,
    1,
    7,
    defaults.profile.trainingDays
  );

  return {
    ...defaults,
    ...savedState,

    profile,
    ratings,

    goals: sanitizeGoals(
      savedState.goals,
      defaults.goals
    ),

    chatHistory: sanitizeChatHistory(
      savedState.chatHistory,
      defaults.chatHistory
    ),

    completedSessions: clampNumber(
      savedState.completedSessions,
      0,
      100000,
      0
    ),

    lastReflection:
      typeof savedState.lastReflection === "string"
        ? savedState.lastReflection.slice(0, 2000)
        : "",

    lastCompletedDate:
      typeof savedState.lastCompletedDate === "string"
        ? savedState.lastCompletedDate.slice(0, 100)
        : ""
  };
}

/**
 * Lädt App-Daten aus localStorage.
 *
 * Gibt bei fehlenden oder ungültigen Daten
 * einen frischen Standardzustand zurück.
 */
export function loadState() {
  const storage = getStorage();

  if (!storage) {
    return createDefaultState();
  }

  try {
    const raw = storage.getItem(APP_CONFIG.storageKey);

    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw);

    return normalizeState(parsed);
  } catch (error) {
    console.warn(
      "AllCoach: Gespeicherte Daten konnten nicht geladen werden.",
      error
    );

    return createDefaultState();
  }
}

/**
 * Speichert den aktuellen App-Zustand.
 *
 * Rückgabe:
 * true  = Speichern erfolgreich
 * false = Speichern fehlgeschlagen
 */
export function saveState(state) {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    const normalized = normalizeState(state);

    storage.setItem(
      APP_CONFIG.storageKey,
      JSON.stringify(normalized)
    );

    return true;
  } catch (error) {
    console.error(
      "AllCoach: Daten konnten nicht gespeichert werden.",
      error
    );

    return false;
  }
}

/**
 * Löscht ausschließlich den AllCoach-Speichereintrag.
 * Andere Webseiten-Daten bleiben unangetastet.
 */
export function clearState() {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(APP_CONFIG.storageKey);
    return true;
  } catch (error) {
    console.error(
      "AllCoach: Daten konnten nicht gelöscht werden.",
      error
    );

    return false;
  }
}

/**
 * Prüft, ob bereits App-Daten gespeichert sind.
 */
export function hasSavedState() {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    return storage.getItem(APP_CONFIG.storageKey) !== null;
  } catch (error) {
    console.warn(
      "AllCoach: Speicherstatus konnte nicht geprüft werden.",
      error
    );

    return false;
  }
}
