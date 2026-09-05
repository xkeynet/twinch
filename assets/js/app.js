'use strict';

/* =========================================================
   TWINCH — LANDING LOOP
   ========================================================= */

(() => {
  /* =========================================================
     TIMING
     ========================================================= */

  const START_DELAY_MS = 500;

  const CHAR_ENTER_STAGGER_MS = 45;
  const CHAR_ENTER_ANIMATION_MS = 1100;
  const LINE_GAP_MS = 120;

  const SEQUENCE_HOLD_MS = 5000;

  const CHAR_EXIT_STAGGER_MS = 40;
  const CHAR_EXIT_ANIMATION_MS = 900;
  const EXIT_LINE_GAP_MS = 80;

  const HEART_ANIMATION_MS = 2400;
  const HEART_COLOR_MS = 520;
  const HEART_HOLD_MS = 5000;
  const HEART_FADE_MS = 500;

  const CHAR_ENTER_EASING = 'cubic-bezier(0.14, 0.92, 0.18, 1)';
  const CHAR_EXIT_EASING = 'cubic-bezier(0.4, 0, 0.6, 1)';

  /* =========================================================
     ELEMENTS
     ========================================================= */

  const intro = document.getElementById('intro');
  const sequence = document.getElementById('introSequence');
  const heartStage = document.getElementById('introHeartStage');
  const heartWhite = document.getElementById('introHeartWhite');
  const heartRed = document.getElementById('introHeartRed');

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
    !heartWhite ||
    !heartRed ||
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

  const getEnterOffset = () => window.innerWidth + 180;
  const getExitOffset = () => -(window.innerWidth + 180);

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
        `translate3d(${getEnterOffset()}px, 0, 0)`;

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
          `translate3d(${getEnterOffset()}px, 0, 0)`;

        character.style.willChange =
          'transform, opacity';
      });
    });
  };

  const resetSequence = () => {
    sequence.classList.remove('is-hidden');

    lines.forEach((line) => {
      line.classList.remove(
        'is-visible',
        'is-settled',
        'is-exiting'
      );
    });

    resetCharacters();
  };

  const resetHeart = () => {
    heartStage.classList.remove(
      'is-visible',
      'is-entering',
      'is-settled',
      'is-red',
      'is-hidden'
    );
  };

  const resetAll = () => {
    resetSequence();
    resetHeart();
  };

  /* =========================================================
     CHARACTER ENTER
     ========================================================= */

  const animateCharacterEnter = (character) => {
    character.style.willChange = 'transform, opacity';

    const animation = character.animate(
      [
        {
          opacity: 0,
          transform:
            `translate3d(${getEnterOffset()}px, 0, 0)`
        },
        {
          opacity: 1,
          offset: 0.08
        },
        {
          opacity: 1,
          transform: 'translate3d(0, 0, 0)'
        }
      ],
      {
        duration: CHAR_ENTER_ANIMATION_MS,
        easing: CHAR_ENTER_EASING,
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

  const animateLineEnter = async (lineCharacters) => {
    for (const character of lineCharacters) {
      if (destroyed) {
        return;
      }

      animateCharacterEnter(character);

      await wait(CHAR_ENTER_STAGGER_MS);
    }

    await wait(
      Math.max(
        0,
        CHAR_ENTER_ANIMATION_MS -
        CHAR_ENTER_STAGGER_MS
      )
    );
  };

  /* =========================================================
     CHARACTER EXIT
     ========================================================= */

  const animateCharacterExit = (character) => {
    character.style.willChange = 'transform, opacity';

    const animation = character.animate(
      [
        {
          opacity: 1,
          transform: 'translate3d(0, 0, 0)'
        },
        {
          opacity: 1,
          offset: 0.72
        },
        {
          opacity: 0,
          transform:
            `translate3d(${getExitOffset()}px, 0, 0)`
        }
      ],
      {
        duration: CHAR_EXIT_ANIMATION_MS,
        easing: CHAR_EXIT_EASING,
        fill: 'forwards'
      }
    );

    animations.add(animation);

    animation.addEventListener(
      'finish',
      () => {
        animations.delete(animation);

        character.style.opacity = '0';
        character.style.transform =
          `translate3d(${getExitOffset()}px, 0, 0)`;

        character.style.willChange = 'auto';
      },
      { once: true }
    );

    return animation;
  };

  const animateLineExit = async (lineCharacters) => {
    for (const character of lineCharacters) {
      if (destroyed) {
        return;
      }

      animateCharacterExit(character);

      await wait(CHAR_EXIT_STAGGER_MS);
    }

    await wait(
      Math.max(
        0,
        CHAR_EXIT_ANIMATION_MS -
        CHAR_EXIT_STAGGER_MS
      )
    );
  };

  /* =========================================================
     SLOGAN SEQUENCE
     ========================================================= */

  const showSequence = async () => {
    resetSequence();

    await nextFrame();

    for (let index = 0; index < characters.length; index += 1) {
      if (destroyed) {
        return;
      }

      lines[index].classList.add('is-visible');

      await animateLineEnter(characters[index]);

      if (destroyed) {
        return;
      }

      lines[index].classList.add('is-settled');

      if (index < characters.length - 1) {
        await wait(LINE_GAP_MS);
      }
    }

    await wait(SEQUENCE_HOLD_MS);

    if (destroyed) {
      return;
    }

    for (let index = 0; index < characters.length; index += 1) {
      if (destroyed) {
        return;
      }

      lines[index].classList.remove('is-settled');
      lines[index].classList.add('is-exiting');

      await animateLineExit(characters[index]);

      if (destroyed) {
        return;
      }

      if (index < characters.length - 1) {
        await wait(EXIT_LINE_GAP_MS);
      }
    }

    sequence.classList.add('is-hidden');

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

    heartStage.classList.add('is-red');

    await wait(HEART_COLOR_MS);

    if (destroyed) {
      return;
    }

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
