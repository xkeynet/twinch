// =========================================================
// TWINCH SAFETY — KILL ZOOM
// iOS Safari: block pinch + gesture zoom
// =========================================================

document.addEventListener('touchmove', (e) => {
  if (e.scale && e.scale !== 1) e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

// =========================================================
// TWINCH SAFETY — LOGO / HEART PROTECTION
// =========================================================

(() => {
  const targets = [
    document.querySelector('#introWordmark'),
    document.querySelector('#introHeartWhite'),
    document.querySelector('#introHeartRed')
  ].filter(Boolean);

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  targets.forEach((img) => {
    img.setAttribute('draggable', 'false');

    img.style.webkitTouchCallout = 'none';
    img.style.webkitUserSelect = 'none';
    img.style.userSelect = 'none';
    img.style.webkitTapHighlightColor = 'transparent';

    img.addEventListener('contextmenu', stop, { passive: false });
    img.addEventListener('dragstart', stop, { passive: false });
  });
})();
