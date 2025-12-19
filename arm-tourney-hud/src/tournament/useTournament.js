import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
// import { createTestTournamentState } from "./testData.js";


/**
 * Data model:
 * tables: [{ id, name }]
 * queue:  [{ id, weightClass, division, round, athletes: {a,b}, bestOf, scheduledTableId? }]
 * currentByTable: { [tableId]: { matchId, startedAtMs, match } }
 * history: [{ matchId, tableId, durationSeconds, weightClass, endedAtMs }]
 */

const LS_KEY = "arm-tourney-hud-demo-v1";

// function demoState() {
//     return createTestTournamentState();
//   }
  

function demoState() {
  return {
    tables: [
      { id: "t1", name: "Table 1" },
      { id: "t2", name: "Table 2" },
    ],
    queue: [
      {
        id: "m101",
        weightClass: "176",
        division: "RH",
        round: "QF",
        bestOf: 1,
        athletes: { a: "Kyler L.", b: "Brandon M." },
        scheduledTableId: "t1",
      },
      {
        id: "m102",
        weightClass: "176",
        division: "RH",
        round: "QF",
        bestOf: 1,
        athletes: { a: "Eli S.", b: "Noah T." },
        scheduledTableId: "t2",
      },
      {
        id: "m103",
        weightClass: "198",
        division: "LH",
        round: "R1",
        bestOf: 1,
        athletes: { a: "Sam P.", b: "Diego R." },
      },
      {
        id: "m104",
        weightClass: "198",
        division: "LH",
        round: "R1",
        bestOf: 1,
        athletes: { a: "Jared K.", b: "Miles V." },
      },
      {
        id: "m105",
        weightClass: "220",
        division: "RH",
        round: "SF",
        bestOf: 3,
        athletes: { a: "Alex J.", b: "Cole W." },
      },
    ],
    currentByTable: {
      t1: null,
      t2: null,
    },
    history: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return demoState();
    const parsed = JSON.parse(raw);
    // shallow validation
    if (!parsed.tables || !parsed.queue || !parsed.currentByTable || !parsed.history) return demoState();
    return parsed;
  } catch {
    return demoState();
  }
}

function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export function useTournament() {
  const nowMs = ref(Date.now());
  const tick = setInterval(() => (nowMs.value = Date.now()), 250);

  const state = reactive(loadState());

  const tables = computed(() => state.tables);
  const queue = computed(() => state.queue);

  const currentByTable = computed(() => state.currentByTable);

  const upNextByTable = computed(() => {
    const result = {};
    for (const t of state.tables) {
      result[t.id] = findNextForTable(t.id, state.queue);
    }
    return result;
  });

  const etaByTable = computed(() => {
    const result = {};
    for (const t of state.tables) {
      result[t.id] = estimateSecondsUntilNextOnTable(t.id, state, nowMs.value);
    }
    return result;
  });

  const metrics = computed(() => {
    const total = state.history.length + state.queue.length + Object.values(state.currentByTable).filter(Boolean).length;
    const completed = state.history.length;

    const durations = state.history.map(h => h.durationSeconds).filter(n => Number.isFinite(n) && n > 0);
    const avgMatchSeconds = durations.length ? durations.reduce((a,b)=>a+b,0) / durations.length : 75;

    // Throughput: use last 30 minutes of finished matches (fallback to avg)
    const windowMs = 30 * 60 * 1000;
    const cutoff = nowMs.value - windowMs;
    const recent = state.history.filter(h => h.endedAtMs >= cutoff);
    const matchesPerHour = recent.length ? (recent.length / (windowMs / 3600000)) : (3600 / avgMatchSeconds);

    // By weight class (completed)
    const byWeight = {};
    for (const h of state.history) {
      const w = h.weightClass || "Unknown";
      byWeight[w] = (byWeight[w] || 0) + 1;
    }

    return {
      total,
      completed,
      avgMatchSeconds,
      matchesPerHour,
      byWeight,
      historyCount: state.history.length,
      queueCount: state.queue.length,
      activeTables: Object.values(state.currentByTable).filter(Boolean).length,
    };
  });

  function estimateForMatch(matchId) {
    const idx = state.queue.findIndex(m => m.id === matchId);
    if (idx === -1) return null;

    // Determine which table it will likely land on:
    const match = state.queue[idx];
    const tableId = match.scheduledTableId || pickLeastLoadedTableId(state);
    if (!tableId) return null;

    // Seconds until it starts = remaining time on current + estimated time of any earlier queue items assigned to that table
    const eta = estimateSecondsUntilMatchOnTable(matchId, tableId, state, nowMs.value);
    return { tableId, etaSeconds: eta };
  }

  function startMatch(tableId) {
    if (state.currentByTable[tableId]) return;

    // pop next match for that table (prefer scheduled)
    const next = findNextForTable(tableId, state.queue);
    if (!next) return;

    // remove from queue
    state.queue = state.queue.filter(m => m.id !== next.id);

    state.currentByTable[tableId] = {
      matchId: next.id,
      startedAtMs: nowMs.value,
      match: next,
    };
  }

  function finishMatch(tableId) {
    const cur = state.currentByTable[tableId];
    if (!cur) return;

    const durationSeconds = Math.max(5, Math.round((nowMs.value - cur.startedAtMs) / 1000));
    state.history.push({
      matchId: cur.matchId,
      tableId,
      durationSeconds,
      weightClass: cur.match?.weightClass,
      endedAtMs: nowMs.value,
    });

    state.currentByTable[tableId] = null;
  }

  function advanceQueue() {
    // convenience: start matches on all idle tables
    for (const t of state.tables) {
      if (!state.currentByTable[t.id]) startMatch(t.id);
    }
  }

  function resetDemo() {
    const fresh = demoState();
    state.tables = fresh.tables;
    state.queue = fresh.queue;
    state.currentByTable = fresh.currentByTable;
    state.history = fresh.history;
  }

  function fmtSec(seconds) {
    if (seconds == null) return "—";
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m <= 0) return `${r}s`;
    return `${m}m ${String(r).padStart(2, "0")}s`;
  }

  // Persist to localStorage
  watch(
    () => ({ tables: state.tables, queue: state.queue, currentByTable: state.currentByTable, history: state.history }),
    () => saveState(state),
    { deep: true }
  );

  onBeforeUnmount(() => clearInterval(tick));

  return {
    nowMs,
    tables,
    queue,
    currentByTable,
    upNextByTable,
    etaByTable,
    metrics,
    estimateForMatch,
    startMatch,
    finishMatch,
    advanceQueue,
    resetDemo,
    fmtSec
  };
}

