/* ══════════════════════════════════════
   LOADING SCREEN — Dancing Yoda (CSS-only animation)
   JS just handles fade-out when page is ready.
   ══════════════════════════════════════ */
(function () {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;

    function revealPage() {
        window.scrollTo(0, 0);
        screen.classList.add('hidden');
        document.body.classList.add('loaded');

        // Remove loading screen from DOM after fade
        setTimeout(() => {
            screen.remove();
        }, 700);
    }

    // When everything is loaded, fade out after a minimum dance time
    window.addEventListener('load', () => {
        const elapsed = performance.now();
        const minTime = 2500; // let Yoda dance for at least 2.5s
        const delay = Math.max(0, minTime - elapsed);
        setTimeout(revealPage, delay);
    });
})();

/* ══════════════════════════════════════
   REALISTIC UNIVERSE — Diagonal orbital starfield
   with nebula clouds, colored stars, cosmic dust,
   and shooting stars. Canvas is position:fixed.
   ══════════════════════════════════════ */
(function () {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    /* ── Diagonal orbit angle (radians) — ~30° from horizontal ── */
    const ORBIT_ANGLE = Math.PI / 6; // 30 degrees
    const COS_A = Math.cos(ORBIT_ANGLE);
    const SIN_A = Math.sin(ORBIT_ANGLE);

    /* ── Realistic star spectral colours (O → M class) ── */
    const STAR_COLORS = [
        { r: 155, g: 176, b: 255 },  // O-type — blue-white
        { r: 170, g: 191, b: 255 },  // B-type — blue-white
        { r: 202, g: 215, b: 255 },  // A-type — white-blue
        { r: 248, g: 247, b: 255 },  // F-type — white
        { r: 255, g: 244, b: 234 },  // G-type — yellow-white (Sun-like)
        { r: 255, g: 210, b: 161 },  // K-type — orange
        { r: 255, g: 204, b: 111 },  // K-type warm
        { r: 255, g: 170, b: 120 },  // M-type — red-orange
    ];

    /* ── Layer config: 4 depth-separated layers ── */
    const LAYERS = [
        { name: 'dust',  count: 3000, sizeMin: 0.1,  sizeMax: 0.35, alphaMin: 0.02, alphaMax: 0.08, speedFactor: 0.06, glow: false, colorChance: 0.1 },
        { name: 'far',   count: 4000, sizeMin: 0.15, sizeMax: 0.55, alphaMin: 0.04, alphaMax: 0.18, speedFactor: 0.12, glow: false, colorChance: 0.3 },
        { name: 'mid',   count: 1800, sizeMin: 0.4,  sizeMax: 1.1,  alphaMin: 0.12, alphaMax: 0.45, speedFactor: 0.28, glow: false, colorChance: 0.5 },
        { name: 'near',  count: 350,  sizeMin: 0.9,  sizeMax: 2.2,  alphaMin: 0.30, alphaMax: 0.85, speedFactor: 0.55, glow: true,  colorChance: 0.7 },
    ];

    /* ── Nebula cloud configs ── */
    const NEBULA_CLOUDS = [];
    const NEBULA_COUNT = 5;

    /* ── Shooting stars ── */
    const SHOOTING_STARS = [];
    const MAX_SHOOTERS = 2;

    let layers = [];
    let time = 0;

    /* ── Offscreen nebula canvas (rendered once, composited each frame) ── */
    let nebulaCanvas, nebulaCtx;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        generateNebula();
    }

    /* ── Pick a spectral star color ── */
    function pickStarColor(colorChance) {
        if (Math.random() > colorChance) return null; // white
        return STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    }

    /* ── Create one star ── */
    function createStar(cfg) {
        const size = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
        const baseAlpha = cfg.alphaMin + Math.random() * (cfg.alphaMax - cfg.alphaMin);
        const speed = cfg.speedFactor * (0.6 + Math.random() * 0.8);
        const color = pickStarColor(cfg.colorChance);

        return {
            x: Math.random() * (canvas.width + 400) - 200,
            y: Math.random() * (canvas.height + 400) - 200,
            size,
            baseAlpha,
            speed,
            // Each star orbits diagonally: speed decomposed along orbit angle
            vx: speed * COS_A,
            vy: -speed * SIN_A, // negative = upward component
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.003 + Math.random() * 0.015,
            glowRadius: cfg.glow ? size * (3.5 + Math.random() * 3) : 0,
            color,
            // Slight perpendicular wobble for organic motion
            wobbleAmp: 0.02 + Math.random() * 0.06,
            wobbleFreq: 0.001 + Math.random() * 0.003,
        };
    }

    /* ── Render nebula clouds to offscreen canvas ── */
    function generateNebula() {
        nebulaCanvas = document.createElement('canvas');
        nebulaCanvas.width = canvas.width;
        nebulaCanvas.height = canvas.height;
        nebulaCtx = nebulaCanvas.getContext('2d');

        // Generate cloud positions
        NEBULA_CLOUDS.length = 0;
        const nebulaColors = [
            { r: 60, g: 20, b: 120 },   // deep purple
            { r: 20, g: 40, b: 100 },   // dark blue
            { r: 80, g: 15, b: 60 },    // magenta-plum
            { r: 15, g: 50, b: 80 },    // teal-dark
            { r: 40, g: 10, b: 90 },    // indigo
            { r: 100, g: 30, b: 50 },   // deep rose
        ];

        for (let i = 0; i < NEBULA_COUNT; i++) {
            const cloud = {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radiusX: 150 + Math.random() * 350,
                radiusY: 100 + Math.random() * 250,
                rotation: Math.random() * Math.PI * 2,
                color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
                alpha: 0.015 + Math.random() * 0.03,
                drift: { x: (Math.random() - 0.5) * 0.015, y: (Math.random() - 0.5) * 0.01 },
            };
            NEBULA_CLOUDS.push(cloud);
        }

        renderNebulaToCanvas();
    }

    function renderNebulaToCanvas() {
        nebulaCtx.clearRect(0, 0, nebulaCanvas.width, nebulaCanvas.height);

        for (const c of NEBULA_CLOUDS) {
            nebulaCtx.save();
            nebulaCtx.translate(c.x, c.y);
            nebulaCtx.rotate(c.rotation);

            // Multiple overlapping gradients for volume
            for (let pass = 0; pass < 3; pass++) {
                const offsetX = (Math.random() - 0.5) * c.radiusX * 0.3;
                const offsetY = (Math.random() - 0.5) * c.radiusY * 0.3;
                const rx = c.radiusX * (0.6 + pass * 0.25);
                const ry = c.radiusY * (0.6 + pass * 0.25);

                nebulaCtx.save();
                nebulaCtx.translate(offsetX, offsetY);
                nebulaCtx.scale(1, ry / rx);

                const grad = nebulaCtx.createRadialGradient(0, 0, 0, 0, 0, rx);
                const a = c.alpha * (1 - pass * 0.25);
                grad.addColorStop(0, `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, ${a * 1.5})`);
                grad.addColorStop(0.3, `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, ${a})`);
                grad.addColorStop(0.7, `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, ${a * 0.3})`);
                grad.addColorStop(1, `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, 0)`);

                nebulaCtx.beginPath();
                nebulaCtx.arc(0, 0, rx, 0, Math.PI * 2);
                nebulaCtx.fillStyle = grad;
                nebulaCtx.fill();
                nebulaCtx.restore();
            }

            nebulaCtx.restore();
        }
    }

    /* ── Shooting star management ── */
    function maybeSpawnShooter() {
        if (SHOOTING_STARS.length >= MAX_SHOOTERS) return;
        if (Math.random() > 0.0015) return; // rare

        const w = canvas.width;
        const h = canvas.height;
        // Spawn from random edge, travel diagonally
        const angle = ORBIT_ANGLE + (Math.random() - 0.5) * 0.4;
        const speed = 8 + Math.random() * 12;

        SHOOTING_STARS.push({
            x: Math.random() * w * 0.6,
            y: -10 - Math.random() * 50,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: 0.008 + Math.random() * 0.012,
            length: 60 + Math.random() * 80,
            width: 1 + Math.random() * 1.5,
        });
    }

    function drawShootingStars() {
        for (let i = SHOOTING_STARS.length - 1; i >= 0; i--) {
            const s = SHOOTING_STARS[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= s.decay;

            if (s.life <= 0 || s.x > canvas.width + 100 || s.y > canvas.height + 100) {
                SHOOTING_STARS.splice(i, 1);
                continue;
            }

            const tailX = s.x - (s.vx / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.length;
            const tailY = s.y - (s.vy / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.length;

            const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
            grad.addColorStop(0, `rgba(255, 255, 255, ${s.life * 0.9})`);
            grad.addColorStop(0.3, `rgba(200, 220, 255, ${s.life * 0.4})`);
            grad.addColorStop(1, `rgba(150, 180, 255, 0)`);

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(s.x, s.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = s.width * s.life;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Bright head glow
            const headGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 4);
            headGlow.addColorStop(0, `rgba(255, 255, 255, ${s.life * 0.8})`);
            headGlow.addColorStop(1, `rgba(255, 255, 255, 0)`);
            ctx.beginPath();
            ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = headGlow;
            ctx.fill();
        }
    }

    /* ── Initialise all star layers ── */
    function init() {
        resize();
        layers = LAYERS.map(cfg => {
            const stars = [];
            for (let i = 0; i < cfg.count; i++) {
                stars.push(createStar(cfg));
            }
            return { config: cfg, stars };
        });
    }

    /* ── Wrap star around screen edges (with diagonal drift buffer) ── */
    function wrapStar(s, w, h) {
        const buf = 50;
        if (s.x > w + buf) { s.x = -buf; s.y = Math.random() * (h + buf * 2) - buf; }
        if (s.x < -buf)    { s.x = w + buf; s.y = Math.random() * (h + buf * 2) - buf; }
        if (s.y < -buf)    { s.y = h + buf; s.x = Math.random() * (w + buf * 2) - buf; }
        if (s.y > h + buf) { s.y = -buf; s.x = Math.random() * (w + buf * 2) - buf; }
    }

    /* ── Main render loop ── */
    function draw() {
        const w = canvas.width;
        const h = canvas.height;

        // Clear canvas fully (transparent — hero video shows through)
        ctx.clearRect(0, 0, w, h);
        time++;

        // Draw nebula layer underneath
        if (nebulaCanvas) {
            // Slowly drift nebula
            for (const c of NEBULA_CLOUDS) {
                c.x += c.drift.x;
                c.y += c.drift.y;
                c.rotation += 0.00003;
                // Soft wrap
                if (c.x > w + c.radiusX) c.x = -c.radiusX;
                if (c.x < -c.radiusX) c.x = w + c.radiusX;
                if (c.y > h + c.radiusY) c.y = -c.radiusY;
                if (c.y < -c.radiusY) c.y = h + c.radiusY;
            }

            // Re-render nebula every 120 frames to animate drift
            if (time % 120 === 0) {
                renderNebulaToCanvas();
            }

            ctx.globalAlpha = 1;
            ctx.drawImage(nebulaCanvas, 0, 0);
        }

        // Draw star layers (far → near)
        for (const layer of layers) {
            for (const s of layer.stars) {
                // Diagonal orbital movement
                const wobble = Math.sin(time * s.wobbleFreq + s.pulsePhase) * s.wobbleAmp;
                s.x += s.vx + wobble * SIN_A;
                s.y += s.vy + wobble * COS_A;

                wrapStar(s, w, h);

                // Realistic twinkle (scintillation)
                const p1 = Math.sin(time * s.pulseSpeed + s.pulsePhase);
                const p2 = Math.sin(time * s.pulseSpeed * 1.7 + s.pulsePhase * 2.3);
                const twinkle = (p1 * 0.6 + p2 * 0.4);
                const a = Math.max(0, Math.min(1, s.baseAlpha + twinkle * s.baseAlpha * 0.4));

                // Determine draw color
                let r = 255, g = 255, b = 255;
                if (s.color) {
                    r = s.color.r;
                    g = s.color.g;
                    b = s.color.b;
                }

                // Glow halo for near-layer stars
                if (s.glowRadius > 0) {
                    const glowA = a * 0.2;
                    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.glowRadius);
                    glow.addColorStop(0, `rgba(${r},${g},${b},${glowA})`);
                    glow.addColorStop(0.4, `rgba(${r},${g},${b},${glowA * 0.3})`);
                    glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.glowRadius, 0, Math.PI * 2);
                    ctx.fillStyle = glow;
                    ctx.fill();
                }

                // Star core with diffraction spike effect for bright stars
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
                ctx.fill();

                // Cross-spike for very bright near stars
                if (s.glowRadius > 0 && a > 0.55) {
                    const spikeLen = s.size * 4 + a * 6;
                    const spikeAlpha = a * 0.15;
                    ctx.strokeStyle = `rgba(${r},${g},${b},${spikeAlpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(s.x - spikeLen, s.y);
                    ctx.lineTo(s.x + spikeLen, s.y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(s.x, s.y - spikeLen);
                    ctx.lineTo(s.x, s.y + spikeLen);
                    ctx.stroke();
                }
            }
        }

        // Shooting stars
        maybeSpawnShooter();
        drawShootingStars();

        requestAnimationFrame(draw);
    }

    /* ── Kick off ── */
    init();
    draw();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resize();
            for (const layer of layers) {
                for (const s of layer.stars) {
                    if (s.x > canvas.width + 200 || s.y > canvas.height + 200 || s.x < -200 || s.y < -200) {
                        s.x = Math.random() * canvas.width;
                        s.y = Math.random() * canvas.height;
                    }
                }
            }
        }, 150);
    });

    /* ══════════════════════════════════════
       ORBITAL SKILLS DYNAMICS
       ══════════════════════════════════════ */

    const API_BASE = window.location.protocol === 'file:'
        ? null
        : window.location.origin + '/api';

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

    function bindSkillInteractions(container, items) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkillsOut(items);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        observer.observe(container);

        items.forEach(item => {
            item.addEventListener('mousemove', (e) => {
                if (window.innerWidth <= 768) return;

                const rect = item.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const pull = 0.35;
                item.style.transition = 'transform 0.12s cubic-bezier(0.25, 1, 0.5, 1)';
                item.style.transform = `translate(${x * pull}px, ${y * pull}px) scale(1.15)`;
            });

            item.addEventListener('mouseleave', () => {
                if (window.innerWidth <= 768) return;

                item.style.transition = 'transform 0.3s ease';
                item.style.transform = `translate(0px, 0px) scale(1)`;
            });
        });
    }

    function animateSkillsOut(items) {
        if (window.innerWidth <= 768) return;

        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px) scale(0.8)';
            
            setTimeout(() => {
                item.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0px) scale(1)';
                
                // Cleanup transition after entrance to not interfere with hover
                setTimeout(() => {
                    if (item.style.transform === 'translateY(0px) scale(1)') {
                        item.style.transition = '';
                        item.style.transform = '';
                    }
                }, 600);
            }, index * 60);
        });
    }

    async function loadAndRenderSkills() {
        const container = document.querySelector('.skills-orbit-container');
        if (!container) return;

        let items = container.querySelectorAll('.skill-item');

        if (API_BASE) {
            try {
                const res = await fetch(`${API_BASE}/skills`);
                if (res.ok) {
                    const skills = await res.json();
                    container.querySelectorAll('.skill-row, .skill-item').forEach(el => el.remove());
                    
                    // Group by row
                    const rows = {};
                    skills.forEach(skill => {
                        const rowNum = skill.row || 1;
                        if (!rows[rowNum]) rows[rowNum] = [];
                        rows[rowNum].push(skill);
                    });

                    Object.keys(rows).sort((a, b) => a - b).forEach(rowNum => {
                        const rowDiv = document.createElement('div');
                        rowDiv.className = 'skill-row';
                        rows[rowNum].forEach(skill => {
                            const el = createSkillElement(skill);
                            rowDiv.appendChild(el);
                        });
                        container.appendChild(rowDiv);
                    });
                    
                    items = container.querySelectorAll('.skill-item');
                }
            } catch (err) {
                console.warn('Skills API unavailable, using static fallback.');
            }
        }

        if (items.length > 0) {
            bindSkillInteractions(container, items);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAndRenderSkills);
    } else {
        loadAndRenderSkills();
    }
})();

/* ══════════════════════════════════════
   PROJECTS — Fetch & Render
   ══════════════════════════════════════ */
(function () {
    const API_BASE = window.location.protocol === 'file:'
        ? null
        : window.location.origin + '/api';

    const grid = document.getElementById('projects-grid');
    if (!grid || !API_BASE) return;

    const githubSVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`;
    const externalSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

    function renderProjectCard(p) {
        const imageHTML = p.image
            ? `<img class="project-card-image" src="${p.image}" alt="${p.title}" loading="lazy">`
            : `<div class="project-card-image-placeholder">💻</div>`;

        const tagsHTML = (p.tags || [])
            .map(t => `<span>${t}</span>`)
            .join('');

        const linksHTML = [
            p.github ? `<a href="${p.github}" target="_blank" rel="noopener">${githubSVG} GitHub</a>` : '',
            p.demo ? `<a href="${p.demo}" target="_blank" rel="noopener">${externalSVG} Live Demo</a>` : '',
        ].filter(Boolean).join('');

        return `
            <article class="project-card">
                ${imageHTML}
                <div class="project-card-body">
                    <h3 class="project-card-title">${p.title}</h3>
                    <p class="project-card-desc">${p.description}</p>
                    ${tagsHTML ? `<div class="project-card-tags">${tagsHTML}</div>` : ''}
                    ${linksHTML ? `<div class="project-card-links">${linksHTML}</div>` : ''}
                </div>
            </article>
        `;
    }

    async function loadProjects() {
        try {
            const res = await fetch(`${API_BASE}/projects`);
            if (!res.ok) throw new Error('API error');
            const projects = await res.json();

            if (!projects.length) {
                grid.innerHTML = '<p class="projects-empty">No projects yet.</p>';
                return;
            }

            grid.innerHTML = projects.map(renderProjectCard).join('');

            // Fade-in animation on scroll
            const cards = grid.querySelectorAll('.project-card');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            cards.forEach((card, i) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`;
                observer.observe(card);
            });

        } catch (err) {
            console.warn('Projects API unavailable.');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadProjects);
    } else {
        loadProjects();
    }
})();

/* ══════════════════════════════════════
   SCROLL-DRIVEN MARQUEE
   ══════════════════════════════════════ */
(function () {
    const track = document.querySelector('.hero-marquee-track');
    if (!track) return;

    // Remove the CSS animation — we'll drive it manually
    track.style.animation = 'none';

    let position = 0;
    let speed = -1.5;           // base drift speed (px per frame, negative = left)
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    window.addEventListener('scroll', () => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY;
        // Scroll down (delta > 0) → push marquee LEFT (negative)
        // Scroll up (delta < 0) → push marquee RIGHT (positive)
        scrollVelocity += delta * -1.5;
        lastScrollY = currentY;
    }, { passive: true });

    function animate() {
        // Blend scroll velocity into movement (decays gradually)
        scrollVelocity *= 0.95;

        // Total frame movement = base drift + scroll impulse
        position += speed + scrollVelocity;

        // Get the width of one set of spans (half the track since content is duplicated)
        const halfWidth = track.scrollWidth / 2;

        // Seamless loop: wrap around when a full set has scrolled past
        if (position <= -halfWidth) {
            position += halfWidth;
        } else if (position >= 0) {
            position -= halfWidth;
        }

        track.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(animate);
    }

    animate();
})();
