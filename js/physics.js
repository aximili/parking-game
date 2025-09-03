// Car physics engine
class CarPhysics {
    constructor() {
        this.maxSpeed = 120; // pixels per second (reduced for better control)
        this.acceleration = 60; // pixels per second squared (2s to reach max speed: 120/2 = 60)
        this.deceleration = 300; // pixels per second squared
        this.turnSpeed = Math.PI; // radians per second for full turn
        this.friction = 0.8; // velocity multiplier per second (stronger deceleration)
    }

    update(car, controls, deltaTime, boundaries) {
        // Ensure deltaTime is valid
        if (!deltaTime || deltaTime <= 0 || deltaTime > 1) {
            deltaTime = 1 / 60; // Default to 60fps
        }

        // Handle acceleration/deceleration
        if (controls.up) {
            car.velocity += this.acceleration * deltaTime;
        } else if (controls.down) {
            car.velocity -= this.deceleration * deltaTime;
        } else {
            // Natural deceleration
            car.velocity *= Math.pow(this.friction, deltaTime * 60);
        }

        // Clamp velocity
        car.velocity = Math.max(-this.maxSpeed * 0.5, Math.min(this.maxSpeed, car.velocity));

        // Handle steering - realistic car steering with power steering effect
        const maxSteeringAngle = Math.PI / 4; // 45 degrees max steering
        const steeringSpeed = Math.PI * 1.5; // radians per second

        if (controls.left) {
            car.steeringAngle = Math.max(car.steeringAngle - steeringSpeed * deltaTime, -maxSteeringAngle);
        } else if (controls.right) {
            car.steeringAngle = Math.min(car.steeringAngle + steeringSpeed * deltaTime, maxSteeringAngle);
        } else {
            // Power steering: only return to center when moving
            if (Math.abs(car.velocity) > 1.0) { // Only when moving at reasonable speed
                if (Math.abs(car.steeringAngle) < 0.01) {
                    car.steeringAngle = 0;
                } else {
                    car.steeringAngle *= 0.85; // Very slow return when moving
                }
            }
            // When stopped, steering stays where it is (no automatic centering)
        }

        // Realistic turning based on bicycle model
        if (Math.abs(car.velocity) > 0.1) {
            const wheelBase = car.height; // Distance between front and rear wheels
            if (Math.abs(car.steeringAngle) > 0.01) {
                const turnRadius = wheelBase / Math.tan(car.steeringAngle);
                const angularVelocity = car.velocity / turnRadius;
                car.angle += angularVelocity * deltaTime;
            }
        }

        // Calculate intended movement
        const moveX = Math.cos(car.angle) * car.velocity * deltaTime;
        const moveY = Math.sin(car.angle) * car.velocity * deltaTime;

        // Move the car
        car.x += moveX;
        car.y += moveY;

        // Check collision with boundaries
        for (const boundary of boundaries) {
            if (this.checkCollision(car.getBounds(), boundary)) {
                car.velocity = 0;
                this.pushAway(car, boundary);
            }
        }
    }

    checkCollision(carBounds, boundary) {
        // Simple AABB collision detection
        return !(carBounds.right < boundary.left ||
            carBounds.left > boundary.right ||
            carBounds.bottom < boundary.top ||
            carBounds.top > boundary.bottom);
    }

    pushAway(car, boundary) {
        const carBounds = car.getBounds();
        const overlapX = Math.min(carBounds.right - boundary.left, boundary.right - carBounds.left);
        const overlapY = Math.min(carBounds.bottom - boundary.top, boundary.bottom - carBounds.top);

        if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
                // Push in x direction
                if (carBounds.left < boundary.left) {
                    car.x -= overlapX;
                } else if (carBounds.right > boundary.right) {
                    car.x += overlapX;
                }
            } else {
                // Push in y direction
                if (carBounds.top < boundary.top) {
                    car.y -= overlapY;
                } else if (carBounds.bottom > boundary.bottom) {
                    car.y += overlapY;
                }
            }
        }
    }

    handleCollision(car, boundary) {
        car.velocity = 0;
        this.pushAway(car, boundary);
    }

    checkParking(carBounds, parkingSpot) {
        // Check if car is within parking spot bounds
        return carBounds.left >= parkingSpot.left &&
            carBounds.right <= parkingSpot.right &&
            carBounds.top >= parkingSpot.top &&
            carBounds.bottom <= parkingSpot.bottom;
    }

    checkExit(carBounds, exitArea) {
        // Check if car has reached the exit
        return carBounds.left >= exitArea.left &&
            carBounds.right <= exitArea.right &&
            carBounds.top >= exitArea.top &&
            carBounds.bottom <= exitArea.bottom;
    }
}

// Car class
class Car {
    constructor(x, y, angle = 0) {
        this.x = x || 100; // Default to 100 if x is undefined/NaN
        this.y = y || 300; // Default to 300 if y is undefined/NaN
        this.angle = angle || 0; // Car's current direction
        this.steeringAngle = 0; // Front wheel steering angle
        this.velocity = 0;
        this.width = 30;
        this.height = 50;
        // Load car SVG image asynchronously
        this.image = new Image();
        this.image.src = 'assets/car.svg';
    }

    getBounds() {
        // Bounds based on rendered car (height and width swapped in rendering)
        return {
            left: this.x - this.height / 2,
            right: this.x + this.height / 2,
            top: this.y - this.width / 2,
            bottom: this.y + this.width / 2
        };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw car SVG image with proper scaling and positioning
        ctx.drawImage(this.image, -this.height / 2, -this.width / 2, this.height, this.width);

        // Draw wheels
        ctx.fillStyle = 'black';

        // Left front wheel
        ctx.save();
        ctx.translate(0.25 * this.height, -0.5 * this.width);
        ctx.rotate(this.steeringAngle * 0.8);
        ctx.fillRect(-4, -2, 8, 4);
        ctx.restore();

        // Right front wheel
        ctx.save();
        ctx.translate(0.25 * this.height, 0.5 * this.width);
        ctx.rotate(this.steeringAngle * 0.8);
        ctx.fillRect(-4, -2, 8, 4);
        ctx.restore();

        // Left rear wheel
        ctx.save();
        ctx.translate(-0.27 * this.height, -0.5 * this.width);
        ctx.fillRect(-4, -2, 8, 4);
        ctx.restore();

        // Right rear wheel
        ctx.save();
        ctx.translate(-0.27 * this.height, 0.5 * this.width);
        ctx.fillRect(-4, -2, 8, 4);
        ctx.restore();

        ctx.restore();
    }
}