<template>
    <div class="panel">
      <div class="row">
        <div class="table">{{ table.name }}</div>
        <div class="badge" v-if="current">LIVE</div>
        <div class="badge idle" v-else>IDLE</div>
      </div>
  
      <div class="block" v-if="current">
        <div class="label">Currently</div>
        <div class="main">
          <div class="names">
            <div class="name">{{ current.match.athletes.a }}</div>
            <div class="vs">vs</div>
            <div class="name">{{ current.match.athletes.b }}</div>
          </div>
          <div class="meta">
            <span class="pill">{{ current.match.weightClass }} lb</span>
            <span class="pill">{{ current.match.division }}</span>
            <span class="pill">{{ current.match.round }}</span>
            <span class="pill">Bo{{ current.match.bestOf }}</span>
          </div>
        </div>
      </div>
  
      <div class="block" v-else>
        <div class="label">Currently</div>
        <div class="muted">No active match</div>
      </div>
  
      <div class="block">
        <div class="label">Up next</div>
        <div v-if="upNext" class="next">
          <div class="names">
            <div class="name">{{ upNext.athletes.a }}</div>
            <div class="vs">vs</div>
            <div class="name">{{ upNext.athletes.b }}</div>
          </div>
          <div class="meta">
            <span class="pill">{{ upNext.weightClass }} lb</span>
            <span class="pill">{{ upNext.division }}</span>
            <span class="pill">{{ upNext.round }}</span>
            <span class="pill">ETA {{ fmtSec(etaSeconds) }}</span>
          </div>
        </div>
        <div v-else class="muted">Queue empty</div>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    table: Object,
    current: Object,
    upNext: Object,
    etaSeconds: Number,
    fmtSec: Function
  });
  </script>
  
  <style scoped>
  .panel {
    border-radius: 18px;
    padding: 14px;
    background: rgba(10, 14, 24, 0.82);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
    position: relative;
    overflow: hidden;
  }
  .panel::before {
    content: "";
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 4px;
    background: linear-gradient(180deg, rgba(120, 180, 255, 0.7), rgba(120, 255, 210, 0.7));
    opacity: 0.6;
  }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .table { font-weight: 700; }
  .badge {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(60, 220, 150, 0.15);
    color: #7dffcf;
  }
  .badge.idle {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(235, 242, 255, 0.7);
  }
  
  .block { margin-top: 12px; }
  .label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.7; margin-bottom: 6px; }
  .names { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; }
  .name { font-weight: 700; }
  .vs { opacity: 0.6; font-size: 12px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .pill {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }
  .muted { opacity: 0.65; }
  </style>
  