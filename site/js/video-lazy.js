/**
 * video-lazy.js - Lazy loading + autoplay for videos
 * Videos with class "lazy-video" will:
 * 1. Show poster image immediately (no video data loaded)
 * 2. Start loading when scrolling near viewport (200px threshold)
 * 3. Autoplay (muted) once enough data is buffered
 */
(function() {
  'use strict';

  function initLazyVideos() {
    var videos = document.querySelectorAll('video.lazy-video');
    if (!videos.length) return;

    // Use Intersection Observer if available (all modern browsers)
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            loadVideo(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '200px 0px' // Start loading 200px before visible
      });

      videos.forEach(function(video) {
        observer.observe(video);
      });
    } else {
      // Fallback: load all videos immediately
      videos.forEach(loadVideo);
    }
  }

  function loadVideo(video) {
    var sources = video.querySelectorAll('source[data-src]');
    sources.forEach(function(source) {
      source.src = source.getAttribute('data-src');
      source.removeAttribute('data-src');
    });

    // If video itself has data-src
    if (video.dataset.src) {
      video.src = video.dataset.src;
      delete video.dataset.src;
    }

    video.preload = 'metadata';
    video.load();

    // Autoplay once enough data is ready
    if (video.hasAttribute('data-autoplay')) {
      video.muted = true;
      video.addEventListener('canplay', function onCanPlay() {
        video.removeEventListener('canplay', onCanPlay);
        video.play().catch(function() {});
      });
    }

    video.classList.remove('lazy-video');
    video.classList.add('lazy-loaded');
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyVideos);
  } else {
    initLazyVideos();
  }
})();
