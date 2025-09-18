// Level class
class Level {
    constructor(levelNumber) {
        this.levelNumber = levelNumber;
        this.boundaries = [];
        this.parkingSpot = {};
        this.exitArea = {};
        this.startPosition = { x: 100, y: 300 };
        this.startAngle = 0;
        this.instructions = [];

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
        let config = Level.levelConfigs[this.levelNumber - 1];

        if (!config) {
            this.levelNumber = 1;
            config = Level.levelConfigs[this.levelNumber - 1];
        }

        this.boundaries = config.boundaries;
        this.parkingSpot = config.parkingSpot;
        this.exitArea = config.exitArea;
        this.startPosition = config.startPosition;
        this.startAngle = config.startAngle;
        this.instructions = config.instructions;
        this.proScore = config.proScore;
    }

    static get levelConfigs() {
        const Angle = {
            N: -Math.PI / 2,   // North (up)
            NE: -Math.PI / 4,  // NorthEast
            E: 0,              // East (right)
            SE: Math.PI / 4,   // SouthEast
            S: Math.PI / 2,    // South (down)
            SW: Math.PI / 4,   // SouthWest
            W: Math.PI,        // West (left)
            NW: -Math.PI / 4,   // NorthWest
        };

        return [
            // Level 1: Simple straight parking
            {
                boundaries: [
                    { left: 0, right: 800, top: 0, bottom: 50 }, // Top wall
                    { left: 0, right: 50, top: 0, bottom: 600 }, // Left wall
                    { left: 750, right: 800, top: 0, bottom: 600 }, // Right wall
                    { left: 0, right: 800, top: 550, bottom: 600 }, // Bottom wall
                    // Parking lot obstacles
                    { left: 200, right: 250, top: 200, bottom: 400 },
                    { left: 550, right: 600, top: 200, bottom: 400 }
                ],
                parkingSpot: {
                    left: 300,
                    right: 365,
                    top: 250,
                    bottom: 350,
                    angle: Angle.N // Face North
                },
                exitArea: {
                    left: 640,
                    right: 720,
                    top: 250,
                    bottom: 350
                },
                startPosition: { x: 100, y: 300 },
                startAngle: Angle.N, // Face North
                instructions: ['Use the arrow keys to drive (Best on PC/laptop). Park the car inside the yellow area.', 'Excellent! Now drive to the exit!'],
                proScore: 980
            },

            // Level 2: Just a little narrower
            {
                boundaries: [
                    { left: 0, right: 800, top: 0, bottom: 50 },
                    { left: 0, right: 50, top: 0, bottom: 600 },
                    { left: 750, right: 800, top: 0, bottom: 600 },
                    { left: 0, right: 800, top: 550, bottom: 600 },
                    { left: 200, right: 250, top: 150, bottom: 450 },
                    { left: 550, right: 600, top: 150, bottom: 450 },
                    { left: 350, right: 450, top: 100, bottom: 150 }
                ],
                parkingSpot: {
                    left: 300,
                    right: 350,
                    top: 200,
                    bottom: 300,
                    angle: Angle.N // Face up
                },
                exitArea: {
                    left: 650,
                    right: 710,
                    top: 200,
                    bottom: 300
                },
                startPosition: { x: 100, y: 250 },
                startAngle: Angle.N, // Face North
                instructions: ['Too easy? Now the parking spot is narrower.', 'Great job! Head to the exit!'],
                proScore: 970
            },

            // Level 3: Realistic parking lot with parallel parked cars
            {
                boundaries: [
                    { left: 0, right: 800, top: 0, bottom: 50 }, // Top wall
                    { left: 0, right: 50, top: 0, bottom: 600 }, // Left wall
                    { left: 750, right: 800, top: 0, bottom: 600 }, // Right wall
                    { left: 0, right: 800, top: 550, bottom: 600 }, // Bottom wall

                    // Parked cars as obstacles
                    { left: 250, right: 290, top: 100, bottom: 200 }, // Left parked car
                    { left: 380, right: 420, top: 100, bottom: 200 }, // Right parked car

                    // Additional parked cars for realism
                    { left: 190, right: 230, top: 100, bottom: 200 }, // Another left car
                    { left: 440, right: 480, top: 100, bottom: 200 },  // Another right car

                    // Side of road
                    { left: 180, right: 500, top: 260, bottom: 280 },
                ],
                parkingSpot: {
                    left: 310,
                    right: 360,
                    top: 100,
                    bottom: 200,
                    angle: Angle.N
                },
                exitArea: {
                    left: 690,
                    right: 750,
                    top: 250,
                    bottom: 350
                },
                startPosition: { x: 100, y: 300 },
                startAngle: Angle.N,  // Face North
                instructions: ['Imaging parking between the parked cars in a parking lot.', 'Well parked! Now exit the car park.'],
                proScore: 960
            },

            // Level 4: Tricky angle and obstacles
            {
                boundaries: [
                    { left: 0, right: 800, top: 0, bottom: 50 },
                    { left: 0, right: 50, top: 0, bottom: 600 },
                    { left: 750, right: 800, top: 0, bottom: 600 },
                    { left: 0, right: 800, top: 550, bottom: 600 },
                    { left: 150, right: 200, top: 100, bottom: 300 },
                    { left: 600, right: 650, top: 300, bottom: 500 },
                    { left: 300, right: 350, top: 150, bottom: 250 },

                    // Next to carpark
                    { left: 350, right: 390, top: 320, bottom: 420 },
                    { left: 460, right: 500, top: 350, bottom: 450 },

                    { left: 250, right: 400, top: 200, bottom: 250 }
                ],
                parkingSpot: {
                    left: 400,
                    right: 450,
                    top: 300,
                    bottom: 400,
                    angle: Angle.N // Face up
                },
                exitArea: {
                    left: 650,
                    right: 700,
                    top: 300,
                    bottom: 400
                },
                startPosition: { x: 100, y: 350 },
                startAngle: Angle.N, // Face North
                instructions: ['Navigate the obstacles to park in the tight space.', 'Success! Proceed to the exit. Watch the wall!'],
                proScore: 955
            },

            // Level 5: Parallel parking scenario on the side of a street
            {
                boundaries: [
                    { left: 0, right: 800, top: 0, bottom: 50 }, // Top wall
                    { left: 0, right: 50, top: 0, bottom: 600 }, // Left wall
                    { left: 750, right: 800, top: 0, bottom: 600 }, // Right wall
                    { left: 0, right: 800, top: 550, bottom: 600 }, // Bottom wall

                    // Middle walls
                    { left: 250, right: 230, top: 50, bottom: 480 },
                    { left: 370, right: 400, top: 200, bottom: 550 },
                    { left: 460, right: 490, top: 120, bottom: 150 },
                    { left: 590, right: 630, top: 110, bottom: 490 },

                    // Parked cars on the right
                    { left: 700, right: 750, top: 150, bottom: 250 }, // First parked car
                    { left: 700, right: 750, top: 350, bottom: 450 }  // Second parked car
                ],
                parkingSpot: {
                    left: 700,
                    right: 750,
                    top: 270,
                    bottom: 330,
                },
                exitArea: {
                    left: 50,
                    right: 100,
                    top: 250,
                    bottom: 350
                },
                startPosition: { x: 150, y: 300 },
                startAngle: Angle.E, // Face East
                instructions: ['That was too easy! Now let\'s park between two cars on the side of a street.', 'Perfect! Now drive all the way back to the exit!'],
                proScore: 890
            },

            // Level 6: by Isko
            {
                boundaries: [
                    { left: 0, right: 800, top: 0, bottom: 50 }, // Top wall
                    { left: 0, right: 50, top: 0, bottom: 600 }, // Left wall
                    { left: 750, right: 800, top: 0, bottom: 600 }, // Right wall
                    { left: 0, right: 800, top: 550, bottom: 600 }, // Bottom wall

                    // Obstacles
                    { left: 50, right: 150, top: 350, bottom: 380 },
                    { left: 120, right: 150, top: 350, bottom: 490 },
                    { left: 210, right: 250, top: 450, bottom: 550 },
                    { left: 210, right: 250, top: 300, bottom: 400 },
                    { left: 310, right: 350, top: 150, bottom: 250 },

                    { left: 200, right: 350, top: 100, bottom: 150 },
                    { left: 200, right: 240, top: 150, bottom: 250 },
                    { left: 310, right: 350, top: 400, bottom: 450 },
                    { left: 350, right: 390, top: 50, bottom: 100 },
                    { left: 460, right: 590, top: 100, bottom: 460 },

                    { left: 590, right: 650, top: 460, bottom: 550 },
                    { left: 650, right: 750, top: 300, bottom: 390 },
                    { left: 650, right: 750, top: 100, bottom: 190 },
                ],
                parkingSpot: {
                    left: 240,
                    right: 310,
                    top: 150,
                    bottom: 250,
                    angle: Angle.E // Supposed to face right but doesn't work
                },
                exitArea: {
                    left: 650,
                    right: 750,
                    top: 500,
                    bottom: 550,
                },
                startPosition: { x: 80, y: 420 },
                startAngle: Angle.N, // Face North
                instructions: ['(by Isko) Get the car out of this garage to the other.', 'Nicely done! Brrm brrm! Now see if you can exit.'],
                proScore: 815
            },

            // Level 7: Maze by Isko
            {
                boundaries: [
                    { left: 0, right: 800, top: 0, bottom: 50 }, // Top wall
                    { left: 0, right: 50, top: 0, bottom: 600 }, // Left wall
                    { left: 750, right: 800, top: 0, bottom: 600 }, // Right wall
                    { left: 0, right: 800, top: 550, bottom: 600 }, // Bottom wall

                    // Obstacles
                    { left: 100, right: 150, top: 450, bottom: 550 },
                    { left: 50, right: 250, top: 300, bottom: 350 },
                    { left: 200, right: 300, top: 350, bottom: 450 },
                    { left: 500, right: 600, top: 400, bottom: 450 },
                    { left: 250, right: 400, top: 400, bottom: 450 },

                    { left: 450, right: 600, top: 150, bottom: 200 },
                    { left: 650, right: 700, top: 150, bottom: 550 },
                    { left: 400, right: 550, top: 300, bottom: 350 },
                    { left: 550, right: 600, top: 300, bottom: 400 },
                    { left: 600, right: 650, top: 250, bottom: 300 },

                    { left: 400, right: 450, top: 200, bottom: 300 },
                    { left: 250, right: 350, top: 200, bottom: 250 },
                    { left: 350, right: 450, top: 100, bottom: 250 },
                    { left: 100, right: 200, top: 100, bottom: 200 },
                    { left: 400, right: 450, top: 450, bottom: 500 },

                    { left: 200, right: 250, top: 50, bottom: 100 },
                    { left: 600, right: 750, top: 50, bottom: 100 },
                ],
                parkingSpot: {
                    left: 50,
                    right: 100,
                    top: 450,
                    bottom: 550,
                },
                exitArea: {
                    left: 700,
                    right: 750,
                    top: 450,
                    bottom: 550,
                },
                startPosition: { x: 200, y: 530 },
                startAngle: Angle.E, // Face east
                instructions: ['(by Isko) Try parking in the narrow garage.', 'Amazing! Now weave through the maze to the far exit!'],
                proScore: 760
            },

            // Level 8: by Niko
            {
                boundaries: [
                    { left: 0, right: 800, top: 0, bottom: 50 }, // Top wall
                    { left: 0, right: 50, top: 0, bottom: 600 }, // Left wall
                    { left: 750, right: 800, top: 0, bottom: 600 }, // Right wall
                    { left: 0, right: 800, top: 550, bottom: 600 }, // Bottom wall

                    // Obstacles
                    { left: 150, right: 250, top: 200, bottom: 300 },
                    { left: 50, right: 450, top: 350, bottom: 400 },
                    { left: 400, right: 450, top: 50, bottom: 250 },
                    { left: 550, right: 750, top: 100, bottom: 300 },
                ],
                parkingSpot: {
                    left: 350,
                    right: 450,
                    top: 250,
                    bottom: 350,
                },
                exitArea: {
                    left: 450,
                    right: 750,
                    top: 350,
                    bottom: 400,
                },
                startPosition: { x: 80, y: 200 },
                startAngle: Angle.N, // Face North
                instructions: ['(by Niko) Nice work. Now let\'s relax.', 'Now just let the arrow keys do the work.'],
                proScore: 975
            },
        ];
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