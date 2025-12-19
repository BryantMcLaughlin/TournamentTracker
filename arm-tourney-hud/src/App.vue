<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <div class="title">Tournament HUD</div>
        <div class="subtitle">Live-ish progress, queue, and ETAs</div>
      </div>

      <div class="chiprow">
        <span class="chip">Now: {{ nowTime }}</span>
        <span class="chip">Avg match: {{ fmtSec(metrics.avgMatchSeconds) }}</span>
        <span class="chip">Throughput: {{ metrics.matchesPerHour.toFixed(1) }}/hr</span>
        <span class="chip">Completed: {{ metrics.completed }}/{{ metrics.total }}</span>
      </div>
    </header>

    <main class="grid">
      <section class="card">
        <h2>Tables</h2>
        <div class="tables">
          <NowMat
            v-for="t in tables"
            :key="t.id"
            :table="t"
            :current="currentByTable[t.id]"
            :upNext="upNextByTable[t.id]"
            :etaSeconds="etaByTable[t.id]"
            :fmtSec="fmtSec"
          />
        </div>
      </section>

      <section class="card">
        <h2>Queue</h2>
        <Queue
          :queue="queue"
          :fmtSec="fmtSec"
          :estimateForMatch="estimateForMatch"
          :now="nowMs"
          :currentByTable="currentByTable"
        />
      </section>

      <section class="card">
        <h2>Metrics</h2>
        <Metrics :metrics="metrics" :fmtSec="fmtSec" />
      </section>

      <section class="card">
        <h2>Control Panel (Demo)</h2>
        <ControlPanel
          :tables="tables"
          :queue="queue"
          :currentByTable="currentByTable"
          :startMatch="startMatch"
          :finishMatch="finishMatch"
          :advanceQueue="advanceQueue"
          :resetDemo="resetDemo"
        />
      </section>
    </main>

    <footer class="footer">
      <small>
        Data is stored in-memory + localStorage (demo). Replace the state updates with your live feed when ready.
      </small>
    </footer>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useTournament } from "./tournament/useTournament";

import NowMat from "./tournament/components/NowMat.vue";
import Queue from "./tournament/components/Queue.vue";
import Metrics from "./tournament/components/Metrics.vue";
import ControlPanel from "./tournament/components/ControlPanel.vue";

const {
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
} = useTournament();

const nowTime = computed(() => new Date(nowMs.value).toLocaleTimeString());
</script>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
.topbar { padding: 16px; border-bottom: 1px solid rgba(255,255,255,.08); position: sticky; top: 0; background: rgba(10,12,18,.9); backdrop-filter: blur(10px); z-index: 5; }
.brand .title { font-size: 20px; font-weight: 700; }
.brand .subtitle { font-size: 13px; opacity: .75; margin-top: 2px; }

.chiprow { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.chip { font-size: 12px; padding: 6px 10px; border: 1px solid rgba(255,255,255,.12); border-radius: 999px; background: rgba(255,255,255,.04); }

.grid { padding: 16px; display: grid; grid-template-columns: 1.2fr .8fr; gap: 16px; }
.card { border: 1px solid rgba(255,255,255,.10); border-radius: 16px; background: rgba(255,255,255,.03); padding: 14px; }
.card h2 { font-size: 14px; letter-spacing: .04em; text-transform: uppercase; opacity: .9; margin: 0 0 10px; }

.tables { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }

.footer { margin-top: auto; padding: 14px 16px; opacity: .7; border-top: 1px solid rgba(255,255,255,.08); }

@media (max-width: 980px) {
  .grid { grid-template-columns: 1fr; }
  .tables { grid-template-columns: 1fr; }
}
</style>
