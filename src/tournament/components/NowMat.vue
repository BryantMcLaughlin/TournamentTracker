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
  .panel { border: 1px solid rgba(255,255,255,.10); border-radius: 14px; padding: 12px; background: rgba(0,0,0,.18); }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .table { font-weight: 700; }
  .badge { font-size: 11px; padding: 4px 8px; border-radius: 999px; background: rgba(0,255,140,.12); border: 1px solid rgba(0,255,140,.25); }
  .badge.idle { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.12); }
  
  .block { margin-top: 10px; }
  .label { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .7; margin-bottom: 6px; }
  .names { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; }
  .name { font-weight: 700; }
  .vs { opacity: .6; font-size: 12px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .pill { font-size: 11px; padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.10); }
  .muted { opacity: .65; }
  </style>
  