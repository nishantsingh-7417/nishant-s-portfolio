/* ══════════════════════════════════════
   ANIMATED STARFIELD + BLACK HOLE
   ══════════════════════════════════════ */
(function () {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let stars = [];
    const STAR_COUNT = 600;

    /* Black hole config — position updated dynamically based on DOM */
    const blackHole = {
        coreRadius: 28,
        diskRadiusX: 130,
        diskRadiusY: 38,
        glowRadius: 200,
        pullRadius: 280,     // stars within this radius get pulled
        rotation: 0,
        rotationSpeed: 0.004,
    };

    let bhX = 0;
    let bhY = 0;
    const placeholder = document.getElementById('skills-blackhole-placeholder');

    function updateBlackHolePosition() {
        if (placeholder && window.getComputedStyle(placeholder).display !== 'none') {
            const rect = placeholder.getBoundingClientRect();
            const wrapperRect = canvas.parentElement.getBoundingClientRect();
            bhX = rect.left - wrapperRect.left + rect.width / 2;
            bhY = rect.top - wrapperRect.top + rect.height / 2;
        } else {
            bhX = canvas.width * 0.5;
            bhY = -1000; // Hide off-screen on mobile
        }
    }

    /* ── Resize handler ── */
    function resize() {
        const wrapper = canvas.parentElement;
        canvas.width = wrapper.offsetWidth;
        canvas.height = wrapper.offsetHeight;
        updateBlackHolePosition();
    }

    /* ── Create a single star ── */
    function createStar(randomY) {
        const rand = Math.random();
        let type, size, baseAlpha, speed, glowRadius;

        if (rand < 0.05) {
            type = 'big';
            size = 1.2 + Math.random() * 1.0;
            baseAlpha = 0.5 + Math.random() * 0.4;
            speed = 0.2 + Math.random() * 0.25;
            glowRadius = size * 5;
        } else if (rand < 0.2) {
            type = 'medium';
            size = 0.6 + Math.random() * 0.5;
            baseAlpha = 0.35 + Math.random() * 0.35;
            speed = 0.15 + Math.random() * 0.3;
            glowRadius = size * 3;
        } else {
            type = 'tiny';
            size = 0.2 + Math.random() * 0.4;
            baseAlpha = 0.1 + Math.random() * 0.3;
            speed = 0.1 + Math.random() * 0.35;
            glowRadius = 0;
        }

        return {
            x: Math.random() * canvas.width,
            y: randomY ? Math.random() * canvas.height : canvas.height + Math.random() * 20,
            size: size,
            baseAlpha: baseAlpha,
            alpha: 0,
            speed: speed,
            dx: (Math.random() - 0.5) * 0.15,
            pulseSpeed: 0.005 + Math.random() * 0.015,
            pulsePhase: Math.random() * Math.PI * 2,
            type: type,
            glowRadius: glowRadius,
        };
    }

    /* ── Initialise ── */
    function init() {
        resize();
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(createStar(true));
        }
    }

    /* ══════════════════════════════════════
       DRAW BLACK HOLE
       ══════════════════════════════════════ */
    function drawBlackHole(bx, by, t) {
        const bh = blackHole;

        /* ── 1. Outer gravitational glow ── */
        const outerGlow = ctx.createRadialGradient(bx, by, bh.coreRadius, bx, by, bh.glowRadius);
        outerGlow.addColorStop(0, 'rgba(180, 180, 200, 0.06)');
        outerGlow.addColorStop(0.3, 'rgba(140, 140, 160, 0.03)');
        outerGlow.addColorStop(0.7, 'rgba(100, 100, 120, 0.01)');
        outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(bx, by, bh.glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        /* ── 2. Accretion disk (back half — behind the black hole) ── */
        drawAccretionDisk(bx, by, t, 'back');

        /* ── 3. Event horizon — the dark void ── */
        const voidGrad = ctx.createRadialGradient(bx, by, 0, bx, by, bh.coreRadius * 1.6);
        voidGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        voidGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.98)');
        voidGrad.addColorStop(0.85, 'rgba(2, 2, 5, 0.7)');
        voidGrad.addColorStop(1, 'rgba(5, 5, 10, 0)');
        ctx.beginPath();
        ctx.arc(bx, by, bh.coreRadius * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = voidGrad;
        ctx.fill();

        /* ── 4. Photon ring — thin bright ring at event horizon edge ── */
        const ringPulse = 0.7 + Math.sin(t * 0.008) * 0.15;
        ctx.beginPath();
        ctx.arc(bx, by, bh.coreRadius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 200, 220, ${0.15 * ringPulse})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx, by, bh.coreRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 180, 200, ${0.06 * ringPulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        /* ── 5. Accretion disk (front half — in front of the black hole) ── */
        drawAccretionDisk(bx, by, t, 'front');
    }

    /* ── Accretion disk drawing ── */
    function drawAccretionDisk(bx, by, t, half) {
        const bh = blackHole;
        const angle = t * bh.rotationSpeed;
        const layers = 5;

        ctx.save();
        ctx.translate(bx, by);

        for (let i = 0; i < layers; i++) {
            const progress = i / layers;
            const rx = bh.diskRadiusX * (0.7 + progress * 0.5);
            const ry = bh.diskRadiusY * (0.7 + progress * 0.5);
            const alpha = (1 - progress) * 0.12;
            const brightness = 180 + (1 - progress) * 75;

            ctx.save();
            ctx.rotate(angle + i * 0.15);

            ctx.beginPath();
            if (half === 'back') {
                ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
            } else {
                ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
            }

            const diskGrad = ctx.createLinearGradient(-rx, 0, rx, 0);
            const c = `${brightness}, ${brightness}, ${brightness + 20}`;
            diskGrad.addColorStop(0, `rgba(${c}, 0)`);
            diskGrad.addColorStop(0.2, `rgba(${c}, ${alpha * 0.6})`);
            diskGrad.addColorStop(0.5, `rgba(${c}, ${alpha})`);
            diskGrad.addColorStop(0.8, `rgba(${c}, ${alpha * 0.6})`);
            diskGrad.addColorStop(1, `rgba(${c}, 0)`);

            ctx.strokeStyle = diskGrad;
            ctx.lineWidth = 2 - progress * 0.8;
            ctx.stroke();

            ctx.restore();
        }

        /* ── Bright streaming particles along the disk ── */
        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const a = angle + (i / particleCount) * Math.PI * 2 + Math.sin(t * 0.01 + i) * 0.1;

            // Only draw particles in the correct half
            const sy = Math.sin(a);
            if (half === 'back' && sy > 0) continue;
            if (half === 'front' && sy < 0) continue;

            const orbitRx = bh.diskRadiusX * (0.75 + Math.sin(i * 1.7) * 0.25);
            const orbitRy = bh.diskRadiusY * (0.75 + Math.cos(i * 2.3) * 0.25);
            const px = Math.cos(a) * orbitRx;
            const py = Math.sin(a) * orbitRy;

            const pAlpha = 0.15 + Math.sin(t * 0.02 + i * 0.8) * 0.1;
            const pSize = 0.5 + Math.random() * 0.8;

            ctx.beginPath();
            ctx.arc(px, py, pSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220, 220, 235, ${pAlpha})`;
            ctx.fill();
        }

        ctx.restore();
    }

    /* ══════════════════════════════════════
       MAIN DRAW LOOP
       ══════════════════════════════════════ */
    let time = 0;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        time += 1;

        // bhX and bhY are outer-scope variables updated dynamically on resize

        /* ── Draw stars ── */
        for (const s of stars) {
            // Move star
            s.y -= s.speed;
            s.x += s.dx + Math.sin(time * 0.003 + s.pulsePhase) * 0.08;

            // Gravitational pull near the black hole
            const distX = bhX - s.x;
            const distY = bhY - s.y;
            const dist = Math.sqrt(distX * distX + distY * distY);

            if (dist < blackHole.pullRadius && dist > blackHole.coreRadius * 0.8) {
                const pullStrength = (1 - dist / blackHole.pullRadius) * 0.35;
                s.x += (distX / dist) * pullStrength;
                s.y += (distY / dist) * pullStrength;
            }

            // Swallow stars that reach the core
            if (dist < blackHole.coreRadius * 0.8) {
                s.y = canvas.height + 5;
                s.x = Math.random() * canvas.width;
            }

            // Wrap around
            if (s.y < -5) {
                s.y = canvas.height + 5;
                s.x = Math.random() * canvas.width;
            }
            if (s.x < -5) s.x = canvas.width + 5;
            if (s.x > canvas.width + 5) s.x = -5;

            // Twinkle pulse
            const pulse = Math.sin(time * s.pulseSpeed + s.pulsePhase);
            s.alpha = s.baseAlpha + pulse * 0.15;
            const a = Math.max(0, Math.min(1, s.alpha));

            // Dim stars near the black hole (gravitational dimming)
            let dimFactor = 1;
            if (dist < blackHole.glowRadius) {
                dimFactor = Math.max(0.1, dist / blackHole.glowRadius);
            }

            // Draw glow halo for big and medium stars
            if (s.glowRadius > 0) {
                const glow = ctx.createRadialGradient(
                    s.x, s.y, 0,
                    s.x, s.y, s.glowRadius
                );
                glow.addColorStop(0, `rgba(255,255,255,${a * 0.3 * dimFactor})`);
                glow.addColorStop(0.5, `rgba(255,255,255,${a * 0.08 * dimFactor})`);
                glow.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.glowRadius, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();
            }

            // Draw the star core
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${a * dimFactor})`;
            ctx.fill();
        }

        /* ── Draw black hole on top of stars ── */
        drawBlackHole(bhX, bhY, time);

        requestAnimationFrame(draw);
    }

    /* ── Kick off ── */
    init();
    draw();

    // Debounced resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resize();
        }, 150);
    });

    // Force position recalculation once the window has fully loaded
    window.addEventListener('load', () => {
        updateBlackHolePosition();
    });

    /* ══════════════════════════════════════
       ORBITAL SKILLS DYNAMICS
       ══════════════════════════════════════ */

    // Determine API base URL. When served by Express it's the same origin.
    // When opened as file://, API won't be available — fallback gracefully.
    const API_BASE = window.location.protocol === 'file:'
        ? null
        : window.location.origin + '/api';

    /**
     * Creates a single .skill-item DOM element from a skill data object.
     */
    function createSkillElement(skill) {
        const div = document.createElement('div');
        div.className = 'skill-item';
        div.setAttribute('data-row', skill.row);
        div.setAttribute('data-angle', skill.angle);
        div.setAttribute('data-radius', skill.radius);
        div.setAttribute('data-name', skill.name);

        const wrapper = document.createElement('div');
        wrapper.className = `skill-icon-wrapper${skill.filter ? ' ' + skill.filter : ''}`;

        const img = document.createElement('img');
        img.src = skill.icon;
        img.alt = skill.name;

        wrapper.appendChild(img);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'skill-name';
        nameSpan.textContent = skill.name;

        div.appendChild(wrapper);
        div.appendChild(nameSpan);

        return div;
    }

    /**
     * Binds flyout animation and magnetic hover to a NodeList of skill items.
     */
    function bindSkillInteractions(container, items) {
        // 1. Scroll-triggered flyout
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkillsOut(items);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        observer.observe(container);

        // 2. Magnetic mouse tracking
        items.forEach(item => {
            item.addEventListener('mousemove', (e) => {
                if (window.innerWidth <= 768) return;

                const rect = item.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const pull = 0.35;

                const tx = item.style.getPropertyValue('--tx') || '0px';
                const ty = item.style.getPropertyValue('--ty') || '0px';

                item.style.transform = `translate(-50%, -50%) translate(${tx}, ${ty}) translate(${x * pull}px, ${y * pull}px) scale(1.15)`;
            });

            item.addEventListener('mouseleave', () => {
                if (window.innerWidth <= 768) return;

                const tx = item.style.getPropertyValue('--tx') || '0px';
                const ty = item.style.getPropertyValue('--ty') || '0px';

                item.style.transform = `translate(-50%, -50%) translate(${tx}, ${ty}) scale(1)`;
            });
        });
    }

    function animateSkillsOut(items) {
        if (window.innerWidth <= 768) return;

        items.forEach((item, index) => {
            const angle = parseFloat(item.getAttribute('data-angle'));
            const radius = parseFloat(item.getAttribute('data-radius'));
            const angleRad = (angle * Math.PI) / 180;

            const tx = Math.cos(angleRad) * radius;
            const ty = Math.sin(angleRad) * radius;

            // Start at event horizon
            item.style.setProperty('--tx', '0px');
            item.style.setProperty('--ty', '0px');
            item.style.setProperty('--scale', '0');
            item.style.setProperty('--opacity', '0');

            // Stagger release
            setTimeout(() => {
                item.style.setProperty('--tx', `${tx}px`);
                item.style.setProperty('--ty', `${ty}px`);
                item.style.setProperty('--scale', '1');
                item.style.setProperty('--opacity', '1');
            }, index * 60);
        });
    }

    /**
     * Fetches skills from the API and injects them into the DOM.
     * Falls back to any pre-existing .skill-item elements if the API is unavailable.
     */
    async function loadAndRenderSkills() {
        const container = document.querySelector('.skills-orbit-container');
        if (!container) return;

        let items = container.querySelectorAll('.skill-item');

        // Try fetching from the API
        if (API_BASE) {
            try {
                const res = await fetch(`${API_BASE}/skills`);
                if (res.ok) {
                    const skills = await res.json();

                    // Clear any existing items (except the blackhole placeholder)
                    container.querySelectorAll('.skill-item').forEach(el => el.remove());

                    // Build DOM elements from API data
                    skills.forEach(skill => {
                        const el = createSkillElement(skill);
                        container.appendChild(el);
                    });

                    items = container.querySelectorAll('.skill-item');
                }
            } catch (err) {
                // API unavailable — fall back to whatever is in the HTML
                console.warn('Skills API unavailable, using static fallback.');
            }
        }

        if (items.length > 0) {
            bindSkillInteractions(container, items);
        }

        // Recalculate black hole position after skills are placed
        updateBlackHolePosition();
    }

    // Kick off skills loading after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAndRenderSkills);
    } else {
        loadAndRenderSkills();
    }
})();

