<template>
    <div class="queue">
      <div v-if="!queue.length" class="muted">No matches in queue.</div>
  
      <div v-for="m in queue" :key="m.id" class="item">
        <div class="left">
          <div class="names">
            <span class="name">{{ m.athletes.a }}</span>
            <span class="vs">vs</span>
            <span class="name">{{ m.athletes.b }}</span>
          </div>
          <div class="meta">
            <span class="pill">{{ m.weightClass }} lb</span>
            <span class="pill">{{ m.division }}</span>
            <span class="pill">{{ m.round }}</span>
            <span class="pill">Bo{{ m.bestOf }}</span>
            <span class="pill" v-if="m.scheduledTableId">Scheduled: {{ m.scheduledTableId }}</span>
          </div>
        </div>
  
        <div class="right">
          <div class="eta" v-if="etaFor(m.id)">
            <div class="small">ETA (est.)</div>
            <div class="big">
              {{ fmtSec(etaFor(m.id).etaSeconds) }}
            </div>
            <div class="small muted">Table: {{ etaFor(m.id).tableId }}</div>
          </div>
          <div class="eta" v-else>
            <div class="small muted">ETA unavailable</div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    queue: Array,
    fmtSec: Function,
    estimateForMatch: Function,
    now: Number
  });
  
  function etaFor(matchId) {
    // call composable estimator (reactive enough since parent re-renders with now tick)
    return props.estimateForMatch(matchId);
  }
  </script>
  
  <style scoped>
  .queue { display: flex; flex-direction: column; gap: 12px; }
  .item {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 18px;
    background: rgba(8, 12, 20, 0.85);
    box-shadow: 0 18px 32px rgba(0, 0, 0, 0.35);
    position: relative;
    overflow: hidden;
  }
  .item::before {
    content: "";
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 3px;
    background: linear-gradient(180deg, rgba(120, 180, 255, 0.7), rgba(120, 255, 210, 0.7));
    opacity: 0.5;
  }
  .names { font-weight: 700; }
  .vs { margin: 0 6px; opacity: 0.6; font-size: 12px; font-weight: 500; }
  .meta { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px; }
  .pill {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }
  .right { min-width: 150px; text-align: right; }
  .small { font-size: 11px; opacity: 0.75; }
  .big { font-size: 18px; font-weight: 800; margin-top: 4px; }
  .muted { opacity: 0.65; }
  </style>
  