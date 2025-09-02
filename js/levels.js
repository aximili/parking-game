// Level class
class Level {
    constructor(levelNumber) {
        this.levelNumber = levelNumber;
        this.boundaries = [];
        this.parkingSpot = {};
        this.exitArea = {};
        this.startPosition = { x: 100, y: 300 };
        this.startAngle = 0;

        // Initialize SVG images
        this.roadImage = new Image();
        this.obstacleImage = new Image();
        this.parkingImage = new Image();
        this.exitImage = new Image();

        // Load SVG images asynchronously
        this.roadImage.src = 'assets/road.svg';
        this.obstacleImage.src = 'assets/obstacle.svg';
        this.parkingImage.src = 'assets/parking.svg';
        this.exitImage.src = 'assets/exit.svg';

        this.generateLevel();
    }

    generateLevel() {
        switch (this.levelNumber) {
            case 1:
                this.generateLevel1();
                break;
            case 2:
                this.generateLevel2();
                break;
            case 3:
                this.generateLevel3();
                break;
            case 4:
                this.generateLevel4();
                break;
            case 5:
                this.generateLevel5();
                break;
            default:
                this.generateLevel1();
        }
    }

    generateLevel1() {
        // Simple level: straight parking
        this.boundaries = [
            { left: 0, right: 800, top: 0, bottom: 50 }, // Top wall
            { left: 0, right: 50, top: 0, bottom: 600 }, // Left wall
            { left: 750, right: 800, top: 0, bottom: 600 }, // Right wall
            { left: 0, right: 800, top: 550, bottom: 600 }, // Bottom wall
            // Parking lot obstacles
            { left: 200, right: 250, top: 200, bottom: 400 },
            { left: 550, right: 600, top: 200, bottom: 400 }
        ];

        this.parkingSpot = {
            left: 300,
            right: 350,
            top: 250,
            bottom: 350,
            angle: -Math.PI / 2 // Face up to match car orientation
        };

        this.exitArea = {
            left: 700,
            right: 750,
            top: 250,
            bottom: 350
        };

        this.startPosition = { x: 100, y: 300 };
        this.startAngle = -Math.PI / 2;
    }

    generateLevel2() {
        // Angled parking
        this.boundaries = [
            { left: 0, right: 800, top: 0, bottom: 50 },
            { left: 0, right: 50, top: 0, bottom: 600 },
            { left: 750, right: 800, top: 0, bottom: 600 },
            { left: 0, right: 800, top: 550, bottom: 600 },
            { left: 200, right: 250, top: 150, bottom: 450 },
            { left: 550, right: 600, top: 150, bottom: 450 },
            { left: 350, right: 450, top: 100, bottom: 150 }
        ];

        this.parkingSpot = {
            left: 300,
            right: 350,
            top: 200,
            bottom: 300,
            angle: -Math.PI / 2 // Face up
        };

        this.exitArea = {
            left: 650,
            right: 700,
            top: 200,
            bottom: 300
        };

        this.startPosition = { x: 100, y: 250 };
        this.startAngle = -Math.PI / 2;
    }

    generateLevel3() {
        // Realistic parking lot with parallel parked cars
        this.boundaries = [
            { left: 0, right: 800, top: 0, bottom: 50 }, // Top wall
            { left: 0, right: 50, top: 0, bottom: 600 }, // Left wall
            { left: 750, right: 800, top: 0, bottom: 600 }, // Right wall
            { left: 0, right: 800, top: 550, bottom: 600 }, // Bottom wall
            // Parked cars as obstacles
            { left: 330, right: 370, top: 250, bottom: 350 }, // Left parked car
            { left: 430, right: 470, top: 250, bottom: 350 }, // Right parked car
            // Additional parked cars for realism
            { left: 280, right: 320, top: 250, bottom: 350 }, // Another left car
            { left: 480, right: 520, top: 250, bottom: 350 }  // Another right car
        ];

        this.parkingSpot = {
            left: 360,
            right: 440,
            top: 250,
            bottom: 350,
            angle: -Math.PI / 2
        };

        this.exitArea = {
            left: 700,
            right: 750,
            top: 250,
            bottom: 350
        };

        this.startPosition = { x: 100, y: 300 };
        this.startAngle = -Math.PI / 2; // Face up (negative Y direction)
    }

