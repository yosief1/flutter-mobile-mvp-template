
/* ==========================================
   ALLCOACH — APPLICATION CORE
   Version: 0.2.0
   ========================================== */

import {
  APP_CONFIG,
  ROUTES,
  createDefaultState,
  isValidRoute,
  LIMITS
} from "./config.js";

import {
  loadState,
  saveState,
  clearState
} from "./storage.js";

/* ---------- 1. APP-ZUSTAND ---------- */

let state = loadState();

const root = document.getElementById("page-content");

if (!root) {
  throw new Error(
    "AllCoach: Das Element #page-content fehlt in index.html."
  );
}

/* ---------- 2. HILFSFUNKTIONEN ---------- */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[char];
  });
}

function clamp(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) return min;

  return Math.min(max, Math.max(min, number));
}

function getInitials(name) {
  return String(name || "A")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("");
}

function getDateLabel() {
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

  return isValidRoute(route)
    ? route
    : APP_CONFIG.defaultRoute;
}

function persist() {
  const success = saveState(state);

  if (!success) {
    showToast(
      "Speichern nicht möglich. Prüfe deine Browsereinstellungen."
    );
  }

  return success;
}

function showToast(message) {
  const region = document.getElementById("toast-region");

  if (!region) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  region.appendChild(toast);

  window.setTimeout(() => toast.remove(), 3000);
}

function makeButton(label, action, variant = "primary") {
  return `
    <button class="btn btn-${variant}"
            type="button"
            data-action="${escapeHTML(action)}">
      ${label}
    </button>
  `;
}