/* ----------------- Estimation helpers ----------------- */

function findNextForTable(tableId, queue) {
  // Prefer explicit scheduledTableId first
  const scheduled = queue.find(m => m.scheduledTableId === tableId);
  if (scheduled) return scheduled;
  // Otherwise just take first (you can replace with your own scheduling rules)
  return queue[0] || null;
}

function pickLeastLoadedTableId(state) {
  const tableIds = state.tables.map(t => t.id);
  if (!tableIds.length) return null;
  const loads = {};
  for (const id of tableIds) loads[id] = 0;

  // count queued scheduled
  for (const m of state.queue) {
    const tid = m.scheduledTableId;
    if (tid && loads[tid] != null) loads[tid] += 1;
  }
  // active matches weigh more
  for (const id of tableIds) {
    if (state.currentByTable[id]) loads[id] += 2;
  }

  return tableIds.sort((a,b) => loads[a] - loads[b])[0];
}

function averageForWeightClass(state, weightClass) {
  // Use history average for this weight class; fallback to global avg; fallback to 75s
  const hist = state.history.filter(h => h.weightClass === weightClass).map(h => h.durationSeconds);
  if (hist.length >= 3) return hist.reduce((a,b)=>a+b,0) / hist.length;

  const all = state.history.map(h => h.durationSeconds);
  if (all.length) return all.reduce((a,b)=>a+b,0) / all.length;

  return 75;
}

function estimateRemainingCurrentSeconds(state, tableId, nowMs) {
  const cur = state.currentByTable[tableId];
  if (!cur) return 0;

  const elapsed = (nowMs - cur.startedAtMs) / 1000;
  const expected = averageForWeightClass(state, cur.match?.weightClass);
  // clamp: remaining can’t go below 5s to avoid flicker
  return Math.max(5, expected - elapsed);
}

function estimateSecondsUntilNextOnTable(tableId, state, nowMs) {
  const next = findNextForTable(tableId, state.queue);
  if (!next) return null;

  const remainingCur = estimateRemainingCurrentSeconds(state, tableId, nowMs);
  return remainingCur; // since “next” is the immediate one after current
}

function estimateSecondsUntilMatchOnTable(matchId, tableId, state, nowMs) {
  // Remaining on current
  let seconds = estimateRemainingCurrentSeconds(state, tableId, nowMs);

  // Add estimated durations for any queued matches that will run on that table before matchId
  const ordered = orderQueueForTable(tableId, state.queue);

  for (const m of ordered) {
    if (m.id === matchId) break;
    seconds += estimateDurationForQueuedMatch(state, m);
  }

  return seconds;
}

function orderQueueForTable(tableId, queue) {
  // Put scheduled for this table first, then unscheduled, preserving relative order
  const scheduled = queue.filter(m => m.scheduledTableId === tableId);
  const other = queue.filter(m => !m.scheduledTableId);
  return [...scheduled, ...other];
}

function estimateDurationForQueuedMatch(state, match) {
  const base = averageForWeightClass(state, match.weightClass);
  // bestOf scaling (very rough): bestOf 3 tends to run longer
  const scale = match.bestOf === 3 ? 1.8 : 1.0;
  return base * scale;
}
