'use strict';

/* =========================================================
   TWINCH — MAIN ENTRY
   ========================================================= */

(() => {
  /* =========================================================
     ELEMENTS
     ========================================================= */

  const intro = document.getElementById('intro');
  const heartStage = document.getElementById('introHeartStage');
  const twinchApp = document.getElementById('twinchApp');
  const bottomNav = document.getElementById('bottomNav');

  if (
    !intro ||
    !heartStage ||
    !twinchApp ||
    !bottomNav
  ) {
    return;
  }

  /* =========================================================
     STATE
     ========================================================= */

  let entered = false;

  /* =========================================================
     ENTER MAIN APP
     ========================================================= */

  const enterMainApp = () => {
    if (entered) {
      return;
    }

    entered = true;

    intro.hidden = true;
    twinchApp.hidden = false;
    bottomNav.hidden = false;
  };

  /* =========================================================
     INTRO EXIT WATCH
     ========================================================= */

  const observer = new MutationObserver(() => {
    if (
      heartStage.style.opacity === '0' &&
      heartStage.style.visibility === 'hidden'
    ) {
      observer.disconnect();
      enterMainApp();
    }
  });

  observer.observe(heartStage, {
    attributes: true,
    attributeFilter: ['style']
  });

  /* =========================================================
     CLEANUP
     ========================================================= */

  window.addEventListener(
    'pagehide',
    () => {
      observer.disconnect();
    },
    { once: true }
  );
})();
