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

        this.init();
        this.gameLoop();
    }

    init() {
        this.loadLevel(this.currentLevel);
        this.setupEventListeners();
        this.detectDevice();
    }

    loadLevel(levelNumber) {
        this.level = new Level(levelNumber);
        this.car = new Car(this.level.startPosition.x, this.level.startPosition.y, this.level.startAngle);
        this.gameState = 'playing';
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
        if (this.gameState === 'playing' || this.gameState === 'exiting') {
            this.controls.update();
            this.physics.update(this.car, this.controls, deltaTime, this.level.boundaries);
            this.checkCollisions();
            this.checkParkingSuccess();
            this.checkExitSuccess();
        }
    }

    checkCollisions() {
        // Check collision with boundaries
        const carBounds = this.car.getBounds();
        for (const boundary of this.level.boundaries) {
            if (this.physics.checkCollision(carBounds, boundary)) {
                this.physics.handleCollision(this.car, boundary);
            }
        }
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
                this.nextLevel();
            }
        }
    }

    playSuccessSound() {
        // Simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    playExitSound() {
        // Simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
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
        // Clear canvas with background
        this.ctx.fillStyle = '#2C2C2C';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw level
        this.level.render(this.ctx);

        // Draw car
        this.car.render(this.ctx);

        // Draw UI overlays
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