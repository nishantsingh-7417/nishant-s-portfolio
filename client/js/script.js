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
   LAYERED STARFIELD — 3 depth layers, 20x intensity
   Canvas is position:fixed via CSS (static background)
   ══════════════════════════════════════ */
(function () {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    /*  ── LAYER CONFIGURATION ──
        3 depth layers create parallax-like depth.
        Far = many tiny dim stars, slow
        Mid = moderate stars, medium speed
        Near = fewer but bigger/brighter/faster stars with glow
    */
    const LAYERS = [
        { name: 'far',  count: 5000, sizeMin: 0.15, sizeMax: 0.5,  alphaMin: 0.05, alphaMax: 0.2,  speedMin: 0.15, speedMax: 0.4,  glow: false },
        { name: 'mid',  count: 2500, sizeMin: 0.4,  sizeMax: 1.0,  alphaMin: 0.15, alphaMax: 0.45, speedMin: 0.4,  speedMax: 1.0,  glow: false },
        { name: 'near', count:  500, sizeMin: 0.8,  sizeMax: 2.0,  alphaMin: 0.35, alphaMax: 0.8,  speedMin: 0.8,  speedMax: 2.0,  glow: true  },
    ];

    let layers = [];

    /* ── Resize to viewport (canvas is position:fixed) ── */
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    /* ── Create one star for a given layer ── */
    function createStar(cfg, randomY) {
        const size = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
        const baseAlpha = cfg.alphaMin + Math.random() * (cfg.alphaMax - cfg.alphaMin);
        const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);

        return {
            x: Math.random() * canvas.width,
            y: randomY ? Math.random() * canvas.height : canvas.height + Math.random() * 20,
            size,
            baseAlpha,
            alpha: baseAlpha,
            speed,
            dx: (Math.random() - 0.5) * 0.12,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.004 + Math.random() * 0.012,
            glowRadius: cfg.glow ? size * 4 + Math.random() * 3 : 0,
        };
    }

    /* ── Initialise all layers ── */
    function init() {
        resize();
        layers = LAYERS.map(cfg => {
            const stars = [];
            for (let i = 0; i < cfg.count; i++) {
                stars.push(createStar(cfg, true));
            }
            return { config: cfg, stars };
        });
    }

    /* ── Main draw loop ── */
    let time = 0;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        time++;

        const w = canvas.width;
        const h = canvas.height;

        // Draw each layer (far first → near on top)
        for (const layer of layers) {
            for (const s of layer.stars) {
                // Move
                s.y -= s.speed;
                s.x += s.dx + Math.sin(time * 0.002 + s.pulsePhase) * 0.04;

                // Wrap around
                if (s.y < -5) { s.y = h + 5; s.x = Math.random() * w; }
                if (s.x < -5) s.x = w + 5;
                if (s.x > w + 5) s.x = -5;

                // Twinkle
                const pulse = Math.sin(time * s.pulseSpeed + s.pulsePhase);
                const a = Math.max(0, Math.min(1, s.baseAlpha + pulse * 0.15));

                // Glow halo for near-layer stars
                if (s.glowRadius > 0) {
                    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.glowRadius);
                    glow.addColorStop(0, `rgba(255,255,255,${a * 0.3})`);
                    glow.addColorStop(0.5, `rgba(255,255,255,${a * 0.06})`);
                    glow.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.glowRadius, 0, Math.PI * 2);
                    ctx.fillStyle = glow;
                    ctx.fill();
                }

                // Star core
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${a})`;
                ctx.fill();
            }
        }

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
                    if (s.x > canvas.width || s.y > canvas.height) {
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

            item.style.setProperty('--tx', '0px');
            item.style.setProperty('--ty', '0px');
            item.style.setProperty('--scale', '0');
            item.style.setProperty('--opacity', '0');

            setTimeout(() => {
                item.style.setProperty('--tx', `${tx}px`);
                item.style.setProperty('--ty', `${ty}px`);
                item.style.setProperty('--scale', '1');
                item.style.setProperty('--opacity', '1');
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
                    container.querySelectorAll('.skill-item').forEach(el => el.remove());
                    skills.forEach(skill => {
                        const el = createSkillElement(skill);
                        container.appendChild(el);
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
