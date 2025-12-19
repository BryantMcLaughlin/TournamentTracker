<template>
    <div class="metrics">
      <div class="row">
        <div class="k">Active tables</div>
        <div class="v">{{ metrics.activeTables }}</div>
      </div>
      <div class="row">
        <div class="k">Queue</div>
        <div class="v">{{ metrics.queueCount }}</div>
      </div>
      <div class="row">
        <div class="k">History</div>
        <div class="v">{{ metrics.historyCount }}</div>
      </div>
      <div class="row">
        <div class="k">Avg match duration</div>
        <div class="v">{{ fmtSec(metrics.avgMatchSeconds) }}</div>
      </div>
      <div class="row">
        <div class="k">Matches per hour</div>
        <div class="v">{{ metrics.matchesPerHour.toFixed(1) }}</div>
      </div>
  
      <div class="divider"></div>
  
      <div class="k muted" style="margin-bottom:6px;">Completed by weight class</div>
      <div class="wc" v-if="Object.keys(metrics.byWeight).length">
        <div class="wcrow" v-for="(count, wc) in metrics.byWeight" :key="wc">
          <div class="wck">{{ wc }} lb</div>
          <div class="wcv">{{ count }}</div>
        </div>
      </div>
      <div class="muted" v-else>No completed matches yet.</div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    metrics: Object,
    fmtSec: Function
  });
  </script>
  
  <style scoped>
  .metrics { display: flex; flex-direction: column; gap: 8px; }
  .row { display: flex; justify-content: space-between; gap: 10px; padding: 8px 10px; border: 1px solid rgba(255,255,255,.08); border-radius: 12px; background: rgba(0,0,0,.14); }
  .k { opacity: .8; font-size: 13px; }
  .v { font-weight: 800; }
  .divider { height: 1px; background: rgba(255,255,255,.10); margin: 8px 0; }
  .muted { opacity: .65; }
  .wc { display: grid; gap: 6px; }
  .wcrow { display: flex; justify-content: space-between; padding: 6px 10px; border: 1px solid rgba(255,255,255,.08); border-radius: 12px; background: rgba(0,0,0,.10); }
  .wck { opacity: .85; }
  .wcv { font-weight: 800; }
  </style>
  