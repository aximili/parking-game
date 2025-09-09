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

        // Check collision with boundaries and handle response
        for (const boundary of boundaries) {
            const collisionResult = this.checkCollisionWithMTV(car, boundary);
            if (collisionResult.collision) {
                this.handleCollisionResponse(car, collisionResult);
                // Return collision result for visual effects
                return collisionResult;
            }
        }
        return null;
    }

    // Project points onto an axis (unit vector)
    project(points, axis) {
        let min = Infinity;
        let max = -Infinity;
        for (const point of points) {
            const proj = point.x * axis.x + point.y * axis.y;
            if (proj < min) min = proj;
            if (proj > max) max = proj;
        }
        return { min, max };
    }

    // Get axes for SAT: car's edge normals + AABB axes
    getAxes(carCorners, boundary) {
        const axes = [];

        // Car's two unique edge axes (normals)
        for (let i = 0; i < 2; i++) {
            const p1 = carCorners[i];
            const p2 = carCorners[(i + 1) % 4];
            const edgeX = p2.x - p1.x;
            const edgeY = p2.y - p1.y;
            // Perpendicular (normal)
            const axisX = -edgeY;
            const axisY = edgeX;
            const length = Math.sqrt(axisX * axisX + axisY * axisY);
            if (length > 0) {
                axes.push({ x: axisX / length, y: axisY / length });
            }
        }

        // AABB axes (x and y)
        axes.push({ x: 1, y: 0 });
        axes.push({ x: 0, y: 1 });

        return axes;
    }

    // Check for overlap on a single axis
    axesOverlap(proj1, proj2) {
        return !(proj1.max < proj2.min || proj2.max < proj1.min);
    }

    // SAT collision detection and MTV calculation
    checkSATCollision(carCorners, boundary) {
        const axes = this.getAxes(carCorners, boundary);

        let minOverlap = Infinity;
        let minAxis = null;

        for (const axis of axes) {
            // Project car corners
            const carProj = this.project(carCorners, axis);

            // Project AABB corners (simple for axis-aligned)
            const aabbCorners = [
                { x: boundary.left, y: boundary.top },
                { x: boundary.right, y: boundary.top },
                { x: boundary.right, y: boundary.bottom },
                { x: boundary.left, y: boundary.bottom }
            ];
            const aabbProj = this.project(aabbCorners, axis);

            if (!this.axesOverlap(carProj, aabbProj)) {
                return { collision: false, mtv: null };
            }

            // Calculate overlap for MTV
            const overlap = Math.min(carProj.max, aabbProj.max) - Math.max(carProj.min, aabbProj.min);
            if (overlap < minOverlap) {
                minOverlap = overlap;
                minAxis = axis;
            }
        }

        // Determine MTV direction (towards car center from AABB)
        const aabbCenter = { x: (boundary.left + boundary.right) / 2, y: (boundary.top + boundary.bottom) / 2 };

        // Calculate car center from the corners (more reliable than using this.x, this.y)
        const carCenter = {
            x: (carCorners[0].x + carCorners[2].x) / 2,
            y: (carCorners[0].y + carCorners[2].y) / 2
        };

        const toCar = { x: carCenter.x - aabbCenter.x, y: carCenter.y - aabbCenter.y };
        const dot = toCar.x * minAxis.x + toCar.y * minAxis.y;
        const mtv = { x: minAxis.x * minOverlap * (dot > 0 ? 1 : -1), y: minAxis.y * minOverlap * (dot > 0 ? 1 : -1) };

        return { collision: true, mtv };
    }

    checkCollision(car, boundary) {
        const carCorners = car.getCorners();
        const aabbCorners = [
            { x: boundary.left, y: boundary.top },
            { x: boundary.right, y: boundary.top },
            { x: boundary.right, y: boundary.bottom },
            { x: boundary.left, y: boundary.bottom }
        ];
        // Quick AABB reject first
        const carBounds = car.getBounds();
        if (carBounds.right < boundary.left ||
            carBounds.left > boundary.right ||
            carBounds.bottom < boundary.top ||
            carBounds.top > boundary.bottom) {
            return false;
        }
        // Full SAT
        return this.checkSATCollision(carCorners, boundary).collision;
    }

    /*
    pushAway(car, boundary) {
        const carCorners = car.getCorners();
        const satResult = this.checkSATCollision(carCorners, boundary);
        if (satResult.collision && satResult.mtv) {
            // Apply MTV to separate car from boundary
            car.x += satResult.mtv.x;
            car.y += satResult.mtv.y;
        }
    }
    */

    // Check collision between car and boundary with MTV
    checkCollisionWithMTV(car, boundary) {
        const carCorners = car.getCorners();
        return this.checkSATCollision(carCorners, boundary);
    }

    // Handle collision response with momentum preservation and damage
    handleCollisionResponse(car, collisionResult) {
        const { mtv } = collisionResult;

        // Apply MTV to separate car from boundary
        car.x += mtv.x;
        car.y += mtv.y;

        // Calculate collision damage/slowdown based on impact velocity
        const impactSpeed = Math.abs(car.velocity);
        // console.log(`Collision at speed: ${impactSpeed.toFixed(1)}`);
        const damageFactor = Math.min(impactSpeed / 40, 1.2); // More sensitive damage calculation

        // Calculate bounce-back effect once
        const mtvLength = Math.sqrt(mtv.x * mtv.x + mtv.y * mtv.y);
        // if (mtvLength > 0) {
        //     const normalX = mtv.x / mtvLength;
        //     const normalY = mtv.y / mtvLength;
        //     const velocityAlongNormal = car.velocity * (Math.cos(car.angle) * normalX + Math.sin(car.angle) * normalY);
        //     const bounceStrength = Math.min(impactSpeed / 3, 2.0); // Stronger 200% bounce
        //     console.log(`Bounce strength: ${bounceStrength.toFixed(2)}`);
        //     // car.velocity -= velocityAlongNormal * bounceStrength;
        // }
        car.velocity = car.velocity * (car.velocity > 0 ? -0.3 : -0.6); // bounce back

        // Then apply velocity reduction
        // car.velocity *= (1 - damageFactor * 0.8); // Stronger velocity reduction
        // console.log(`Post-collision velocity: ${car.velocity.toFixed(1)}`);
        // Reuse existing mtvLength variable
        // if (mtvLength > 0) {
        //     const normalX = mtv.x / mtvLength;
        //     const normalY = mtv.y / mtvLength;

        //     // Calculate velocity component along collision normal
        //     const velocityAlongNormal = car.velocity * (Math.cos(car.angle) * normalX + Math.sin(car.angle) * normalY);

        //     // Apply bounce-back (reverse velocity along normal) - more aggressive for better feel
        //     // Test settings - maximum bounce
        //     const bounceStrength = Math.min(impactSpeed / 2, 0.8); // Up to 80% bounce back
        //     console.log(`BOUNCE: ${bounceStrength.toFixed(2)} from impact ${impactSpeed.toFixed(1)}`);
        //     car.velocity -= velocityAlongNormal * bounceStrength;
        // }

        // // Reduce velocity based on damage, but preserve some momentum
        // const remainingVelocity = car.velocity * (1 - damageFactor * 0.6); // Keep 40% of velocity at max damage
        // car.velocity = remainingVelocity * 0.5; // Moderate additional reduction

        // // Add steering disruption for realistic effect
        // if (damageFactor > 0.3) {
        //     car.steeringAngle *= (1 - damageFactor * 0.2); // Reduce steering angle based on damage
        // }
    }

    // Legacy collision handler (kept for compatibility)
    handleCollision(car, boundary) {
        car.velocity = 0;
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

    getCorners() {
        // Return the four rotated corners of the car in world coordinates
        const halfLength = this.height / 2;
        const halfWidth = this.width / 2;

        // Four corners relative to car center, before rotation
        const corners = [
            { x: -halfLength, y: -halfWidth }, // top-left relative
            { x: halfLength, y: -halfWidth },  // top-right
            { x: halfLength, y: halfWidth },   // bottom-right
            { x: -halfLength, y: halfWidth }   // bottom-left
        ];

        // Rotate corners around origin
        const cosA = Math.cos(this.angle);
        const sinA = Math.sin(this.angle);
        const rotatedCorners = corners.map(corner => ({
            x: corner.x * cosA - corner.y * sinA,
            y: corner.x * sinA + corner.y * cosA
        }));

        // Translate to world position
        return rotatedCorners.map(corner => ({
            x: this.x + corner.x,
            y: this.y + corner.y
        }));
    }

    getBounds() {
        // Fallback AABB for legacy use (e.g., parking/exit checks)
        const corners = this.getCorners();
        const minX = Math.min(...corners.map(c => c.x));
        const maxX = Math.max(...corners.map(c => c.x));
        const minY = Math.min(...corners.map(c => c.y));
        const maxY = Math.max(...corners.map(c => c.y));

        return {
            left: minX,
            right: maxX,
            top: minY,
            bottom: maxY
        };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw car SVG image with proper scaling and positioning
        const drawX = -this.height / 2;
        const drawY = -this.width / 2;
        const drawWidth = this.height;
        const drawHeight = this.width;
        ctx.drawImage(this.image, drawX, drawY, drawWidth, drawHeight);

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