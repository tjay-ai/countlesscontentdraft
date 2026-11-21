/* =========================================================
   Countless Content: main.js (vanilla, no dependencies)
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* -------------------------------------------------------
     "Book a call" CTAs
     Every CTA has data-cta="book-call". Set the URL once here
     and all buttons on the page will use it.
     ------------------------------------------------------- */
  // TODO: add booking link (e.g. 'https://calendly.com/your-link')
  var BOOKING_URL = '';

  document.querySelectorAll('[data-cta="book-call"]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (!BOOKING_URL) return; // non-clickable until a link is added
      window.open(BOOKING_URL, '_blank', 'noopener');
    });
  });

  /* -------------------------------------------------------
     Sticky header: transparent over hero, solid once scrolled
     ------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* -------------------------------------------------------
     Fade-up reveals + process timeline + stat counters
     ------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal, [data-timeline]');
  var counters = document.querySelectorAll('[data-count]');

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }

    var duration = 1400;
    var start = null;
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (!hasIO) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });

    if (!reduceMotion) {
      counters.forEach(function (el) {
        el.textContent = '0' + (el.getAttribute('data-suffix') || '');
      });
      var countObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { countObserver.observe(el); });
    }
  }

  /* -------------------------------------------------------
     Videos
     - Lazy-play: play when in view, pause when out of view
     - Speaker toggle: only one video has sound at a time
     - Click a video to pause / resume it
     - Reduced motion: no autoplay (sound button starts playback)
     ------------------------------------------------------- */
  var videos = Array.prototype.slice.call(document.querySelectorAll('.phone__video'));

  function setSoundUI(video, on) {
    var btn = video.parentElement.querySelector('.sound-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Mute video' : 'Unmute video');
  }

  function muteAllExcept(keep) {
    videos.forEach(function (v) {
      if (v !== keep && !v.muted) {
        v.muted = true;
        setSoundUI(v, false);
      }
    });
  }

  function safePlay(video) {
    if (video.dataset.userPaused === 'true') return;
    if (video.preload === 'none') video.preload = 'metadata';
    var p = video.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* autoplay blocked: poster stays */ });
  }

  videos.forEach(function (video) {
    video.muted = true; // required for autoplay on iOS/Chrome

    if (reduceMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    }

    var btn = video.parentElement.querySelector('.sound-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var turnOn = video.muted;
        if (turnOn) {
          muteAllExcept(video);
          video.muted = false;
          video.dataset.userPaused = 'false';
          safePlay(video);
        } else {
          video.muted = true;
        }
        setSoundUI(video, turnOn);
      });
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        video.dataset.userPaused = 'false';
        safePlay(video);
      } else {
        video.dataset.userPaused = 'true';
        video.pause();
      }
    });
  });

  if (hasIO) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        video.dataset.inView = entry.isIntersecting ? 'true' : 'false';
        if (entry.isIntersecting) {
          // With reduced motion, only resume videos the user started via the sound button
          if (!reduceMotion || !video.muted) safePlay(video);
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { videoObserver.observe(v); });
  } else if (!reduceMotion) {
    videos.forEach(safePlay);
  }

  // Pause everything when the tab is hidden; resume visible ones on return
  document.addEventListener('visibilitychange', function () {
    videos.forEach(function (v) {
      if (document.hidden) v.pause();
      else if (v.dataset.inView === 'true' && (!reduceMotion || !v.muted)) safePlay(v);
    });
  });
})();
