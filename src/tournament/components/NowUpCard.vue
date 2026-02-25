<template>
  <section
    class="card now_up_card"
    :class="{
      pulse: pulse,
      decision: is_decision,
      pop: pop,
      winner_left: is_decision && winner_side === 'left',
      winner_right: is_decision && winner_side === 'right',
    }"
  >
    <div class="now_up_glow" aria-hidden="true"></div>
    <div class="now_up_pattern" aria-hidden="true"></div>
    <div class="winner_side_glow" aria-hidden="true"></div>

    <div class="now_up_header">
      <span class="label">Now Up</span>
      <span class="zap" v-if="!is_decision" aria-hidden="true"></span>
    </div>

    <div class="now_up_main">
      <div class="fighter fighter_left" :class="{ winner: is_decision && winner_side === 'left', loser: is_decision && winner_side === 'right' }">
        <div class="winner_badge" v-if="is_decision && winner_side === 'left'">Winner</div>
        <span class="fighter_name">{{ p1_name }}</span>
      </div>

      <div class="vs_divider">
        <div class="vs_ring"></div>
        <div class="vs_chip">VS</div>
      </div>

      <div class="fighter fighter_right" :class="{ winner: is_decision && winner_side === 'right', loser: is_decision && winner_side === 'left' }">
        <span class="fighter_name">{{ p2_name }}</span>
        <div class="winner_badge" v-if="is_decision && winner_side === 'right'">Winner</div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  p1_name: { type: String, default: "TBD" },
  p2_name: { type: String, default: "TBD" },
  is_decision: { type: Boolean, default: false },
  winner_side: { type: String, default: "" },
  pulse: { type: Boolean, default: false },
  pop: { type: Boolean, default: false },
});
</script>

<style scoped>
.now_up_card {
  position: relative;
  min-height: 220px;
  flex: 1 1 320px;
  padding: 20px;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(80, 130, 190, 0.3);
  background: linear-gradient(135deg, #1e3a5f 0%, #1a2f4d 100%);
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.44);
}

.now_up_glow {
  position: absolute;
  inset: -8px;
  border-radius: 24px;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2));
  filter: blur(18px);
  opacity: 0.7;
}

.now_up_pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.1;
  background-image: radial-gradient(circle at 2px 2px, rgb(59, 130, 246) 1px, transparent 0);
  background-size: 40px 40px;
  animation: pattern_drift 16s linear infinite;
}

.winner_side_glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  z-index: 1;
  transition: opacity 400ms ease;
}

.now_up_card.winner_left .winner_side_glow {
  opacity: 1;
  background: radial-gradient(circle at 0% 50%, rgba(34, 197, 94, 0.45) 0%, rgba(34, 197, 94, 0.1) 40%, transparent 70%);
}

.now_up_card.winner_right .winner_side_glow {
  opacity: 1;
  background: radial-gradient(circle at 100% 50%, rgba(34, 197, 94, 0.45) 0%, rgba(34, 197, 94, 0.1) 40%, transparent 70%);
}

.now_up_header {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-weight: 800;
  color: rgba(197, 220, 244, 0.9);
}

.zap {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22d3ee;
  box-shadow: 0 0 16px rgba(34, 211, 238, 0.85);
  animation: zap_pulse 1.3s ease-in-out infinite;
}

.now_up_main {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 20px;
}

.fighter {
  min-width: 0;
  transition: transform 320ms ease, opacity 320ms ease, color 320ms ease, text-shadow 320ms ease;
}

.fighter_name {
  font-size: clamp(22px, 3.8vw, 38px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0.02em;
  color: #f2f7ff;
  text-wrap: nowrap;
}

.fighter_left {
  text-align: left;
}

.fighter_right {
  text-align: right;
}

.fighter.winner {
  transform: scale(1.04);
}

.fighter.winner .fighter_name {
  color: #4ade80;
  text-shadow: 0 0 24px rgba(34, 197, 94, 0.95), 0 0 54px rgba(34, 197, 94, 0.6);
}

.fighter.loser {
  opacity: 0.34;
  transform: scale(0.95);
}

.winner_badge {
  margin-top: 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #4ade80;
  font-weight: 800;
  text-shadow: 0 0 18px rgba(34, 197, 94, 0.7);
}

.vs_divider {
  position: relative;
  width: 74px;
  height: 74px;
  display: grid;
  place-items: center;
}

.vs_ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 2px solid rgba(34, 211, 238, 0.32);
  animation: vs_ring_pulse 1.8s ease-in-out infinite;
}

.vs_chip {
  position: relative;
  z-index: 1;
  width: 58px;
  height: 58px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #b7c7de;
  background: linear-gradient(160deg, rgba(53, 68, 94, 0.92), rgba(33, 42, 58, 0.92));
  border: 2px solid rgba(86, 106, 136, 0.85);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.38);
}

.now_up_card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  z-index: 3;
}

.now_up_card.pop.decision::after {
  opacity: 1;
}

.now_up_card.pop.decision.winner_left::after {
  animation: winner_sweep_left 0.8s cubic-bezier(0.2, 0, 0.2, 1);
}

.now_up_card.pop.decision.winner_right::after {
  animation: winner_sweep_right 0.8s cubic-bezier(0.2, 0, 0.2, 1);
}

.now_up_card.pulse::before {
  content: "";
  position: absolute;
  inset: -14% -10%;
  pointer-events: none;
  background: radial-gradient(circle, rgba(120, 200, 255, 0.34), transparent 60%);
  animation: card_pulse 1.2s ease-out;
}

@keyframes pattern_drift {
  from { background-position: 0 0; }
  to { background-position: 40px 40px; }
}

@keyframes zap_pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.35); opacity: 1; }
}

@keyframes vs_ring_pulse {
  0%, 100% { transform: scale(1); opacity: 0.35; }
  50% { transform: scale(1.14); opacity: 0.75; }
}

@keyframes card_pulse {
  0% { opacity: 0; transform: scale(0.9); }
  55% { opacity: 0.74; }
  100% { opacity: 0; transform: scale(1.12); }
}

@keyframes winner_sweep_left {
  0% {
    transform: translateX(100%);
    background: linear-gradient(270deg, transparent, rgba(34, 197, 94, 0.6), transparent);
  }
  100% {
    transform: translateX(-100%);
    background: linear-gradient(270deg, transparent, rgba(34, 197, 94, 0.2), transparent);
  }
}

@keyframes winner_sweep_right {
  0% {
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.6), transparent);
  }
  100% {
    transform: translateX(100%);
    background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.2), transparent);
  }
}

@media (max-width: 900px) {
  .now_up_main {
    gap: 14px;
  }
  .vs_divider {
    width: 62px;
    height: 62px;
  }
  .vs_chip {
    width: 50px;
    height: 50px;
    font-size: 15px;
  }
}

@media (max-width: 700px) {
  .now_up_card {
    min-height: 250px;
  }
  .now_up_main {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .fighter_left,
  .fighter_right {
    text-align: center;
  }
  .vs_divider {
    margin: 2px auto;
  }
}
</style>
