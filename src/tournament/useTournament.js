import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const DEFAULT_BASE_URL = "https://brackets-production.up.railway.app";
const LS_TOURNEY_ID = "arm-tourney-hud:tournament-id";

const BRACKET_LABELS = {
  CH: "Championship",
  WB: "Winners",
  LB: "Losers",
  P5: "5th Place",
};

const BRACKET_ORDER = {
  CH: 0,
  WB: 1,
  LB: 2,
  P5: 3,
};

function getBaseUrl() {
  const envUrl = import.meta.env.VITE_BRACKET_SYNC_URL;
  const raw = envUrl && String(envUrl).trim() ? envUrl : DEFAULT_BASE_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function loadString(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  return raw == null ? fallback : raw;
}


function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function bracketTypeLabel(code) {
  if (!code) return "Bracket";
  return BRACKET_LABELS[code] || code;
}

function displayAthlete(athlete) {
  if (!athlete) return "TBD";
  if (isByeAthlete(athlete)) return "TBD";
  return athlete.name || "TBD";
}

function isByeAthlete(athlete) {
  if (!athlete) return false;
  if (athlete.bye) return true;
  const name = typeof athlete === "string" ? athlete : athlete.name;
  return String(name || "").trim().toLowerCase() === "bye";
}

function matchRoundLabel(match) {
  if (match.label) return match.label;
  if (Number.isFinite(match.round)) return `Round ${match.round}`;
  return "Match";
}

function matchOrderValue(match) {
  const bracketOrder = BRACKET_ORDER[match.bracket] ?? 4;
  const round = Number.isFinite(match.round) ? match.round : 999;
  return bracketOrder * 1000 + round;
}

function compareMatches(a, b) {
  const order = matchOrderValue(a) - matchOrderValue(b);
  if (order !== 0) return order;
  if (a.bracketId !== b.bracketId) return String(a.bracketId).localeCompare(String(b.bracketId));
  return String(a.id).localeCompare(String(b.id));
}

function isReadyMatch(match) {
  return !match.done && match.p1 && match.p2 && !isByeAthlete(match.p1) && !isByeAthlete(match.p2);
}

function estimateDurationSeconds(match, base) {
  if (!Number.isFinite(base) || base <= 0) return 75;
  if (match.bestOf === 3) return base * 1.8;
  if (match.bestOf === 5) return base * 2.4;
  return base;
}

export function useTournament() {
  const baseUrl = getBaseUrl();
  const nowMs = ref(Date.now());
  const tick = setInterval(() => (nowMs.value = Date.now()), 1000);

  const tournaments = ref([]);
  const tournamentsStatus = ref("idle");
  const tournamentsError = ref(null);

  const selectedTournamentId = ref(loadString(LS_TOURNEY_ID, ""));
  const tournament = ref(null);
  const connectionStatus = ref("idle");
  const connectionError = ref(null);
  const lastEventAt = ref(null);

  const avgMatchSeconds = 75;

  let eventSource = null;
  let refreshTimer = null;

  watch(selectedTournamentId, (value) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LS_TOURNEY_ID, value || "");
    }
  });

  const payload = computed(() => tournament.value?.payload ?? null);
  const meta = computed(() => tournament.value?.meta ?? {});
  const tournamentName = computed(() => {
    return (
      payload.value?.tournament_name ||
      meta.value?.tournament_name ||
      meta.value?.name ||
      "Tournament"
    );
  });

  const activeBracketId = computed(() => payload.value?.active_bracket_id ?? null);
  const serverVersion = computed(() => tournament.value?.server_version ?? null);
  const updatedAt = computed(() => tournament.value?.updated_at ?? null);
  const createdAt = computed(() => tournament.value?.created_at ?? null);
  const exportedAt = computed(() => payload.value?.exported_at ?? null);
  const mode = computed(() => payload.value?.mode ?? null);

  const matches = computed(() => {
    if (!payload.value?.brackets?.length) return [];
    const flattened = [];
    payload.value.brackets.forEach((bracket, bracketIndex) => {
      const bracketName = bracket.name || `Bracket ${bracketIndex + 1}`;
      const bracketId = bracket.id || `${bracketIndex}`;
      (bracket.matches || []).forEach((match) => {
        const p1Name = displayAthlete(match.p1);
        const p2Name = displayAthlete(match.p2);
        const hasBye = isByeAthlete(match.p1) || isByeAthlete(match.p2);
        const bracketLabel = bracketTypeLabel(match.bracket);
        const status = match.done ? "done" : match.p1 && match.p2 ? "ready" : "waiting";
        flattened.push({
          ...match,
          bracketId,
          bracketName,
          bracketLabel,
          roundLabel: matchRoundLabel(match),
          p1Name,
          p2Name,
          hasBye,
          status,
          searchText: normalizeText(`${p1Name} ${p2Name}`),
        });
      });
    });
    return flattened;
  });

  const readyQueue = computed(() => {
    const activeId = activeBracketId.value;
    const ready = matches.value.filter(isReadyMatch).sort((a, b) => {
      if (activeId) {
        const aActive = a.bracketId === activeId;
        const bActive = b.bracketId === activeId;
        if (aActive && !bActive) return -1;
        if (bActive && !aActive) return 1;
      }
      return compareMatches(a, b);
    });
    let elapsed = 0;
    return ready.map((match) => {
      const durationSeconds = estimateDurationSeconds(match, avgMatchSeconds);
      const etaSeconds = elapsed;
      elapsed += durationSeconds;
      return { ...match, etaSeconds, durationSeconds };
    });
  });

  const bracketSummary = computed(() => {
    if (!payload.value?.brackets?.length) return [];
    return payload.value.brackets.map((bracket, bracketIndex) => {
      const bracketName = bracket.name || `Bracket ${bracketIndex + 1}`;
      const bracketId = bracket.id || `${bracketIndex}`;
      const bracketMatches = (bracket.matches || []).map((match) => ({
        ...match,
        bracketId,
        bracketName,
        bracketLabel: bracketTypeLabel(match.bracket),
        roundLabel: matchRoundLabel(match),
        p1Name: displayAthlete(match.p1),
        p2Name: displayAthlete(match.p2),
      }));
      const doneCount = bracketMatches.filter((m) => m.done).length;
      const readyMatches = bracketMatches.filter(isReadyMatch).sort(compareMatches);
      const readyCount = readyMatches.length;
      const waitingCount = bracketMatches.length - doneCount - readyCount;
      const total = bracketMatches.length;
      const progress = total ? Math.round((doneCount / total) * 100) : 0;
      return {
        id: bracketId,
        name: bracketName,
        total,
        doneCount,
        readyCount,
        waitingCount,
        progress,
        nextReady: readyMatches[0] || null,
        finalSeries: bracket.final_series || null,
      };
    });
  });

  const stats = computed(() => {
    const totalMatches = matches.value.length;
    const doneCount = matches.value.filter((m) => m.done).length;
    const readyCount = matches.value.filter((m) => m.status === "ready").length;
    const waitingCount = matches.value.filter((m) => m.status === "waiting").length;
    const athletes = new Map();
    if (payload.value?.brackets?.length) {
      payload.value.brackets.forEach((bracket) => {
        (bracket.athletes || []).forEach((athlete) => {
          if (!athlete) return;
          const key = athlete.id || athlete.name;
          if (!key) return;
          athletes.set(key, athlete);
        });
      });
    }
    return {
      totalMatches,
      doneCount,
      readyCount,
      waitingCount,
      athleteCount: athletes.size,
      bracketCount: payload.value?.brackets?.length || 0,
    };
  });

  async function refreshTournaments() {
    tournamentsStatus.value = "loading";
    tournamentsError.value = null;
    try {
      const res = await fetch(`${baseUrl}/api/tournaments`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (!data.ok) throw new Error("Server error");
      tournaments.value = (data.tournaments || []).slice().sort((a, b) => {
        const aTime = new Date(a.updated_at || 0).getTime();
        const bTime = new Date(b.updated_at || 0).getTime();
        return bTime - aTime;
      });
      tournamentsStatus.value = "ready";
    } catch (error) {
      tournamentsStatus.value = "error";
      tournamentsError.value = error?.message || "Failed to load tournaments";
    }
  }

  async function fetchSnapshot(tournamentId) {
    if (!tournamentId) return;
    connectionError.value = null;
    try {
      const res = await fetch(`${baseUrl}/api/tournaments/${encodeURIComponent(tournamentId)}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (!data.ok) throw new Error("Tournament not found");
      applySnapshot(data.tournament);
    } catch (error) {
      connectionError.value = error?.message || "Failed to load snapshot";
    }
  }

  function applySnapshot(snapshot) {
    if (!snapshot) return;
    tournament.value = snapshot;
    lastEventAt.value = Date.now();
  }

  function handleHello(event) {
    const data = safeParseEvent(event);
    if (!data) return;
    if (!tournament.value) {
      tournament.value = {
        id: data.tournament_id,
        server_version: data.server_version,
        updated_at: data.updated_at || null,
        created_at: null,
        payload: null,
        meta: null,
      };
    }
    lastEventAt.value = Date.now();
  }

  function safeParseEvent(event) {
    if (!event?.data) return null;
    try {
      return JSON.parse(event.data);
    } catch {
      return null;
    }
  }

  function connectStream(tournamentId) {
    if (!tournamentId) return;
    disconnectStream();
    connectionStatus.value = "connecting";
    connectionError.value = null;
    const url = `${baseUrl}/api/tournaments/${encodeURIComponent(tournamentId)}/stream`;
    eventSource = new EventSource(url);
    eventSource.onopen = () => {
      connectionStatus.value = "connected";
    };
    eventSource.onerror = () => {
      connectionStatus.value = "reconnecting";
    };
    eventSource.addEventListener("snapshot", (event) => {
      const data = safeParseEvent(event);
      if (!data) return;
      applySnapshot({
        id: data.tournament_id,
        server_version: data.server_version,
        updated_at: data.updated_at,
        created_at: null,
        payload: data.payload,
        meta: data.meta || null,
      });
    });
    eventSource.addEventListener("hello", handleHello);
    eventSource.addEventListener("ping", () => {
      lastEventAt.value = Date.now();
    });
  }

  function disconnectStream() {
    if (!eventSource) return;
    eventSource.close();
    eventSource = null;
    connectionStatus.value = "idle";
  }

  function setTournamentId(id) {
    selectedTournamentId.value = String(id || "").trim();
  }

  watch(
    selectedTournamentId,
    (id) => {
      if (!id) {
        disconnectStream();
        tournament.value = null;
        return;
      }
      fetchSnapshot(id);
      connectStream(id);
    },
    { immediate: true }
  );

  onMounted(() => {
    refreshTournaments();
    refreshTimer = setInterval(refreshTournaments, 60000);
  });

  onBeforeUnmount(() => {
    clearInterval(tick);
    disconnectStream();
    if (refreshTimer) clearInterval(refreshTimer);
  });

  return {
    baseUrl,
    nowMs,
    tournaments,
    tournamentsStatus,
    tournamentsError,
    selectedTournamentId,
    setTournamentId,
    refreshTournaments,
    tournament,
    payload,
    meta,
    tournamentName,
    activeBracketId,
    serverVersion,
    updatedAt,
    createdAt,
    exportedAt,
    mode,
    connectionStatus,
    connectionError,
    lastEventAt,
    matches,
    readyQueue,
    bracketSummary,
    stats,
  };
}
