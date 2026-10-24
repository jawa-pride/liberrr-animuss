/* ========================================================
   LIBER ANIMUS — gravity.js
   Google Gravity & Gemini Interactive Physics Engine
   - Cosmic gravity particle simulation
   - 3D perspective magnetic card tilt & spotlight
   - Floating zero-g hero tags with elastic collision
   - Interactive gravity wave on click
   ======================================================== */

(function() {
  'use strict';

  // --- 1. COSMIC GRAVITY PARTICLE SYSTEM ---
  function initGravityCanvas() {
    let canvas = document.getElementById('gravityCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'gravityCanvas';
      canvas.className = 'gravity-canvas';
      document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let particles = [];
    let shockwaves = [];
    let mouse = { x: -1000, y: -1000, isActive: false, targetX: -1000, targetY: -1000 };
    let animFrameId = null;
    let isVisible = true;

    const COLORS = [
      'rgba(66, 133, 244, ',   // Gemini Blue
      'rgba(56, 189, 248, ',   // Gemini Cyan
      'rgba(155, 114, 207, ',  // Gemini Violet
      'rgba(236, 72, 153, ',   // Gemini Magenta
      'rgba(251, 191, 36, ',   // Amber Star
      'rgba(255, 255, 255, '    // White Starlight
    ];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createParticles();
    }

    function createParticles() {
      const count = Math.min(Math.floor((width * height) / 16000), 85);
      particles = [];
      for (let i = 0; i < count; i++) {
        const colorPrefix = COLORS[Math.floor(Math.random() * COLORS.length)];
        const isStar = Math.random() > 0.65;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          baseRadius: isStar ? Math.random() * 2 + 1.2 : Math.random() * 1.5 + 0.6,
          radius: 1,
          colorPrefix: colorPrefix,
          alpha: Math.random() * 0.55 + 0.25,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.03 + 0.01,
          mass: Math.random() * 0.8 + 0.5,
          isStar: isStar
        });
      }
    }

    // Interactive mouse gravity tracking
    window.addEventListener('mousemove', (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isActive = true;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      mouse.isActive = false;
    }, { passive: true });

    // Touch support for mobile
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.isActive = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      mouse.isActive = false;
    }, { passive: true });

    // Gravitational shockwave on click
    window.addEventListener('click', (e) => {
      // Don't interfere with modal/interactive elements
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 5,
        maxRadius: Math.min(width, height) * 0.38,
        speed: 7,
        alpha: 0.7,
        color: COLORS[Math.floor(Math.random() * 4)]
      });

      // Spawn a burst of sparkling gravity motes
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3.5 + 1.5;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          baseRadius: Math.random() * 2 + 1.5,
          radius: 2,
          colorPrefix: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 0.9,
          pulse: 0,
          pulseSpeed: 0.08,
          mass: 0.8,
          isBurst: true,
          decay: 0.018
        });
      }
    });

    function draw() {
      if (!isVisible) {
        animFrameId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      if (mouse.isActive) {
        mouse.x += (mouse.targetX - mouse.x) * 0.12;
        mouse.y += (mouse.targetY - mouse.y) * 0.12;
      }

      // Draw and update shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += sw.speed;
        sw.alpha *= 0.94;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${sw.color}${sw.alpha * 0.7})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = `${sw.color}0.8)`;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();

        if (sw.radius >= sw.maxRadius || sw.alpha < 0.03) {
          shockwaves.splice(i, 1);
        }
      }

      // Render cosmic particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Burst particle decay
        if (p.isBurst) {
          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }
        }

        p.pulse += p.pulseSpeed;
        p.radius = p.baseRadius * (1 + 0.22 * Math.sin(p.pulse));

        // Physics: Gravitational force towards mouse
        if (mouse.isActive) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          const maxDist = 260;

          if (dist < maxDist && dist > 15) {
            // Gentle gravitational pull with subtle vortex orbit
            const force = (1 - dist / maxDist) * 0.28 * p.mass;
            const angle = Math.atan2(dy, dx);
            const orbitAngle = angle + Math.PI / 2; // subtle orbital spin

            p.vx += Math.cos(angle) * force + Math.cos(orbitAngle) * (force * 0.22);
            p.vy += Math.sin(angle) * force + Math.sin(orbitAngle) * (force * 0.22);
          }
        }

        // Apply shockwave physics
        for (let s = 0; s < shockwaves.length; s++) {
          const sw = shockwaves[s];
          const dx = p.x - sw.x;
          const dy = p.y - sw.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const diff = Math.abs(dist - sw.radius);
          if (diff < 35 && dist > 0) {
            const push = (1 - diff / 35) * 2.8;
            p.vx += (dx / dist) * push;
            p.vy += (dy / dist) * push;
          }
        }

        // Natural movement & damping
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.965;
        p.vy *= 0.965;

        // Screen boundary wrapping
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${p.alpha})`;
        if (p.isStar) {
          ctx.shadowColor = `${p.colorPrefix}0.7)`;
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();

        // Connect nearby particles with subtle Gemini constellation lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < 85) {
            const lineAlpha = (1 - cdist / 85) * 0.12 * Math.min(p.alpha, p2.alpha);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(126, 184, 247, ${lineAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animFrameId = requestAnimationFrame(draw);
    }

    // Pause when page is hidden to save battery
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
    });

    window.addEventListener('resize', resize, { passive: true });
    resize();
    draw();
  }

  // --- 2. 3D MAGNETIC PERSPECTIVE TILT WITH SPECULAR SPOTLIGHT ---
  function initMagneticTilt() {
    const selector = '.category-card, .step, .card, .pricing-card, .telegram-section';
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
      let raf = null;

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate rotation (-8 to +8 deg)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateY = ((x - centerX) / centerX) * 7.5;
        const rotateX = -((y - centerY) / centerY) * 7.5;

        // Set CSS custom properties for radiant gradient spotlight
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `perspective(850px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale3d(1.018, 1.018, 1.018)`;
        });
      });

      el.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  // --- 3. ZERO-GRAVITY FLOATING HERO TAGS ---
  function initHeroFloatTags() {
    const hero = document.querySelector('.hero');
    if (!hero || document.querySelector('.gravity-chips-wrap')) return;

    // Create interactive floating tags
    const tags = [
      { text: '✦ Safe Space', icon: '🛡️', color: 'blue' },
      { text: '100% Anonim', icon: '🔐', color: 'green' },
      { text: 'Tanpa Penghakiman', icon: '🕊️', color: 'purple' },
      { text: 'AI Empatik 24/7', icon: '✨', color: 'cyan' },
      { text: 'Lega & Tenang', icon: '🌊', color: 'amber' }
    ];

    const wrap = document.createElement('div');
    wrap.className = 'gravity-chips-wrap';

    tags.forEach((tag, idx) => {
      const chip = document.createElement('div');
      chip.className = `gravity-chip chip-${tag.color}`;
      chip.innerHTML = `<span class="chip-icon">${tag.icon}</span> <span>${tag.text}</span>`;
      chip.setAttribute('data-speed', (0.8 + idx * 0.25).toFixed(2));
      chip.style.animationDelay = `${(idx * 0.45).toFixed(2)}s`;

      // Interactive gentle bounce when nudged by mouse
      chip.addEventListener('mouseenter', () => {
        const randX = (Math.random() - 0.5) * 24;
        const randY = -Math.random() * 16 - 8;
        const randR = (Math.random() - 0.5) * 12;
        chip.style.transform = `translate3d(${randX}px, ${randY}px, 0) rotate(${randR}deg) scale(1.1)`;
        chip.style.boxShadow = `0 14px 30px rgba(66, 133, 244, 0.35)`;
      });

      chip.addEventListener('mouseleave', () => {
        setTimeout(() => {
          chip.style.transform = '';
          chip.style.boxShadow = '';
        }, 300);
      });

      wrap.appendChild(chip);
    });

    // Insert into hero before CTA
    const heroDesc = hero.querySelector('.hero-desc');
    if (heroDesc) {
      hero.insertBefore(wrap, heroDesc.nextSibling);
    } else {
      hero.appendChild(wrap);
    }
  }

  // --- 4. GOOGLE GRAVITY TOGGLE INTERACTION ---
  function initGravityModeButton() {
    const nav = document.querySelector('nav .nav-links');
    if (!nav || document.getElementById('gravityToggleBtn')) return;

    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.id = 'gravityToggleBtn';
    btn.className = 'btn-gravity-toggle';
    btn.innerHTML = `<span>✨</span> <span class="btn-gravity-text">Gravity</span>`;
    btn.title = 'Nyalakan mode gravitasi interaktif';

    let gravityActive = false;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      gravityActive = !gravityActive;
      btn.classList.toggle('active', gravityActive);

      const body = document.body;
      body.classList.toggle('gravity-mode-active', gravityActive);

      // Trigger celebratory particle blast
      const rect = btn.getBoundingClientRect();
      const clickEvent = new MouseEvent('click', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
      window.dispatchEvent(clickEvent);

      if (window.LiberChat && window.LiberChat.showToast) {
        window.LiberChat.showToast(gravityActive ? '🪐 Zero Gravity Mode: Aktif!' : '✨ Gravitasi Kembali Normal');
      } else {
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = gravityActive ? '🪐 Zero-G Mode Aktif!' : '✨ Gravitasi Normal';
          toast.className = 'toast success show';
          setTimeout(() => toast.classList.remove('show'), 2200);
        }
      }
    });

    li.appendChild(btn);
    // Insert before the last button
    nav.insertBefore(li, nav.lastElementChild);
  }

  // Initialize all gravity physics once DOM is loaded
  function init() {
    initGravityCanvas();
    initMagneticTilt();
    initHeroFloatTags();
    initGravityModeButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external scripts
  window.LiberGravity = {
    init,
    initMagneticTilt
  };

})();
