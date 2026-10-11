/* ==========================================================================
   CARTA INTERACTIVA CON EXPLOSIÓN TRASERA Y LLUVIA DE CORAZONES
   Diseño responsivo y amigable para teléfonos móviles
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Elementos del DOM ---
  const envelope = document.getElementById('envelope');
  const heartSeal = document.getElementById('heart-seal');
  const letterPaper = document.getElementById('letter-paper');
  const instructionText = document.getElementById('instruction-text');
  const expandPreviewBtn = document.getElementById('expand-preview-btn');

  // Botones de acción
  const resetBtn = document.getElementById('reset-btn');
  const customizeBtn = document.getElementById('customize-btn'); // Opcional si existe
  const soundBtn = document.getElementById('sound-btn');
  const soundIcon = document.getElementById('sound-icon');
  const musicBtn = document.getElementById('music-btn');
  const musicIcon = document.getElementById('music-icon');

  // Modales
  const letterModal = document.getElementById('letter-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalDoneBtn = document.getElementById('modal-done-btn');

  // Textos de la carta
  const displayRecipient = document.getElementById('display-recipient');
  const displayMessage = document.getElementById('display-message');
  const displaySender = document.getElementById('display-sender');
  const displayDate = document.getElementById('display-date');

  const modalDisplayRecipient = document.getElementById('modal-display-recipient');
  const modalDisplayMessage = document.getElementById('modal-display-message');
  const modalDisplaySender = document.getElementById('modal-display-sender');
  const modalDisplayDate = document.getElementById('modal-display-date');

  // Canvas para la lluvia y explosión de corazones
  const canvas = document.getElementById('hearts-canvas');
  const ctx = canvas.getContext('2d');

  // --- Estado de la Aplicación ---
  let isOpen = false;
  let soundEnabled = true;
  let musicPlaying = false;
  let particles = [];
  let animationFrameId = null;
  let audioCtx = null;
  let musicInterval = null;
  let ambientRainInterval = null;

  // Fecha fija: 11 de Octubre
  const fixedDate = '11 de Octubre';
  if (displayDate) displayDate.textContent = fixedDate;
  if (modalDisplayDate) modalDisplayDate.textContent = fixedDate;

  // Ajustar tamaño del Canvas en alta resolución
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  /* ==========================================================================
     SISTEMA DE PARTÍCULAS: Explosión y Caída de Corazones (Doodle Style)
     ========================================================================== */

  // Función para dibujar un corazón con trazo tipo cómic
  function drawDoodleHeart(ctx, x, y, size, color, strokeColor, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(size / 30, size / 30);

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-15, -20, -30, 2, 0, 26);
    ctx.bezierCurveTo(30, 2, 15, -20, 0, -6);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = strokeColor;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Pequeño reflejo tierno
    ctx.beginPath();
    ctx.ellipse(-7, -4, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();

    ctx.restore();
  }

  // Clase para cada partícula de corazón
  class HeartParticle {
    constructor(startX, startY, isExplosion = true) {
      this.x = startX;
      this.y = startY;

      // Paleta tierna de colores
      const colors = ['#ff4d6d', '#ff758f', '#ff8fa3', '#ffb3c1', '#c9184a', '#ff9ebb', '#e63946'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.strokeColor = '#451322';

      this.size = Math.random() * 18 + 16; // 16px a 34px

      if (isExplosion) {
        // Explosión radial proyectada principalmente hacia arriba y a los lados
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 1.35);
        const speed = Math.random() * 13 + 6;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - Math.random() * 4;
        this.gravity = 0.22 + Math.random() * 0.12;
      } else {
        // Lluvia ambiental suave
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = Math.random() * 2 + 1.6;
        this.gravity = 0.06;
      }

      this.friction = 0.982;
      this.rotation = (Math.random() - 0.5) * 0.6;
      this.vRot = (Math.random() - 0.5) * 0.08;

      // Efecto bamboleo como hoja cayendo
      this.wobbleSpeed = Math.random() * 0.05 + 0.025;
      this.wobbleAmp = Math.random() * 2.2 + 0.8;
      this.wobbleTime = Math.random() * 100;

      this.opacity = 1;
      this.fadeRate = Math.random() * 0.003 + 0.0018;
    }

    update() {
      this.vx *= this.friction;
      this.vy += this.gravity;

      this.wobbleTime += this.wobbleSpeed;
      this.x += this.vx + Math.sin(this.wobbleTime) * this.wobbleAmp;
      this.y += this.vy;

      this.rotation += this.vRot;

      if (this.y > window.innerHeight * 0.68) {
        this.opacity -= this.fadeRate * 3.5;
      }

      return this.y < window.innerHeight + 80 && this.opacity > 0.02;
    }

    draw(ctx) {
      ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));
      drawDoodleHeart(ctx, this.x, this.y, this.size, this.color, this.strokeColor, this.rotation);
      ctx.globalAlpha = 1;
    }
  }

  // Generar ráfaga de corazones en coordenadas (x, y)
  function spawnHeartBurst(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      particles.push(new HeartParticle(x, y, true));
    }
    if (!animationFrameId) {
      animateParticles();
    }
  }

  // Detonar la gran explosión de corazones desde detrás del sobre
  function triggerHeartExplosion() {
    const rect = envelope.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height * 0.45;

    const count = window.innerWidth < 480 ? 65 : 90;
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * (rect.width * 0.65);
      const offsetY = (Math.random() - 0.5) * (rect.height * 0.4);
      particles.push(new HeartParticle(originX + offsetX, originY + offsetY, true));
    }

    if (!animationFrameId) {
      animateParticles();
    }
  }

  // Lluvia ambiental suave
  function spawnAmbientHeart() {
    if (!isOpen) return;
    const x = Math.random() * window.innerWidth;
    const y = -35;
    particles.push(new HeartParticle(x, y, false));
  }

  // Ciclo de animación del Canvas
  function animateParticles() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    for (let i = particles.length - 1; i >= 0; i--) {
      const isAlive = particles[i].update();
      if (isAlive) {
        particles[i].draw(ctx);
      } else {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      animationFrameId = requestAnimationFrame(animateParticles);
    } else {
      animationFrameId = null;
    }
  }

  /* ==========================================================================
     AUDIO Y MÚSICA SINTETIZADA CON WEB AUDIO API
     ========================================================================== */
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Reproducir una nota sintetizada limpia
  function playNote(freq, startTime, duration, volume = 0.22, type = 'sine') {
    const ctx = getAudioContext();
    if (!ctx || !soundEnabled) return;

    try {
      const now = Math.max(ctx.currentTime, startTime);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Sonido de apertura / Efecto mágico de campanas y arpa
  function playOpenSound() {
    const ctx = getAudioContext();
    if (!ctx || !soundEnabled) return;

    const now = ctx.currentTime;
    // Arpegio mágico celestial pentatónico
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      playNote(freq, now + idx * 0.075, 0.85, 0.22, 'triangle');
    });

    // Pequeño pop dulce
    playNote(320, now, 0.15, 0.2, 'sine');
  }

  // Sonido suave al cerrar
  function playCloseSound() {
    const ctx = getAudioContext();
    if (!ctx || !soundEnabled) return;
    playNote(440, ctx.currentTime, 0.2, 0.16, 'sine');
  }

  // Melodía romántica en bucle (caja musical)
  const melodyNotes = [
    { f: 523.25, d: 0.45 }, { f: 659.25, d: 0.45 }, { f: 783.99, d: 0.6 },
    { f: 659.25, d: 0.45 }, { f: 880.00, d: 0.6 },  { f: 783.99, d: 0.5 },
    { f: 659.25, d: 0.5 },  { f: 523.25, d: 0.8 }
  ];
  let melodyStep = 0;

  function playMelodyNote() {
    if (!musicPlaying) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const item = melodyNotes[melodyStep % melodyNotes.length];
    melodyStep++;
    playNote(item.f, ctx.currentTime, item.d, 0.24, 'sine');
  }

  function toggleMusic() {
    getAudioContext();
    musicPlaying = !musicPlaying;

    if (musicPlaying) {
      if (musicBtn) musicBtn.classList.add('active');
      if (musicIcon) musicIcon.textContent = '🎶';
      musicInterval = setInterval(playMelodyNote, 420);
      playMelodyNote();
    } else {
      if (musicBtn) musicBtn.classList.remove('active');
      if (musicIcon) musicIcon.textContent = '🎵';
      clearInterval(musicInterval);
    }
  }

  /* ==========================================================================
     MECÁNICA DE APERTURA Y CIERRE
     ========================================================================== */
  function openEnvelope() {
    if (isOpen) return;
    isOpen = true;

    envelope.classList.add('is-open');
    if (instructionText) instructionText.textContent = '¡Carta abierta con mucho amor! ✨';
    
    if (resetBtn) {
      const resetLabel = resetBtn.querySelector('.tool-label');
      if (resetLabel) resetLabel.textContent = 'Cerrar carta';
    }

    // Sonido mágico
    playOpenSound();

    // Ráfaga festiva de corazones por detrás
    setTimeout(() => {
      triggerHeartExplosion();
    }, 180);

    // Lluvia ambiental periódica
    if (!ambientRainInterval) {
      ambientRainInterval = setInterval(spawnAmbientHeart, 850);
    }
  }

  function closeEnvelope() {
    if (!isOpen) return;
    isOpen = false;

    envelope.classList.remove('is-open');
    if (instructionText) instructionText.textContent = 'Toca el corazón para abrirla ✨';
    
    if (resetBtn) {
      const resetLabel = resetBtn.querySelector('.tool-label');
      if (resetLabel) resetLabel.textContent = 'Abrir carta';
    }

    playCloseSound();

    if (ambientRainInterval) {
      clearInterval(ambientRainInterval);
      ambientRainInterval = null;
    }
  }

  function toggleEnvelope() {
    if (isOpen) {
      closeEnvelope();
    } else {
      openEnvelope();
    }
  }

  // Tocar el corazón central
  if (heartSeal) {
    heartSeal.addEventListener('click', (e) => {
      e.stopPropagation();
      openEnvelope();
    });
  }

  // Tocar el sobre cuando está cerrado
  if (envelope) {
    envelope.addEventListener('click', () => {
      if (!isOpen) {
        openEnvelope();
      }
    });
  }

  // Botón para cerrar / abrir
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      toggleEnvelope();
    });
  }

  // Si la carta está abierta y se toca el papel, ampliar para leer
  if (letterPaper) {
    letterPaper.addEventListener('click', (e) => {
      if (isOpen) {
        e.stopPropagation();
        openLetterModal();
      }
    });
  }

  if (expandPreviewBtn) {
    expandPreviewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openLetterModal();
    });
  }

  /* ==========================================================================
     BOTONES DE EFECTOS Y MELODÍA
     ========================================================================== */
  
  // Botón de Efectos: reproduce el sonido mágico y lanza corazones
  if (soundBtn) {
    soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      getAudioContext();

      // Asegurar que el sonido esté activo
      soundEnabled = true;
      if (soundIcon) soundIcon.textContent = '🔊';
      soundBtn.classList.add('active');

      // Reproducir sonido festivo
      playOpenSound();

      // Lanzar corazones desde el botón
      const rect = soundBtn.getBoundingClientRect();
      spawnHeartBurst(rect.left + rect.width / 2, rect.top, 14);

      setTimeout(() => {
        soundBtn.classList.remove('active');
      }, 600);
    });
  }

  // Botón de Melodía: inicia/detiene la música romántica
  if (musicBtn) {
    musicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMusic();

      if (musicPlaying) {
        const rect = musicBtn.getBoundingClientRect();
        spawnHeartBurst(rect.left + rect.width / 2, rect.top, 14);
      }
    });
  }

  /* ==========================================================================
     INTERACCIÓN TÁCTIL: TOCAR LA PANTALLA CREA CORAZONES
     ========================================================================== */
  window.addEventListener('pointerdown', (e) => {
    // Si tocan un botón de la barra o dentro de un modal, no generar corazones extra
    if (e.target.closest('button') || e.target.closest('.modal-sheet') || e.target.closest('input') || e.target.closest('textarea')) {
      return;
    }

    // Inicializar audio con la interacción del usuario
    getAudioContext();

    // Ráfaga de corazones exactamente donde toque el usuario
    spawnHeartBurst(e.clientX, e.clientY, 12);
  });

  /* ==========================================================================
     MODAL DE LECTURA COMPLETA
     ========================================================================== */
  function openLetterModal() {
    if (letterModal) {
      letterModal.classList.add('is-active');
      letterModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeLetterModal() {
    if (letterModal) {
      letterModal.classList.remove('is-active');
      letterModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeLetterModal);
  if (modalDoneBtn) modalDoneBtn.addEventListener('click', closeLetterModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeLetterModal);
});
