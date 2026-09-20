'use strict';

/* =========================================================
   TWINCH — MAIN ENTRY
   ========================================================= */

(() => {
  const intro =
    document.getElementById('intro');

  const wordmark =
    document.getElementById('introWordmarkStage');

  const quote =
    document.getElementById('introHeartStage');

  const app =
    document.getElementById('twinchApp');

  if (!intro || !wordmark || !quote || !app) {
    return;
  }

  let exiting = false;
  let entered = false;

  const enter = () => {
    if (entered) {
      return;
    }

    entered = true;
    observer.disconnect();

    document.documentElement.style.setProperty(
      '--page-background',
      '#000000'
    );

    app.hidden = false;

    intro.hidden = true;
    intro.style.display = 'none';
  };

  const observer =
    new MutationObserver(() => {
      const isExiting =
        wordmark.classList.contains('is-exiting') &&
        quote.classList.contains('is-exiting');

      if (isExiting) {
        exiting = true;
        return;
      }

      if (exiting) {
        enter();
      }
    });

  observer.observe(wordmark, {
    attributes: true,
    attributeFilter: ['class']
  });

  observer.observe(quote, {
    attributes: true,
    attributeFilter: ['class']
  });
})();
