const nav = document.querySelector('.primary-nav');
const toggle = document.querySelector('.menu-toggle');
const links = document.querySelectorAll('.primary-nav a[href^="#"]');
const form = document.querySelector('.contact-form');
const yearEl = document.getElementById('year');
const heroSection = document.querySelector('.hero');
const heroVisual = document.querySelector('.hero-visual');
const heroOrbs = document.querySelectorAll('.hero-visual .orb[data-depth]');
const tiltElements = document.querySelectorAll('[data-tilt]');
const sections = document.querySelectorAll('section[id]');
const revealElements = document.querySelectorAll('[data-reveal]');
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const interactiveTargets = document.querySelectorAll('a, button, .card, .showcase-item, .timeline-card, .quote-card, .gallery-item, .hero-card, .contact-form input, .contact-form textarea');
const root = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const supportsFinePointer = window.matchMedia('(pointer: fine)').matches;
let heroRaf;
const heroCursor = { x: 0, y: 0 };
const cursorTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const cursorLerp = { x: cursorTarget.x, y: cursorTarget.y };
let cursorAnimation;
let gradientAnimation;
const galleryItems = document.querySelectorAll('.gallery-item');
const playerBar = document.querySelector('.global-player');
const playerTrackEl = document.querySelector('.player-track');
const playerTaglineEl = document.querySelector('.player-tagline');
const playerBtn = document.getElementById('player-toggle');
const progressFill = document.querySelector('.progress-fill');
const currentTimeEl = document.querySelector('.player-time--current');
const durationEl = document.querySelector('.player-time--duration');
const minimizeBtn = document.getElementById('player-minimize');
const widgetFrame = document.getElementById('sc-widget');
let scWidget;
let widgetReady = false;
let pendingTrack = null;
let durationMs = 0;
const pageLoader = document.querySelector('.page-loader');

if (toggle && nav) {
    toggle.addEventListener('click', () => {
        nav.classList.toggle('open');
    });
}

if (links.length) {
    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                event.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                nav?.classList.remove('open');
            }
        });
    });

    if (sections.length) {
        const sectionObserver = new IntersectionObserver(handleSectionIntersect, {
            threshold: 0.35,
        });
        sections.forEach((section) => sectionObserver.observe(section));
    }
}

if (form) {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const fields = [...form.elements].filter((el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
        const invalid = fields.find((field) => !field.value.trim());

        if (invalid) {
            invalid.focus();
            invalid.classList.add('error');
            setTimeout(() => invalid.classList.remove('error'), 2000);
            return;
        }

        form.reset();
        alert('Cảm ơn bạn! AliStudio sẽ liên hệ trong 24h.');
    });
}

if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

if (!prefersReducedMotion && revealElements.length) {
    const revealObserver = new IntersectionObserver(handleReveal, {
        threshold: 0.2,
        rootMargin: '0px 0px -40px 0px',
    });
    revealElements.forEach((element) => revealObserver.observe(element));
}

if (!prefersReducedMotion && supportsFinePointer) {
    if (heroSection && heroVisual) {
        heroSection.addEventListener('mousemove', handleHeroParallax);
        heroSection.addEventListener('mouseleave', resetHeroParallax);
    }

    tiltElements.forEach((element) => {
        element.addEventListener('mousemove', (event) => handleTiltMove(event, element));
        element.addEventListener('mouseleave', () => resetTilt(element));
    });

    if (cursorDot && cursorRing) {
        document.addEventListener('pointermove', handleCursorMove);
        document.addEventListener('pointerleave', hideCursor);
        cursorAnimation = requestAnimationFrame(animateCursor);

        interactiveTargets.forEach((target) => {
            target.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
            target.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
        });
    }
}

if (!prefersReducedMotion) {
    gradientAnimation = requestAnimationFrame(animateGradient);
    window.addEventListener('scroll', handleScrollGlow, { passive: true });
}

if (galleryItems.length) {
    galleryItems.forEach((item) => {
        const button = item.querySelector('.gallery-cta');
        if (!button) return;
        button.addEventListener('click', () => handleTrackSelection(item));
    });
}

if (playerBtn) {
    playerBtn.addEventListener('click', togglePlayback);
}

if (minimizeBtn) {
    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playerBar.classList.toggle('is-minimized');
    });

    // Click on minimized player to expand
    playerBar.addEventListener('click', (e) => {
        if (playerBar.classList.contains('is-minimized') && !e.target.closest('.player-minimize')) {
            playerBar.classList.remove('is-minimized');
        }
    });
}

initSoundCloudWidget();
window.addEventListener('load', () => {
    const minTime = 1500; // Minimum 1.5s loading
    const start = performance.now();

    // Simulate progress
    const progressBar = document.querySelector('.loader-progress-bar');
    const percentEl = document.querySelector('.status-percent');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;

        if (progressBar) progressBar.style.width = `${progress}%`;
        if (percentEl) percentEl.textContent = `${Math.floor(progress)}%`;

        if (progress === 100) clearInterval(interval);
    }, 100);

    const elapsed = performance.now() - start;
    const remaining = Math.max(0, minTime - elapsed);

    setTimeout(() => {
        clearInterval(interval);
        if (progressBar) progressBar.style.width = '100%';
        if (percentEl) percentEl.textContent = '100%';

        setTimeout(() => {
            pageLoader?.classList.add('is-hidden');
        }, 500);
    }, remaining);
});

function handleSectionIntersect(entries) {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('active', isActive);
        });
    });
}

function handleReveal(entries, observer) {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}

