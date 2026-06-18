'use strict';

document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Navigation -----------------------------------------------------------
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

menuToggle?.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const observedSections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.site-nav a')];

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) return;
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
  });
}, { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.25, 0.6] });

observedSections.forEach((section) => sectionObserver.observe(section));

// --- Reveal animation -----------------------------------------------------
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

revealElements.forEach((element, index) => {
  element.style.transitionDelay = reducedMotion ? '0ms' : `${Math.min(index * 55, 220)}ms`;
  revealObserver.observe(element);
});

// --- Clock, footer, and copy interaction ---------------------------------
const clock = document.querySelector('#local-clock');
const footerYear = document.querySelector('#footer-year');
const copyButton = document.querySelector('#copy-handle');
const toast = document.querySelector('#toast');
let toastTimer;

function updateClock() {
  if (!clock) return;
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

updateClock();
setInterval(updateClock, 1000);
if (footerYear) footerYear.textContent = new Date().getFullYear();

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
}

copyButton?.addEventListener('click', async () => {
  const value = copyButton.dataset.copy || 'Chordinski';
  try {
    await navigator.clipboard.writeText(value);
    showToast('Handle copied: Chordinski');
  } catch {
    showToast('Copy unavailable — handle: Chordinski');
  }
});

// --- Occasional title glitch ---------------------------------------------
const glitchTitle = document.querySelector('.glitch');
if (glitchTitle && !reducedMotion) {
  setInterval(() => {
    glitchTitle.classList.add('is-glitching');
    setTimeout(() => glitchTitle.classList.remove('is-glitching'), 450);
  }, 4200);
}

// --- Interactive terminal ------------------------------------------------
const terminalForm = document.querySelector('#terminal-form');
const terminalInput = document.querySelector('#terminal-input');
const terminalOutput = document.querySelector('#terminal-output');

// Have to add this because pushing is actually one behind last commit, thank you Github...
const terminalCommands = {
  help: [
    'Available commands:',
    'about      display a short profile',
    'skills     list core technologies',
    'lab        show homelab summary',
    'steam      open the Steam profile',
    'contact    display public handle',
    'clear      clear this terminal',
  ],
  about: [
    'Chordinski is a security engineer focused on offensive operations,',
    'attack-path validation, homelabbing, and practical security research.'
  ],
  skills: [
    'OFFENSE  :: NodeZero, Nessus, BloodHound, Impacket, Metasploit',
    'DEFENSE  :: Security Onion, Splunk, Elastic, Wireshark, Sysmon',
    'SYSTEMS  :: Linux, Windows Server, pfSense, Docker, Python'
  ],
  lab: [
    'DOMAIN   :: cyberia.lab',
    'ROUTER   :: pfSense',
    'ZONES    :: corporate / security / attack / isolated',
    'MISSION  :: build, break, observe, repeat'
  ],
  contact: [
    'PUBLIC HANDLE :: Chordinski',
    'STEAM         :: steamcommunity.com/id/mcguin/',
    'DISCORD       :: mcguin'
  ],
  secret:  [
    'You gay as hell for looking in the Sources tab...'
  ]
};

function appendTerminalLine(text, className = 'terminal-response') {
  const paragraph = document.createElement('p');
  paragraph.className = className;
  paragraph.textContent = text;
  terminalOutput.append(paragraph);
}

terminalForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const command = terminalInput.value.trim().toLowerCase();
  if (!command) return;

  const commandLine = document.createElement('p');
  commandLine.className = 'terminal-command-line';
  commandLine.innerHTML = '<span class="prompt">$</span> ';
  commandLine.append(document.createTextNode(command));
  terminalOutput.append(commandLine);

  if (command === 'clear') {
    terminalOutput.replaceChildren();
  } else if (command === 'steam') {
    appendTerminalLine('Opening Steam profile…', 'terminal-success');
    window.open('https://steamcommunity.com/id/mcguin/', '_blank', 'noopener,noreferrer');
  } else if (terminalCommands[command]) {
    terminalCommands[command].forEach((line) => appendTerminalLine(line));
  } else {
    appendTerminalLine(`command not found: ${command}. Type "help".`, 'terminal-error');
  }

  terminalInput.value = '';
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
});

// --- Background particles ------------------------------------------------
const canvas = document.querySelector('#particle-canvas');
const context = canvas?.getContext('2d');
let particles = [];
let animationFrame;
let width = 0;
let height = 0;
let dpr = 1;
let mouseX = -9999;
let mouseY = -9999;

class Particle {
  constructor(initial = false) {
    this.reset(initial);
  }

  reset(initial = false) {
    this.x = Math.random() * width;
    this.y = initial ? Math.random() * height : height + Math.random() * 40;
    this.radius = Math.random() * 1.45 + 0.25;
    this.speedY = Math.random() * 0.28 + 0.08;
    this.speedX = (Math.random() - 0.5) * 0.12;
    this.alpha = Math.random() * 0.55 + 0.12;
    this.pulse = Math.random() * Math.PI * 2;
  }

  update() {
    this.y -= this.speedY;
    this.x += this.speedX;
    this.pulse += 0.012;

    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.hypot(dx, dy);
    if (distance < 100 && distance > 0) {
      this.x += (dx / distance) * 0.22;
      this.y += (dy / distance) * 0.22;
    }

    if (this.y < -10 || this.x < -20 || this.x > width + 20) this.reset();
  }

  draw() {
    const alpha = this.alpha * (0.78 + Math.sin(this.pulse) * 0.22);
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(231, 43, 65, ${alpha})`;
    context.fill();
  }
}

function resizeCanvas() {
  if (!canvas || !context) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particleCount = Math.min(135, Math.max(38, Math.floor((width * height) / 11500)));
  particles = Array.from({ length: particleCount }, () => new Particle(true));
}

function animateParticles() {
  context.clearRect(0, 0, width, height);
  particles.forEach((particle) => {
    particle.update();
    particle.draw();
  });
  animationFrame = requestAnimationFrame(animateParticles);
}

if (canvas && context && !reducedMotion) {
  resizeCanvas();
  animateParticles();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrame);
    } else {
      animateParticles();
    }
  });
}
