// Main game class
class ParkingGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevel = 1;
        this.gameState = 'playing'; // playing, parked, exiting, completed
        this.car = null;
        this.level = null;
        this.physics = new CarPhysics();
        this.controls = new GameControls();
        this.lastTime = 0;
        this.elapsedTime = 0;
        this.startTime = 0;
        this.timerStarted = false;
        this.audioContext = null;
        this.masterGain = null;
        this.lastCrashTime = 0;
        this.lastCollisionTime = 0;
        this.collisionEffect = null; // For visual collision feedback
        this.collisionsCount = 0;
        this.lastCollision = false;
        this.currentScore = 0;
        this.highScore = 0;

        // Screen shake effect for collisions
        this.shakeIntensity = 0;
        this.shakeDuration = 0;

        // Mobile scaling
        this.isMobile = false;
        this.scale = 1;
        this.dpr = window.devicePixelRatio || 1;

        this.logicalWidth = 800;
        this.logicalHeight = 600;

        this.init();
        this.gameLoop();
    }

    init() {
        this.loadLevel(this.currentLevel);
        this.setupEventListeners();
        this.detectDevice();
        this.applyScaling();
        // Add resize listener for dynamic scaling
        window.addEventListener('resize', () => {
            this.applyScaling();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        });

        // Audio initialization
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (!this.masterGain) {
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
        }
        const slider = document.getElementById('volume-slider');
        if (slider) {
            const savedVolume = localStorage.getItem('volume') || '100';
            slider.value = savedVolume;
            this.masterGain.gain.value = parseInt(savedVolume) / 100;
            slider.addEventListener('input', (e) => {
                const volume = e.target.value;
                console.log('Volume changed to:', volume);
                this.masterGain.gain.value = parseInt(volume) / 100;
                localStorage.setItem('volume', volume);
            });
        }
    }

    applyScaling() {
        this.scale = 1 / this.dpr;

        if (window.innerHeight < this.logicalHeight) {

            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.width = window.innerWidth * this.dpr;
            this.canvas.height = window.innerHeight * this.dpr;

            const scale = Math.min((window.innerWidth / this.logicalWidth), (window.innerHeight / this.logicalHeight));
            this.scale = scale;
            this.offsetX = (window.innerWidth - (this.logicalWidth * scale)) / 2;
            this.offsetY = (window.innerHeight - (this.logicalHeight * scale)) / 2;
        }
    }

    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.level = new Level(levelNumber);
        this.car = new Car(this.level.startPosition.x, this.level.startPosition.y, this.level.startAngle);
        const highScores = JSON.parse(localStorage.getItem('highScores') || '{}');
        this.highScore = highScores[levelNumber] || 0;
        this.gameState = 'ready';
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerStarted = false;
        this.readyDelayStart = 0;
        this.firstInputDetected = false;
        this.collisionsCount = 0;
        this.lastCollision = false;
        this.lastCollisionTime = 0;
        this.currentScore = 0;
        document.getElementById('level-select').value = levelNumber;
        document.getElementById('instructions').textContent = this.level.instructions[0];
    }

    setupEventListeners() {
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.loadLevel(this.currentLevel);
        });

        document.getElementById('level-select').addEventListener('change', (e) => {
            this.loadLevel(parseInt(e.target.value));
        });

        // Close completion message handlers
        document.getElementById('close-completion').addEventListener('click', () => {
            document.getElementById('completion-message').style.display = 'none';
        });
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('completion-message').style.display === 'block' &&
                (e.key === 'Escape' ||
                    (this.gameState === 'playing' && e.key.startsWith('Arrow')))) {
                document.getElementById('completion-message').style.display = 'none';
            }
        });

        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
    }

    detectDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            ('ontouchstart' in window);
        this.isMobile = isMobile;
        if (isMobile) {
            document.getElementById('mobile-controls-left').classList.remove('hidden');
            document.getElementById('mobile-controls-right').classList.remove('hidden');
        }
    }

    update(deltaTime) {
        // Always update controls to detect input even in ready state
        this.controls.update();

        if (this.gameState === 'ready') {
            // 2-second delay after level load
            if (this.readyDelayStart === 0) {
                this.readyDelayStart = Date.now();
            }
            const delayElapsed = Date.now() - this.readyDelayStart;
            if (delayElapsed >= 2000) {
                // After delay, wait for first input to start playing
                if (!this.firstInputDetected && (this.controls.up > 0 || this.controls.down > 0 || this.controls.left > 0 || this.controls.right > 0)) {
                    this.firstInputDetected = true;
                    this.gameState = 'playing';
                    this.timerStarted = true;
                    this.startTime = Date.now();
                }
            }
            // Don't update physics or timer during ready state
            this.updateScreenShake(deltaTime);
            return;
        }

        if (this.gameState === 'playing' || this.gameState === 'exiting') {
            if (this.timerStarted) {
                this.elapsedTime += deltaTime;
            }

            const base = 1000;
            const timePenalty = 600 * (1 - Math.exp(-this.elapsedTime / 400));
            const collisionsPenalty = this.collisionsCount * 20;
            this.currentScore = Math.max(0, base - timePenalty - collisionsPenalty);
        }

        if (this.gameState === 'playing' || this.gameState === 'exiting') {
            const isColliding = this.physics.update(this.car, this.controls, deltaTime, this.level.boundaries);
            if (isColliding && !this.lastCollision && (Date.now() - this.lastCollisionTime > 1000)) { // at most once per second
                this.collisionsCount++;
                this.lastCollisionTime = Date.now();
                const impactSpeed = Math.abs(this.car.velocity);
                this.triggerCollisionEffect(this.car, impactSpeed);
                this.playCrashSound();
                this.addScreenShake(impactSpeed);
            }
            this.lastCollision = isColliding;
            this.checkParkingSuccess();
            this.checkExitSuccess();
        }

        // Update screen shake effect
        this.updateScreenShake(deltaTime);
    }


    checkParkingSuccess() {
        if (this.gameState === 'playing') {
            const parkingSpot = this.level.parkingSpot;
            const carCorners = this.car.getCorners();

            // Strict position check: all car corners must be 100% within parking spot bounds
            const positionCheck = carCorners.every(corner =>
                corner.x >= parkingSpot.left &&
                corner.x <= parkingSpot.right &&
                corner.y >= parkingSpot.top &&
                corner.y <= parkingSpot.bottom
            );

            // Check if car is nearly stopped (low speed)
            const speedCheck = Math.abs(this.car.velocity) < 3;

            // Only require position and low speed - no angle requirement (like real parking)
            if (positionCheck && speedCheck) {
                console.log('PARKING SUCCESS!');
                this.gameState = 'parked';
                this.playSuccessSound();
                this.showSuccessEffect();
                setTimeout(() => {
                    this.gameState = 'exiting';
                    document.getElementById('instructions').textContent = this.level.instructions[1];
                }, 2000);
            }
        }
    }

    checkExitSuccess() {
        if (this.gameState === 'exiting') {
            const exitArea = this.level.exitArea;
            const carCorners = this.car.getCorners();

            // Strict position check: all car corners must be 100% within exit area bounds
            const positionCheck = carCorners.every(corner =>
                corner.x >= exitArea.left &&
                corner.x <= exitArea.right &&
                corner.y >= exitArea.top &&
                corner.y <= exitArea.bottom
            );

            if (positionCheck) {
                this.playExitSound();
                this.gameState = 'completed';
                const highScores = JSON.parse(localStorage.getItem('highScores') || '{}');
                highScores[this.currentLevel] = Math.max(highScores[this.currentLevel] || 0, Math.floor(this.currentScore));
                localStorage.setItem('highScores', JSON.stringify(highScores));
                this.highScore = highScores[this.currentLevel];
                const completionText = document.getElementById('completion-text');
                const message = this.getCompletionMessage(this.level, this.currentScore, this.collisionsCount);
                const formattedMessage = message.replace(/\n/g, '<br>'); // Convert \n to HTML breaks if needed
                completionText.innerHTML = `${formattedMessage}<br><small>Score: ${Math.floor(this.currentScore)} (High: ${this.highScore})</small>`;
                document.getElementById('completion-message').style.display = 'block';
                this.nextLevel();
            }
        }
    }

    playSuccessSound() {
        // Enhanced celebratory rising chime using multiple oscillators
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // First note: 600Hz
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sine';
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.frequency.value = 600;
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc1.start(now);
        osc1.stop(now + 0.1);

        // Second note: 800Hz
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.frequency.value = 800;
        gain2.gain.setValueAtTime(0.3, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.2);

        // Third note: 1000Hz
        const osc3 = this.audioContext.createOscillator();
        const gain3 = this.audioContext.createGain();
        osc3.type = 'sine';
        osc3.connect(gain3);
        gain3.connect(this.masterGain);
        osc3.frequency.value = 1000;
        gain3.gain.setValueAtTime(0.3, now + 0.2);
        gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc3.start(now + 0.2);
        osc3.stop(now + 0.3);
    }

    playExitSound() {
        // Enhanced triumphant ascending tone with dual oscillators for whoosh effect
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // Main ascending sine wave
        const mainOsc = this.audioContext.createOscillator();
        const mainGain = this.audioContext.createGain();
        mainOsc.type = 'sine';
        mainOsc.connect(mainGain);
        mainGain.connect(this.masterGain);
        mainOsc.frequency.setValueAtTime(1400, now);
        mainOsc.frequency.linearRampToValueAtTime(4500, now + 0.4);
        mainGain.gain.setValueAtTime(0.3, now);
        mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        mainOsc.start(now);
        mainOsc.stop(now + 0.4);

        // Harmonic square wave for richness
        const harmOsc = this.audioContext.createOscillator();
        const harmGain = this.audioContext.createGain();
        harmOsc.type = 'square';
        harmOsc.connect(harmGain);
        harmGain.connect(this.masterGain);
        harmOsc.frequency.setValueAtTime(700, now);
        harmOsc.frequency.linearRampToValueAtTime(2250, now + 0.4);
        harmGain.gain.setValueAtTime(0.15, now);
        harmGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        harmOsc.start(now);
        harmOsc.stop(now + 0.4);
    }

    playCrashSound() {
        // Cooldown to prevent sound spam
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastCrashTime < 0.5) return;
        this.lastCrashTime = currentTime;

        // Enhanced crash sound with dual-oscillator rumble for impact
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Main crash oscillator (sawtooth for harshness)
        const mainOsc = this.audioContext.createOscillator();
        const mainGain = this.audioContext.createGain();
        mainOsc.type = 'sawtooth';
        mainOsc.connect(mainGain);
        mainGain.connect(this.masterGain);

        mainOsc.frequency.setValueAtTime(50, this.audioContext.currentTime);
        mainOsc.frequency.setValueAtTime(25, this.audioContext.currentTime + 0.1);
        mainGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        mainGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        // Low-frequency rumble oscillator (sine for bass)
        const rumbleOsc = this.audioContext.createOscillator();
        const rumbleGain = this.audioContext.createGain();
        rumbleOsc.type = 'sine';
        rumbleOsc.connect(rumbleGain);
        rumbleGain.connect(this.masterGain);

        rumbleOsc.frequency.setValueAtTime(10, this.audioContext.currentTime);
        rumbleOsc.frequency.setValueAtTime(5, this.audioContext.currentTime + 0.2);
        rumbleGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        rumbleGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        mainOsc.start(this.audioContext.currentTime);
        mainOsc.stop(this.audioContext.currentTime + 0.5);
        rumbleOsc.start(this.audioContext.currentTime);
        rumbleOsc.stop(this.audioContext.currentTime + 0.5);
    }

    playCongratsSound() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;
        const notes = [
            { freq: 1046.5, start: 0 },    // Do (C8)
            { freq: 1318.5, start: 0.1 }, // Mi (E8)
            { freq: 1568.0, start: 0.2 },  // Sol (G8)
            { freq: 2093, start: 0.3 }, // Do
            { freq: 1568.0, start: 0.6 },  // Sol
            { freq: 2093, start: 0.7 }  // Do
        ];

        notes.forEach((note, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.frequency.value = note.freq;
            gain.gain.setValueAtTime(0.3, now + note.start);
            gain.gain.exponentialRampToValueAtTime(0.01, now + note.start + 0.2);
            osc.start(now + note.start);
            osc.stop(now + note.start + 0.2);
        });
    }

    // Trigger collision visual effect (coordinates in logical space)
    triggerCollisionEffect(car, impactSpeed) {
        this.collisionEffect = {
            x: car.x,
            y: car.y,
            intensity: Math.min(impactSpeed / 10, 1.0),
            duration: 500, // milliseconds
            startTime: Date.now()
        };
    }

    // Draw collision visual effect (coordinates in logical space)
    drawCollisionEffect() {
        if (!this.collisionEffect) return;

        const now = Date.now();
        const elapsed = now - this.collisionEffect.startTime;

        if (elapsed > this.collisionEffect.duration) {
            this.collisionEffect = null;
            return;
        }

        const progress = elapsed / this.collisionEffect.duration;
        const alpha = (1 - progress) * this.collisionEffect.intensity;
        const radius = progress * 30 * this.collisionEffect.intensity;

        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = '#ff4444';
        this.ctx.lineWidth = 3 / this.scale; // Adjust line width for scaling
        this.ctx.beginPath();
        this.ctx.arc(this.collisionEffect.x, this.collisionEffect.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Add some particles for extra effect
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particleRadius = radius * 0.8;
            const x = this.collisionEffect.x + Math.cos(angle) * particleRadius;
            const y = this.collisionEffect.y + Math.sin(angle) * particleRadius;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffaa44';
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    addScreenShake(impactSpeed) {
        // Add screen shake based on collision intensity
        const shakeAmount = Math.min(impactSpeed / 2, 10);
        this.shakeIntensity = Math.max(this.shakeIntensity, shakeAmount);
        this.shakeDuration = Math.max(this.shakeDuration, 0.5); // 500ms duration
        // console.log(`Screen shake: ${shakeAmount.toFixed(1)}px for ${this.shakeDuration.toFixed(1)}s`);
    }

    updateScreenShake(deltaTime) {
        // Update screen shake effect
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            this.shakeIntensity *= 0.85; // Decay shake intensity
            if (this.shakeDuration <= 0) {
                this.shakeIntensity = 0;
            }
        }
    }

    showSuccessEffect() {
        // Simple visual effect (in logical space)
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.fillRect(0, 0, 800, 600);
        this.ctx.restore();
    }

    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel <= Level.levelConfigs.length) {
            document.getElementById('level-select').value = this.currentLevel;
            setTimeout(() => {
                this.loadLevel(this.currentLevel);
            }, 2000);
        } else {
            this.currentLevel--;
            document.getElementById('instructions').textContent = 'Congratulations! You have completed all levels!';
            setTimeout(() => {
                this.playCongratsSound();
            }, 1500);
        }
    }

    render() {
        // Apply screen shake effect only during active gameplay
        let shakeX = 0;
        let shakeY = 0;
        if (this.gameState === 'playing' || this.gameState === 'exiting' || this.gameState === 'parked') {
            shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            shakeY = (Math.random() - 0.5) * this.shakeIntensity;
        }

        this.ctx.save();
        this.ctx.scale(this.scale * this.dpr, this.scale * this.dpr);
        this.ctx.translate(this.offsetX * this.dpr / 2, this.offsetY * this.dpr);
        this.ctx.translate(shakeX, shakeY);

        // Clear canvas with background (using logical dimensions)
        this.ctx.fillStyle = '#2C2C2C';
        this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

        // Draw level
        this.level.render(this.ctx);

        // Draw car always
        this.car.render(this.ctx);

        // Draw collision visual effect
        this.drawCollisionEffect();

        // Draw UI overlays (using logical dimensions)
        if (this.gameState === 'ready') {
            // Semi-transparent overlay for ready state
            this.ctx.fillStyle = 'rgba(0, 100, 200, 0.4)';
            this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('READY!', this.logicalWidth / 2, this.logicalHeight / 2 - 40);

            this.ctx.font = '18px Arial';
            const delayElapsed = Date.now() - this.readyDelayStart;
            if (delayElapsed < 2000) {
                const remaining = Math.ceil((2000 - delayElapsed) / 1000);
                this.ctx.fillText(`Wait ${remaining}s...`, this.logicalWidth / 2, this.logicalHeight / 2);
            } else {
                this.ctx.fillText('Press arrow key or touch to start!', this.logicalWidth / 2, this.logicalHeight / 2);
            }
            this.ctx.textAlign = 'left';
        } else if (this.gameState === 'parked') {
            // Semi-transparent overlay
            this.ctx.fillStyle = 'rgba(0, 100, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PARKED!', this.logicalWidth / 2, this.logicalHeight / 2 - 20);

            this.ctx.font = '18px Arial';
            this.ctx.fillText('Now drive to the EXIT', this.logicalWidth / 2, this.logicalHeight / 2 + 20);
            this.ctx.textAlign = 'left';
        } else if (this.gameState === 'completed') {
            // Semi-transparent overlay
            this.ctx.fillStyle = 'rgba(0, 0, 100, 0.7)';
            this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LEVEL COMPLETE!', this.logicalWidth / 2, this.logicalHeight / 2);
            this.ctx.textAlign = 'left';
        }

        this.ctx.translate(-shakeX, -shakeY);
        this.ctx.translate(-this.offsetX * this.dpr, -this.offsetY * this.dpr);
        this.ctx.scale(1 / (this.scale * this.dpr), 1 / (this.scale * this.dpr));
        this.ctx.restore();

        // Update timer display
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = `Time: ${this.elapsedTime.toFixed(0)}s`;
        }

        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = `Score: ${Math.floor(this.currentScore)}`;
        }

        const collisionsEl = document.getElementById('collisions');
        if (collisionsEl) {
            collisionsEl.textContent = `Collisions: ${this.collisionsCount}`;
        }
    }

    getCompletionMessage(level, score, collisionCount) {
        const proScore = level.proScore || 980; // Default to level 1 if not set

        // Score tier messages
        let baseMessage = '';
        if (score >= (1000 - (1000 - proScore) * 0.8)) {
            // Crazy tier
            const crazyMessages = [
                "Unbelievable! You're a parking legend!",
                "Insane skills — Perfection personified!",
                "Beyond pro level — Driving wizardry!",
                "Cosmic parking mastery achieved!",
                "Wow! Too fast! Did you teleport that car?"
            ];
            baseMessage = crazyMessages[Math.floor(Math.random() * crazyMessages.length)];
        } else if (score >= proScore) {
            // Amazing tier
            const amazingMessages = [
                "Wow, you're an amazing driver! Perfect parking pro!",
                "Legendary parking skills — Flawless execution!",
                "Pro level mastery achieved!",
                "Elite driver status unlocked!",
                "Textbook perfection!"
            ];
            baseMessage = amazingMessages[Math.floor(Math.random() * amazingMessages.length)];
        } else if (score > proScore * 0.85) {
            // Great tier
            const greatMessages = [
                "Great job! Solid parking skills.",
                "That was smooth — Nice work!",
                "Impressive maneuvering!",
                "Well executed — Professional level!",
                "Smooth operator!"
            ];
            baseMessage = greatMessages[Math.floor(Math.random() * greatMessages.length)];
        } else if (score > proScore * 0.5) {
            // OK tier
            const okMessages = [
                "Good effort! Keep practicing those turns.",
                "Not bad — Solid attempt!",
                "You're getting the hang of it!",
                "Respectable performance!",
                "On the right track!"
            ];
            baseMessage = okMessages[Math.floor(Math.random() * okMessages.length)];
        } else if (score > 0) {
            // Poor tier
            const poorMessages = [
                "Tough level, but you'll nail it next time!",
                "Close call. Sharpen those skills!",
                "Every pro started somewhere!",
                "Brave attempt — Progress made!",
                "Better than nothing!"
            ];
            baseMessage = poorMessages[Math.floor(Math.random() * poorMessages.length)];
        } else {
            // Zero tier
            const zeroMessages = [
                "Oof, that was a wild ride! Time for a do-over?",
                "The car put up a fight — Better luck next round!",
                "Collision chaos! Let's try a gentler approach.",
                "You made it... barely! Epic survival!",
                "Parking? More like demolition derby win!"
            ];
            baseMessage = zeroMessages[Math.floor(Math.random() * zeroMessages.length)];
        }

        // Collision tier appendix
        let collisionAppendix = '';
        if (collisionCount === 0) {
            // Perfect
            const perfectMessages = [
                "(Car still perfect — Zero damage!)",
                "(Pristine condition — Flawless drive!)",
                "(No scratches — Masterful control!)"
            ];
            collisionAppendix = perfectMessages[Math.floor(Math.random() * perfectMessages.length)];
        } else if (collisionCount <= 3) {
            // Little Damaged
            const littleDamagedMessages = [
                "(A little dinged up, but mostly fine)",
                "(Minor bumps — No big deal!)",
                "(Slight wear and tear — Still drivable)",
                "(Couple of scrapes — Nothing serious)"
            ];
            collisionAppendix = littleDamagedMessages[Math.floor(Math.random() * littleDamagedMessages.length)];
        } else if (collisionCount <= 8) {
            // Moderately Banged Up
            const moderateMessages = [
                "(Moderately banged up — Still street-legal!)",
                "(Several bumps — Car's complaining!)",
                "(Your bumper's on vacation)",
                "(Dented but determined — Keep going!)"
            ];
            collisionAppendix = moderateMessages[Math.floor(Math.random() * moderateMessages.length)];
        } else if (collisionCount <= 16) {
            // Ouch
            const ouchMessages = [
                "(Ouch, that hurt! Time for major repairs)",
                "(Rough ride — Body shop visit needed?)",
                "(Battered but not broken!)",
                "(Your mechanic is going to love your parking skills)"
            ];
            collisionAppendix = ouchMessages[Math.floor(Math.random() * ouchMessages.length)];
        } else {
            // Broken
            const brokenMessages = [
                "(Broken car — It's a convertible now!)",
                "(Car totaled! Call the scrapyard valet!)",
                "(Broken car — Time for a new car!)",
                "(Frankenstein's monster mobile — Alive but limping!)",
            ];
            collisionAppendix = brokenMessages[Math.floor(Math.random() * brokenMessages.length)];
        }

        return baseMessage + "\n" + collisionAppendix;
    }

    gameLoop = (currentTime) => {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Populate level select dropdown dynamically
    const levelSelect = document.getElementById('level-select');
    const numLevels = Level.levelConfigs.length;

    for (let i = 1; i <= numLevels; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === 1) {
            option.selected = true;
        }
        levelSelect.appendChild(option);
    }

    new ParkingGame();
});