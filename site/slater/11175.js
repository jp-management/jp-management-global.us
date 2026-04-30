let paths=window.location.pathname.split("/");paths=paths.filter((s=>!["en","pt-br","es","ru","it"].includes(s))),import("https://assets.slater.app/slater/11175/26522.js?v=734307"),import("https://assets.slater.app/slater/11175/26607.js?v=390320"),import("https://assets.slater.app/slater/11175/26386.js?v=351124"),import("https://assets.slater.app/slater/11175/26595.js?v=436337"),import("https://assets.slater.app/slater/11175/28417.js?v=10519");{const s=[""],t=paths[paths.length-1],a=paths[paths.length-2];(s.includes(t)||s.includes("detail_"+a)||s.includes(a+"/item"))&&import("https://assets.slater.app/slater/11175/26113.js?v=508259")}

/* Language dropdown: hover to open with delay */
document.addEventListener('DOMContentLoaded',function(){
var d=document.querySelector('.w-dropdown');if(!d)return;
var l=d.querySelector('.w-dropdown-list');if(!l)return;
var tog=d.querySelector('.w-dropdown-toggle');
var timer=null;
function show(){clearTimeout(timer);l.style.display='block';l.style.opacity='1';l.style.visibility='visible'}
function scheduleHide(){clearTimeout(timer);if(!d.classList.contains('w--open')){l.style.display='';l.style.opacity='';l.style.visibility=''}}
d.addEventListener('mouseenter',show);
d.addEventListener('mouseleave',scheduleHide);
/* Close when clicking outside */
document.addEventListener('click',function(e){if(!d.contains(e.target)){clearTimeout(timer);if(!d.classList.contains('w--open')){l.style.display='';l.style.opacity='';l.style.visibility=''}}});
});

/* Dream h2 fade-in now uses .reveal class added directly in HTML.
   No word-by-word effect — whole text fades in at once via the scroll-reveal observer. */

/* Sticky dream text: force visible, override Webflow IX2 animations */
document.addEventListener('DOMContentLoaded',function(){
  var stickyContainer=document.querySelector('.cr--dream.u-height-40vh .cmp--dream');
  if(!stickyContainer)return;
  /* Kill Webflow IX2 animations and force full visibility */
  if(stickyContainer.getAnimations){
    stickyContainer.getAnimations().forEach(function(a){a.cancel()});
  }
  stickyContainer.style.opacity='1';
  stickyContainer.style.transform='none';
  /* Keep Webflow from overriding */
  new MutationObserver(function(){
    if(stickyContainer.getAnimations){
      stickyContainer.getAnimations().forEach(function(a){a.cancel()});
    }
    if(stickyContainer.style.opacity!=='1'){stickyContainer.style.opacity='1';}
    if(stickyContainer.style.transform!=='none'){stickyContainer.style.transform='none';}
  }).observe(stickyContainer,{attributes:true,attributeFilter:['style']});
});

/* Compare section: premium scroll-driven card animation.
   JP card gently grows while "Other Agencies" card shrinks.
   Uses CSS custom properties with !important to override Webflow IX2's
   persistent inline style writes. GSAP ScrollTrigger drives the
   CSS variable values, and a CSS rule with !important applies them.
   This makes the animation immune to IX2 interference.
   NOTE: IIFE because this script is dynamically imported after load. */
