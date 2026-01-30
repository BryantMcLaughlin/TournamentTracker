<template>
  <div class="app">
    <div class="fx fx-glow" aria-hidden="true"></div>
    <div class="fx fx-grid" aria-hidden="true"></div>
    <div class="fx fx-scan" aria-hidden="true"></div>
    <header class="topbar" :class="connectionStatus">
      <div class="topbar-main">
        <div class="brand">
          <div class="brand-icon" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="brand-text">
            <div class="title">{{ headingTitle }}</div>
            <div class="subtitle">
              <span v-if="hasTournament">Live bracket status for athletes</span>
              <span v-else>Select a tournament to begin.</span>
            </div>
          </div>
        </div>

        <div class="status">
          <span class="dot" :class="connectionStatus"></span>
          <span class="status-text">{{ connectionLabel }}</span>
        </div>
      </div>

      <div class="topbar-stats" v-if="hasTournament">
        <div class="top-stat wide glow">
          <div class="k">Active Bracket</div>
          <div class="v">{{ activeBracketName }}</div>
          <div class="s">{{ stats.bracketCount }} brackets</div>
        </div>
        <div class="top-stat highlight">
          <div class="k">Progress</div>
          <div class="v">{{ overallProgress }}%</div>
          <div class="s">{{ stats.doneCount }}/{{ stats.totalMatches }} done</div>
          <div class="meter">
            <span :style="{ width: `${overallProgress}%` }"></span>
          </div>
        </div>
        <div class="top-stat">
          <div class="k">Athletes</div>
          <div class="v">{{ stats.athleteCount }}</div>
          <div class="s">Ready {{ stats.readyCount }}</div>
        </div>
        <div class="top-stat">
          <div class="k">Waiting</div>
          <div class="v">{{ stats.waitingCount }}</div>
          <div class="s">Matches</div>
        </div>
        <div class="top-stat">
          <div class="k">Matches</div>
          <div class="v">{{ stats.totalMatches }}</div>
          <div class="s">Total</div>
        </div>
      </div>
    </header>

    <main class="content">
      <div class="now-row" v-if="displayNowList.length">
        <section
          v-for="match in displayNowList"
          :key="match.key"
          class="card now-card"
          :class="{
            pulse: nowAdvancePulse,
            decision: decisionHighlightId === match.sourceId,
            pop: decisionPop && decisionHighlightId === match.sourceId
          }"
        >
          <div class="now-head">
            <div class="card-title">Now Up</div>
          </div>
          <div
            v-if="swooshActive && decisionHighlightId === match.sourceId"
            class="swoosh"
            :class="swooshSide"
            aria-hidden="true"
          ></div>
          <Transition name="now-swap" mode="out-in">
            <div v-if="match" :key="match.key" class="now-hero">
              <div class="now-names">
                <span class="name left" :style="nameStyle(match.p1Name)">{{ match.p1Name }}</span>
                <span class="vs">vs</span>
                <span class="name right" :style="nameStyle(match.p2Name)">{{ match.p2Name }}</span>
              </div>
            </div>
            <div v-else key="empty" class="muted">
              No ready matches yet. Waiting for two confirmed athletes.
            </div>
          </Transition>
        </section>
      </div>
      <section
        v-else
        class="card now-card"
        :class="{ pulse: nowAdvancePulse, decision: recentDecision, pop: decisionPop }"
      >
        <div class="now-head">
          <div class="card-title">Now Up</div>
        </div>
        <Transition name="now-swap" mode="out-in">
          <div key="empty" class="muted">
            No ready matches yet. Waiting for two confirmed athletes.
          </div>
        </Transition>
      </section>

      <div v-if="hasTournament" class="columns">
        <section class="card brackets-card">
          <div class="card-title">Bracket Overview</div>
          <TransitionGroup name="fade-swipe" tag="div" class="brackets" v-if="bracketSummary.length">
            <div
              v-for="bracket in visibleBrackets"
              :key="bracket.id"
              class="bracket-row"
              :class="{ active: bracket.id === activeBracketId, ready: bracket.readyCount > 0 }"
            >
              <div class="bracket-main">
                <div class="bracket-head">
                  <div class="bracket-name">{{ bracket.name }}</div>
                  <div class="bracket-tags">
                    <span class="pill" v-if="bracketHand(bracket.name)">
                      {{ bracketHand(bracket.name) }}
                    </span>
                    <span class="pill active-pill" v-if="bracket.id === activeBracketId">Active</span>
                    <span class="badge">{{ bracket.progress }}%</span>
                  </div>
                </div>
                <div class="bracket-meta">
                  <span>Ready {{ bracket.readyCount }}</span>
                  <span>Waiting {{ bracket.waitingCount }}</span>
                  <span>Done {{ bracket.doneCount }}/{{ bracket.total }}</span>
                </div>
                <div class="bracket-progress">
                  <span :style="{ width: `${bracket.progress}%` }"></span>
                </div>
                <div class="bracket-next" v-if="bracket.nextReady">
                  Next: {{ bracket.nextReady.p1Name }} vs {{ bracket.nextReady.p2Name }}
                  <span class="pill">{{ bracket.nextReady.roundLabel }}</span>
                </div>
              </div>
            </div>
          </TransitionGroup>
          <div v-if="hiddenBracketCount > 0" class="muted">
            +{{ hiddenBracketCount }} more brackets not shown
          </div>
          <div v-if="!bracketSummary.length" class="muted">No bracket data yet.</div>
        </section>

        <section class="card queue-card">
          <div class="card-title">Ready Queue</div>
          <div class="queue" v-if="readyQueue.length">
            <div v-if="hasQueueExtras">
              <div class="queue-section" v-if="onDeckMatches.length">
                <div class="section-title">On Deck</div>
                <TransitionGroup name="slide-up" tag="div" class="stack">
                  <div
                    v-for="(m, index) in onDeckMatches"
                    :key="`${m.bracketId}-${m.id}`"
                    class="queue-item"
                    :class="{ hot: index === 0 }"
                    :style="{ '--i': index }"
                  >
                    <div class="queue-main">
                      <div class="names">
                        <span>{{ m.p1Name }}</span>
                        <span class="vs">vs</span>
                        <span>{{ m.p2Name }}</span>
                      </div>
                      <div class="meta">
                        <span class="pill">{{ m.bracketName }}</span>
                        <span class="pill">{{ m.roundLabel }}</span>
                        <span class="pill" v-if="m.bestOf">Bo{{ m.bestOf }}</span>
                      </div>
                    </div>
                    <div class="queue-eta">
                      <div class="small">ETA</div>
                      <div class="big">{{ fmtDuration(m.etaSeconds) }}</div>
                      <div class="small muted">~{{ fmtTimeFromNow(m.etaSeconds) }}</div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>

              <div class="queue-section" v-if="laterMatches.length">
                <div class="section-title">Coming Up</div>
                <TransitionGroup name="fade-rise" tag="div" class="stack">
                  <div
                    v-for="(m, index) in laterMatches"
                    :key="`${m.bracketId}-${m.id}`"
                    class="queue-item muted-row"
                    :style="{ '--i': index }"
                  >
                    <div class="queue-main">
                      <div class="names">
                        <span>{{ m.p1Name }}</span>
                        <span class="vs">vs</span>
                        <span>{{ m.p2Name }}</span>
                      </div>
                      <div class="meta">
                        <span class="pill">{{ m.bracketName }}</span>
                        <span class="pill">{{ m.roundLabel }}</span>
                        <span class="pill" v-if="m.bestOf">Bo{{ m.bestOf }}</span>
                      </div>
                    </div>
                    <div class="queue-eta">
                      <div class="small">ETA</div>
                      <div class="big">{{ fmtDuration(m.etaSeconds) }}</div>
                      <div class="small muted">~{{ fmtTimeFromNow(m.etaSeconds) }}</div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </div>
            <div v-else class="muted">No additional matches queued yet.</div>
          </div>
          <div class="muted" v-else>No ready matches yet. Waiting for two confirmed athletes.</div>
        </section>
      </div>

      <section class="card browser-card">
        <div class="browser-header">
          <div class="card-title">Tournament Browser</div>
          <button v-if="selectedTournamentId" class="ghost" @click="browserOpen = !browserOpen">
            {{ browserOpen ? "Hide" : "Show" }} browser
          </button>
        </div>
        <div class="browser-body" v-show="browserOpen || !selectedTournamentId">
          <div class="picker">
            <div class="pane">
              <div class="field">
                <div class="field-label">Connect by tournament ID</div>
                <div class="row">
                  <input
                    v-model="manualId"
                    placeholder="Tournament ID (UUID)"
                    @keyup.enter="setTournamentId(manualId)"
                  />
                  <button @click="setTournamentId(manualId)">Connect</button>
                  <button @click="refreshTournaments" :disabled="tournamentsStatus === 'loading'">
                    Refresh
                  </button>
                  <button v-if="selectedTournamentId" @click="setTournamentId('')">Disconnect</button>
                </div>
                <div class="hint">Base URL: {{ baseUrl }}</div>
              </div>

              <div class="error" v-if="connectionError">{{ connectionError }}</div>
            </div>

            <div class="pane">
              <div class="field-label">Recent tournaments</div>
              <div class="list" v-if="tournaments.length">
                <button
                  v-for="t in tournaments"
                  :key="t.id"
                  class="list-item"
                  :class="{ active: t.id === selectedTournamentId }"
                  @click="setTournamentId(t.id)"
                >
                  <div class="list-title">{{ tournamentLabel(t) }}</div>
                  <div class="list-meta">
                    Updated {{ fmtDateTime(t.updated_at) }} · v{{ t.server_version }}
                  </div>
                </button>
              </div>
              <div class="muted" v-else>No tournaments yet.</div>
              <div class="error" v-if="tournamentsError">{{ tournamentsError }}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
    <Transition name="toast-rise">
      <div v-if="recentDecision" class="decision-toast" role="status" aria-live="polite">
        <div class="toast-title">Match decided</div>
        <div class="toast-match">{{ recentDecision.matchLabel }}</div>
        <div class="toast-meta">
          <span>{{ recentDecision.bracketName }}</span>
          <span>{{ recentDecision.roundLabel }}</span>
        </div>
        <div class="toast-result" v-if="recentDecision.winnerName">
          <span class="winner">{{ recentDecision.winnerName }}</span>
          <span class="loser" v-if="recentDecision.loserName">{{ recentDecision.loserName }}</span>
        </div>
        <div class="toast-result muted" v-else>Result synced.</div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTournament } from "./tournament/useTournament";

