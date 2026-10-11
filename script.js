/* ==========================================================================
   CARTA INTERACTIVA CON EXPLOSIÓN TRASERA Y LLUVIA DE CORAZONES
   Diseño responsivo para móviles y ordenadores
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Elementos del DOM ---
  const envelope = document.getElementById('envelope');
  const heartSeal = document.getElementById('heart-seal');
  const letterPaper = document.getElementById('letter-paper');
  const instructionText = document.getElementById('instruction-text');
  const expandPreviewBtn = document.getElementById('expand-preview-btn');
  const referenceHearts = document.querySelector('.reference-hearts');

  // Botones de acción
  const resetBtn = document.getElementById('reset-btn');
  const customizeBtn = document.getElementById('customize-btn');
  const soundBtn = document.getElementById('sound-btn');
  const soundIcon = document.getElementById('sound-icon');
  const musicBtn = document.getElementById('music-btn');
  const musicIcon = document.getElementById('music-icon');

  // Modales
  const letterModal = document.getElementById('letter-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalDoneBtn = document.getElementById('modal-done-btn');

  const editModal = document.getElementById('edit-modal');
  const editModalBackdrop = document.getElementById('edit-modal-backdrop');
  const editModalClose = document.getElementById('edit-modal-close');
  const editForm = document.getElementById('edit-form');
  const inputRecipient = document.getElementById('input-recipient');
  const inputMessage = document.getElementById('input-message');
  const inputSender = document.getElementById('input-sender');

  // Textos de la carta
  const displayRecipient = document.getElementById('display-recipient');
  const displayMessage = document.getElementById('display-message');
  const displaySender = document.getElementById('display-sender');
  const displayDate = document.getElementById('display-date');

  const modalDisplayRecipient = document.getElementById('modal-display-recipient');
  const modalDisplayMessage = document.getElementById('modal-display-message');
  const modalDisplaySender = document.getElementById('modal-display-sender');
  const modalDisplayDate = document.getElementById('modal-display-date');

  // Canvas para la explosión por detrás
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

  // Fecha de la carta
  const letterDate = '11 de Octubre';
  displayDate.textContent = letterDate;
  modalDisplayDate.textContent = letterDate;

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

  // Función para dibujar un corazón con trazo tipo cómic (idéntico a la referencia)
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

    ctx.lineWidth = 2.6;
    ctx.strokeStyle = strokeColor;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Pequeño reflejo de brillo tierno
    ctx.beginPath();
    ctx.ellipse(-7, -4, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    ctx.restore();
  }

  // Clase para cada partícula de corazón
  class HeartParticle {
    constructor(startX, startY, isExplosion = true) {
      this.x = startX;
      this.y = startY;

      // Paleta vibrante y tierna
      const colors = ['#ff4d6d', '#ff758f', '#ff8fa3', '#ffb3c1', '#c9184a', '#ff9ebb', '#e63946'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.strokeColor = '#451322';

      this.size = Math.random() * 18 + 16; // 16px a 34px

      if (isExplosion) {
        // Explosión radial que sale por detrás de la carta
        // Principalmente proyectada hacia arriba, izquierda y derecha
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 1.35);
        const speed = Math.random() * 14 + 7;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - Math.random() * 5; // Empuje extra hacia arriba
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

      // Desvanecimiento suave conforme cae al fondo
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

  // Detonar la explosión de corazones desde detrás del sobre
  function triggerHeartExplosion() {
    const rect = envelope.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height * 0.45;

    // Crear entre 65 y 90 corazones
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

  // Generar corazones ambientales periódicos
  function spawnAmbientHeart() {
    if (!isOpen) return;
    const x = Math.random() * window.innerWidth;
    const y = -35;
    particles.push(new HeartParticle(x, y, false));
  }

  // Ciclo de animación
  function animateParticles() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

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
     AUDIO Y MÚSICA SINTETIZADA CON WEB AUDIO API (Cero dependencias externas)
     ========================================================================== */
  function initAudio() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Sonido de apertura: arpegio mágico celestial
  function playOpenSound() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const chord = [523.25, 659.25, 783.99, 987.77, 1046.50]; // Do, Mi, Sol, Si, Do agudo

    chord.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.9);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.95);
    });

    // Pop alegre
    const popOsc = audioCtx.createOscillator();
    const popGain = audioCtx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(320, now);
    popOsc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

    popGain.gain.setValueAtTime(0.2, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    popOsc.connect(popGain);
    popGain.connect(audioCtx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.16);
  }

  // Sonido de cierre
  function playCloseSound() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.25);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Melodía romántica sintetizada (caja de música)
  const melodyNotes = [
    { f: 523.25, d: 0.5 }, { f: 587.33, d: 0.5 }, { f: 659.25, d: 0.8 },
    { f: 587.33, d: 0.5 }, { f: 523.25, d: 0.5 }, { f: 659.25, d: 0.8 },
    { f: 783.99, d: 0.8 }, { f: 659.25, d: 0.8 }, { f: 523.25, d: 1.2 }
  ];
  let melodyStep = 0;

  function playMelodyNote() {
    if (!musicPlaying || !audioCtx) return;
    const note = melodyNotes[melodyStep % melodyNotes.length];
    melodyStep++;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.f, now);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.d * 0.9);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + note.d);
  }

  function toggleMusic() {
    initAudio();
    musicPlaying = !musicPlaying;

    if (musicPlaying) {
      musicBtn.classList.add('active');
      musicIcon.textContent = '🎶';
      musicInterval = setInterval(playMelodyNote, 420);
      playMelodyNote();
    } else {
      musicBtn.classList.remove('active');
      musicIcon.textContent = '🎵';
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
    instructionText.textContent = '¡Carta abierta con mucho amor! ✨';
    
    const resetLabel = resetBtn.querySelector('.tool-label');
    if (resetLabel) resetLabel.textContent = 'Cerrar carta';

    // Reproducir sonido mágico
    playOpenSound();

    // Sincronizar la explosión de corazones por detrás justo cuando la solapa se levanta
    setTimeout(() => {
      triggerHeartExplosion();
    }, 180);

    // Lluvia ambiental suave mientras esté abierta
    ambientRainInterval = setInterval(spawnAmbientHeart, 850);
  }

  function closeEnvelope() {
    if (!isOpen) return;
    isOpen = false;

    envelope.classList.remove('is-open');
    instructionText.textContent = 'Toca el corazón para abrirla ✨';
    
    const resetLabel = resetBtn.querySelector('.tool-label');
    if (resetLabel) resetLabel.textContent = 'Abrir carta';

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
  heartSeal.addEventListener('click', (e) => {
    e.stopPropagation();
    openEnvelope();
  });

  // Tocar el sobre cuando está cerrado
  envelope.addEventListener('click', (e) => {
    if (!isOpen) {
      openEnvelope();
    }
  });

  // Botón inferior para cerrar/abrir
  resetBtn.addEventListener('click', () => {
    toggleEnvelope();
  });

  // Si la carta está abierta y se toca el papel, ampliar para leer
  letterPaper.addEventListener('click', (e) => {
    if (isOpen) {
      e.stopPropagation();
      openLetterModal();
    }
  });

  expandPreviewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openLetterModal();
  });

  /* ==========================================================================
     MODAL DE LECTURA COMPLETA (Excelente para lectura en celulares)
     ========================================================================== */
  function openLetterModal() {
    letterModal.classList.add('is-active');
    letterModal.setAttribute('aria-hidden', 'false');
  }

  function closeLetterModal() {
    letterModal.classList.remove('is-active');
    letterModal.setAttribute('aria-hidden', 'true');
  }

  modalCloseBtn.addEventListener('click', closeLetterModal);
  modalDoneBtn.addEventListener('click', closeLetterModal);
  modalBackdrop.addEventListener('click', closeLetterModal);

  /* ==========================================================================
     PERSONALIZACIÓN DEL MENSAJE (Persistencia con localStorage)
     ========================================================================== */
  const STORAGE_KEY = 'cute_heart_letter_data';

  function formatParagraphs(text) {
    return text
      .split('\n')
      .filter(l => l.trim().length > 0)
      .map(line => `<p>${escapeHtml(line)}</p>`)
      .join('');
  }

  function escapeHtml(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
  }

  function loadSavedMessage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.recipient) {
          displayRecipient.textContent = data.recipient;
          modalDisplayRecipient.textContent = data.recipient;
        }
        if (data.message) {
          displayMessage.innerHTML = formatParagraphs(data.message);
          modalDisplayMessage.innerHTML = formatParagraphs(data.message);
        }
        if (data.sender) {
          displaySender.textContent = data.sender;
          modalDisplaySender.textContent = data.sender;
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar localStorage', e);
    }
  }

  function openEditModal() {
    inputRecipient.value = displayRecipient.textContent;
    const paras = Array.from(displayMessage.querySelectorAll('p')).map(p => p.textContent);
    inputMessage.value = paras.join('\n');
    inputSender.value = displaySender.textContent;

    editModal.classList.add('is-active');
    editModal.setAttribute('aria-hidden', 'false');
  }

  function closeEditModal() {
    editModal.classList.remove('is-active');
    editModal.setAttribute('aria-hidden', 'true');
  }

  if (customizeBtn) customizeBtn.addEventListener('click', openEditModal);
  editModalClose.addEventListener('click', closeEditModal);
  editModalBackdrop.addEventListener('click', closeEditModal);

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const recipient = inputRecipient.value.trim() || 'Para ti';
    const message = inputMessage.value.trim() || 'Te quiero mucho.';
    const sender = inputSender.value.trim() || 'De mí para ti 💕';

    // Actualizar pantalla
    displayRecipient.textContent = recipient;
    modalDisplayRecipient.textContent = recipient;

    displayMessage.innerHTML = formatParagraphs(message);
    modalDisplayMessage.innerHTML = formatParagraphs(message);

    displaySender.textContent = sender;
    modalDisplaySender.textContent = sender;

    // Guardar
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ recipient, message, sender }));
    } catch (err) {
      console.warn('Error guardando en localStorage', err);
    }

    closeEditModal();

    // Ráfaga festiva de corazones al guardar la nueva carta
    triggerHeartExplosion();
  });

  // Presets / Plantillas rápidas
  const presets = {
    amor: {
      recipient: 'Mi amor ❤️',
      message: 'Quería recordarte lo increíble e importante que eres para mí.\n\nCada momento contigo es un regalo que alegra mis días. Gracias por iluminar mi mundo con tu sonrisa y hacerme tan feliz.',
      sender: 'Siempre tuyo/a 💕'
    },
    aniversario: {
      recipient: 'Feliz Aniversario 🥂',
      message: 'Gracias por cada risa, cada abrazo y cada recuerdo compartido.\n\nEstar a tu lado es la aventura más hermosa de mi vida. ¡Por muchísimos momentos más juntos!',
      sender: 'Con todo mi amor 💖'
    },
    amistad: {
      recipient: 'Para mi persona favorita 🌸',
      message: 'Solo quería darte las gracias por estar siempre presente.\n\nTu amistad vale oro y tenerte en mi vida es una verdadera bendición. ¡Nunca dejes de brillar!',
      sender: 'Tu amigo/a incondicional ✨'
    },
    motivacion: {
      recipient: 'Una nota para ti ✨',
      message: 'Recuerda que eres mucho más fuerte y capaz de lo que imaginas.\n\nNo dejes que nada apague tu luz ni te quite la sonrisa. ¡Hoy será un gran día y estoy muy orgulloso/a de ti!',
      sender: 'Un abrazo enorme 🤗'
    }
  };

  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const p = presets[chip.dataset.preset];
      if (p) {
        inputRecipient.value = p.recipient;
        inputMessage.value = p.message;
        inputSender.value = p.sender;
      }
    });
  });

  // Controles de sonido y música
  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    soundBtn.classList.toggle('active', soundEnabled);
  });

  musicBtn.addEventListener('click', toggleMusic);

  // Efecto extra: tocar cualquier parte de la pantalla genera una mini ráfaga de corazones
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || e.target.closest('.modal-sheet') || e.target.closest('input') || e.target.closest('textarea')) {
      return;
    }
    if (isOpen) {
      for (let i = 0; i < 14; i++) {
        particles.push(new HeartParticle(e.clientX, e.clientY, true));
      }
      if (!animationFrameId) {
        animateParticles();
      }
    }
  });

  // Cargar si existía mensaje personalizado previo
  loadSavedMessage();
});