    generateLevel4() {
        // Tricky angle and obstacles
        this.boundaries = [
            { left: 0, right: 800, top: 0, bottom: 50 },
            { left: 0, right: 50, top: 0, bottom: 600 },
            { left: 750, right: 800, top: 0, bottom: 600 },
            { left: 0, right: 800, top: 550, bottom: 600 },
            { left: 150, right: 200, top: 100, bottom: 300 },
            { left: 600, right: 650, top: 300, bottom: 500 },
            { left: 300, right: 350, top: 150, bottom: 250 },
            { left: 450, right: 500, top: 350, bottom: 450 },
            { left: 250, right: 400, top: 200, bottom: 250 }
        ];

        this.parkingSpot = {
            left: 400,
            right: 450,
            top: 300,
            bottom: 400,
            angle: -Math.PI / 2 // Face up
        };

        this.exitArea = {
            left: 650,
            right: 700,
            top: 300,
            bottom: 400
        };

        this.startPosition = { x: 100, y: 350 };
        this.startAngle = -Math.PI / 2;
    }

    generateLevel5() {
        // Parallel parking scenario on the side of a street
        this.boundaries = [
            { left: 0, right: 800, top: 0, bottom: 50 }, // Top road boundary
            { left: 0, right: 800, top: 550, bottom: 600 }, // Bottom road boundary
            { left: 750, right: 800, top: 0, bottom: 600 }, // Right curb
            // Parked cars on the right
            { left: 650, right: 700, top: 150, bottom: 250 }, // First parked car
            { left: 650, right: 700, top: 350, bottom: 450 }  // Second parked car
        ];

        this.parkingSpot = {
            left: 650,
            right: 700,
            top: 250,
            bottom: 350,
            angle: 0 // Face right
        };

        this.exitArea = {
            left: 0,
            right: 50,
            top: 250,
            bottom: 350
        };

        this.startPosition = { x: 100, y: 300 };
        this.startAngle = 0; // Face right
    }

    render(ctx) {
        // Draw background (road)
        if (this.roadImage.complete) {
            ctx.drawImage(this.roadImage, 0, 0, 800, 600);
        } else {
            ctx.fillStyle = '#404040';
            ctx.fillRect(0, 0, 800, 600);
        }

        // Draw boundaries (walls/obstacles)
        if (this.obstacleImage.complete) {
            this.boundaries.forEach(boundary => {
                ctx.drawImage(this.obstacleImage, boundary.left, boundary.top,
                    boundary.right - boundary.left,
                    boundary.bottom - boundary.top);
            });
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            this.boundaries.forEach(boundary => {
                ctx.fillRect(boundary.left, boundary.top,
                    boundary.right - boundary.left,
                    boundary.bottom - boundary.top);
                ctx.strokeRect(boundary.left, boundary.top,
                    boundary.right - boundary.left,
                    boundary.bottom - boundary.top);
            });
        }

        // Draw parking spot
        if (this.parkingImage.complete) {
            ctx.drawImage(this.parkingImage, this.parkingSpot.left, this.parkingSpot.top,
                this.parkingSpot.right - this.parkingSpot.left,
                this.parkingSpot.bottom - this.parkingSpot.top);
        } else {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(this.parkingSpot.left, this.parkingSpot.top,
                this.parkingSpot.right - this.parkingSpot.left,
                this.parkingSpot.bottom - this.parkingSpot.top);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.strokeRect(this.parkingSpot.left, this.parkingSpot.top,
                this.parkingSpot.right - this.parkingSpot.left,
                this.parkingSpot.bottom - this.parkingSpot.top);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.parkingSpot.left, this.parkingSpot.top,
                this.parkingSpot.right - this.parkingSpot.left,
                this.parkingSpot.bottom - this.parkingSpot.top);
            ctx.setLineDash([]);
        }

        // Draw exit area
        if (this.exitImage.complete) {
            ctx.drawImage(this.exitImage, this.exitArea.left, this.exitArea.top,
                this.exitArea.right - this.exitArea.left,
                this.exitArea.bottom - this.exitArea.top);
        } else {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fillRect(this.exitArea.left, this.exitArea.top,
                this.exitArea.right - this.exitArea.left,
                this.exitArea.bottom - this.exitArea.top);
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 4;
            ctx.strokeRect(this.exitArea.left, this.exitArea.top,
                this.exitArea.right - this.exitArea.left,
                this.exitArea.bottom - this.exitArea.top);
        }

        // Draw "PARK HERE" text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PARK HERE',
            (this.parkingSpot.left + this.parkingSpot.right) / 2,
            this.parkingSpot.top - 10);
        ctx.textAlign = 'left';

        // Draw "EXIT" text
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT',
            (this.exitArea.left + this.exitArea.right) / 2,
            this.exitArea.top - 10);
        ctx.textAlign = 'left';

        // Draw level number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`Level ${this.levelNumber}`, 10, 30);

        // Draw instructions
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.fillText('Use arrow keys to drive', 10, 580);
    }
}