const {
  baseUrl,
  nowMs,
  tournaments,
  tournamentsStatus,
  tournamentsError,
  selectedTournamentId,
  setTournamentId,
  refreshTournaments,
  tournamentName,
  activeBracketId,
  connectionStatus,
  connectionError,
  readyQueue,
  bracketSummary,
  stats,
  matches,
  payload,
} = useTournament();

const route = useRoute();
const router = useRouter();

const manualId = ref(selectedTournamentId.value);
watch(selectedTournamentId, (value) => {
  manualId.value = value;
});

const browserOpen = ref(!selectedTournamentId.value);
watch(selectedTournamentId, (value) => {
  browserOpen.value = !value;
});

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function matchKey(match) {
  if (!match) return "";
  const value =
    match.id ??
    match.match_id ??
    match.matchId ??
    match.matchID ??
    match.matchid ??
    match.match?.id ??
    null;
  return value == null ? "" : String(value);
}

function matchDisplayKey(match, p1Name = "", p2Name = "") {
  const direct = matchKey(match);
  if (direct) return direct;
  const left = normalizeName(
    p1Name ||
      match?.p1Name ||
      match?.p1?.name ||
      match?.p1 ||
      match?.athletes?.a ||
      match?.a
  );
  const right = normalizeName(
    p2Name ||
      match?.p2Name ||
      match?.p2?.name ||
      match?.p2 ||
      match?.athletes?.b ||
      match?.b
  );
  if (!left && !right) return "";
  return `${left}::${right}`;
}

