'use strict';

/* =========================================================
   TWINCH — NAVBAR / SEEK / TIMER / PLAY
   ========================================================= */

(() => {
  /* =========================================================
     ELEMENTS
     ========================================================= */

  const nav = document.querySelector('.nav');
  const seekWrap = document.getElementById('seekWrap');
  const seekPill = document.getElementById('seekPill');
  const seekFill = document.getElementById('seekFill');
  const seekTime = document.getElementById('seekTime');
  const playOverlay = document.getElementById('playOverlay');

  /* =========================================================
     STATE
     ========================================================= */

  let currentVideo = null;

  let progRaf = 0;

  let pillTouching = false;
  let pillSeeking = false;
  let pillStartX = 0;
  let pillStartY = 0;
  let pillMoved = false;
  let wasPlayingBeforeSeek = false;

  let seekRaf = 0;
  let seekLatestX = 0;
  let seekActiveOffTimer = 0;

  let playbackGuardTimers = [];

  let tapStartX = 0;
  let tapStartY = 0;
  let tapStartT = 0;
  let tapTracking = false;

  const TAP_MAX_MOVE = 8;
  const TAP_MAX_TIME = 220;

  /* =========================================================
     HELPERS
     ========================================================= */

  function tryPlay(video) {
    if (!video) return Promise.resolve();

    const result = video.play();

    if (result && typeof result.catch === 'function') {
      return result.catch(() => {});
    }

    return Promise.resolve();
  }

  function showPlayOverlay(show) {
    if (!playOverlay) return;
    playOverlay.style.opacity = show ? '1' : '0';
  }

  function clearPlaybackGuard() {
    playbackGuardTimers.forEach((timer) => clearTimeout(timer));
    playbackGuardTimers = [];
  }

  function guardCurrentPlayback() {
    clearPlaybackGuard();
    if (!currentVideo) return;

    const delays = [180, 420];

    const attempt = () => {
      const video = currentVideo;
      if (!video) return;

      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      if (video.readyState === 0) {
        try {
          video.load();
        } catch (error) {}

        return;
      }

      if (video.paused && video.readyState >= 2) {
        tryPlay(video);
      }
    };

    delays.forEach((delay) => {
      const timer = setTimeout(() => {
        playbackGuardTimers = playbackGuardTimers.filter(
          (item) => item !== timer
        );

        attempt();
      }, delay);

      playbackGuardTimers.push(timer);
    });
  }

  /* =========================================================
     PROGRESS
     ========================================================= */

  function stopProg() {
    if (progRaf) cancelAnimationFrame(progRaf);
    progRaf = 0;
  }

  function updateSeekFill() {
    if (!currentVideo || !seekFill) return;

    const duration = currentVideo.duration;

    if (duration && isFinite(duration) && duration > 0) {
      const progress = Math.max(
        0,
        Math.min(1, currentVideo.currentTime / duration)
      );

      seekFill.style.width = (progress * 100) + '%';
    } else {
      seekFill.style.width = '0%';
    }
  }

  function startProg() {
    stopProg();
    if (!currentVideo) return;

    const tick = () => {
      progRaf = 0;
      if (!currentVideo) return;

      updateSeekFill();

      if (!currentVideo.paused && !currentVideo.ended) {
        progRaf = requestAnimationFrame(tick);
      }
    };

    progRaf = requestAnimationFrame(tick);
  }

  /* =========================================================
     TIMER
     ========================================================= */

  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    sec = Math.floor(sec);

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');

    return h > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  function updateSeekUIFromCurrent() {
    if (!currentVideo || !seekTime) return;

    const duration = currentVideo.duration;

    if (!duration || !isFinite(duration) || duration <= 0) {
      seekTime.innerHTML =
        '<span class="t-cur">00:00</span>' +
        '<span class="t-sep"> / </span>' +
        '<span class="t-tot">00:00</span>';

      return;
    }

    const time = Math.max(
      0,
      Math.min(duration, currentVideo.currentTime || 0)
    );

    seekTime.innerHTML =
      `<span class="t-cur">${fmtTime(time)}</span>` +
      '<span class="t-sep"> / </span>' +
      `<span class="t-tot">${fmtTime(duration)}</span>`;
  }

  /* =========================================================
     SEEK ACTIVE STATE
     ========================================================= */

  function clearSeekInactiveTimer() {
    if (!seekActiveOffTimer) return;

    clearTimeout(seekActiveOffTimer);
    seekActiveOffTimer = 0;
  }

  function setSeekActive(on) {
    if (seekPill) seekPill.classList.toggle('is-active', !!on);
    if (seekTime) seekTime.classList.toggle('is-active', !!on);

    if (on) updateSeekUIFromCurrent();
  }

  function queueSeekInactive() {
    clearSeekInactiveTimer();

    if (seekTime) seekTime.classList.remove('is-active');

    seekActiveOffTimer = setTimeout(() => {
      if (seekPill) seekPill.classList.remove('is-active');
      seekActiveOffTimer = 0;
    }, 3000);
  }

  /* =========================================================
     SEEK VISIBILITY
     ========================================================= */

  function showSeek(show) {
    if (!seekWrap) return;

    seekWrap.style.display = show ? 'flex' : 'none';
    seekWrap.setAttribute('aria-hidden', show ? 'false' : 'true');

    if (!show) {
      clearSeekInactiveTimer();
      setSeekActive(false);

      if (seekFill) seekFill.style.width = '0%';

      stopProg();
    }
  }

  /* =========================================================
     SEEK ENGINE
     ========================================================= */

  function seekToClientX(clientX) {
    if (!currentVideo || !seekPill) return;

    const duration = currentVideo.duration;
    if (!duration || !isFinite(duration) || duration <= 0) return;

    const rect = seekPill.getBoundingClientRect();
    if (!rect.width) return;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const time = (x / rect.width) * duration;

    currentVideo.currentTime = time;

    const progress = Math.max(0, Math.min(1, time / duration));

    if (seekFill) {
      seekFill.style.width = (progress * 100) + '%';
    }

    if (seekTime) {
      seekTime.innerHTML =
        `<span class="t-cur">${fmtTime(time)}</span>` +
        '<span class="t-sep"> / </span>' +
        `<span class="t-tot">${fmtTime(duration)}</span>`;
    }
  }

  function queueSeek(clientX) {
    seekLatestX = clientX;
    if (seekRaf) return;

    seekRaf = requestAnimationFrame(() => {
      seekRaf = 0;
      seekToClientX(seekLatestX);
    });
  }

  /* =========================================================
     PLAY / PAUSE
     ========================================================= */

  function playCurrent() {
    if (!currentVideo) return;

    tryPlay(currentVideo);
    showPlayOverlay(false);
    startProg();
    guardCurrentPlayback();
  }

  function pauseCurrent() {
    if (!currentVideo) return;

    clearPlaybackGuard();
    currentVideo.pause();
    stopProg();
    showPlayOverlay(true);
  }

  function togglePlayPause() {
    if (!currentVideo) return;

    if (currentVideo.paused || currentVideo.ended) {
      playCurrent();
    } else {
      pauseCurrent();
    }
  }

  /* =========================================================
     VIDEO EVENTS
     ========================================================= */

  function onVideoPlay() {
    showPlayOverlay(false);
    startProg();
  }

  function onVideoPause() {
    stopProg();
  }

  function onVideoLoadedMetadata() {
    updateSeekFill();
    updateSeekUIFromCurrent();
    startProg();
  }

  function onVideoSeeked() {
    updateSeekFill();
    updateSeekUIFromCurrent();
    startProg();
  }

  function onVideoTimeUpdate() {
    updateSeekFill();

    if (seekTime && seekTime.classList.contains('is-active')) {
      updateSeekUIFromCurrent();
    }
  }

  function unbindCurrentVideo() {
    if (!currentVideo) return;

    currentVideo.removeEventListener('play', onVideoPlay);
    currentVideo.removeEventListener('pause', onVideoPause);
    currentVideo.removeEventListener('loadedmetadata', onVideoLoadedMetadata);
    currentVideo.removeEventListener('seeked', onVideoSeeked);
    currentVideo.removeEventListener('timeupdate', onVideoTimeUpdate);
  }

  function bindVideo(video) {
    if (currentVideo === video) return;

    unbindCurrentVideo();
    stopProg();
    clearPlaybackGuard();

    currentVideo = video || null;

    if (!currentVideo) {
      showSeek(false);
      showPlayOverlay(false);
      return;
    }

    currentVideo.preload = 'auto';
    currentVideo.playsInline = true;
    currentVideo.setAttribute('playsinline', '');
    currentVideo.setAttribute('webkit-playsinline', '');
    currentVideo.setAttribute('disablepictureinpicture', '');
    currentVideo.setAttribute('x-webkit-airplay', 'deny');

    currentVideo.addEventListener('play', onVideoPlay);
    currentVideo.addEventListener('pause', onVideoPause);
    currentVideo.addEventListener('loadedmetadata', onVideoLoadedMetadata);
    currentVideo.addEventListener('seeked', onVideoSeeked);
    currentVideo.addEventListener('timeupdate', onVideoTimeUpdate);

    showSeek(true);
    updateSeekFill();
    updateSeekUIFromCurrent();
    showPlayOverlay(currentVideo.paused);

    if (!currentVideo.paused && !currentVideo.ended) {
      startProg();
    }
  }

  /* =========================================================
     SEEK — WRAPPER TOUCH
     ========================================================= */

  if (seekWrap) {
    seekWrap.addEventListener('touchstart', (event) => {
      if (!currentVideo) return;
      if (!event.touches || event.touches.length !== 1) return;

      pillTouching = true;
      pillSeeking = false;
      pillMoved = false;

      pillStartX = event.touches[0].clientX;
      pillStartY = event.touches[0].clientY;

      clearSeekInactiveTimer();
      setSeekActive(true);

      wasPlayingBeforeSeek = !(
        currentVideo.paused ||
        currentVideo.ended
      );

      currentVideo.pause();
      stopProg();

      queueSeek(event.touches[0].clientX);
    }, { passive: false });

    seekWrap.addEventListener('touchmove', (event) => {
      if (!currentVideo || !pillTouching) return;
      if (!event.touches || event.touches.length !== 1) return;

      const x = event.touches[0].clientX;
      const y = event.touches[0].clientY;
      const dx = x - pillStartX;
      const dy = y - pillStartY;

      if (!pillSeeking) {
        if (
          Math.abs(dx) >= 2 &&
          Math.abs(dx) >= Math.abs(dy)
        ) {
          pillSeeking = true;
        } else if (
          Math.abs(dy) > Math.abs(dx) &&
          Math.abs(dy) > 6
        ) {
          pillTouching = false;
          setSeekActive(false);

          if (wasPlayingBeforeSeek) {
            playCurrent();
          }

          startProg();
          return;
        } else {
          return;
        }
      }

      pillMoved = pillMoved || Math.abs(dx) >= 2;

      event.preventDefault();
      event.stopPropagation();

      queueSeek(x);
    }, { passive: false });

    seekWrap.addEventListener('touchend', (event) => {
      if (!currentVideo) return;

      pillTouching = false;
      pillSeeking = false;

      if (
        !pillMoved &&
        event &&
        event.changedTouches &&
        event.changedTouches[0]
      ) {
        queueSeek(event.changedTouches[0].clientX);
      }

      pillMoved = false;

      queueSeekInactive();

      if (wasPlayingBeforeSeek) {
        playCurrent();
      }

      startProg();
    }, { passive: false });

    seekWrap.addEventListener('touchcancel', () => {
      if (!currentVideo) return;

      pillTouching = false;
      pillSeeking = false;
      pillMoved = false;

      queueSeekInactive();

      if (wasPlayingBeforeSeek) {
        playCurrent();
      }

      startProg();
    }, { passive: true });
  }

  /* =========================================================
     SEEK — PILL TOUCH
     ========================================================= */

  if (seekPill) {
    seekPill.addEventListener('touchstart', (event) => {
      if (!currentVideo) return;
      if (!event.touches || event.touches.length !== 1) return;

      pillTouching = true;
      pillSeeking = false;
      pillMoved = false;

      pillStartX = event.touches[0].clientX;
      pillStartY = event.touches[0].clientY;
    }, { passive: true });

    seekPill.addEventListener('touchmove', (event) => {
      if (!currentVideo || !pillTouching) return;
      if (!event.touches || event.touches.length !== 1) return;

      const x = event.touches[0].clientX;
      const y = event.touches[0].clientY;
      const dx = x - pillStartX;
      const dy = y - pillStartY;

      if (!pillSeeking) {
        if (
          Math.abs(dx) > Math.abs(dy) &&
          Math.abs(dx) > 6
        ) {
          pillSeeking = true;
        } else if (
          Math.abs(dy) > Math.abs(dx) &&
          Math.abs(dy) > 6
        ) {
          pillTouching = false;
          return;
        } else {
          return;
        }
      }

      pillMoved = true;

      event.preventDefault();
      event.stopPropagation();

      seekToClientX(x);
    }, { passive: false });

    seekPill.addEventListener('touchend', (event) => {
      if (!currentVideo) {
        pillTouching = false;
        pillSeeking = false;
        return;
      }

      const wasMoved = pillMoved;

      pillTouching = false;
      pillSeeking = false;
      pillMoved = false;

      if (!wasMoved) {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }

        togglePlayPause();
      }
    }, { passive: false });

    seekPill.addEventListener('click', (event) => {
      if (!currentVideo || pillMoved) return;

      event.preventDefault();
      togglePlayPause();
    });
  }

  /* =========================================================
     VIDEO TAP — TIKBOO PLAY / PAUSE
     ========================================================= */

  document.addEventListener('touchstart', (event) => {
    if (!currentVideo) return;

    if (!event.touches || event.touches.length !== 1) {
      tapTracking = false;
      return;
    }

    if (
      event.target.closest(
        'button, a, input, textarea, select, label, .nav, .seek-wrap'
      )
    ) {
      tapTracking = false;
      return;
    }

    tapTracking = true;
    tapStartX = event.touches[0].clientX;
    tapStartY = event.touches[0].clientY;
    tapStartT = performance.now();
  }, { passive: true });

  document.addEventListener('touchend', (event) => {
    if (!tapTracking || !currentVideo) {
      tapTracking = false;
      return;
    }

    tapTracking = false;

    if (!event.changedTouches || !event.changedTouches[0]) return;

    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;

    const dx = endX - tapStartX;
    const dy = endY - tapStartY;
    const move = Math.max(Math.abs(dx), Math.abs(dy));
    const duration = performance.now() - tapStartT;

    const isTap =
      move < TAP_MAX_MOVE &&
      duration < TAP_MAX_TIME;

    if (!isTap) return;

    togglePlayPause();
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    tapTracking = false;
  }, { passive: true });

  /* =========================================================
     NAVIGATION BUTTONS
     ========================================================= */

  if (nav) {
    nav.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const label = button.getAttribute('aria-label');
      if (!label) return;

      document.dispatchEvent(
        new CustomEvent('twinch:nav', {
          detail: {
            label,
            button
          }
        })
      );
    });
  }

  /* =========================================================
     PUBLIC VIDEO BINDING
     ========================================================= */

  function findInitialVideo() {
    const explicit = document.getElementById('videoCurrent');
    if (explicit) return explicit;

    const app = document.getElementById('twinchApp');
    if (!app) return null;

    return app.querySelector('video');
  }

  function setCurrentVideo(video) {
    bindVideo(video);
  }

  function clearCurrentVideo() {
    bindVideo(null);
  }

  window.TwinchNavbar = {
    setCurrentVideo,
    clearCurrentVideo,
    showSeek,
    showPlayOverlay,
    togglePlayPause,
    updateSeekFill,
    updateSeekUIFromCurrent
  };

  /* =========================================================
     INITIAL VIDEO
     ========================================================= */

  const initialVideo = findInitialVideo();

  if (initialVideo) {
    bindVideo(initialVideo);
  } else {
    showSeek(false);
    showPlayOverlay(false);
  }

  /* =========================================================
     VIDEO CHANGE EVENT
     ========================================================= */

  document.addEventListener('twinch:video:current', (event) => {
    const video = event.detail?.video || null;
    bindVideo(video);
  });

  /* =========================================================
     PAGE LIFECYCLE
     ========================================================= */

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (
        currentVideo &&
        !currentVideo.paused &&
        !currentVideo.ended
      ) {
        startProg();
      }

      updateSeekFill();
      updateSeekUIFromCurrent();
    } else {
      clearPlaybackGuard();
      stopProg();
    }
  });

  window.addEventListener('pageshow', () => {
    updateSeekFill();
    updateSeekUIFromCurrent();

    if (
      currentVideo &&
      !currentVideo.paused &&
      !currentVideo.ended
    ) {
      startProg();
    }
  });
})();
