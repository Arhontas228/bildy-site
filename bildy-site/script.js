document.addEventListener('DOMContentLoaded', () => {
    
    // Функция переключения вкладок
    function switchTab(targetId) {
        // 1. Прячем все секции
        const sections = document.querySelectorAll('section');
        sections.forEach(section => section.classList.add('hidden'));

        // 2. Показываем нужную секцию
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 3. Обновляем активный класс в меню
        const navLinks = document.querySelectorAll('.navbar nav a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${targetId}`) {
                link.classList.add('active');
            }
        });
    }

    // Обработчик кликов по меню
    const navLinks = document.querySelectorAll('.navbar nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            switchTab(targetId);
        });
    });

    // Обработчик кнопки "Смотреть фильм" на главной
    const watchFilmBtn = document.getElementById('watchFilmBtn');
    if (watchFilmBtn) {
        watchFilmBtn.addEventListener('click', () => {
            switchTab('video');
        });
    }

    // --- ЗВЁЗДЫ ---
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            star.style.width = `${Math.random() * 2 + 1}px`;
            star.style.height = `${Math.random() * 2 + 1}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            star.style.animationDuration = `${Math.random() * 3 + 2}s`;
            starsContainer.appendChild(star);
        }
    }

    // --- ИГРА ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('gameOverlay');
    const startBtn = document.getElementById('startGameBtn');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayText = document.getElementById('overlayText');
    const highScoreEl = document.getElementById('highScore');

    let gameRunning = false;
    let score = 0;
    let highScore = localStorage.getItem('bilbyHighScore') || 0;
    if(highScoreEl) highScoreEl.innerText = highScore;

    const pizl = { x: canvas.width / 2, y: canvas.height - 60, width: 80, height: 40, targetX: canvas.width / 2 };
    const chick = { x: canvas.width / 2, y: canvas.height - 30, radius: 15 };
    let rocks = [];
    let spawnTimer = 0;
    let spawnInterval = 60;

    let audioCtx;
    function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    function playHitSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    }
    function playGameOverSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        pizl.targetX = (e.clientX - rect.left) * scaleX;
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        pizl.targetX = (e.touches[0].clientX - rect.left) * scaleX;
    }, { passive: false });

    if(startBtn) {
        startBtn.addEventListener('click', () => {
            initAudio();
            gameRunning = true; score = 0; rocks = []; spawnInterval = 60;
            overlay.classList.add('hidden-overlay');
            gameLoop();
        });
    }

    function gameLoop() {
        if (!gameRunning) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        pizl.x += (pizl.targetX - pizl.x) * 0.2;
        if (pizl.x < pizl.width / 2) pizl.x = pizl.width / 2;
        if (pizl.x > canvas.width - pizl.width / 2) pizl.x = canvas.width - pizl.width / 2;

        spawnTimer++;
        if (spawnTimer >= spawnInterval) {
            rocks.push({ x: Math.random() * (canvas.width - 40) + 20, y: -20, radius: Math.random() * 10 + 10, speed: Math.random() * 3 + 3 });
            spawnTimer = 0;
            if (spawnInterval > 20) spawnInterval -= 0.5;
        }

        for (let i = rocks.length - 1; i >= 0; i--) {
            let rock = rocks[i];
            rock.y += rock.speed;

            ctx.beginPath(); ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4500'; ctx.fill(); ctx.strokeStyle = '#ff8c00'; ctx.lineWidth = 2; ctx.stroke();

            if (rock.y + rock.radius > pizl.y - pizl.height / 2 && rock.y - rock.radius < pizl.y + pizl.height / 2 && rock.x > pizl.x - pizl.width / 2 && rock.x < pizl.x + pizl.width / 2) {
                rocks.splice(i, 1); score += 10; playHitSound(); continue;
            }

            let dx = rock.x - chick.x; let dy = rock.y - chick.y;
            if (Math.sqrt(dx * dx + dy * dy) < rock.radius + chick.radius) { gameOver(); return; }
            if (rock.y > canvas.height + 20) rocks.splice(i, 1);
        }

        ctx.beginPath(); ctx.arc(chick.x, chick.y, chick.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;

        ctx.fillStyle = '#ff8c00'; ctx.shadowColor = '#ff8c00'; ctx.shadowBlur = 20;
        ctx.fillRect(pizl.x - pizl.width / 2, pizl.y - pizl.height / 2, pizl.width, pizl.height);
        ctx.beginPath(); ctx.arc(pizl.x - 20, pizl.y - pizl.height / 2, 10, 0, Math.PI * 2); ctx.arc(pizl.x + 20, pizl.y - pizl.height / 2, 10, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Montserrat, sans-serif'; ctx.fillText('Счет: ' + score, 20, 40);
        requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        gameRunning = false; playGameOverSound();
        if (score > highScore) { highScore = score; localStorage.setItem('bilbyHighScore', highScore); if(highScoreEl) highScoreEl.innerText = highScore; }
        overlayTitle.innerText = "ИГРА ОКОНЧЕНА";
        overlayText.innerHTML = `Птенец пострадал!<br>Твой счет: <strong style="color:#ff8c00; font-size: 1.5rem;">${score}</strong>`;
        startBtn.innerText = "ИГРАТЬ СНОВА";
        overlay.classList.remove('hidden-overlay');
    }

    // --- ФОРМА ---
    const feedbackForm = document.getElementById('feedbackForm');
    const formStatus = document.getElementById('formStatus');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            formStatus.innerText = `Спасибо, ${name}! Твоё мнение очень важно для нас.`;
            formStatus.style.color = '#ff8c00';
            feedbackForm.reset();
            setTimeout(() => { formStatus.innerText = ''; }, 3000);
        });
    }

});