const NAME_FONT_MAX = 32;
const NAME_FONT_MIN = 16;

function nameStyle(name) {
  const len = String(name || "").length;
  // Scale down gently for longer names while keeping a readable floor.
  let size = NAME_FONT_MAX - Math.max(0, len - 12) * 0.45;
  if (len > 28) size -= (len - 28) * 0.25;
  size = Math.max(NAME_FONT_MIN, Math.min(NAME_FONT_MAX, size));
  return { fontSize: `${size}px` };
}

const routeTournamentId = computed(() => {
  const value = route.params.tournamentId;
  if (Array.isArray(value)) return value[0] || "";
  return String(value || "");
});

watch(
  routeTournamentId,
  (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return;
    if (trimmed !== selectedTournamentId.value) {
      setTournamentId(trimmed);
    }
  },
  { immediate: true }
);

watch(
  selectedTournamentId,
  (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      if (routeTournamentId.value) {
        router.replace({ path: "/" });
      }
      return;
    }
    if (trimmed !== routeTournamentId.value) {
      router.replace({ path: `/${trimmed}` });
    }
  },
  { immediate: true }
);

const hasTournament = computed(() => Boolean(payload.value && payload.value.brackets));
const headingTitle = computed(() =>
  hasTournament.value ? tournamentName.value : "Tournament Tracker"
);

