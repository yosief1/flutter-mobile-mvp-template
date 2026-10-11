
/* =====================================================
   ALLCOACH — APP CORE
   Version: 0.1.0
   Startpunkt, Navigation, Seiten und lokale Daten
   ===================================================== */

"use strict";

/* ---------- 1. KONFIGURATION ---------- */

const APP_CONFIG = Object.freeze({
  name: "AllCoach",
  version: "0.1.0",
  storageKey: "allcoach-app-v1",
  defaultRoute: "today"
});

const ROUTES = {
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
};

/* ---------- 2. STANDARD-DATEN ---------- */

const DEFAULT_STATE = {
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
};

/* ---------- 3. SPEICHER ---------- */

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function loadState() {
  try {
    const saved = localStorage.getItem(APP_CONFIG.storageKey);

    if (!saved) {
      return cloneDefaults();
    }

    const parsed = JSON.parse(saved);
    const defaults = cloneDefaults();

    return {
      ...defaults,
      ...parsed,
      profile: {
        ...defaults.profile,
        ...(parsed.profile || {})
      },
      ratings: {
        ...defaults.ratings,
        ...(parsed.ratings || {})
      },
      goals: Array.isArray(parsed.goals)
        ? parsed.goals
        : defaults.goals,
      chatHistory: Array.isArray(parsed.chatHistory)
        ? parsed.chatHistory
        : defaults.chatHistory
    };
  } catch (error) {
    console.warn("AllCoach: Daten konnten nicht geladen werden.", error);
    return cloneDefaults();
  }
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(
      APP_CONFIG.storageKey,
      JSON.stringify(state)
    );
    return true;
  } catch (error) {
    console.warn("AllCoach: Speichern fehlgeschlagen.", error);
    showToast("Speichern nicht möglich. Prüfe deinen Browser.");
    return false;
  }
}

