<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <div class="title">{{ tournamentName }}</div>
        <div class="subtitle">Live bracket sync for athletes and fans</div>
      </div>

      <div class="status">
        <span class="dot" :class="connectionStatus"></span>
        <span>{{ connectionLabel }}</span>
      </div>

      <div class="chiprow">
        <span class="chip">Tournament: {{ selectedTournamentId || "Not selected" }}</span>
        <span class="chip">Version: {{ serverVersion ?? "—" }}</span>
        <span class="chip">Updated: {{ fmtDateTime(updatedAt) }}</span>
        <span class="chip">Exported: {{ fmtDateTime(exportedAt) }}</span>
        <span class="chip" v-if="mode">Mode: {{ mode }}</span>
      </div>
    </header>

    <main class="grid">
      <section class="card span-2">
        <div class="card-title">Tournament Browser</div>
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
              </div>
              <div class="hint">Base URL: {{ baseUrl }}</div>
            </div>

            <div class="field">
              <div class="field-label">Avg match time (seconds)</div>
              <div class="row">
                <input type="number" min="20" max="600" v-model.number="avgMatchSeconds" />
              </div>
              <div class="hint">Used for ETAs when the event is moving faster or slower.</div>
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
      </section>

      <section class="card span-2">
        <div class="card-title">Ready Queue</div>
        <div class="queue" v-if="readyQueue.length">
          <div v-for="m in readyQueue.slice(0, 12)" :key="`${m.bracketId}-${m.id}`" class="queue-item">
            <div class="queue-main">
              <div class="names">
                <span>{{ m.p1Name }}</span>
                <span class="vs">vs</span>
                <span>{{ m.p2Name }}</span>
              </div>
              <div class="meta">
                <span class="pill">{{ m.bracketName }}</span>
                <span class="pill">{{ m.bracketLabel }}</span>
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
        </div>
        <div class="muted" v-else>No ready matches yet. Waiting for two confirmed athletes.</div>
      </section>

      <section class="card">
        <div class="card-title">Athlete Lookup</div>
        <input v-model="athleteQuery" placeholder="Search athlete name" />

        <div v-if="!athleteQuery" class="muted">
          Type your name to see upcoming matches and ETAs.
        </div>
        <template v-else>
          <div class="subhead">Up Next</div>
          <div v-if="athleteNext" class="match-row">
            <div class="names">
              <span>{{ athleteNext.p1Name }}</span>
              <span class="vs">vs</span>
              <span>{{ athleteNext.p2Name }}</span>
            </div>
            <div class="meta">
              <span class="pill">{{ athleteNext.bracketName }}</span>
              <span class="pill">{{ athleteNext.roundLabel }}</span>
              <span class="pill">ETA {{ fmtDuration(athleteNext.etaSeconds) }}</span>
            </div>
          </div>
          <div v-else class="muted">No ready matches for this athlete yet.</div>

          <div class="subhead">Waiting on opponents</div>
          <div v-if="athleteWaiting.length" class="stack">
            <div
              v-for="match in athleteWaiting.slice(0, 6)"
              :key="`${match.bracketId}-${match.id}`"
              class="match-row"
            >
              <div class="names">
                <span>{{ match.p1Name }}</span>
                <span class="vs">vs</span>
                <span>{{ match.p2Name }}</span>
              </div>
              <div class="meta">
                <span class="pill">{{ match.bracketName }}</span>
                <span class="pill">{{ match.roundLabel }}</span>
                <span class="pill">Waiting</span>
              </div>
            </div>
          </div>
          <div v-else class="muted">No waiting matches found.</div>
        </template>
      </section>

      <section class="card">
        <div class="card-title">Tournament Stats</div>
        <div class="stat-grid">
          <div class="stat">
            <div class="k">Brackets</div>
            <div class="v">{{ stats.bracketCount }}</div>
          </div>
          <div class="stat">
            <div class="k">Athletes</div>
            <div class="v">{{ stats.athleteCount }}</div>
          </div>
          <div class="stat">
            <div class="k">Matches</div>
            <div class="v">{{ stats.totalMatches }}</div>
          </div>
          <div class="stat">
            <div class="k">Ready</div>
            <div class="v">{{ stats.readyCount }}</div>
          </div>
          <div class="stat">
            <div class="k">Waiting</div>
            <div class="v">{{ stats.waitingCount }}</div>
          </div>
          <div class="stat">
            <div class="k">Done</div>
            <div class="v">{{ stats.doneCount }}</div>
          </div>
        </div>
        <div class="hint" v-if="lastEventAt">Last update {{ fmtAge(lastEventAt) }}</div>
      </section>

      <section class="card span-2">
        <div class="card-title">Brackets Overview</div>
        <div class="brackets" v-if="bracketSummary.length">
          <div
            v-for="bracket in bracketSummary"
            :key="bracket.id"
            class="bracket-card"
            :class="{ active: bracket.id === activeBracketId }"
          >
            <div class="row">
              <div class="name">{{ bracket.name }}</div>
              <div class="badge">{{ bracket.progress }}%</div>
            </div>
            <div class="counts">
              Ready {{ bracket.readyCount }} · Waiting {{ bracket.waitingCount }} · Done
              {{ bracket.doneCount }}/{{ bracket.total }}
            </div>
            <div class="next" v-if="bracket.nextReady">
              Next: {{ bracket.nextReady.p1Name }} vs {{ bracket.nextReady.p2Name }}
              <span class="pill">{{ bracket.nextReady.roundLabel }}</span>
            </div>
            <div class="finals" v-if="bracket.finalSeries">
              Finals advantage: {{ bracket.finalSeries.advantage }} ·
              {{ bracket.finalSeries.concluded ? "Concluded" : "In progress" }}
            </div>
          </div>
        </div>
        <div v-else class="muted">No bracket data yet.</div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
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
  serverVersion,
  updatedAt,
  exportedAt,
  mode,
  connectionStatus,
  connectionError,
  lastEventAt,
  matches,
  readyQueue,
  bracketSummary,
  stats,
  avgMatchSeconds,
} = useTournament();

