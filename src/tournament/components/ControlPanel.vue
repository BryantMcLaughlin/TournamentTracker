<template>
    <div class="cp">
      <div class="controls">
        <button @click="advanceQueue">Start on all idle tables</button>
        <button @click="resetDemo">Reset demo</button>
      </div>
  
      <div class="grid">
        <div v-for="t in tables" :key="t.id" class="tableCtl">
          <div class="hdr">
            <div class="name">{{ t.name }}</div>
            <div class="id muted">{{ t.id }}</div>
          </div>
  
          <div class="buttons">
            <button @click="startMatch(t.id)" :disabled="!!currentByTable[t.id]">Start</button>
            <button @click="finishMatch(t.id)" :disabled="!currentByTable[t.id]">Finish</button>
          </div>
  
          <div class="muted" v-if="currentByTable[t.id]">
            Running: {{ currentByTable[t.id].match.athletes.a }} vs {{ currentByTable[t.id].match.athletes.b }}
          </div>
          <div class="muted" v-else>Idle</div>
        </div>
      </div>
  
      <div class="muted" style="margin-top:10px;">
        In your real system, these actions would be driven by the tournament table app / refs / bracket software.
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    tables: Array,
    queue: Array,
    currentByTable: Object,
    startMatch: Function,
    finishMatch: Function,
    advanceQueue: Function,
    resetDemo: Function
  });
  </script>
  
  <style scoped>
  .cp { display: flex; flex-direction: column; gap: 12px; }
  .controls { display: flex; gap: 10px; flex-wrap: wrap; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .tableCtl {
    border-radius: 18px;
    padding: 12px;
    background: rgba(10, 14, 24, 0.8);
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
    position: relative;
    overflow: hidden;
  }
  .tableCtl::before {
    content: "";
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 3px;
    background: linear-gradient(180deg, rgba(120, 180, 255, 0.7), rgba(120, 255, 210, 0.7));
    opacity: 0.6;
  }
  .hdr { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .name { font-weight: 800; }
  .id { font-size: 12px; opacity: 0.7; }
  .buttons { display: flex; gap: 8px; margin: 10px 0; flex-wrap: wrap; }
  .muted { opacity: 0.65; }
  @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }
  </style>
  