(function initCompareAnimation(){
  if(document.readyState!=='complete'){window.addEventListener('load',initCompareAnimation);return;}
  if(!window.gsap||!window.ScrollTrigger){setTimeout(initCompareAnimation,200);return;}

  var section=document.querySelector('.sc--compares');
  if(!section)return;
  var cmps=section.querySelectorAll('.cmp--compare');
  if(cmps.length<2)return;
  var leftCard=cmps[0];
  var rightCard=cmps[1];

  gsap.registerPlugin(ScrollTrigger);

  /* ---- CSS !important overrides driven by custom properties ---- */
  /* IX2 writes inline transforms continuously, so we cannot win with
     inline styles. Instead we use CSS custom properties (--ls, --lo, --rs, --rx)
     and a stylesheet rule with !important that reads them. IX2 can't override !important. */
  var css=document.createElement('style');
  css.textContent=
    '.sc--compares .cmp--compare:first-child{'+
      'transform:scale(var(--ls,1))!important;'+
      'opacity:var(--lo,1)!important;'+
      'will-change:transform,opacity;'+
    '}'+
    '.sc--compares .cmp--compare:last-child{'+
      'transform:scale(var(--rs,1)) translateX(var(--rx,0em))!important;'+
      'will-change:transform;'+
    '}'+
    '.sc--compares .cmp--compare-term{opacity:1!important;transform:none!important}'+
    '.sc--compares .cmp--compare-term *{opacity:1!important}';
  document.head.appendChild(css);

  /* Set initial CSS variable values on the section */
  section.style.setProperty('--ls','1');
  section.style.setProperty('--lo','1');
  section.style.setProperty('--rs','1');
  section.style.setProperty('--rx','0em');

  /* ---- Scroll-driven animation via manual scroll listener ---- */
  /* Replicates the XO Angels compare card effect:
     - Left card (Other Agencies): scale 1→0.8, opacity 1→0.6
     - Right card (JP Management): scale 1→1.2, translateX 0→-5em
     Animation starts at scroll 20% of section and ends at 50% (like XO reference).
     Uses GSAP ticker for smooth rAF-based updates. */
  function updateCompare(){
    var rect=section.getBoundingClientRect();
    var vh=window.innerHeight;
    /* XO reference uses scroll progress 20%→50% of the section being in view.
       startsEntering=true means progress 0=section enters bottom of viewport,
       progress 100=section exits top. We map 20%→50% of that range. */
    var fullStart=vh;           /* rect.top when section just enters viewport bottom */
    var fullEnd=-rect.height;   /* rect.top when section fully exited top */
    var fullRange=fullStart-fullEnd;
    var fullP=(fullStart-rect.top)/fullRange;  /* 0→1 full scroll progress */
    /* Map to 20%→50% range like XO reference */
    var p=(fullP-0.2)/(0.5-0.2);  /* remap: 0 at 20%, 1 at 50% */
    p=Math.max(0,Math.min(1,p));   /* clamp */
    /* Left card: scale 1→0.85, opacity 1→0.6 */
    section.style.setProperty('--ls',(1-0.15*p).toFixed(5));
    section.style.setProperty('--lo',(1-0.4*p).toFixed(4));
    /* Right card: scale 1→1.08, translateX 0→-3em */
    section.style.setProperty('--rs',(1+0.08*p).toFixed(5));
    section.style.setProperty('--rx',(-3*p).toFixed(4)+'em');
  }
  /* Use GSAP ticker for smooth updates (fires every rAF, tied to GSAP's loop) */
  gsap.ticker.add(updateCompare);
  updateCompare();
})();

/* Scroll-reveal: animate elements with .reveal class as they enter viewport.
   NOTE: Uses IIFE instead of window.load because this script is dynamically
   imported and load may have already fired. */
(function initScrollReveal(){
  if(document.readyState!=='complete'){window.addEventListener('load',initScrollReveal);return;}
  var revealOb=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('visible');
        revealOb.unobserve(e.target);
      }
    });
  },{threshold:0.15,rootMargin:'0px 0px -50px 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){revealOb.observe(el)});
})();

/* Set all videos to 50% volume */
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('video').forEach(function(v){ v.volume = 0.5; });
});

/* Mobile: clone language globe into header-base next to burger (visible ≤991px) */
document.addEventListener('DOMContentLoaded', function(){
  function closeGlobeDropdown(list) {
    list.style.display = 'none';
    list.style.opacity = '0';
    list.style.visibility = 'hidden';
  }

  function setupMobileGlobe() {
    var existing = document.getElementById('mobile-globe-clone');
    if (window.innerWidth <= 991) {
      if (existing) return;
      var original = document.querySelector('.cmp--dd-nav-link.w-dropdown');
      /* Insert into hd-base (next to burger), not hd-menu */
      var target = document.querySelector('.lyt--hd-base.lyt');
      if (!original || !target) return;
      var clone = original.cloneNode(true);
      clone.id = 'mobile-globe-clone';
      clone.style.display = 'block';
      clone.classList.remove('w--open');
      /* Append after burger (last child of hd-base) */
      target.appendChild(clone);
      /* Setup click toggle for the cloned dropdown */
      var tog = clone.querySelector('.w-dropdown-toggle');
      var list = clone.querySelector('.w-dropdown-list');
      if (tog && list) {
        list.style.display = 'none';
        tog.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var isOpen = list.style.display === 'block';
          if (isOpen) { closeGlobeDropdown(list); }
          else { list.style.display = 'block'; list.style.opacity = '1'; list.style.visibility = 'visible'; }
        });
        /* Close when clicking outside */
        document.addEventListener('click', function(e) {
          if (!clone.contains(e.target)) { closeGlobeDropdown(list); }
        });
        /* Close immediately when any language link is clicked */
        clone.querySelectorAll('.w-dropdown-list a[data-lang]').forEach(function(a) {
          a.addEventListener('click', function() {
            closeGlobeDropdown(list);
          });
        });
      }
    } else {
      if (existing) existing.remove();
    }
  }
  setupMobileGlobe();
  window.addEventListener('resize', setupMobileGlobe);
});