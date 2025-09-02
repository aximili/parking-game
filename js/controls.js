// Game controls class
class GameControls {
    constructor() {
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;

        this.upPressed = false;
        this.downPressed = false;
        this.leftPressed = false;
        this.rightPressed = false;

        this.initKeyboardControls();
        this.initMobileControls();
    }

    initKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.upPressed = true;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.downPressed = true;
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.leftPressed = true;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.rightPressed = true;
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.upPressed = false;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.downPressed = false;
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.leftPressed = false;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.rightPressed = false;
                    break;
            }
        });
    }

    initMobileControls() {
        const upBtn = document.getElementById('up-btn');
        const downBtn = document.getElementById('down-btn');
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');

        // Touch start events
        upBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.upPressed = true;
        });
        downBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.downPressed = true;
        });
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.leftPressed = true;
        });
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.rightPressed = true;
        });

        // Touch end events
        upBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.upPressed = false;
        });
        downBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.downPressed = false;
        });
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.leftPressed = false;
        });
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.rightPressed = false;
        });

        // Mouse events for desktop testing
        upBtn.addEventListener('mousedown', () => this.upPressed = true);
        downBtn.addEventListener('mousedown', () => this.downPressed = true);
        leftBtn.addEventListener('mousedown', () => this.leftPressed = true);
        rightBtn.addEventListener('mousedown', () => this.rightPressed = true);

        upBtn.addEventListener('mouseup', () => this.upPressed = false);
        downBtn.addEventListener('mouseup', () => this.downPressed = false);
        leftBtn.addEventListener('mouseup', () => this.leftPressed = false);
        rightBtn.addEventListener('mouseup', () => this.rightPressed = false);

        // Handle mouse leave
        [upBtn, downBtn, leftBtn, rightBtn].forEach(btn => {
            btn.addEventListener('mouseleave', () => {
                this.upPressed = false;
                this.downPressed = false;
                this.leftPressed = false;
                this.rightPressed = false;
            });
        });
    }

    update() {
        // More responsive input handling
        const inputSpeed = 0.3; // Faster input response

        if (this.upPressed) {
            this.up = Math.min(1, this.up + inputSpeed);
        } else {
            this.up = Math.max(0, this.up - inputSpeed);
        }

        if (this.downPressed) {
            this.down = Math.min(1, this.down + inputSpeed);
        } else {
            this.down = Math.max(0, this.down - inputSpeed);
        }

        if (this.leftPressed) {
            this.left = Math.min(1, this.left + inputSpeed);
        } else {
            this.left = Math.max(0, this.left - inputSpeed);
        }

        if (this.rightPressed) {
            this.right = Math.min(1, this.right + inputSpeed);
        } else {
            this.right = Math.max(0, this.right - inputSpeed);
        }
    }
}