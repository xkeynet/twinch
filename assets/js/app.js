'use strict';

/* =========================================================
   TWINCH — LANDING
   ========================================================= */

(() => {
  /* =========================================================
     TIMING
     ========================================================= */

  const START_DELAY_MS = 2200;

  const WORDMARK_ANIMATION_MS = 1500;

  const HEART_ANIMATION_MS = 2400;
  const HEART_SETTLE_DELAY_MS = 520;
  const HEART_HOLD_MS = 5000;
  const SPLIT_EXIT_MS = 1100;

  /* =========================================================
     ELEMENTS
     ========================================================= */

  const intro = document.getElementById('intro');
  const wordmarkStage = document.getElementById('introWordmarkStage');
  const wordmark = document.getElementById('introWordmark');
  const heartStage = document.getElementById('introHeartStage');
  const heartWhite = document.getElementById('introHeartWhite');

  if (
    !intro ||
    !wordmarkStage ||
    !wordmark ||
    !heartStage ||
    !heartWhite
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

  const resetWordmark = () => {
    wordmarkStage.hidden = false;

    wordmarkStage.classList.remove(
      'is-visible',
      'is-entering',
      'is-settled',
      'is-exiting',
      'is-hidden'
    );
  };

  const resetHeart = () => {
    heartStage.classList.remove(
      'is-visible',
      'is-entering',
      'is-settled',
      'is-exiting',
      'is-hidden'
    );
  };

  const resetAll = () => {
    resetWordmark();
    resetHeart();
  };

  /* =========================================================
     WORDMARK
     ========================================================= */

  const showWordmark = async () => {
    resetWordmark();

    wordmarkStage.classList.add(
      'is-visible',
      'is-entering'
    );

    await wait(WORDMARK_ANIMATION_MS);

    if (destroyed) {
      return;
    }

    wordmarkStage.classList.remove('is-entering');
    wordmarkStage.classList.add('is-settled');

    await nextFrame();
  };

  /* =========================================================
     HEART
     ========================================================= */

  const showHeart = async () => {
    resetHeart();

    heartStage.classList.add('is-visible');

    await nextFrame();

    if (destroyed) {
      return;
    }

    heartStage.classList.add('is-entering');

    await wait(HEART_ANIMATION_MS);

    if (destroyed) {
      return;
    }

    heartStage.classList.remove('is-entering');
    heartStage.classList.add('is-settled');

    await nextFrame();

    if (destroyed) {
      return;
    }

    await wait(HEART_SETTLE_DELAY_MS);

    if (destroyed) {
      return;
    }

    await wait(HEART_HOLD_MS);

    if (destroyed) {
      return;
    }

    heartStage.classList.add('is-exiting');
    wordmarkStage.classList.add('is-exiting');

    await wait(SPLIT_EXIT_MS);
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
      themeColor.setAttribute('content', '#000000');
    }

    intro.style.display = 'none';

    await nextFrame();
  };

  /* =========================================================
     RUN
     ========================================================= */

  const run = async () => {
    await wait(START_DELAY_MS);

    if (destroyed) {
      return;
    }

    await showWordmark();

    if (destroyed) {
      return;
    }

    await showHeart();

    if (destroyed) {
      return;
    }

    await enterApplication();
  };

  /* =========================================================
     START
     ========================================================= */

  resetAll();
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