const activeBracket = computed(
  () => bracketSummary.value.find((bracket) => bracket.id === activeBracketId.value) || null
);
const activeBracketName = computed(() => activeBracket.value?.name || "—");

const overallProgress = computed(() => {
  if (!stats.value.totalMatches) return 0;
  return Math.round((stats.value.doneCount / stats.value.totalMatches) * 100);
});

const BRACKET_LIMIT = 10;
const ON_DECK_COUNT = 2;
const LATER_COUNT = 8;

const nowAdvancePulse = ref(false);
const recentDecision = ref(null);
const decisionMatch = ref(null);
const decisionHighlightId = ref(null);
const swooshActive = ref(false);
const swooshSide = ref("left");
const decisionPop = ref(false);
let nowPulseTimer = null;
let decisionToastTimer = null;
let swooshTimer = null;
let decisionPopTimer = null;

const currentMatches = computed(() => payload.value?.current_matches || []);

const displayNowList = computed(() => {
  if (currentMatches.value.length) {
    return currentMatches.value.map((m, index) => {
      const p1Name =
        m.p1Name ||
        m.p1?.name ||
        m.p1 ||
        m.athletes?.a ||
        m.a ||
        (typeof m === "string" ? m : "") ||
        "TBD";
      const p2Name =
        m.p2Name ||
        m.p2?.name ||
        m.p2 ||
        m.athletes?.b ||
        m.b ||
        (typeof m === "string" ? m : "") ||
        "TBD";
      const sourceId = matchDisplayKey(m, p1Name, p2Name) || `current-${index}`;
      return {
        key: sourceId,
        sourceId,
        p1Name,
        p2Name,
      };
    });
  }
  const first = readyQueue.value[0];
  if (first) {
    const sourceId =
      matchDisplayKey(first, first.p1Name, first.p2Name) ||
      `${first.bracketId}-${first.id || "ready"}`;
    return [
      {
        key: sourceId,
        sourceId,
        p1Name: first.p1Name,
        p2Name: first.p2Name,
      },
    ];
  }
  return [];
});

const sortedBrackets = computed(() => {
  const list = bracketSummary.value.slice();
  const activeId = activeBracketId.value;
  return list.sort((a, b) => {
    const aActive = a.id === activeId;
    const bActive = b.id === activeId;
    if (aActive && !bActive) return -1;
    if (bActive && !aActive) return 1;
    const aReady = a.readyCount > 0;
    const bReady = b.readyCount > 0;
    if (aReady && !bReady) return -1;
    if (bReady && !aReady) return 1;
    return b.progress - a.progress;
  });
});

const visibleBrackets = computed(() => sortedBrackets.value.slice(0, BRACKET_LIMIT));
const hiddenBracketCount = computed(() =>
  Math.max(0, bracketSummary.value.length - visibleBrackets.value.length)
);

const nowMatch = computed(() => readyQueue.value[0] || null);
const onDeckMatches = computed(() => readyQueue.value.slice(1, 1 + ON_DECK_COUNT));
const laterMatches = computed(() =>
  readyQueue.value.slice(1 + ON_DECK_COUNT, 1 + ON_DECK_COUNT + LATER_COUNT)
);
const hasQueueExtras = computed(
  () => onDeckMatches.value.length > 0 || laterMatches.value.length > 0
);

watch(
  () => matchDisplayKey(nowMatch.value),
  (id, prev) => {
    if (!prev || !id || id === prev) return;
    nowAdvancePulse.value = true;
    if (nowPulseTimer) window.clearTimeout(nowPulseTimer);
    nowPulseTimer = window.setTimeout(() => {
      nowAdvancePulse.value = false;
    }, 1400);
  }
);