/* ---------- 4. HILFSFUNKTIONEN ---------- */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function getInitials(name) {
  const parts = String(name || "Y")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("") || "Y";
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

function getRoute() {
  const route = window.location.hash.replace(/^#\/?/, "");
  return Object.hasOwn(ROUTES, route)
    ? route
    : APP_CONFIG.defaultRoute;
}

function showToast(message) {
  const region = document.getElementById("toast-region");

  if (!region) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  region.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3000);
}

function button(label, action, variant = "primary") {
  return `
    <button class="btn btn-${variant}"
            type="button"
            data-action="${escapeHTML(action)}">
      ${label}
    </button>
  `;
}

function card(title, content, subtitle = "") {
  return `
    <section class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">${title}</h3>
          ${subtitle
            ? `<p class="card-subtitle">${subtitle}</p>`
            : ""}
        </div>
      </div>
      ${content}
    </section>
  `;
}

function progressBar(label, value, max = 10) {
  const safeValue = clamp(value, 0, max);
  const percentage = Math.round((safeValue / max) * 100);

  return `
    <div class="progress-item">
      <div class="progress-meta">
        <span>${escapeHTML(label)}</span>
        <strong>${safeValue}/${max}</strong>
      </div>
      <div class="progress-track"
           role="progressbar"
           aria-label="${escapeHTML(label)}"
           aria-valuemin="0"
           aria-valuemax="${max}"
           aria-valuenow="${safeValue}">
        <div class="progress-fill"
             style="width:${percentage}%"></div>
      </div>
    </div>
  `;
}

/* ---------- 5. SEITE: HEUTE ---------- */

function renderToday() {
  const name = escapeHTML(state.profile.name);
  const sessions = Math.max(0, Number(state.completedSessions) || 0);
  const avgRating = Object.values(state.ratings)
    .reduce((sum, value) => sum + Number(value), 0) /
    Object.keys(state.ratings).length;

  const workoutDone = Boolean(
    state.lastCompletedDate === new Date().toDateString()
  );

  return `
    <div class="page">

      <section class="hero">
        <div class="hero-content">
          <span class="hero-label">
            <span aria-hidden="true">●</span>
            DEIN ENTWICKLUNGSPLAN
          </span>

          <h2>${getGreeting()}, ${name}.</h2>

          <p>
            Kleine Fortschritte, konsequent umgesetzt.
            Konzentriere dich heute auf eine Sache und
            arbeite gezielt an deinem Spiel.
          </p>

          <div class="hero-actions">
            <a href="#/training" class="btn btn-primary">
              Training ansehen →
            </a>

            <a href="#/coach" class="btn btn-secondary">
              Coach fragen
            </a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Deine Übersicht</h2>
          <span class="badge badge-lime">SAISON ${escapeHTML(
            state.profile.season
          )}</span>
        </div>

        <div class="grid grid-3">
          <article class="card stat-card">
            <span class="stat-icon" aria-hidden="true">⚽</span>
            <p class="card-subtitle">Absolvierte Einheiten</p>
            <p class="card-value">${sessions}</p>
            <p class="card-description">Seit App-Start erfasst</p>
          </article>

          <article class="card stat-card">
            <span class="stat-icon" aria-hidden="true">↗</span>
            <p class="card-subtitle">Deine Selbsteinschätzung</p>
            <p class="card-value">${avgRating.toFixed(1)}<span
              style="font-size:15px;color:var(--text-muted)">/10</span></p>
            <p class="card-description">Dein persönlicher Richtwert</p>
          </article>

          <article class="card stat-card">
            <span class="stat-icon" aria-hidden="true">◎</span>
            <p class="card-subtitle">Aktive Entwicklungsziele</p>
            <p class="card-value">${state.goals.length}</p>
            <p class="card-description">Deine aktuellen Schwerpunkte</p>
          </article>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Dein Fokus heute</h2>
          <a href="#/training">Zum Training →</a>
        </div>

        <div class="grid grid-2">
          <article class="card">
            <div class="card-header">
              <div>
                <span class="badge badge-lime">TECHNIK</span>
                <h3 class="card-title" style="margin-top:12px">
                  Flanken nach Bewegung
                </h3>
                <p class="card-subtitle">
                  Kontrollieren, vorbereiten, präzise spielen.
                </p>
              </div>
              <span class="stat-icon" aria-hidden="true">↗</span>
            </div>

            <p class="card-description">
              Arbeite zunächst an einer sauberen Technik.
              Qualität ist wichtiger als eine hohe Anzahl.
            </p>

            <div style="margin-top:20px">
              ${button("Einheit ansehen →", "go-training")}
            </div>
          </article>

          <article class="card">
            <div class="card-header">
              <div>
                <span class="badge">KURZE REFLEXION</span>
                <h3 class="card-title" style="margin-top:12px">
                  Wie fühlst du dich?
                </h3>
                <p class="card-subtitle">
                  Passe dein Training an deinen Tag an.
                </p>
              </div>
            </div>

            <label class="form-label" for="daily-reflection">
              Dein aktueller Eindruck
            </label>

            <textarea
              id="daily-reflection"
              class="textarea"
              placeholder="Zum Beispiel: Beine müde, aber motiviert …"
            >${escapeHTML(state.lastReflection)}</textarea>

            <div style="margin-top:12px">
              ${button("Reflexion speichern", "save-reflection", "secondary")}
            </div>
          </article>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Deine Entwicklungsziele</h2>
          <a href="#/development">Alle Ziele →</a>
        </div>

        <div class="card">
          ${state.goals.map(goal => `
            <div style="margin-bottom:20px">
              ${progressBar(goal.title, goal.progress, 100)}
              <p class="card-subtitle">${escapeHTML(goal.category)}</p>
            </div>
          `).join("")}
        </div>
      </section>

      ${workoutDone ? `
        <div class="badge badge-green">
          ✓ Heutige Trainingseinheit als erledigt markiert
        </div>
      ` : ""}
    </div>
  `;
}

/* ---------- 6. SEITE: TRAINING ---------- */

function renderTraining() {
  const workoutDone = Boolean(
    state.lastCompletedDate === new Date().toDateString()
  );

  const exercises = [
    {
      time: "8 Min.",
      title: "Ballkontrolle und erster Kontakt",
      description: "Beide Füße nutzen, den Ball kontrolliert mitnehmen."
    },
    {
      time: "10 Min.",
      title: "Passen und Freilaufen",
      description: "Nach dem Pass den Kopf heben und eine neue Position suchen."
    },
    {
      time: "10 Min.",
      title: "Flanken in Bewegung",
      description: "Anlaufen, Ball kontrollieren und gezielt in einen freien Raum spielen."
    },
    {
      time: "5 Min.",
      title: "Reflexion und lockeres Auslaufen",
      description: "Belastung ruhig beenden und die Einheit kurz bewerten."
    }
  ];

  return `
    <div class="page">

      <div class="page-heading">
        <div>
          <h2>Dein Trainingsplan</h2>
          <p>Eine flexible Beispiel-Einheit für deinen Außenverteidiger-Alltag.</p>
        </div>
        <span class="badge badge-lime">33 MINUTEN</span>
      </div>

      <section class="hero">
        <div class="hero-content">
          <span class="hero-label">HEUTIGER SCHWERPUNKT</span>
          <h2>Kontrolle. Blick hoch. Gute Entscheidung.</h2>
          <p>
            Passe Umfang und Intensität an deine Tagesform an.
            Vor dem Training aufwärmen und ausreichend trinken.
            Bei Schmerzen die Übung abbrechen.
          </p>

          <div class="hero-actions">
            ${button(
              workoutDone ? "Einheit erledigt ✓" : "Training abschließen",
              "complete-workout",
              workoutDone ? "secondary" : "primary"
            )}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Ablauf der Einheit</h2>
          <span class="badge">4 ABSCHNITTE</span>
        </div>

        <div class="card">
          ${exercises.map((exercise, index) => `
            <div class="training-item">
              <div class="training-time">${exercise.time}</div>
              <div class="training-details">
                <h3>${index + 1}. ${exercise.title}</h3>
                <p>${exercise.description}</p>
              </div>
              <span class="badge">${index + 1}/4</span>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Anpassung an deine Tagesform</h2>
        </div>

        <div class="grid grid-3">
          <article class="card">
            <span class="badge badge-green">FIT</span>
            <h3 class="card-title" style="margin-top:14px">Normaler Tag</h3>
            <p class="card-description">
              Führe die geplanten Übungen technisch sauber durch.
            </p>
          </article>

          <article class="card">
            <span class="badge badge-orange">MÜDE</span>
            <h3 class="card-title" style="margin-top:14px">Weniger Energie</h3>
            <p class="card-description">
              Reduziere Wiederholungen und konzentriere dich auf Kontrolle.
            </p>
          </article>

          <article class="card">
            <span class="badge badge-red">SCHMERZEN</span>
            <h3 class="card-title" style="margin-top:14px">Training stoppen</h3>
            <p class="card-description">
              Trainiere nicht durch Schmerzen hindurch. Sprich mit einem
              Trainer oder einer erwachsenen Vertrauensperson.
            </p>
          </article>
        </div>
      </section>
    </div>
  `;
}

/* ---------- 7. SEITE: ANALYSE ---------- */

function renderAnalysis() {
  const ratings = [
    ["technique", "Technik"],
    ["tactics", "Taktik und Positionierung"],
    ["fitness", "Athletik"],
    ["decisions", "Entscheidungsfindung"]
  ];

  return `
    <div class="page">

      <div class="page-heading">
        <div>
          <h2>Dein Spiel verstehen</h2>
          <p>Erfasse deinen Eindruck und vergleiche ihn mit späteren Einschätzungen.</p>
        </div>
        <span class="badge">SELBSTEINSCHÄTZUNG</span>
      </div>

      <section class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Wie schätzt du dich aktuell ein?</h3>
            <p class="card-subtitle">
              1 = noch unsicher, 10 = sehr sicher.
              Das sind keine objektiven Messwerte.
            </p>
          </div>
        </div>

        <form class="form" id="ratings-form">
          ${ratings.map(([key, label]) => `
            <div class="form-group">
              <label class="form-label" for="rating-${key}">
                ${label}
                <strong id="value-${key}">${state.ratings[key]}/10</strong>
              </label>

              <input class="input rating-input"
                     id="rating-${key}"
                     name="${key}"
                     type="range"
                     min="1"
                     max="10"
                     step="1"
                     value="${state.ratings[key]}">

              ${progressBar(label, state.ratings[key])}
            </div>
          `).join("")}

          <button class="btn btn-primary" type="submit">
            Einschätzung speichern
          </button>
        </form>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>So liest du deine Analyse</h2>
        </div>

        <div class="grid grid-2">
          <article class="card">
            <span class="stat-icon" aria-hidden="true">◉</span>
            <h3 class="card-title" style="margin-top:14px">
              Stärken erkennen
            </h3>
            <p class="card-description">
              Notiere konkrete Spielsituationen, in denen du gut
              verteidigt, Räume erkannt oder sauber gepasst hast.
            </p>
          </article>

          <article class="card">
            <span class="stat-icon" aria-hidden="true">↗</span>
            <h3 class="card-title" style="margin-top:14px">
              Nächsten Schritt wählen
            </h3>
            <p class="card-description">
              Wähle einen Schwerpunkt, den du im Training gezielt
              wiederholen und später erneut einschätzen kannst.
            </p>
          </article>
        </div>
      </section>

    </div>
  `;
}

/* ---------- 8. SEITE: COACH-DEMO ---------- */

/*
  Hinweis:
  Dieser Coach verwendet lokale Regeln und Vorlagen.
  Er ruft noch kein echtes KI-Modell und keine externe API auf.
*/

function getCoachReply(message) {
  const text = message.toLowerCase();

  if (/schmerz|weh|verletz|schwindel|krank/.test(text)) {
    return "Bei Schmerzen, Schwindel oder wenn du dich krank fühlst, solltest du das Training nicht einfach durchziehen. Unterbrich die Belastung und sprich mit einem Trainer oder einer erwachsenen Vertrauensperson. Ich kann keine medizinische Beurteilung stellen.";
  }

  if (/flank/.test(text)) {
    return "Für bessere Flanken: 1. Laufe kontrolliert an. 2. Schau vor dem Schlag kurz in den Strafraum. 3. Achte auf einen stabilen Standfuß. 4. Spiele zunächst auf ein klares Ziel, bevor du die Schwierigkeit steigerst. Bewerte die Genauigkeit statt nur die Anzahl.";
  }

  if (/zweikampf|verteidig|defensiv|1 gegen 1|1v1/.test(text)) {
    return "Im defensiven 1-gegen-1: 1. Laufe kontrolliert an. 2. Halte einen passenden Abstand. 3. Stelle deinen Körper so, dass du den Gegner vom gefährlichen Raum weglenkst. 4. Warte auf einen guten Moment für den Ballgewinn. Übe das zunächst mit einem Mitspieler.";
  }

  if (/ausdauer|kondition|schnell|sprint/.test(text)) {
    return "Baue deine Belastung schrittweise auf. Ein gutes Aufwärmen und lockere Belastung mit ausreichenden Erholungsphasen sind sinnvoll. Du solltest noch kontrolliert trainieren können. Steigere nicht gleichzeitig Dauer und Intensität stark.";
  }

  if (/linksfuß|linker fuß|schwacher fuß|beidfüß/.test(text)) {
    return "Übe deinen linken Fuß mit kurzen, kontrollierten Pässen gegen eine Wand oder mit einem Partner. Beginne mit einer angenehmen Distanz und steigere erst dann. Achte auf einen ruhigen ersten Kontakt und eine saubere Passbewegung.";
  }

  if (/nlz|profifußball|scout|wechsel/.test(text)) {
    return "Konzentriere dich zunächst auf Dinge, die du beeinflussen kannst: regelmäßig gut trainieren, im Spiel mutige und passende Entscheidungen treffen, zuverlässig verteidigen und aus Feedback lernen. Sprich mit deinem Trainer über konkrete nächste Entwicklungsschritte. Ein späterer Weg in ein NLZ ist nicht garantiert.";
  }

  if (/training|übung|trainieren|heute/.test(text)) {
    return "Wähle für heute einen Schwerpunkt: Ballkontrolle, Passen, Flanken oder defensive Positionierung. Mach dich zuerst warm und arbeite in kurzen, konzentrierten Abschnitten. Wenn du müde bist, reduziere die Belastung. Schau in den Bereich „Training“ für die Beispiel-Einheit.";
  }

  if (/motivation|keine lust|schlecht gespielt|fehler/.test(text)) {
    return "Ein Fehler ist eine Information, kein Urteil über dich. Suche dir eine konkrete Szene heraus: Was ist passiert, welche Optionen hattest du und was probierst du nächstes Mal? Ein kleiner, umsetzbarer Schritt hilft mehr als zehn vage Ziele.";
  }

  return "Lass uns konkret werden: An welchem Punkt möchtest du arbeiten – Technik, Flanken, Zweikämpfe, Taktik, Ausdauer oder Entscheidungen im Spiel? Beschreibe kurz eine Situation aus dem Training oder Spiel. Dann kann ich dir einen passenden allgemeinen Vorschlag machen.";
}

function renderCoach() {
  return `
    <div class="page">

      <div class="page-heading">
        <div>
          <h2>Dein persönlicher Fußball-Coach</h2>
          <p>Stelle Fragen zu Training, Technik und Spielverständnis.</p>
        </div>
        <span class="badge badge-orange">DEMO</span>
      </div>

      <section class="card chat-container">
        <div class="card-header">
          <div>
            <h3 class="card-title">AllCoach Assistant</h3>
            <p class="card-subtitle">
              Lokale Coach-Demo · Noch keine echte KI-Verbindung
            </p>
          </div>
          <span class="status-dot" aria-label="Lokal verfügbar"></span>
        </div>

        <div class="chat-messages" id="chat-messages">
          ${state.chatHistory.map(message => `
            <div class="chat-message ${message.role === "user" ? "user" : "coach"}">
              <p>${escapeHTML(message.text).replace(/\n/g, "<br>")}</p>
            </div>
          `).join("")}
        </div>

        <form class="chat-form" id="coach-form">
          <textarea class="textarea"
                    id="coach-input"
                    name="message"
                    rows="2"
                    maxlength="1000"
                    required
                    placeholder="Zum Beispiel: Wie verbessere ich meine Flanken?"></textarea>

          <button class="btn btn-primary"
                  type="submit"
                  aria-label="Nachricht senden">
            Senden →
          </button>
        </form>

        <p class="form-hint">
          Bitte keine privaten Zugangsdaten oder sensiblen Informationen eingeben.
        </p>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Schnellfragen</h2>
        </div>

        <div class="grid grid-2">
          <button class="card quick-prompt"
                  type="button"
                  data-prompt="Wie verbessere ich meine Flanken?">
            <h3 class="card-title">Flanken verbessern ↗</h3>
            <p class="card-description">Technik und Genauigkeit</p>
          </button>

          <button class="card quick-prompt"
                  type="button"
                  data-prompt="Wie verteidige ich besser im 1 gegen 1?">
            <h3 class="card-title">Besser verteidigen ↗</h3>
            <p class="card-description">Abstand, Stellung und Timing</p>
          </button>

          <button class="card quick-prompt"
                  type="button"
                  data-prompt="Wie trainiere ich meinen linken Fuß?">
            <h3 class="card-title">Schwachen Fuß trainieren ↗</h3>
            <p class="card-description">Kontrolle und saubere Pässe</p>
          </button>

          <button class="card quick-prompt"
                  type="button"
                  data-prompt="Wie kann ich mich als Außenverteidiger entwickeln?">
            <h3 class="card-title">Als Außenverteidiger wachsen ↗</h3>
            <p class="card-description">Deine nächsten Entwicklungsschritte</p>
          </button>
        </div>
      </section>

    </div>
  `;
}

/* ---------- 9. SEITE: ENTWICKLUNG ---------- */

function renderDevelopment() {
  const average = Object.values(state.ratings)
    .reduce((sum, value) => sum + Number(value), 0) /
    Object.keys(state.ratings).length;

  return `
    <div class="page">

      <div class="page-heading">
        <div>
          <h2>Dein Fortschritt</h2>
          <p>Halte Ziele und Selbsteinschätzungen an einem Ort fest.</p>
        </div>
        <span class="badge badge-lime">DEIN WEG</span>
      </div>

      <section class="grid grid-2">
        <article class="card">
          <p class="card-subtitle">Durchschnittliche Selbsteinschätzung</p>
          <p class="card-value">${average.toFixed(1)}<span
            style="font-size:15px;color:var(--text-muted)">/10</span></p>
          <p class="card-description">
            Nutze den Wert zur persönlichen Orientierung, nicht als offizielles Leistungsurteil.
          </p>
        </article>

        <article class="card">
          <p class="card-subtitle">Abgeschlossene Einheiten</p>
          <p class="card-value">${Math.max(0, Number(state.completedSessions) || 0)}</p>
          <p class="card-description">
            Gezählt werden nur Einheiten, die du in der App als abgeschlossen markiert hast.
          </p>
        </article>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Deine Entwicklungsziele</h2>
        </div>

        <div class="card">
          ${state.goals.map(goal => `
            <div class="goal-item" style="margin-bottom:24px">
              <div class="progress-meta">
                <span>
                  <strong>${escapeHTML(goal.title)}</strong>
                  <br>
                  <small>${escapeHTML(goal.category)}</small>
                </span>
                <strong>${clamp(goal.progress, 0, 100)}%</strong>
              </div>

              <div class="progress-track">
                <div class="progress-fill"
                     style="width:${clamp(goal.progress, 0, 100)}%"></div>
              </div>

              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
                <button class="btn btn-secondary"
                        type="button"
                        data-action="increase-goal"
                        data-goal-id="${escapeHTML(goal.id)}">
                  Fortschritt +5%
                </button>
                <button class="btn btn-secondary"
                        type="button"
                        data-action="decrease-goal"
                        data-goal-id="${escapeHTML(goal.id)}">
                  −5%
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Deine nächste Reflexion</h2>
        </div>

        <div class="card">
          <h3 class="card-title">Drei Fragen nach dem Training</h3>
          <div class="training-item">
            <div class="training-time">01</div>
            <div class="training-details">
              <h3>Was lief gut?</h3>
              <p>Notiere eine konkrete gelungene Aktion.</p>
            </div>
          </div>

          <div class="training-item">
            <div class="training-time">02</div>
            <div class="training-details">
              <h3>Was möchtest du verbessern?</h3>
              <p>Wähle einen konkreten Punkt statt vieler auf einmal.</p>
            </div>
          </div>

          <div class="training-item">
            <div class="training-time">03</div>
            <div class="training-details">
              <h3>Was probierst du als Nächstes?</h3>
              <p>Leite eine kleine, umsetzbare Trainingsidee ab.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  `;
}

/* ---------- 10. SEITE: SPIELERPROFIL ---------- */

function renderProfile() {
  const profile = state.profile;

  return `
    <div class="page">

      <div class="page-heading">
        <div>
          <h2>Dein Spielerprofil</h2>
          <p>Deine Angaben bilden die Grundlage für spätere Personalisierung.</p>
        </div>
      </div>

      <section class="card">
        <div class="profile-header">
          <div class="profile-avatar">
            ${escapeHTML(getInitials(profile.name))}
          </div>
          <div>
            <h3 class="profile-name">${escapeHTML(profile.name)}</h3>
            <p class="card-subtitle">
              ${escapeHTML(profile.position)} ·
              ${escapeHTML(profile.club || "Verein noch nicht eingetragen")}
            </p>
            <div class="profile-meta">
              <span class="badge">${escapeHTML(profile.season)}</span>
              <span class="badge badge-lime">Spielerprofil</span>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Profildaten bearbeiten</h3>
            <p class="card-subtitle">
              Die Angaben werden nur in diesem Browser gespeichert.
            </p>
          </div>
        </div>

        <form class="form" id="profile-form">

          <div class="form-group">
            <label class="form-label" for="profile-name">Vorname</label>
            <input class="input"
                   id="profile-name"
                   name="name"
                   maxlength="50"
                   required
                   value="${escapeHTML(profile.name)}">
          </div>

          <div class="form-group">
            <label class="form-label" for="profile-position">Position</label>
            <select class="select" id="profile-position" name="position">
              ${[
                "Außenverteidiger",
                "Innenverteidiger",
                "Defensives Mittelfeld",
                "Zentrales Mittelfeld",
                "Offensives Mittelfeld",
                "Flügelspieler",
                "Stürmer",
                "Torwart"
              ].map(position => `
                <option value="${escapeHTML(position)}"
                  ${profile.position === position ? "selected" : ""}>
                  ${escapeHTML(position)}
                </option>
              `).join("")}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="profile-club">Verein</label>
            <input class="input"
                   id="profile-club"
                   name="club"
                   maxlength="80"
                   value="${escapeHTML(profile.club)}">
          </div>

          <div class="form-group">
            <label class="form-label" for="profile-season">Saison</label>
            <input class="input"
                   id="profile-season"
                   name="season"
                   maxlength="20"
                   value="${escapeHTML(profile.season)}">
          </div>

          <div class="form-group">
            <label class="form-label" for="profile-foot">Stärkerer Fuß</label>
            <select class="select" id="profile-foot" name="preferredFoot">
              <option value="Rechts"
                ${profile.preferredFoot === "Rechts" ? "selected" : ""}>
                Rechts
              </option>
              <option value="Links"
                ${profile.preferredFoot === "Links" ? "selected" : ""}>
                Links
              </option>
              <option value="Beidfüßig"
                ${profile.preferredFoot === "Beidfüßig" ? "selected" : ""}>
                Beidfüßig
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="profile-goal">Hauptziel</label>
            <input class="input"
                   id="profile-goal"
                   name="mainGoal"
                   maxlength="120"
                   value="${escapeHTML(profile.mainGoal)}">
          </div>

          <button class="btn btn-primary" type="submit">
            Profil speichern
          </button>

          <button class="btn btn-danger"
                  type="button"
                  data-action="reset-data">
            Alle lokalen App-Daten zurücksetzen
          </button>

        </form>
      </section>

    </div>
  `;
}

/* ---------- 11. ROUTER UND RENDERING ---------- */

const PAGE_RENDERERS = {
  today: renderToday,
  training: renderTraining,
  analysis: renderAnalysis,
  coach: renderCoach,
  development: renderDevelopment,
  profile: renderProfile
};

function renderPage() {
  document.querySelector(".loading-panel")?.remove();
  const route = getRoute();
  const page = ROUTES[route];
  const content = document.getElementById("page-content");
  const title = document.getElementById("page-title");
  const eyebrow = document.getElementById("page-eyebrow");
  const date = document.getElementById("current-date");
  const avatar = document.getElementById("player-avatar");

  if (!content) {
    console.error("AllCoach: #page-content fehlt in index.html.");
    return;
  }

  if (title) title.textContent = page.title;
  if (eyebrow) eyebrow.textContent = page.eyebrow;
  if (date) date.textContent = getTodayLabel();
  if (avatar) avatar.textContent = getInitials(state.profile.name);

  content.innerHTML = PAGE_RENDERERS[route]();

  document.querySelectorAll("[data-route]").forEach(link => {
    const active = link.dataset.route === route;

    link.classList.toggle("is-active", active);

    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (route === "coach") {
    const messages = document.getElementById("chat-messages");
    if (messages) messages.scrollTop = messages.scrollHeight;
  }
}

function navigate(route) {
  if (!Object.hasOwn(ROUTES, route)) return;
  window.location.hash = `/${route}`;
}

/* ---------- 12. AKTIONEN ---------- */

function completeWorkout() {
  const today = new Date().toDateString();

  if (state.lastCompletedDate === today) {
    showToast("Diese Einheit ist für heute bereits markiert.");
    return;
  }

  state.completedSessions = Math.max(
    0,
    Number(state.completedSessions) || 0
  ) + 1;

  state.lastCompletedDate = today;

  saveState();
  renderPage();
  showToast("Einheit als abgeschlossen gespeichert.");
}

function saveReflection() {
  const field = document.getElementById("daily-reflection");

  if (!field) return;

  state.lastReflection = field.value.trim();
  saveState();
  showToast("Deine Reflexion wurde gespeichert.");
}

function saveProfile(form) {
  const formData = new FormData(form);

  state.profile = {
    ...state.profile,
    name: String(formData.get("name") || "Spieler").trim(),
    position: String(formData.get("position") || "Außenverteidiger"),
    club: String(formData.get("club") || "").trim(),
    season: String(formData.get("season") || "2026/27").trim(),
    preferredFoot: String(formData.get("preferredFoot") || "Rechts"),
    mainGoal: String(formData.get("mainGoal") || "").trim()
  };

  saveState();
  renderPage();
  showToast("Spielerprofil gespeichert.");
}

function saveRatings(form) {
  const formData = new FormData(form);

  for (const key of Object.keys(state.ratings)) {
    state.ratings[key] = clamp(formData.get(key), 1, 10);
  }

  saveState();
  renderPage();
  showToast("Deine Einschätzung wurde gespeichert.");
}

function sendCoachMessage(message) {
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage) return;

  if (cleanMessage.length > 1000) {
    showToast("Die Nachricht darf höchstens 1000 Zeichen enthalten.");
    return;
  }

  state.chatHistory.push({
    role: "user",
    text: cleanMessage
  });

  state.chatHistory.push({
    role: "coach",
    text: getCoachReply(cleanMessage)
  });

  // Chat-Verlauf begrenzen, damit der Browser-Speicher klein bleibt.
  state.chatHistory = state.chatHistory.slice(-30);

  saveState();
  renderPage();

  const input = document.getElementById("coach-input");
  if (input) input.focus();
}

function updateGoal(goalId, difference) {
  const goal = state.goals.find(item => item.id === goalId);

  if (!goal) return;

  goal.progress = clamp(goal.progress + difference, 0, 100);

  saveState();
  renderPage();
  showToast("Ziel-Fortschritt aktualisiert.");
}

function resetData() {
  const confirmed = window.confirm(
    "Möchtest du wirklich alle lokal gespeicherten AllCoach-Daten löschen?"
  );

  if (!confirmed) return;

  state = cloneDefaults();
  state.lastCompletedDate = "";
  saveState();
  renderPage();
  showToast("Lokale Daten wurden zurückgesetzt.");
}

/* ---------- 13. EVENTS ---------- */

// Navigation über die Hash-URL
window.addEventListener("hashchange", renderPage);

// Aktionen über Buttons: ein zentraler Event-Handler
document.addEventListener("click", event => {
  const routeLink = event.target.closest("[data-route]");

  if (routeLink) {
    // Der normale Link ändert den Hash.
    return;
  }

  const promptButton = event.target.closest("[data-prompt]");

  if (promptButton) {
    const prompt = promptButton.dataset.prompt;
    navigate("coach");

    window.setTimeout(() => {
      const input = document.getElementById("coach-input");
      if (input) {
        input.value = prompt;
        input.focus();
      }
    }, 0);

    return;
  }

  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) return;

  switch (actionButton.dataset.action) {
    case "go-training":
      navigate("training");
      break;

    case "complete-workout":
      completeWorkout();
      break;

    case "save-reflection":
      saveReflection();
      break;

    case "increase-goal":
      updateGoal(actionButton.dataset.goalId, 5);
      break;

    case "decrease-goal":
      updateGoal(actionButton.dataset.goalId, -5);
      break;

    case "reset-data":
      resetData();
      break;

    default:
      console.warn(
        "AllCoach: Unbekannte Aktion:",
        actionButton.dataset.action
      );
  }
});

// Formulare innerhalb der dynamischen Seiten
document.addEventListener("submit", event => {
  const form = event.target;

  if (!(form instanceof HTMLFormElement)) return;

  switch (form.id) {
    case "profile-form":
      event.preventDefault();
      saveProfile(form);
      break;

    case "ratings-form":
      event.preventDefault();
      saveRatings(form);
      break;

    case "coach-form": {
      event.preventDefault();

      const input = document.getElementById("coach-input");
      if (!input) return;

      const message = input.value;
      if (!message.trim()) return;

      sendCoachMessage(message);
      break;
    }

    default:
      break;
  }
});

// Live-Anzeige der Selbsteinschätzung
document.addEventListener("input", event => {
  const input = event.target;

  if (!(input instanceof HTMLInputElement)) return;
  if (!input.classList.contains("rating-input")) return;

  const output = document.getElementById(`value-${input.name}`);

  if (output) {
    output.textContent = `${input.value}/10`;
  }
});

/* ---------- 14. APP STARTEN ---------- */

function startApp() {
  if (!window.location.hash) {
    window.location.hash = `/${APP_CONFIG.defaultRoute}`;
    return;
  }

  renderPage();

  console.info(
    `${APP_CONFIG.name} v${APP_CONFIG.version} gestartet.`
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp, { once: true });
} else {
  startApp();
}
