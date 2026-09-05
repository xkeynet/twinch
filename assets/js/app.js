'use strict';

/* =========================================================
   TWINCH — LANDING LOOP
   ========================================================= */

(() => {
  /* =========================================================
     TIMING
     ========================================================= */

  const START_DELAY_MS = 400;

  const LINE_STAGGER_MS = 600;
  const LINE_ANIMATION_MS = 1900;

  const SEQUENCE_HOLD_MS = 10000;
  const SEQUENCE_FADE_MS = 500;

  const HEART_ANIMATION_MS = 2400;
  const HEART_HOLD_MS = 10000;
  const HEART_FADE_MS = 500;

  /* =========================================================
     ELEMENTS
     ========================================================= */

  const intro = document.getElementById('intro');
  const sequence = document.getElementById('introSequence');
  const heartStage = document.getElementById('introHeartStage');

  const lines = [
    document.getElementById('introLine1'),
    document.getElementById('introLine2'),
    document.getElementById('introLine3'),
    document.getElementById('introLine4')
  ];

  if (
    !intro ||
    !sequence ||
    !heartStage ||
    lines.some((line) => !line)
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

  const resetSequence = () => {
    sequence.classList.remove('is-hidden');

    lines.forEach((line) => {
      line.classList.remove(
        'is-visible',
        'is-settled'
      );
    });
  };

  const resetHeart = () => {
    heartStage.classList.remove(
      'is-visible',
      'is-entering',
      'is-settled',
      'is-hidden'
    );
  };

  const resetAll = () => {
    resetSequence();
    resetHeart();
  };

  /* =========================================================
     SLOGAN SEQUENCE
     ========================================================= */

  const showSequence = async () => {
    resetSequence();

    await nextFrame();

    for (const line of lines) {
      if (destroyed) {
        return;
      }

      line.classList.add('is-visible');

      await wait(LINE_STAGGER_MS);
    }

    await wait(
      Math.max(
        0,
        LINE_ANIMATION_MS - LINE_STAGGER_MS
      )
    );

    lines.forEach((line) => {
      line.classList.add('is-settled');
    });

    await wait(SEQUENCE_HOLD_MS);

    if (destroyed) {
      return;
    }

    sequence.classList.add('is-hidden');

    await wait(SEQUENCE_FADE_MS);
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

    await wait(HEART_HOLD_MS);

    if (destroyed) {
      return;
    }

    heartStage.classList.add('is-hidden');

    await wait(HEART_FADE_MS);

    resetHeart();
  };

  /* =========================================================
     LOOP
     ========================================================= */

  const runLoop = async () => {
    await wait(START_DELAY_MS);

    while (!destroyed) {
      await showSequence();

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