watch(
  matches,
  (list, prev = []) => {
    if (!Array.isArray(list) || !Array.isArray(prev)) return;
    const prevDoneIds = new Set(prev.filter((m) => m.done).map((m) => matchDisplayKey(m)));
    const newlyDone = list.filter(
      (m) => m.done && !prevDoneIds.has(matchDisplayKey(m)) && !m.hasBye
    );
    if (!newlyDone.length) return;
    const decided = newlyDone[0];
    const decidedId = matchDisplayKey(decided);
    const winnerName = extractWinnerName(decided);
    const loserName =
      winnerName === decided.p1Name
        ? decided.p2Name
        : winnerName === decided.p2Name
          ? decided.p1Name
          : "";
    const winnerSide =
      winnerName === decided.p1Name ? "left" : winnerName === decided.p2Name ? "right" : "left";
    decisionMatch.value = {
      id: decidedId,
      p1Name: decided.p1Name,
      p2Name: decided.p2Name,
      bracketName: decided.bracketName,
      roundLabel: decided.roundLabel,
      bestOf: decided.bestOf,
    };
    decisionHighlightId.value = decidedId;
    swooshSide.value = winnerSide;
    swooshActive.value = true;
    decisionPop.value = true;
    recentDecision.value = {
      id: decided.id,
      matchLabel: `${decided.p1Name} vs ${decided.p2Name}`,
      roundLabel: decided.roundLabel,
      bracketName: decided.bracketName,
      winnerName,
      loserName,
    };
    if (decisionToastTimer) window.clearTimeout(decisionToastTimer);
    decisionToastTimer = window.setTimeout(() => {
      recentDecision.value = null;
    }, 4200);
    if (swooshTimer) window.clearTimeout(swooshTimer);
    swooshTimer = window.setTimeout(() => {
      swooshActive.value = false;
    }, 1100);
    if (decisionPopTimer) window.clearTimeout(decisionPopTimer);
    decisionPopTimer = window.setTimeout(() => {
      decisionPop.value = false;
    decisionHighlightId.value = null;
    }, 520);
  },
  { flush: "post" }
);

onBeforeUnmount(() => {
  if (nowPulseTimer) window.clearTimeout(nowPulseTimer);
  if (decisionToastTimer) window.clearTimeout(decisionToastTimer);
  if (decisionDisplayTimer) window.clearTimeout(decisionDisplayTimer);
  if (swooshTimer) window.clearTimeout(swooshTimer);
  if (decisionPopTimer) window.clearTimeout(decisionPopTimer);
});

const connectionLabel = computed(() => {
  if (!selectedTournamentId.value) return "No tournament selected";
  if (connectionStatus.value === "connected") return "Live updates connected";
  if (connectionStatus.value === "reconnecting") return "Reconnecting to live updates";
  if (connectionStatus.value === "connecting") return "Connecting to live updates";
  return "Live updates idle";
});

function fmtDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function fmtDuration(seconds) {
  if (seconds == null) return "—";
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (!mins) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function fmtTimeFromNow(seconds) {
  if (seconds == null) return "—";
  const date = new Date(nowMs.value + seconds * 1000);
  return date.toLocaleTimeString();
}

function bracketHand(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/([RL])$/);
  if (!match) return "";
  return match[1] === "R" ? "Right" : "Left";
}

function extractWinnerName(match) {
  if (!match) return "";
  if (match.winner?.name) return match.winner.name;
  if (match.winner_name) return match.winner_name;
  if (match.winnerName) return match.winnerName;
  if (typeof match.winner === "string") return match.winner;
  return "";
}

function tournamentLabel(tournament) {
  return (
    tournament?.meta?.tournament_name ||
    tournament?.meta?.name ||
    tournament?.id ||
    "Tournament"
  );
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.fx {
  position: fixed;
  inset: -15%;
  pointer-events: none;
  z-index: 0;
}
.fx-glow {
  background: radial-gradient(700px 460px at 20% 10%, rgba(110, 210, 255, 0.25), transparent 60%),
    radial-gradient(900px 520px at 80% 0%, rgba(255, 120, 210, 0.18), transparent 55%);
  filter: blur(40px);
  opacity: 0.7;
  animation: glowPulse 10s ease-in-out infinite;
}
.fx-grid {
  background-image: linear-gradient(rgba(120, 180, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 180, 255, 0.08) 1px, transparent 1px);
  background-size: 120px 120px;
  transform: perspective(900px) rotateX(65deg);
  transform-origin: top;
  opacity: 0.25;
  animation: gridDrift 28s linear infinite;
}
.fx-scan {
  background: linear-gradient(180deg, transparent, rgba(120, 190, 255, 0.18), transparent);
  mix-blend-mode: screen;
  opacity: 0.35;
  animation: scanline 7s linear infinite;
}

.topbar {
  padding: 24px 22px 18px;
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: linear-gradient(140deg, rgba(12, 16, 30, 0.96), rgba(6, 8, 16, 0.92));
  backdrop-filter: blur(16px);
}
.topbar::after {
  content: "";
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(120, 200, 255, 0.55), transparent);
  opacity: 0.6;
}
.topbar.connected::after {
  opacity: 0.9;
}