function handleHeroParallax(event) {
    const bounds = heroSection.getBoundingClientRect();
    heroCursor.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    heroCursor.y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;

    if (!heroRaf) {
        heroRaf = requestAnimationFrame(applyHeroParallax);
    }
}

function applyHeroParallax() {
    heroRaf = null;
    const rotateX = heroCursor.y * -6;
    const rotateY = heroCursor.x * 6;

    heroVisual.style.transform = `perspective(1600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    heroOrbs.forEach((orb) => {
        const depth = parseFloat(orb.dataset.depth || '0.5');
        const translateX = heroCursor.x * 30 * depth;
        const translateY = heroCursor.y * 30 * depth;
        const translateZ = depth * 160;
        orb.style.transform = `translate3d(${translateX}px, ${translateY}px, ${translateZ}px)`;
    });
}

function resetHeroParallax() {
    heroVisual.style.transform = '';
    heroOrbs.forEach((orb) => {
        orb.style.transform = '';
    });
}

function handleTiltMove(event, element) {
    const bounds = element.getBoundingClientRect();
    const offsetX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    const offsetY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    const depth = parseFloat(element.dataset.depth || '0.4');

    const rotateY = offsetX * 12 * depth;
    const rotateX = offsetY * -12 * depth;
    const translateZ = depth * 40;

    element.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
    element.classList.add('is-tilting');
}

function resetTilt(element) {
    element.classList.remove('is-tilting');
    element.style.transform = '';
}

function handleCursorMove(event) {
    cursorTarget.x = event.clientX;
    cursorTarget.y = event.clientY;
    cursorDot.style.opacity = 1;
    cursorRing.style.opacity = 1;
    cursorDot.style.left = `${cursorTarget.x}px`;
    cursorDot.style.top = `${cursorTarget.y}px`;
}

function hideCursor() {
    cursorDot.style.opacity = 0;
    cursorRing.style.opacity = 0;
    document.body.classList.remove('cursor-hover');
}

function animateCursor() {
    cursorLerp.x += (cursorTarget.x - cursorLerp.x) * 0.15;
    cursorLerp.y += (cursorTarget.y - cursorLerp.y) * 0.15;
    cursorRing.style.left = `${cursorLerp.x}px`;
    cursorRing.style.top = `${cursorLerp.y}px`;
    cursorAnimation = requestAnimationFrame(animateCursor);
}

function animateGradient() {
    const current = parseFloat(getComputedStyle(root).getPropertyValue('--gradient-angle')) || 0;
    const next = (current + 0.25) % 360;
    root.style.setProperty('--gradient-angle', `${next}deg`);
    gradientAnimation = requestAnimationFrame(animateGradient);
}

function handleScrollGlow() {
    const scrollRatio = Math.min(window.scrollY / 800, 1);
    root.style.setProperty('--scroll-glow', scrollRatio.toFixed(2));
}

function initSoundCloudWidget(retryCount = 0) {
    if (!widgetFrame) return;
    if (typeof SC === 'undefined') {
        if (retryCount < 10) {
            setTimeout(() => initSoundCloudWidget(retryCount + 1), 200);
        }
        return;
    }
    scWidget = SC.Widget(widgetFrame);
    scWidget.bind(SC.Widget.Events.READY, () => {
        widgetReady = true;
        updateDuration();
        if (pendingTrack) {
            loadTrack(pendingTrack);
            pendingTrack = null;
        }
    });
    scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, (event) => {
        if (!event) return;
        if (!durationMs && event.duration) {
            durationMs = event.duration;
            durationEl.textContent = formatTime(durationMs);
        }
        const percent = durationMs
            ? Math.min((event.currentPosition / durationMs) * 100, 100)
            : Math.min(event.relativePosition * 100, 100);
        progressFill.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(event.currentPosition);
    });
    scWidget.bind(SC.Widget.Events.PLAY, () => {
        updateDuration();
        updatePlayerState(true);
    });
    scWidget.bind(SC.Widget.Events.PAUSE, () => updatePlayerState(false));
}

function handleTrackSelection(item) {
    const track = item.dataset.track;
    const url = item.dataset.url;
    const tagline = item.dataset.tagline;
    if (!track || !url) return;

    playerTrackEl.textContent = track;
    playerTaglineEl.textContent = tagline || '';
    playerBar.classList.add('is-visible');
    playerBtn.disabled = true;
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    durationEl.textContent = '0:00';

    pendingTrack = { url };
    if (widgetReady) {
        loadTrack(pendingTrack);
        pendingTrack = null;
    }
}

function loadTrack({ url }) {
    if (!scWidget) return;
    scWidget.load(url, {
        auto_play: true,
        hide_related: true,
        show_comments: false,
        show_user: false,
        show_reposts: false,
        visual: false,
    });
    playerBtn.disabled = false;
    durationMs = 0;
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    durationEl.textContent = '0:00';
}

function togglePlayback() {
    if (!scWidget) return;
    scWidget.isPaused((paused) => {
        if (paused) {
            scWidget.play();
        } else {
            scWidget.pause();
        }
    });
}

function updatePlayerState(isPlaying) {
    if (!playerBtn) return;
    playerBtn.textContent = isPlaying ? 'Pause' : 'Play';
}

function formatTime(ms = 0) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateDuration() {
    if (!scWidget) return;
    scWidget.getDuration((dur) => {
        if (typeof dur === 'number' && dur > 0) {
            durationMs = dur;
            durationEl.textContent = formatTime(dur);
        }
    });
}
