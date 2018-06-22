class Box {
	// box coordinates are in cell units
	// should we stick with pixel coordinates?
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.left = new Anchor(this.leftSide());
		this.top = new Anchor(this.topSide());
		this.right = new Anchor(this.rightSide());
		this.bottom = new Anchor(this.bottomSide());
	}
	
	setAcceleration(acceleration) {
		this.left.acceleration = this.top.acceleration = this.right.acceleration = this.bottom.acceleration = acceleration;
	}
	
	setFriction(friction) {
		this.left.friction = this.top.friction = this.right.friction = this.bottom.friction = friction;
	}

	leftSide() {
		return this.x;
	}
	rightSide() {
		return (this.x+1);
	}
	topSide() {
		return this.y;
	}
	bottomSide() {
		return (this.y+1);
	}
	centerX() {
		return (this.x+0.5);
	}
	centerY() {
		return (this.y+0.5);
	}
	
	update() {
		this.left.update();
		this.top.update();
		this.right.update();
		this.bottom.update();

		// update anchor value limits when player is blocked	
		if(this.left.blocked) {
			this.left.value = Math.max(this.left.value, this.leftSide());
		}
		if(this.right.blocked) {
			this.right.value = Math.min(this.right.value, this.rightSide());
		}
		if(this.top.blocked) {
			this.top.value = Math.max(this.top.value, this.topSide());
		}
		if(this.bottom.blocked) {
			this.bottom.value = Math.min(this.bottom.value, this.bottomSide());
		}
	}
	
	draw(ctx, cellSize) {
		ctx.fillRect(this.left.value*cellSize, 
			this.top.value*cellSize, 
			this.right.value*cellSize-this.left.value*cellSize, 
			this.bottom.value*cellSize-this.top.value*cellSize);
	}
}