.topbar-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  position: relative;
  background: radial-gradient(circle at 30% 30%, rgba(140, 220, 255, 0.75), rgba(40, 80, 140, 0.6));
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.brand-icon span {
  position: absolute;
  left: 10px;
  right: 10px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.85));
  opacity: 0.75;
  animation: brandPulse 2.6s ease-in-out infinite;
}
.brand-icon span:nth-child(1) { top: 10px; animation-delay: 0s; }
.brand-icon span:nth-child(2) { top: 19px; animation-delay: 0.3s; }
.brand-icon span:nth-child(3) { top: 28px; animation-delay: 0.6s; }
.brand-text .title { font-size: 28px; font-weight: 800; letter-spacing: 0.01em; }
.brand-text .subtitle { font-size: 13px; opacity: 0.7; margin-top: 4px; }

.status {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  opacity: 0.85;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(8, 12, 22, 0.7);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.status-text { white-space: nowrap; }
.dot { width: 8px; height: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.35); box-shadow: 0 0 12px rgba(120, 180, 255, 0.3); }
.dot.connected { background: #33d38c; box-shadow: 0 0 12px rgba(51, 211, 140, 0.7); }
.dot.reconnecting { background: #f3b24a; box-shadow: 0 0 12px rgba(243, 178, 74, 0.6); }
.dot.connecting { background: #77a2ff; box-shadow: 0 0 12px rgba(119, 162, 255, 0.6); }

.topbar-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}
.top-stat {
  padding: 14px 14px 16px;
  border-radius: 18px;
  background: rgba(10, 14, 26, 0.75);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
}
.top-stat::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(140deg, rgba(120, 200, 255, 0.08), transparent 60%);
  opacity: 0.8;
}
.top-stat.wide { grid-column: span 2; }
.top-stat.glow { background: linear-gradient(160deg, rgba(18, 30, 62, 0.95), rgba(8, 12, 22, 0.8)); }
.top-stat.highlight { box-shadow: 0 20px 40px rgba(60, 120, 255, 0.25); }
.top-stat .k { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.12em; }
.top-stat .v { font-size: 19px; font-weight: 800; margin-top: 8px; position: relative; }
.top-stat .s { font-size: 11px; opacity: 0.7; margin-top: 4px; }
.meter {
  margin-top: 10px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}
.meter span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(120, 200, 255, 0.9), rgba(120, 255, 210, 0.8));
  box-shadow: 0 0 12px rgba(120, 200, 255, 0.6);
}

.content {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  z-index: 1;
}

.card {
  border-radius: 22px;
  background: linear-gradient(150deg, rgba(12, 16, 28, 0.92), rgba(8, 10, 18, 0.86));
  padding: 18px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.4);
}
.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(120, 190, 255, 0.08), transparent 60%);
  opacity: 0.8;
  pointer-events: none;
}
.card-title {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.75;
  margin-bottom: 12px;
}

.now-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.now-card {
  background: radial-gradient(1200px 400px at 10% -20%, rgba(120, 180, 255, 0.25), transparent 60%),
    linear-gradient(130deg, rgba(16, 28, 60, 0.95), rgba(6, 10, 20, 0.9));
  min-height: 200px;
  flex: 1 1 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.now-card.pulse::after {
  content: "";
  position: absolute;
  inset: -20% -10%;
  background: radial-gradient(circle, rgba(120, 200, 255, 0.35), transparent 60%);
  animation: nowPulse 1.4s ease-out;
}
.now-card.decision {
  box-shadow: 0 25px 55px rgba(60, 140, 255, 0.35);
}
.now-card.pop {
  animation: decisionHop 0.5s ease-out;
}
.now-head {
  position: absolute;
  top: 18px;
  left: 20px;
  z-index: 2;
}
.now-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0;
  position: relative;
  z-index: 1;
}
.now-names {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.5fr);
  justify-items: start;
  align-items: center;
  gap: clamp(12px, 5vw, 80px);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5%;
  font-size: clamp(20px, 3.8vw, 34px);
  font-weight: 800;
  letter-spacing: 0.02em;
  text-shadow: 0 10px 30px rgba(120, 200, 255, 0.35);
}
.now-names .name {
  padding: 8px 0;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  word-break: normal;
  max-width: 100%;
  justify-self: center;
  line-height: 1.15;
}
.now-names .left { text-align: left; transform: translateY(-46px); }
.now-names .right { text-align: left; justify-self: start; transform: translateY(46px); }
.now-names .vs {
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: transparent;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(120, 220, 255, 0.9));
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: 0 12px 28px rgba(120, 200, 255, 0.8);
  position: relative;
}
.now-names .vs::before,
.now-names .vs::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 26px;
  height: 2px;
  background: linear-gradient(90deg, rgba(120, 220, 255, 0.1), rgba(120, 220, 255, 0.9));
  transform: translateY(-50%);
  box-shadow: 0 0 12px rgba(120, 220, 255, 0.7);
}
.now-names .vs::before { right: calc(100% + 10px); }
.now-names .vs::after { left: calc(100% + 10px); }

