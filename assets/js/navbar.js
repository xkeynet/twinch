'use strict';

/* =========================================================
   TWINCH — MAIN ENTRY
   ========================================================= */

(() => {
  /* =========================================================
     ELEMENTS
     ========================================================= */

  const intro = document.getElementById('intro');
  const wordmarkStage = document.getElementById('introWordmarkStage');
  const heartStage = document.getElementById('introHeartStage');
  const twinchApp = document.getElementById('twinchApp');

  if (
    !intro ||
    !wordmarkStage ||
    !heartStage ||
    !twinchApp
  ) {
    return;
  }

  /* =========================================================
     STATE
     ========================================================= */

  let entered = false;
  let exitStarted = false;

  /* =========================================================
     ENTER MAIN APP
     ========================================================= */

  const enterMainApp = () => {
    if (entered) {
      return;
    }

    entered = true;

    observer.disconnect();

    intro.hidden = true;
    twinchApp.hidden = false;
  };

  /* =========================================================
     INTRO EXIT WATCH
     ========================================================= */

  const observer = new MutationObserver(() => {
    if (entered) {
      return;
    }

    const isExiting =
      heartStage.classList.contains('is-exiting') &&
      wordmarkStage.classList.contains('is-exiting');

    if (isExiting) {
      exitStarted = true;
      return;
    }

    if (
      exitStarted &&
      !heartStage.classList.contains('is-exiting') &&
      !wordmarkStage.classList.contains('is-exiting')
    ) {
      enterMainApp();
    }
  });

  observer.observe(heartStage, {
    attributes: true,
    attributeFilter: ['class']
  });

  observer.observe(wordmarkStage, {
    attributes: true,
    attributeFilter: ['class']
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
