/* ==========================================================================
   FOR SEMA — orchestration script
   Handles: loader, scene transitions, bouquet bloom, floating petals,
   sparkles, ambient particle canvas, staggered text reveals, and the
   two-branch response flow.
   ========================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Element references
     --------------------------------------------------------------------- */
  const loader          = document.getElementById('loader');
  const sceneLanding     = document.getElementById('scene-landing');
  const sceneBouquet     = document.getElementById('scene-bouquet');
  const sceneAsk         = document.getElementById('scene-ask');
  const sceneClosing     = document.getElementById('scene-closing');

  const openBtn          = document.getElementById('open-btn');
  const continueBtn      = document.getElementById('continue-btn');
  const yesBtn            = document.getElementById('yes-btn');
  const noBtn             = document.getElementById('no-btn');
  const replayBtn        = document.getElementById('replay-btn');
  const responseText      = document.getElementById('response-text');

  const messageLines     = Array.from(document.querySelectorAll('.message-line'));
  const askLines          = Array.from(document.querySelectorAll('.ask-line'));

  const sparkleContainer = document.querySelector('.bouquet-sparkles');
  const petalContainer    = document.querySelector('.floating-petals');

  /* ---------------------------------------------------------------------
     1. LOADER — simulate a graceful load, then reveal landing scene
     --------------------------------------------------------------------- */
  function initLoader(){
    const minDuration = prefersReducedMotion ? 200 : 2600;
    window.setTimeout(() => {
      loader.classList.add('is-hidden');
      loader.setAttribute('aria-hidden', 'true');
    }, minDuration);
  }

  /* ---------------------------------------------------------------------
     2. SCENE TRANSITIONS
     --------------------------------------------------------------------- */
  function showScene(scene){
    scene.setAttribute('aria-hidden', 'false');
  }
  function hideScene(scene){
    scene.setAttribute('aria-hidden', 'true');
  }

  function goToBouquet(){
    // Fade out landing
    sceneLanding.style.transition = 'opacity 1s ease, transform 1s ease';
    sceneLanding.style.opacity = '0';
    sceneLanding.style.transform = 'scale(0.98)';

    window.setTimeout(() => {
      hideScene(sceneLanding);
      document.body.classList.add('bouquet-open');
      showScene(sceneBouquet);
      startBouquetExperience();
    }, prefersReducedMotion ? 0 : 900);
  }

  function goToAsk(){
    hideScene(sceneBouquet);
    showScene(sceneAsk);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    revealLinesSequentially(askLines, 550);
  }

  function goToClosing(){
    window.setTimeout(() => {
      hideScene(sceneAsk);
      showScene(sceneClosing);
    }, 1800);
  }

  /* ---------------------------------------------------------------------
     3. BOUQUET EXPERIENCE — bloom, sparkles, petals, then message
     --------------------------------------------------------------------- */
  function startBouquetExperience(){
    // Trigger bloom choreography
    requestAnimationFrame(() => {
      sceneBouquet.classList.add('is-blooming');
    });

    spawnSparkles();
    spawnFloatingPetals();

    // Reveal message lines after the bouquet has had time to bloom
    const messageDelay = prefersReducedMotion ? 300 : 2200;
    window.setTimeout(() => {
      revealLinesSequentially(messageLines, 650);
    }, messageDelay);
  }

  function reBloom(){
    sceneBouquet.classList.remove('rebloom');
    // force reflow so the animation can retrigger
    void sceneBouquet.offsetWidth;
    sceneBouquet.classList.add('rebloom');
    spawnSparkles(14);
  }

  /* ---------------------------------------------------------------------
     4. STAGGERED LINE REVEAL (message + ask blocks)
     --------------------------------------------------------------------- */
  function revealLinesSequentially(lines, gapMs){
    if(prefersReducedMotion){
      lines.forEach(el => el.classList.add('is-visible'));
      return;
    }
    lines.forEach((el, i) => {
      window.setTimeout(() => {
        el.classList.add('is-visible');
      }, i * gapMs);
    });
  }

  /* ---------------------------------------------------------------------
     5. SPARKLES around the bouquet
     --------------------------------------------------------------------- */
  function spawnSparkles(count){
    if(!sparkleContainer) return;
    const total = count || 20;
    for(let i = 0; i < total; i++){
      const s = document.createElement('div');
      s.className = 'sparkle';
      const top = 15 + Math.random() * 55;
      const left = 20 + Math.random() * 60;
      s.style.top = top + '%';
      s.style.left = left + '%';
      s.style.animationDelay = (Math.random() * 3) + 's';
      s.style.animationDuration = (2.4 + Math.random() * 2) + 's';
      sparkleContainer.appendChild(s);

      // clean up periodically so DOM doesn't grow unbounded on re-bloom
      window.setTimeout(() => s.remove(), 12000);
    }
  }

  /* ---------------------------------------------------------------------
     6. FLOATING PETALS drifting down past the bouquet
     --------------------------------------------------------------------- */
  let petalIntervalId = null;

  function spawnFloatingPetals(){
    if(!petalContainer || prefersReducedMotion) return;

    const spawnOne = () => {
      const p = document.createElement('div');
      p.className = 'floating-petal';
      const startLeft = Math.random() * 100;
      const duration = 8 + Math.random() * 6;
      const drift = (Math.random() * 80 - 40) + 'px';
      const rotateStart = Math.random() * 360;

      p.style.left = startLeft + '%';
      p.style.setProperty('--drift', drift);
      p.style.animationDuration = duration + 's';
      p.style.transform = `rotate(${rotateStart}deg)`;
      p.style.opacity = '0';

      petalContainer.appendChild(p);
      window.setTimeout(() => p.remove(), duration * 1000 + 500);
    };

    // initial burst, then a steady gentle trickle
    for(let i = 0; i < 5; i++){
      window.setTimeout(spawnOne, i * 400);
    }
    petalIntervalId = window.setInterval(spawnOne, 2600);
  }

  /* ---------------------------------------------------------------------
     7. AMBIENT PARTICLE CANVAS — soft floating dust/light motes
     --------------------------------------------------------------------- */
  function initParticleCanvas(){
    const canvas = document.getElementById('particles');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, particles;
    const COLORS = ['rgba(233,200,119,0.5)', 'rgba(203,184,221,0.45)', 'rgba(169,189,155,0.4)', 'rgba(255,253,249,0.6)'];

    function resize(){
      width = canvas.width = window.innerWidth * window.devicePixelRatio;
      height = canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }

    function makeParticles(){
      const count = prefersReducedMotion ? 0 : Math.min(60, Math.floor(window.innerWidth / 22));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.random() * 1.6 + 0.6) * window.devicePixelRatio,
        vy: (Math.random() * 0.18 + 0.05) * window.devicePixelRatio,
        vx: (Math.random() * 0.1 - 0.05) * window.devicePixelRatio,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.5 + 0.3,
        pulse: Math.random() * Math.PI * 2
      }));
    }

    function tick(){
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.y -= p.vy;
        p.x += p.vx;
        p.pulse += 0.01;
        if(p.y < -10) p.y = height + 10;
        if(p.x < -10) p.x = width + 10;
        if(p.x > width + 10) p.x = -10;

        const pulsedAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = pulsedAlpha;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }

    resize();
    makeParticles();
    if(!prefersReducedMotion){
      requestAnimationFrame(tick);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        makeParticles();
      }, 200);
    });
  }

  /* ---------------------------------------------------------------------
     8. RESPONSE FLOW — "I'd love to" / "Let's choose another day"
     --------------------------------------------------------------------- */
  function handleYes(){
    yesBtn.disabled = true;
    noBtn.disabled = true;
    reBloom();
    responseText.textContent = 'That honestly made me smile. 🌸';
    requestAnimationFrame(() => responseText.classList.add('is-visible'));
    goToClosing();
  }

  function handleNo(){
    yesBtn.disabled = true;
    noBtn.disabled = true;
    responseText.textContent = "That's completely okay. Whenever you're ready. 🌸";
    requestAnimationFrame(() => responseText.classList.add('is-visible'));
    goToClosing();
  }

  /* ---------------------------------------------------------------------
     9. REPLAY — return to the bouquet, still swaying forever
     --------------------------------------------------------------------- */
  function handleReplay(){
    hideScene(sceneClosing);
    showScene(sceneBouquet);
    responseText.classList.remove('is-visible');
    responseText.textContent = '';
    yesBtn.disabled = false;
    noBtn.disabled = false;
    reBloom();
  }

  /* ---------------------------------------------------------------------
     Init
     --------------------------------------------------------------------- */
  function init(){
    initLoader();
    initParticleCanvas();

    openBtn.addEventListener('click', goToBouquet);
    continueBtn.addEventListener('click', goToAsk);
    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
    replayBtn.addEventListener('click', handleReplay);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
