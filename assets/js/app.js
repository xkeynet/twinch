'use strict';

/* =========================================================
   TWINCH — LANDING LOOP
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

    if (destroyed) {
      return;
    }

    heartStage.style.transition = 'none';
    heartStage.style.opacity = '0';
    heartStage.style.visibility = 'hidden';

    wordmarkStage.style.transition = 'none';
    wordmarkStage.style.opacity = '0';
    wordmarkStage.style.visibility = 'hidden';

    resetHeart();
    resetWordmark();

    void heartStage.offsetWidth;
    void wordmarkStage.offsetWidth;

    await nextFrame();

    heartStage.style.transition = '';
    heartStage.style.opacity = '';
    heartStage.style.visibility = '';

    wordmarkStage.style.transition = '';
    wordmarkStage.style.opacity = '';
    wordmarkStage.style.visibility = '';

    await nextFrame();
  };

  /* =========================================================
     LOOP
     ========================================================= */

  const runLoop = async () => {
    await wait(START_DELAY_MS);

    while (!destroyed) {
      await showWordmark();

      if (destroyed) {
        break;
      }

      await showHeart();

      if (destroyed) {
        break;
      }

      resetAll();

      await nextFrame();
    }
  };

  /* =========================================================
     START
     ========================================================= */

  resetAll();
  runLoop();

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