.swoosh {
  display: none !important;
}

.decision-toast {
  position: fixed;
  left: 50%;
  bottom: 26px;
  transform: translateX(-50%);
  background: linear-gradient(140deg, rgba(18, 42, 78, 0.95), rgba(10, 14, 26, 0.92));
  padding: 14px 18px;
  border-radius: 18px;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.5);
  z-index: 6;
  min-width: 280px;
  text-align: center;
}
.toast-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.75; }
.toast-match { font-weight: 700; margin-top: 6px; }
.toast-meta { display: flex; justify-content: center; gap: 10px; font-size: 11px; opacity: 0.7; margin-top: 4px; }
.toast-result { display: flex; justify-content: center; gap: 10px; align-items: center; margin-top: 8px; font-size: 12px; }
.toast-result .winner {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(60, 220, 150, 0.18);
  color: #7dffcf;
}
.toast-result .loser { opacity: 0.6; }

.columns { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 18px; align-items: start; }

.brackets { display: grid; gap: 12px; }
.bracket-row {
  padding: 14px 14px 16px;
  border-radius: 18px;
  background: rgba(10, 14, 24, 0.75);
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 36px rgba(0, 0, 0, 0.35);
}
.bracket-row::before {
  content: "";
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(120, 180, 255, 0.7), rgba(120, 255, 220, 0.6));
  opacity: 0.35;
}
.bracket-row.ready::before { opacity: 0.7; }
.bracket-row.active { box-shadow: 0 22px 48px rgba(60, 200, 140, 0.35); }
.bracket-row.active::before { opacity: 1; }
.bracket-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.bracket-name { font-weight: 700; font-size: 16px; }
.bracket-tags { display: inline-flex; gap: 6px; align-items: center; }
.bracket-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; opacity: 0.7; margin-top: 6px; }
.bracket-progress {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  margin-top: 10px;
  overflow: hidden;
}
.bracket-progress span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(120, 200, 255, 0.9), rgba(120, 255, 210, 0.85));
  box-shadow: 0 0 16px rgba(120, 200, 255, 0.6);
}
.bracket-next { font-size: 12px; margin-top: 10px; opacity: 0.8; }