const manualId = ref(selectedTournamentId.value);
watch(selectedTournamentId, (value) => {
  manualId.value = value;
});

const athleteQuery = ref("");
const normalizedAthleteQuery = computed(() => normalizeText(athleteQuery.value));

const athleteReady = computed(() => {
  if (!normalizedAthleteQuery.value) return [];
  return readyQueue.value.filter((match) => match.searchText.includes(normalizedAthleteQuery.value));
});

const athleteNext = computed(() => athleteReady.value[0] || null);

const athleteWaiting = computed(() => {
  if (!normalizedAthleteQuery.value) return [];
  return matches.value.filter(
    (match) => match.status === "waiting" && match.searchText.includes(normalizedAthleteQuery.value)
  );
});

const connectionLabel = computed(() => {
  if (!selectedTournamentId.value) return "No tournament selected";
  if (connectionStatus.value === "connected") return "Live updates connected";
  if (connectionStatus.value === "reconnecting") return "Reconnecting to live updates";
  if (connectionStatus.value === "connecting") return "Connecting to live updates";
  return "Live updates idle";
});

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

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

function fmtAge(timestamp) {
  if (!timestamp) return "—";
  const delta = Math.max(0, Math.floor((nowMs.value - timestamp) / 1000));
  if (delta < 60) return `${delta}s ago`;
  const mins = Math.floor(delta / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

function fmtTimeFromNow(seconds) {
  if (seconds == null) return "—";
  const date = new Date(nowMs.value + seconds * 1000);
  return date.toLocaleTimeString();
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
.app { min-height: 100vh; display: flex; flex-direction: column; }
.topbar { padding: 18px; border-bottom: 1px solid rgba(255,255,255,.08); position: sticky; top: 0; background: rgba(10,12,18,.9); backdrop-filter: blur(10px); z-index: 5; }
.brand .title { font-size: 22px; font-weight: 700; }
.brand .subtitle { font-size: 13px; opacity: .75; margin-top: 4px; }

.status { display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; opacity: .85; }
.dot { width: 8px; height: 8px; border-radius: 999px; background: rgba(255,255,255,.35); }
.dot.connected { background: #33d38c; }
.dot.reconnecting { background: #f3b24a; }
.dot.connecting { background: #77a2ff; }

.chiprow { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.chip { font-size: 12px; padding: 6px 10px; border: 1px solid rgba(255,255,255,.12); border-radius: 999px; background: rgba(255,255,255,.04); }

.grid { padding: 18px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.span-2 { grid-column: span 2; }
.card { border: 1px solid rgba(255,255,255,.10); border-radius: 16px; background: rgba(255,255,255,.03); padding: 14px; }
.card-title { font-size: 13px; letter-spacing: .06em; text-transform: uppercase; opacity: .85; margin-bottom: 10px; }

.picker { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.pane { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 12px; opacity: .7; text-transform: uppercase; letter-spacing: .06em; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.hint { font-size: 12px; opacity: .65; }
.error { color: #ff8b8b; font-size: 12px; }

.list { display: grid; gap: 10px; }
.list-item { text-align: left; padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.2); }
.list-item.active { border-color: rgba(120,160,255,.8); box-shadow: 0 0 0 1px rgba(120,160,255,.3); }
.list-title { font-weight: 700; }
.list-meta { font-size: 12px; opacity: .7; margin-top: 4px; }

.queue { display: grid; gap: 12px; }
.queue-item { display: flex; justify-content: space-between; gap: 12px; padding: 10px; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; background: rgba(0,0,0,.2); }
.queue-main { display: flex; flex-direction: column; gap: 6px; }
.names { font-weight: 700; }
.vs { margin: 0 6px; opacity: .6; font-size: 12px; font-weight: 500; }
.meta { display: flex; flex-wrap: wrap; gap: 6px; }
.pill { font-size: 11px; padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.10); }
.queue-eta { min-width: 140px; text-align: right; }
.small { font-size: 11px; opacity: .75; }
.big { font-size: 18px; font-weight: 800; margin-top: 4px; }
.muted { opacity: .65; }
.subhead { margin-top: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; opacity: .7; }
.match-row { margin-top: 8px; padding: 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,.08); background: rgba(0,0,0,.18); }
.stack { display: grid; gap: 8px; }

.stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.stat { padding: 8px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,.08); background: rgba(0,0,0,.18); }
.stat .k { font-size: 12px; opacity: .7; }
.stat .v { font-size: 18px; font-weight: 800; margin-top: 6px; }

.brackets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.bracket-card { padding: 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,.08); background: rgba(0,0,0,.18); display: flex; flex-direction: column; gap: 8px; }
.bracket-card.active { border-color: rgba(51,211,140,.6); box-shadow: 0 0 0 1px rgba(51,211,140,.2); }
.bracket-card .name { font-weight: 700; }
.badge { font-size: 11px; padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); }
.counts { font-size: 12px; opacity: .75; }
.next { font-size: 12px; }
.finals { font-size: 12px; opacity: .8; }

@media (max-width: 980px) {
  .grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
  .picker { grid-template-columns: 1fr; }
  .brackets { grid-template-columns: 1fr; }
  .queue-item { flex-direction: column; text-align: left; }
  .queue-eta { text-align: left; }
}
</style>
