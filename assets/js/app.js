'use strict';

/* =========================================================
   TWINCH — LANDING
   ========================================================= */

(() => {
  /* =========================================================
     TIMING
     ========================================================= */

  const GHOST_ANIMATION_MS = 1200;
  const GHOST_HOLD_MS = 500;
  const GHOST_EXIT_MS = 900;

  /* =========================================================
     ELEMENTS
     ========================================================= */

  const intro = document.getElementById('intro');
  const ghostStage = document.getElementById('introHeartStage');
  const ghost = document.getElementById('introHeartWhite');
  const app = document.getElementById('twinchApp');

  if (
    !intro ||
    !ghostStage ||
    !ghost ||
    !app
  ) {
    return;
  }

  /* =========================================================
     STATE
     ========================================================= */

  let destroyed = false;

  const timers = new Set();

  /* =========================================================
     TIMER HELPERS
     ========================================================= */

  const wait = (delay) =>
    new Promise((resolve) => {
      if (destroyed) {
        resolve();
        return;
      }

      const timer = window.setTimeout(() => {
        timers.delete(timer);
        resolve();
      }, delay);

      timers.add(timer);
    });

  const clearTimers = () => {
    timers.forEach((timer) => {
      window.clearTimeout(timer);
    });

    timers.clear();
  };

  const nextFrame = () =>
    new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
    });

  /* =========================================================
     RESET
     ========================================================= */

  const resetGhost = () => {
    ghostStage.classList.remove(
      'is-visible',
      'is-entering',
      'is-settled',
      'is-exiting',
      'is-hidden'
    );
  };

  /* =========================================================
     GHOST ENTER + ROTATION
     ========================================================= */

  const showGhost = async () => {
    resetGhost();

    ghostStage.classList.add('is-visible');

    await nextFrame();

    if (destroyed) {
      return;
    }

    ghostStage.classList.add('is-entering');

    await wait(GHOST_ANIMATION_MS);

    if (destroyed) {
      return;
    }

    ghostStage.classList.remove('is-entering');
    ghostStage.classList.add('is-settled');

    await nextFrame();

    if (destroyed) {
      return;
    }

    /* =====================================================
       GHOST HOLD
       ===================================================== */

    await wait(GHOST_HOLD_MS);

    if (destroyed) {
      return;
    }

    /* =====================================================
       GHOST EXIT — LEFT / PAUSE / RIGHT
       ===================================================== */

    ghostStage.classList.add('is-exiting');

    await wait(GHOST_EXIT_MS);
  };

  /* =========================================================
     ENTER APPLICATION
     ========================================================= */

  const enterApplication = async () => {
    if (destroyed) {
      return;
    }

    document.documentElement.classList.add('is-entered');

    const themeColor = document.querySelector(
      'meta[name="theme-color"]'
    );

    if (themeColor) {
      themeColor.setAttribute('content', '#121315');
    }

    app.hidden = false;
    intro.style.display = 'none';

    await nextFrame();
  };

  /* =========================================================
     RUN
     ========================================================= */

  const run = async () => {
    await showGhost();

    if (destroyed) {
      return;
    }

    await enterApplication();
  };

  /* =========================================================
     START
     ========================================================= */

  resetGhost();
  run();

  /* =========================================================
     CLEANUP
     ========================================================= */

  window.addEventListener(
    'pagehide',
    () => {
      destroyed = true;

      clearTimers();
    },
    { once: true }
  );
})();
