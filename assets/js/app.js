'use strict';

/* =========================================================
   TWINCH — LANDING LOOP
   ========================================================= */

(() => {
  /* =========================================================
     TIMING
     ========================================================= */

  const START_DELAY_MS = 500;

  const CHAR_STAGGER_MS = 70;
  const CHAR_ANIMATION_MS = 1350;
  const LINE_GAP_MS = 260;

  const SEQUENCE_HOLD_MS = 10000;
  const SEQUENCE_FADE_MS = 500;

  const HEART_ANIMATION_MS = 2400;
  const HEART_HOLD_MS = 5000;
  const HEART_FADE_MS = 500;

  const CHAR_EASING = 'cubic-bezier(0.14, 0.92, 0.18, 1)';

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
  const animations = new Set();

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

  const cancelAnimations = () => {
    animations.forEach((animation) => {
      try {
        animation.cancel();
      } catch (error) {
        /* no-op */
      }
    });

    animations.clear();
  };

  const nextFrame = () =>
    new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
    });

  /* =========================================================
     CHARACTER ENGINE
     ========================================================= */

  const prepareLine = (line) => {
    const text = line.textContent.trim();

    line.setAttribute('aria-label', text);
    line.textContent = '';

    line.style.opacity = '1';
    line.style.transform = 'translate3d(0, 0, 0)';
    line.style.transition = 'none';

    const fragment = document.createDocumentFragment();

    Array.from(text).forEach((character) => {
      const span = document.createElement('span');

      span.className = 'intro__char';
      span.setAttribute('aria-hidden', 'true');

      span.textContent =
        character === ' '
          ? '\u00A0'
          : character;

      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform =
        `translate3d(${window.innerWidth + 180}px, 0, 0)`;

      span.style.transformOrigin = '50% 50%';
      span.style.willChange = 'transform, opacity';
      span.style.backfaceVisibility = 'hidden';
      span.style.webkitBackfaceVisibility = 'hidden';

      fragment.appendChild(span);
    });

    line.appendChild(fragment);

    return Array.from(
      line.querySelectorAll('.intro__char')
    );
  };

  const characters = lines.map(prepareLine);

  /* =========================================================
     RESET
     ========================================================= */

  const resetCharacters = () => {
    cancelAnimations();

    characters.forEach((lineCharacters) => {
      lineCharacters.forEach((character) => {
        character.style.opacity = '0';
        character.style.transform =
          `translate3d(${window.innerWidth + 180}px, 0, 0)`;

        character.style.willChange =
          'transform, opacity';
      });
    });
  };

  const resetSequence = () => {
    sequence.classList.remove('is-hidden');
    resetCharacters();
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
     CHARACTER ANIMATION
     ========================================================= */

  const animateCharacter = (character) => {
    const animation = character.animate(
      [
        {
          opacity: 0,
          transform:
            `translate3d(${window.innerWidth + 180}px, 0, 0)`
        },
        {
          opacity: 1,
          offset: 0.12
        },
        {
          opacity: 1,
          transform: 'translate3d(0, 0, 0)'
        }
      ],
      {
        duration: CHAR_ANIMATION_MS,
        easing: CHAR_EASING,
        fill: 'forwards'
      }
    );

    animations.add(animation);

    animation.addEventListener(
      'finish',
      () => {
        animations.delete(animation);

        character.style.opacity = '1';
        character.style.transform =
          'translate3d(0, 0, 0)';

        character.style.willChange = 'auto';
      },
      { once: true }
    );

    return animation;
  };

  const animateLine = async (lineCharacters) => {
    for (const character of lineCharacters) {
      if (destroyed) {
        return;
      }

      animateCharacter(character);

      await wait(CHAR_STAGGER_MS);
    }

    await wait(
      Math.max(
        0,
        CHAR_ANIMATION_MS - CHAR_STAGGER_MS
      )
    );
  };

  /* =========================================================
     SLOGAN SEQUENCE
     ========================================================= */

  const showSequence = async () => {
    resetSequence();

    await nextFrame();

    for (const lineCharacters of characters) {
      if (destroyed) {
        return;
      }

      await animateLine(lineCharacters);

      if (destroyed) {
        return;
      }

      await wait(LINE_GAP_MS);
    }

    await wait(SEQUENCE_HOLD_MS);

    if (destroyed) {
      return;
    }

    sequence.classList.add('is-hidden');

    await wait(SEQUENCE_FADE_MS);

    if (destroyed) {
      return;
    }

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

    await wait(HEART_HOLD_MS);

    if (destroyed) {
      return;
    }

    heartStage.classList.add('is-hidden');

    await wait(HEART_FADE_MS);

    if (destroyed) {
      return;
    }

    resetHeart();

    await nextFrame();
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
      cancelAnimations();
    },
    { once: true }
  );
})();
