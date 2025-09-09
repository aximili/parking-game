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
        this.lastCrashTime = 0;
        this.collisionEffect = null; // For visual collision feedback
        this.collisionsCount = 0;
        this.lastCollision = false;
        this.currentScore = 0;
        this.highScore = 0;
        this.showScore = true;

        // Screen shake effect for collisions
        this.shakeIntensity = 0;
        this.shakeDuration = 0;

        this.init();
        this.gameLoop();
    }

    init() {
        this.loadLevel(this.currentLevel);
        this.setupEventListeners();
        this.detectDevice();
    }

    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.level = new Level(levelNumber);
        this.car = new Car(this.level.startPosition.x, this.level.startPosition.y, this.level.startAngle);
        const highScores = JSON.parse(localStorage.getItem('highScores') || '{}');
        this.highScore = highScores[levelNumber] || 0;
        this.gameState = 'playing';
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerStarted = false;
        this.collisionsCount = 0;
        this.lastCollision = false;
        this.currentScore = 0;
        document.getElementById('level-select').value = levelNumber;
    }

    setupEventListeners() {
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.loadLevel(this.currentLevel);
        });

        document.getElementById('level-select').addEventListener('change', (e) => {
            this.loadLevel(parseInt(e.target.value));
        });

        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
    }

    detectDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            ('ontouchstart' in window);
        if (isMobile) {
            document.getElementById('mobile-controls').classList.remove('hidden');
        }
    }

    update(deltaTime) {
        if (this.gameState === 'playing') {
            // Start timer on first input
            if (!this.timerStarted) {
                if (this.controls.up > 0 || this.controls.down > 0 || this.controls.left > 0 || this.controls.right > 0) {
                    this.timerStarted = true;
                    this.startTime = Date.now();
                }
            }
        }

        if (this.gameState === 'playing' || this.gameState === 'exiting') {
            if (this.timerStarted) {
                this.elapsedTime += deltaTime;
            }

            const base = 1000;
            const timePenalty = 1000 * (1 - Math.exp(-this.elapsedTime / 100));
            const collisionsPenalty = this.collisionsCount * 50;
            this.currentScore = Math.max(0, base - timePenalty - collisionsPenalty);
        }

        if (this.gameState === 'playing' || this.gameState === 'exiting') {
            this.controls.update();
            const isColliding = this.physics.update(this.car, this.controls, deltaTime, this.level.boundaries);
            if (isColliding && !this.lastCollision) {
                this.collisionsCount++;
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
            const carBounds = this.car.getBounds();

            // More lenient position check (allow 5 pixel tolerance)
            const positionCheck = carBounds.left >= parkingSpot.left - 5 &&
                carBounds.right <= parkingSpot.right + 5 &&
                carBounds.top >= parkingSpot.top - 5 &&
                carBounds.bottom <= parkingSpot.bottom + 5;

            // Check if car is mostly stopped (speed < 10)
            const speedCheck = Math.abs(this.car.velocity) < 10;

            // Only require position and low speed - no angle requirement (like real parking)
            if (positionCheck && speedCheck) {
                console.log('PARKING SUCCESS!');
                this.gameState = 'parked';
                this.playSuccessSound();
                this.showSuccessEffect();
                setTimeout(() => {
                    this.gameState = 'exiting';
                    document.getElementById('instructions').textContent = 'Now exit to the road!';
                }, 2000);
            }
        }
    }

    checkExitSuccess() {
        if (this.gameState === 'exiting') {
            const exitArea = this.level.exitArea;
            const carBounds = this.car.getBounds();

            // More lenient position check for exit (allow 5 pixel tolerance)
            const positionCheck = carBounds.left >= exitArea.left - 5 &&
                carBounds.right <= exitArea.right + 5 &&
                carBounds.top >= exitArea.top - 5 &&
                carBounds.bottom <= exitArea.bottom + 5;

            if (positionCheck) {
                this.playExitSound();
                this.gameState = 'completed';
                const highScores = JSON.parse(localStorage.getItem('highScores') || '{}');
                highScores[this.currentLevel] = Math.max(highScores[this.currentLevel] || 0, Math.floor(this.currentScore));
                localStorage.setItem('highScores', JSON.stringify(highScores));
                this.highScore = highScores[this.currentLevel];
                const completionMsg = document.getElementById('completion-message');
                if (completionMsg) {
                    completionMsg.textContent = `Level Complete! Score: ${Math.floor(this.currentScore)} (High: ${this.highScore})`;
                    completionMsg.style.display = 'block';
                }
                setTimeout(() => {
                    const completionMsg = document.getElementById('completion-message');
                    if (completionMsg) {
                        completionMsg.style.display = 'none';
                    }
                }, 10000);
                this.nextLevel();
            }
        }
    }

    playSuccessSound() {
        // Enhanced celebratory rising chime using multiple oscillators
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // First note: 600Hz
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sine';
        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);
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
        gain2.connect(this.audioContext.destination);
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
        gain3.connect(this.audioContext.destination);
        osc3.frequency.value = 1000;
        gain3.gain.setValueAtTime(0.3, now + 0.2);
        gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc3.start(now + 0.2);
        osc3.stop(now + 0.3);
    }

    playExitSound() {
        // Enhanced triumphant ascending tone with dual oscillators for whoosh effect
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // Main ascending sine wave
        const mainOsc = this.audioContext.createOscillator();
        const mainGain = this.audioContext.createGain();
        mainOsc.type = 'sine';
        mainOsc.connect(mainGain);
        mainGain.connect(this.audioContext.destination);
        mainOsc.frequency.setValueAtTime(800, now);
        mainOsc.frequency.linearRampToValueAtTime(1200, now + 0.4);
        mainGain.gain.setValueAtTime(0.3, now);
        mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        mainOsc.start(now);
        mainOsc.stop(now + 0.4);

        // Harmonic square wave for richness
        const harmOsc = this.audioContext.createOscillator();
        const harmGain = this.audioContext.createGain();
        harmOsc.type = 'square';
        harmOsc.connect(harmGain);
        harmGain.connect(this.audioContext.destination);
        harmOsc.frequency.setValueAtTime(400, now);
        harmOsc.frequency.linearRampToValueAtTime(600, now + 0.4);
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
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Main crash oscillator (sawtooth for harshness)
        const mainOsc = this.audioContext.createOscillator();
        const mainGain = this.audioContext.createGain();
        mainOsc.type = 'sawtooth';
        mainOsc.connect(mainGain);
        mainGain.connect(this.audioContext.destination);

        mainOsc.frequency.setValueAtTime(50, this.audioContext.currentTime);
        mainOsc.frequency.setValueAtTime(25, this.audioContext.currentTime + 0.1);
        mainGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        mainGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        // Low-frequency rumble oscillator (sine for bass)
        const rumbleOsc = this.audioContext.createOscillator();
        const rumbleGain = this.audioContext.createGain();
        rumbleOsc.type = 'sine';
        rumbleOsc.connect(rumbleGain);
        rumbleGain.connect(this.audioContext.destination);

        rumbleOsc.frequency.setValueAtTime(10, this.audioContext.currentTime);
        rumbleOsc.frequency.setValueAtTime(5, this.audioContext.currentTime + 0.2);
        rumbleGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        rumbleGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        mainOsc.start(this.audioContext.currentTime);
        mainOsc.stop(this.audioContext.currentTime + 0.5);
        rumbleOsc.start(this.audioContext.currentTime);
        rumbleOsc.stop(this.audioContext.currentTime + 0.5);
    }

    // Trigger collision visual effect
    triggerCollisionEffect(car, impactSpeed) {
        this.collisionEffect = {
            x: car.x,
            y: car.y,
            intensity: Math.min(impactSpeed / 10, 1.0),
            duration: 500, // milliseconds
            startTime: Date.now()
        };
    }

    // Draw collision visual effect
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
        this.ctx.lineWidth = 3;
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
        // Simple visual effect
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    nextLevel() {
        this.currentLevel++;
        document.getElementById('level-select').value = this.currentLevel;
        if (this.currentLevel <= 5) { // Assuming 5 levels
            setTimeout(() => {
                this.loadLevel(this.currentLevel);
            }, 2000);
        } else {
            document.getElementById('instructions').textContent = 'Congratulations! All levels completed!';
        }
    }

    render() {
        // Apply screen shake effect
        const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
        const shakeY = (Math.random() - 0.5) * this.shakeIntensity;

        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);

        // Clear canvas with background
        this.ctx.fillStyle = '#2C2C2C';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw level
        this.level.render(this.ctx);

        // Draw car
        this.car.render(this.ctx);

        // Draw collision visual effect
        this.drawCollisionEffect();

        this.ctx.restore();

        // Draw UI overlays (not affected by shake)
        if (this.gameState === 'parked') {
            // Semi-transparent overlay
            this.ctx.fillStyle = 'rgba(0, 100, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PARKED!', this.canvas.width / 2, this.canvas.height / 2 - 20);

            this.ctx.font = '18px Arial';
            this.ctx.fillText('Now drive to the EXIT', this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.textAlign = 'left';
        } else if (this.gameState === 'completed') {
            // Semi-transparent overlay
            this.ctx.fillStyle = 'rgba(0, 0, 100, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }

        // Update timer display
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = `Time: ${this.elapsedTime.toFixed(1)}s`;
        }

        const scoreEl = document.getElementById('score');
        if (scoreEl && this.showScore) {
            scoreEl.textContent = `Score: ${Math.floor(this.currentScore)}`;
        }

        const collisionsEl = document.getElementById('collisions');
        if (collisionsEl) {
            collisionsEl.textContent = `Collisions: ${this.collisionsCount}`;
        }
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
    new ParkingGame();
});