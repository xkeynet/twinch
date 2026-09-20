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

  const themeColor = document.querySelector(
    'meta[name="theme-color"]'
  );

  const tileColor = document.querySelector(
    'meta[name="msapplication-TileColor"]'
  );

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

    /* Browser / Safari chrome */
    if (themeColor) {
      themeColor.setAttribute('content', '#000000');
    }

    if (tileColor) {
      tileColor.setAttribute('content', '#000000');
    }

    /* Page background */
    document.documentElement.style.backgroundColor = '#000000';
    document.body.style.backgroundColor = '#000000';

    /* Intro off */
    intro.hidden = true;

    /* Main black environment on */
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