.queue { display: flex; flex-direction: column; gap: 16px; }
.queue-section { display: flex; flex-direction: column; gap: 8px; }
.section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; opacity: 0.7; }
.queue-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(8, 12, 20, 0.85);
  position: relative;
  overflow: hidden;
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.35);
}
.queue-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  background: linear-gradient(180deg, rgba(120, 180, 255, 0.8), rgba(120, 255, 210, 0.8));
  opacity: 0.4;
}
.queue-item.hot::before { opacity: 1; }
.queue-main { display: flex; flex-direction: column; gap: 6px; }
.names { font-weight: 700; }
.names.big { font-size: 20px; }
.vs { margin: 0 6px; opacity: 0.6; font-size: 12px; font-weight: 500; }
.meta { display: flex; flex-wrap: wrap; gap: 6px; }
.pill {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.active-pill { background: rgba(60, 220, 150, 0.15); color: #7dffcf; }
.queue-eta { min-width: 140px; text-align: right; }
.small { font-size: 11px; opacity: 0.75; }
.big { font-size: 18px; font-weight: 800; margin-top: 4px; }
.muted { opacity: 0.65; }
.muted-row { opacity: 0.75; }
.stack { display: grid; gap: 10px; }

.browser-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ghost { background: transparent; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2); }
.browser-body { margin-top: 12px; }
.picker { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.pane { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 12px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.12em; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.hint { font-size: 12px; opacity: 0.65; }
.error { color: #ff9fa5; font-size: 12px; }

.list { display: grid; gap: 12px; }
.list-item {
  text-align: left;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(8, 12, 20, 0.8);
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.3);
}
.list-item.active {
  box-shadow: 0 18px 36px rgba(120, 180, 255, 0.35);
}
.list-title { font-weight: 700; }
.list-meta { font-size: 12px; opacity: 0.7; margin-top: 4px; }

.now-swap-enter-active,
.now-swap-leave-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.now-swap-enter-from,
.now-swap-leave-to { opacity: 0; transform: translateY(8px); }

.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
  transition-delay: calc(var(--i, 0) * 40ms);
}
.slide-up-enter-from { opacity: 0; transform: translateY(12px) scale(0.98); }
.slide-up-leave-to { opacity: 0; transform: translateY(-12px) scale(0.98); }
.slide-up-move { transition: transform 0.35s ease; }

.fade-rise-enter-active,
.fade-rise-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
  transition-delay: calc(var(--i, 0) * 30ms);
}
.fade-rise-enter-from { opacity: 0; transform: translateY(10px); }
.fade-rise-leave-to { opacity: 0; transform: translateY(-8px); }
.fade-rise-move { transition: transform 0.35s ease; }

.fade-swipe-enter-active,
.fade-swipe-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.fade-swipe-enter-from { opacity: 0; transform: translateX(-12px); }
.fade-swipe-leave-to { opacity: 0; transform: translateX(12px); }
.fade-swipe-move { transition: transform 0.35s ease; }

.toast-rise-enter-active,
.toast-rise-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.toast-rise-enter-from { opacity: 0; transform: translate(-50%, 10px); }
.toast-rise-leave-to { opacity: 0; transform: translate(-50%, 16px); }

@keyframes glowPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.85; }
}
@keyframes gridDrift {
  0% { transform: perspective(900px) rotateX(65deg) translateY(0); }
  100% { transform: perspective(900px) rotateX(65deg) translateY(120px); }
}
@keyframes scanline {
  0% { transform: translateY(-30%); }
  100% { transform: translateY(30%); }
}
@keyframes brandPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.95; }
}
@keyframes nowPulse {
  0% { opacity: 0; transform: scale(0.9); }
  50% { opacity: 0.7; }
  100% { opacity: 0; transform: scale(1.1); }
}
@keyframes decisionHop {
  0% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-4px) scale(1.015); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes swooshLeft {}
@keyframes swooshRight {}

@media (max-width: 1200px) {
  .topbar-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .top-stat.wide { grid-column: span 3; }
  .columns { grid-template-columns: 1fr; }
  .queue-eta { text-align: left; }
  .now-names { font-size: clamp(18px, 3.6vw, 28px); gap: 28px; width: min(900px, 96%); padding: 0 5%; }
  .now-names .left { transform: translateY(-28px); }
  .now-names .right { transform: translateY(28px); }
  .now-names .vs { font-size: 24px; letter-spacing: 0.2em; }
}

@media (max-width: 900px) {
  .topbar-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .top-stat.wide { grid-column: span 2; }
  .picker { grid-template-columns: 1fr; }
  .queue-item { flex-direction: column; text-align: left; }
  .brand-text .title { font-size: 24px; }
  .now-names { font-size: clamp(17px, 4.4vw, 24px); gap: 18px; width: min(760px, 96%); padding: 0 4%; }
  .now-names .left { transform: translateY(-20px); }
  .now-names .right { transform: translateY(20px); }
  .now-names .vs { font-size: 20px; letter-spacing: 0.18em; }
  .decision-toast { width: calc(100% - 40px); }
}

@media (max-width: 700px) {
  .now-row { flex-direction: column; }
  .now-card { min-height: 230px; }
  .now-hero { align-items: flex-start; }
  .now-names {
    grid-template-columns: 1fr;
    gap: 10px;
    width: 100%;
    padding: 0 12px;
    text-align: center;
  }
  .now-names .left,
  .now-names .right {
    transform: none;
    text-align: center;
  }
  .now-names .vs {
    order: 2;
    justify-self: center;
    font-size: 18px;
    letter-spacing: 0.12em;
    position: static;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fx-glow,
  .fx-grid,
  .fx-scan,
  .brand-icon span,
  .now-card.pulse::after,
  .swoosh,
  .now-card.pop {
    animation: none;
  }
  .now-swap-enter-active,
  .now-swap-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active,
  .slide-up-move,
  .fade-rise-enter-active,
  .fade-rise-leave-active,
  .fade-rise-move,
  .fade-swipe-enter-active,
  .fade-swipe-leave-active,
  .fade-swipe-move,
  .toast-rise-enter-active,
  .toast-rise-leave-active {
    transition-duration: 0ms;
  }
}
</style>