function progressBar(label, value, max = 100) {
  const safeValue = clamp(value, 0, max);
  const percentage = Math.round((safeValue / max) * 100);

  return `
    <div class="progress-item">
      <div class="progress-meta">
        <span>${escapeHTML(label)}</span>
        <strong>${safeValue}${max === 100 ? "%" : `/${max}`}</strong>
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

/* ---------- 3. SEITE: HEUTE ---------- */

function renderToday() {
  const average = Object.values(state.ratings)
    .reduce((sum, value) => sum + Number(value), 0) /
    Object.keys(state.ratings).length;

  return `
    <div class="page">

      <section class="hero">
        <div class="hero-content">
          <span class="hero-label">DEIN ENTWICKLUNGSPLAN</span>

          <h2>
            ${getGreeting()},
            ${escapeHTML(state.profile.name)}.
          </h2>

          <p>
            Arbeite gezielt an deinem Spiel.
            Wähle einen Schwerpunkt und mache
            aus jeder Trainingseinheit einen Lernschritt.
          </p>

          <div class="hero-actions">
            <a class="btn btn-primary" href="#/training">
              Training ansehen →
            </a>

            <a class="btn btn-secondary" href="#/coach">
              Coach fragen
            </a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Deine Übersicht</h2>
          <span class="badge badge-lime">
            SAISON ${escapeHTML(state.profile.season)}
          </span>
        </div>

        <div class="grid grid-3">
          <article class="card stat-card">
            <span class="stat-icon" aria-hidden="true">⚽</span>
            <p class="card-subtitle">Abgeschlossene Einheiten</p>
            <p class="card-value">
              ${state.completedSessions}
            </p>
          </article>

          <article class="card stat-card">
            <span class="stat-icon" aria-hidden="true">↗</span>
            <p class="card-subtitle">Deine Einschätzung</p>
            <p class="card-value">
              ${average.toFixed(1)}
              <span style="font-size:14px;color:var(--text-muted)">/10</span>
            </p>
          </article>

          <article class="card stat-card">
            <span class="stat-icon" aria-hidden="true">◎</span>
            <p class="card-subtitle">Aktive Ziele</p>
            <p class="card-value">${state.goals.length}</p>
          </article>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Dein Fokus</h2>
          <a href="#/training">Trainingsplan →</a>
        </div>

        <div class="grid grid-2">
          <article class="card">
            <span class="badge badge-lime">TECHNIK</span>
            <h3 class="card-title" style="margin-top:12px">
              Flanken nach Bewegung
            </h3>
            <p class="card-description">
              Kontrolliere den Ball, schau vor dem Schlag
              auf und spiele zunächst auf ein klares Ziel.
            </p>
            <div style="margin-top:18px">
              ${makeButton("Training öffnen →", "go-training")}
            </div>
          </article>

          <article class="card">
            <span class="badge">REFLEXION</span>
            <h3 class="card-title" style="margin-top:12px">
              Wie fühlst du dich heute?
            </h3>
            <p class="card-subtitle">
              Deine Tagesform hilft dabei, die Belastung anzupassen.
            </p>

            <label class="form-label" for="daily-reflection">
              Notiz
            </label>

            <textarea class="textarea"
                      id="daily-reflection"
                      maxlength="2000"
                      placeholder="Zum Beispiel: motiviert, aber etwas müde …">${escapeHTML(state.lastReflection)}</textarea>

            <div style="margin-top:12px">
              ${makeButton("Notiz speichern", "save-reflection", "secondary")}
            </div>
          </article>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Deine Entwicklungsziele</h2>
          <a href="#/development">Fortschritt →</a>
        </div>

        <div class="card">
          ${state.goals.map(goal => `
            <div style="margin-bottom:22px">
              ${progressBar(goal.title, goal.progress)}
              <p class="card-subtitle">
                ${escapeHTML(goal.category)}
              </p>
            </div>
          `).join("")}
        </div>
      </section>

    </div>
  `;
}

/* ---------- 4. SEITE: TRAINING ---------- */

function renderTraining() {
  const exercises = [
    {
      time: "8 Min.",
      title: "Ballkontrolle",
      description: "Den Ball mit beiden Füßen kontrolliert mitnehmen."
    },
    {
      time: "10 Min.",
      title: "Passen und Freilaufen",
      description: "Nach dem Pass den Kopf heben und einen neuen Raum suchen."
    },
    {
      time: "10 Min.",
      title: "Flanken in Bewegung",
      description: "Kontrolliert anlaufen und auf einen markierten Zielbereich spielen."
    },
    {
      time: "5 Min.",
      title: "Abschluss und Reflexion",
      description: "Ruhig auslaufen und die Einheit kurz bewerten."
    }
  ];

  return `
    <div class="page">
      <div class="page-heading">
        <div>
          <h2>Dein Trainingsplan</h2>
          <p>Eine Beispiel-Einheit für deinen Alltag als Außenverteidiger.</p>
        </div>
        <span class="badge badge-lime">33 MINUTEN</span>
      </div>

      <section class="hero">
        <div class="hero-content">
          <span class="hero-label">HEUTIGER SCHWERPUNKT</span>
          <h2>Kontrolle. Blick hoch. Entscheidung.</h2>
          <p>
            Wärme dich zuerst auf und passe den Umfang
            an deine Tagesform an. Qualität geht vor Menge.
            Trainiere nicht durch Schmerzen hindurch.
          </p>

          <div class="hero-actions">
            ${makeButton("Einheit abschließen ✓", "complete-workout")}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Ablauf der Einheit</h2>
        </div>

        <div class="card">
          ${exercises.map((exercise, index) => `
            <div class="training-item">
              <div class="training-time">${exercise.time}</div>
              <div class="training-details">
                <h3>${index + 1}. ${exercise.title}</h3>
                <p>${exercise.description}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="grid grid-3">
        <article class="card">
          <span class="badge badge-green">FIT</span>
          <h3 class="card-title" style="margin-top:12px">Normale Tagesform</h3>
          <p class="card-description">
            Arbeite konzentriert an der Technik.
          </p>
        </article>

        <article class="card">
          <span class="badge badge-orange">MÜDE</span>
          <h3 class="card-title" style="margin-top:12px">Weniger Energie</h3>
          <p class="card-description">
            Reduziere Wiederholungen und Pausen nicht unnötig.
          </p>
        </article>

        <article class="card">
          <span class="badge badge-red">SCHMERZEN</span>
          <h3 class="card-title" style="margin-top:12px">Unterbrechen</h3>
          <p class="card-description">
            Beende die Belastung und hole dir Unterstützung.
          </p>
        </article>
      </section>
    </div>
  `;
}

/* ---------- 5. SEITE: ANALYSE ---------- */

function renderAnalysis() {
  const categories = [
    ["technique", "Technik"],
    ["tactics", "Taktik und Positionierung"],
    ["fitness", "Athletik"],
    ["decisions", "Entscheidungsfindung"]
  ];

  return `
    <div class="page">
      <div class="page-heading">
        <div>
          <h2>Spielanalyse</h2>
          <p>Halte fest, wie du deine aktuellen Fähigkeiten einschätzt.</p>
        </div>
        <span class="badge">SELBSTEINSCHÄTZUNG</span>
      </div>

      <section class="card">
        <h3 class="card-title">Wie schätzt du dich ein?</h3>
        <p class="card-subtitle">
          1 = unsicher, 10 = sehr sicher.
          Dies sind persönliche Einschätzungen, keine objektiven Messwerte.
        </p>

        <form id="ratings-form" class="form" style="margin-top:22px">
          ${categories.map(([key, label]) => `
            <div class="form-group">
              <label class="form-label" for="rating-${key}">
                ${label}
                <strong id="value-${key}">${state.ratings[key]}/10</strong>
              </label>

              <input class="input rating-input"
                     type="range"
                     min="1"
                     max="10"
                     step="1"
                     id="rating-${key}"
                     name="${key}"
                     value="${state.ratings[key]}">
            </div>
          `).join("")}

          <button class="btn btn-primary" type="submit">
            Einschätzungen speichern
          </button>
        </form>
      </section>

      <section class="grid grid-2">
        <article class="card">
          <h3 class="card-title">Stärken finden</h3>
          <p class="card-description">
            Notiere gelungene Spielsituationen, gute Pässe und
            erfolgreiche defensive Entscheidungen.
          </p>
        </article>

        <article class="card">
          <h3 class="card-title">Nächsten Schritt planen</h3>
          <p class="card-description">
            Wähle eine konkrete Situation, die du im Training
            verbessern möchtest.
          </p>
        </article>
      </section>
    </div>
  `;
}

/* ---------- 6. SEITE: COACH ---------- */

/*
 * Regelbasierte Demo.
 * Eine echte KI benötigt später einen sicheren Backend-Endpunkt.
 * Ein privater API-Schlüssel darf nicht hier im Browser stehen.
 */

function getCoachReply(message) {
  const text = message.toLowerCase();

  if (/schmerz|weh|verletz|schwindel|krank/.test(text)) {
    return "Bei Schmerzen, Schwindel oder wenn du dich krank fühlst, unterbrich das Training und sprich mit einem Trainer oder einer erwachsenen Vertrauensperson. Ich kann keine medizinische Beurteilung stellen.";
  }

  if (/flank/.test(text)) {
    return "Für bessere Flanken: Laufe kontrolliert an, schaue vor dem Schlag kurz auf und spiele zunächst auf einen klaren Zielbereich. Achte auf einen stabilen Standfuß. Erhöhe die Schwierigkeit erst, wenn du die Bewegung kontrollierst.";
  }

  if (/zweikampf|verteidig|defensiv|1v1|1 gegen 1/.test(text)) {
    return "Im defensiven 1-gegen-1: Nähere dich kontrolliert, halte einen passenden Abstand und lenke den Gegner möglichst vom gefährlichen Raum weg. Warte auf einen guten Moment für den Ballgewinn und übe zunächst mit einem Mitspieler.";
  }

  if (/ausdauer|kondition|schnell|sprint/.test(text)) {
    return "Steigere deine Laufbelastung schrittweise und plane Erholungsphasen ein. Du solltest die Intensität an deine Tagesform anpassen. Wenn du ungewöhnliche Beschwerden hast, hör auf und sprich mit einem Erwachsenen.";
  }

  if (/linksfuß|linker fuß|schwacher fuß|beidfüß/.test(text)) {
    return "Beginne mit kurzen, kontrollierten Pässen mit dem linken Fuß. Achte auf den ersten Kontakt und die Genauigkeit. Steigere Distanz und Schwierigkeit langsam, sobald die Bewegung sicher klappt.";
  }

  if (/nlz|profifußball|scout|wechsel/.test(text)) {
    return "Arbeite an deinen beeinflussbaren Faktoren: Trainingsqualität, Spielverständnis, Zuverlässigkeit und der Umsetzung von Trainerfeedback. Besprich mit deinem Trainer konkrete nächste Schritte. Ein Weg ins NLZ oder in den Profifußball ist nicht garantiert.";
  }

  if (/motivation|fehler|schlecht gespielt/.test(text)) {
    return "Wähle eine konkrete Spielsituation aus. Was ist passiert, welche Möglichkeiten hattest du und was willst du beim nächsten Mal ausprobieren? Ein kleiner umsetzbarer Schritt ist hilfreicher als zu viele gleichzeitige Ziele.";
  }

  return "Woran möchtest du arbeiten: Flanken, Technik, Zweikämpfe, Taktik, Ausdauer oder Entscheidungen? Beschreibe eine konkrete Situation aus Training oder Spiel. Ich gebe dir dazu einen allgemeinen Trainingsvorschlag.";
}

function renderCoach() {
  const messages = state.chatHistory
    .slice(-LIMITS.maxChatMessages)
    .map(message => `
      <div class="chat-message ${message.role === "user" ? "user" : "coach"}">
        <p>${escapeHTML(message.text).replace(/\n/g, "<br>")}</p>
      </div>
    `)
    .join("");

  return `
    <div class="page">
      <div class="page-heading">
        <div>
          <h2>Dein Fußball-Coach</h2>
          <p>Stelle Fragen zu Technik, Taktik und Trainingsplanung.</p>
        </div>
        <span class="badge badge-orange">DEMO</span>
      </div>

      <section class="card chat-container">
        <div class="card-header">
          <div>
            <h3 class="card-title">AllCoach Assistant</h3>
            <p class="card-subtitle">
              Regelbasierter Prototyp – noch keine echte KI-Anbindung.
            </p>
          </div>
        </div>

        <div class="chat-messages"
             id="chat-messages"
             aria-live="polite">
          ${messages}
        </div>

        <form class="chat-form" id="coach-form">
          <textarea class="textarea"
                    id="coach-input"
                    name="message"
                    rows="2"
                    maxlength="${LIMITS.maxChatCharacters}"
                    required
                    placeholder="Wie verbessere ich meine Flanken?"></textarea>

          <button class="btn btn-primary" type="submit">
            Senden →
          </button>
        </form>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Schnellfragen</h2>
        </div>

        <div class="grid grid-2">
          <button class="card quick-prompt" data-prompt="Wie verbessere ich meine Flanken?" type="button">
            <h3 class="card-title">Flanken verbessern ↗</h3>
            <p class="card-description">Technik und Genauigkeit</p>
          </button>

          <button class="card quick-prompt" data-prompt="Wie verteidige ich besser im 1 gegen 1?" type="button">
            <h3 class="card-title">Besser verteidigen ↗</h3>
            <p class="card-description">Abstand, Stellung und Timing</p>
          </button>

          <button class="card quick-prompt" data-prompt="Wie trainiere ich meinen linken Fuß?" type="button">
            <h3 class="card-title">Linken Fuß trainieren ↗</h3>
            <p class="card-description">Kontrolle und saubere Pässe</p>
          </button>

          <button class="card quick-prompt" data-prompt="Wie entwickle ich mich als Außenverteidiger?" type="button">
            <h3 class="card-title">Als Außenverteidiger wachsen ↗</h3>
            <p class="card-description">Deine nächsten Entwicklungsschritte</p>
          </button>
        </div>
      </section>
    </div>
  `;
}

/* ---------- 7. SEITE: ENTWICKLUNG ---------- */

function renderDevelopment() {
  const average = Object.values(state.ratings)
    .reduce((sum, value) => sum + Number(value), 0) /
    Object.keys(state.ratings).length;

  return `
    <div class="page">
      <div class="page-heading">
        <div>
          <h2>Deine Entwicklung</h2>
          <p>Verfolge deine Ziele und Selbsteinschätzungen.</p>
        </div>
      </div>

      <div class="grid grid-2">
        <article class="card">
          <p class="card-subtitle">Selbsteinschätzung im Durchschnitt</p>
          <p class="card-value">
            ${average.toFixed(1)}
            <span style="font-size:14px;color:var(--text-muted)">/10</span>
          </p>
          <p class="card-description">
            Dein persönlicher Richtwert, kein offizielles Leistungsurteil.
          </p>
        </article>

        <article class="card">
          <p class="card-subtitle">Abgeschlossene Einheiten</p>
          <p class="card-value">${state.completedSessions}</p>
          <p class="card-description">
            Gezählt werden die in AllCoach erfassten Einheiten.
          </p>
        </article>
      </div>

      <section class="section">
        <div class="section-heading">
          <h2>Entwicklungsziele</h2>
        </div>

        <div class="card">
          ${state.goals.map(goal => `
            <div style="margin-bottom:25px">
              ${progressBar(goal.title, goal.progress)}

              <p class="card-subtitle">${escapeHTML(goal.category)}</p>

              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
                <button class="btn btn-secondary"
                        type="button"
                        data-action="goal-up"
                        data-goal-id="${escapeHTML(goal.id)}">
                  Fortschritt +5%
                </button>

                <button class="btn btn-secondary"
                        type="button"
                        data-action="goal-down"
                        data-goal-id="${escapeHTML(goal.id)}">
                  −5%
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

/* ---------- 8. SEITE: SPIELERPROFIL ---------- */

function renderProfile() {
  const profile = state.profile;

  const positions = [
    "Außenverteidiger",
    "Innenverteidiger",
    "Defensives Mittelfeld",
    "Zentrales Mittelfeld",
    "Offensives Mittelfeld",
    "Flügelspieler",
    "Stürmer",
    "Torwart"
  ];

  return `
    <div class="page">
      <div class="page-heading">
        <div>
          <h2>Spielerprofil</h2>
          <p>Diese Angaben werden für spätere Personalisierung verwendet.</p>
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
              ${escapeHTML(profile.club || "Kein Verein eingetragen")}
            </p>
            <div class="profile-meta">
              <span class="badge">${escapeHTML(profile.season)}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <h3 class="card-title">Profildaten bearbeiten</h3>
        <p class="card-subtitle">
          Deine Angaben werden lokal in diesem Browser gespeichert.
        </p>

        <form class="form" id="profile-form" style="margin-top:20px">
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
              ${positions.map(position => `
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
              ${["Rechts", "Links", "Beidfüßig"].map(foot => `
                <option value="${foot}"
                  ${profile.preferredFoot === foot ? "selected" : ""}>
                  ${foot}
                </option>
              `).join("")}
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

          <button class="btn btn-danger" type="button" data-action="reset-data">
            Lokale App-Daten zurücksetzen
          </button>
        </form>
      </section>
    </div>
  `;
}

/* ---------- 9. SEITEN-ROUTER ---------- */

const PAGE_RENDERERS = {
  today: renderToday,
  training: renderTraining,
  analysis: renderAnalysis,
  coach: renderCoach,
  development: renderDevelopment,
  profile: renderProfile
};

function renderPage() {
  const route = getRoute();
  const page = ROUTES[route];

  document.querySelector(".loading-panel")?.remove();

  const title = document.getElementById("page-title");
  const eyebrow = document.getElementById("page-eyebrow");
  const date = document.getElementById("current-date");
  const avatar = document.getElementById("player-avatar");

  if (title) title.textContent = page.title;
  if (eyebrow) eyebrow.textContent = page.eyebrow;
  if (date) date.textContent = getDateLabel();
  if (avatar) avatar.textContent = getInitials(state.profile.name);

  root.innerHTML = PAGE_RENDERERS[route]();

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

    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
  }
}

function navigate(route) {
  if (!isValidRoute(route)) return;

  window.location.hash = `/${route}`;
}

/* ---------- 10. AKTIONEN ---------- */

function completeWorkout() {
  const today = new Date().toDateString();

  if (state.lastCompletedDate === today) {
    showToast("Heute wurde bereits eine Einheit erfasst.");
    return;
  }

  state.completedSessions += 1;
  state.lastCompletedDate = today;

  persist();
  renderPage();
  showToast("Trainingseinheit erfasst.");
}

function saveReflection() {
  const field = document.getElementById("daily-reflection");

  if (!field) return;

  state.lastReflection = field.value.trim().slice(0, 2000);

  persist();
  showToast("Reflexion gespeichert.");
}

function saveProfile(form) {
  const data = new FormData(form);

  state.profile = {
    ...state.profile,
    name: String(data.get("name") || "Spieler").trim(),
    position: String(data.get("position") || "Außenverteidiger"),
    club: String(data.get("club") || "").trim(),
    season: String(data.get("season") || "2026/27").trim(),
    preferredFoot: String(data.get("preferredFoot") || "Rechts"),
    mainGoal: String(data.get("mainGoal") || "").trim()
  };

  persist();
  renderPage();
  showToast("Spielerprofil gespeichert.");
}

function saveRatings(form) {
  const data = new FormData(form);

  for (const key of Object.keys(state.ratings)) {
    state.ratings[key] = clamp(
      data.get(key),
      LIMITS.minRating,
      LIMITS.maxRating
    );
  }

  persist();
  renderPage();
  showToast("Einschätzungen gespeichert.");
}

function sendCoachMessage(message) {
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage) return;

  if (cleanMessage.length > LIMITS.maxChatCharacters) {
    showToast("Die Nachricht ist zu lang.");
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

  state.chatHistory = state.chatHistory.slice(
    -LIMITS.maxChatMessages
  );

  persist();
  renderPage();

  document.getElementById("coach-input")?.focus();
}

function updateGoal(goalId, amount) {
  const goal = state.goals.find(item => item.id === goalId);

  if (!goal) return;

  goal.progress = clamp(goal.progress + amount, 0, 100);

  persist();
  renderPage();
  showToast("Fortschritt aktualisiert.");
}

function resetData() {
  const confirmed = window.confirm(
    "Möchtest du alle lokal gespeicherten AllCoach-Daten löschen?"
  );

  if (!confirmed) return;

  clearState();
  state = createDefaultState();

  persist();
  renderPage();
  showToast("App-Daten zurückgesetzt.");
}

/* ---------- 11. ZENTRALE EVENTS ---------- */

document.addEventListener("click", event => {
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

    case "goal-up":
      updateGoal(actionButton.dataset.goalId, 5);
      break;

    case "goal-down":
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

      if (input && input.value.trim()) {
        sendCoachMessage(input.value);
      }

      break;
    }

    default:
      break;
  }
});

document.addEventListener("input", event => {
  const input = event.target;

  if (!(input instanceof HTMLInputElement)) return;
  if (!input.classList.contains("rating-input")) return;

  const output = document.getElementById(`value-${input.name}`);

  if (output) {
    output.textContent = `${input.value}/10`;
  }
});

/* ---------- 12. START ---------- */

function startApp() {
  console.info(
    `${APP_CONFIG.name} v${APP_CONFIG.version} wird gestartet.`
  );

  if (!window.location.hash) {
    window.location.hash = `/${APP_CONFIG.defaultRoute}`;
    return;
  }

  renderPage();
}

window.addEventListener("hashchange", renderPage);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp, {
    once: true
  });
} else {
  startApp();
}
