<template>
  <div class="cp-coming-soon-overlay">
    <div class="cp-coming-soon-card">
      <div class="cp-coming-soon-icon">🚀</div>
      <h2 class="cp-coming-soon-title">Coming Soon!</h2>
      <p class="cp-coming-soon-sub">We're working hard on this.<br>Check back shortly.</p>
    </div>
  </div>
</template>

<style lang="scss">
.cp-coming-soon-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px) saturate(0.6);
  -webkit-backdrop-filter: blur(8px) saturate(0.6);
  background: rgba(245, 243, 250, 0.72);
}

.cp-coming-soon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 36px 40px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(145, 132, 217, 0.18);
  border-radius: 24px;
  box-shadow:
    0 8px 32px rgba(145, 132, 217, 0.14),
    0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.cp-coming-soon-icon {
  font-size: 44px;
  line-height: 1;
  filter: drop-shadow(0 2px 8px rgba(145, 132, 217, 0.3));
}

.cp-coming-soon-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #1A1730;
  letter-spacing: -0.3px;
}

.cp-coming-soon-sub {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #5E5A7E;
  line-height: 1.55;
}
</style>
