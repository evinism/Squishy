class MapCell {
	constructor(type) {
		this.type = type;
		this.value = -1;
	}
}
MapCell.Type = {};
MapCell.Type.WALL = -1;
MapCell.Type.EMPTY = 0;
MapCell.Type.STAR = 1;

class Map {
	constructor(data) {
		this.loadData(data);
		this.stars = [];
		this.maxValue = 0;
		this.finished = false;
	}

	loadData(data) {
		this.player = null;
		this.data = null;
		this.height = data.length;
		// height must be greater than 0
		if(this.height == 0) {
			return false;
		}
		// width must be greater than 0
		this.width = data[0].length;
		if(this.width == 0) {
			return false;
		}
		this.data = [];
		for(var i=0;i<this.height;i++) {
			// all rows must have the same width
			if(data[i].length != this.width) {
				return false;
			}
			var row = [];
			for(var j=0;j<this.width;j++) {
				if(data[i][j] == 'x') {
					// there must not be more than one player
					if(this.player != null) {
						return false;
					}
					this.player = new Box(j, i);
					var cell = new MapCell(MapCell.Type.EMPTY);
					cell.value = 1;
					row.push(cell);
				}
				else if(data[i][j] == -1) {
					row.push(new MapCell(MapCell.Type.WALL));
				}
				else if(data[i][j] == 0) {
					row.push(new MapCell(MapCell.Type.EMPTY));
				}
				else {
					var cell = new MapCell(MapCell.Type.STAR);
					cell.order = data[i][j];
					row.push(cell);

				}
			}
			this.data.push(row);
		}
		
		// there must be one player
		if(this.player == null) {
			return false;
		}
		this.updatePlayerConstraints();
		return true;
	}

	// retrieve map cells
	cellAt(x, y) {
		if(x < 0 || y < 0 || x >= this.width || y >= this.height) {
			return null;
		}
		return this.data[y][x];
	}

	cellAtPlayer() {
		return this.cellAt(this.player.x, this.player.y);
	}

	// todo: canMoveTo(cell)
	// e.g. canMoveTo(left) && left.value > 0

	// check if player can move to location
	canMoveTo(x, y) {
		if(this.finished) {
			return false;
		}

		var absX = Math.abs(x-this.player.x);
		var absY = Math.abs(y-this.player.y);
		if(absX > 1 || absY > 1 || absX+absY != 1) {
			return false;
		}
		var from = this.cellAtPlayer();
		if(from == null) {
			return false;
		}
		var to = this.cellAt(x, y);
		if(to == null) {
			return false;
		}
		if(to.type == MapCell.Type.WALL) {
			return false;
		}
		return (to.value == from.value-1 || 
			to.value == -1);
	}

	canMoveLeft() {
		return this.canMoveTo(this.player.x-1, this.player.y);
	}

	canMoveRight() {
		return this.canMoveTo(this.player.x+1, this.player.y);
	}

	canMoveUp() {
		return this.canMoveTo(this.player.x, this.player.y-1);
	}

	canMoveDown() {
		return this.canMoveTo(this.player.x, this.player.y+1);
	}

	moveTo(x, y) {
		if(!this.canMoveTo(x, y)) {
			return false;
		}
		var from = this.cellAtPlayer();
		var to = this.cellAt(x, y);
		if(to.value == from.value-1 && to.value > 0) {
			from.value = -1;
			if(from.type == MapCell.Type.STAR) {
				this.unearnStar(from.order);
			}
		}
		else {
			to.value = from.value+1;
			if(to.type == MapCell.Type.STAR) {
				// todo: figure out rules for stars
				// i think the challenge should be to get them in order, right?
				// so if you get 1, then 3... 1 counts for sure, does 3? either way, 2 is disqualified
				// if you run over 2 first, you disqualify 1.. do you still keep 2?
				this.earnStar(to.order);
			}
		}

		this.player.x = x;
		this.player.y = y;
		this.updatePlayerConstraints();

		if(this.maxValue > 0 && this.cellAtPlayer().value >= this.maxValue) {
			this.finished = true;
		}
		return true;
	}

	moveLeft() {
		if(!this.canMoveLeft()) {
			return false;
		}
		this.moveTo(this.player.x-1, this.player.y);
		return true;
	}

	moveRight() {
		if(!this.canMoveRight()) {
			return false;
		}
		this.moveTo(this.player.x+1, this.player.y);
		return true;
	}

	moveUp() {
		if(!this.canMoveUp()) {
			return false;
		}
		this.moveTo(this.player.x, this.player.y-1);
		return true;
	}

	moveDown() {
		if(!this.canMoveDown()) {
			return false;
		}
		this.moveTo(this.player.x, this.player.y+1);
		return true;
	}

	moveBackwards() {
		if(this.canMoveLeft() && this.cellAt(this.player.x-1, this.player.y).value > -1) {
			return this.moveLeft();
		}
		else if(this.canMoveRight() && this.cellAt(this.player.x+1, this.player.y).value > -1) {
			return this.moveRight();
		}
		else if(this.canMoveUp() && this.cellAt(this.player.x, this.player.y-1).value > -1) {
			return this.moveUp();
		}
		else if(this.canMoveDown() && this.cellAt(this.player.x, this.player.y+1).value > -1) {
			return this.moveDown();
		}
		else {
			return false;
		}
	}


	moveRandomly() {
		var options = [];
		if(this.canMoveLeft() && this.cellAt(this.player.x-1, this.player.y).value == -1) {
			options.push({x:-1, y:0});
		}
		if(this.canMoveRight() && this.cellAt(this.player.x+1, this.player.y).value == -1) {
			options.push({x:1, y:0});
		}
		if(this.canMoveUp() && this.cellAt(this.player.x, this.player.y-1).value == -1) {
			options.push({x:0, y:-1});
		}
		if(this.canMoveDown() && this.cellAt(this.player.x, this.player.y+1).value == -1) {
			options.push({x:0, y:1});
		}
		if(options.length == 0) {
			return false;
		}
		// select randomly
		var choice = options[Math.floor(Math.random()*options.length)];
		return this.moveTo(this.player.x+choice.x, this.player.y+choice.y);
	}

	// invoke when player moves, in order to provide player with new constraints
	updatePlayerConstraints() {
		this.player.left.blocked = !this.canMoveLeft();
		this.player.right.blocked = !this.canMoveRight();
		this.player.top.blocked = !this.canMoveUp();
		this.player.bottom.blocked = !this.canMoveDown();
	}

	lastStarRank() {
		if(this.stars.length == 0) {
			return 0;
		}
		return this.stars[this.stars.length-1];
	}

	earnedStar(order) {
		return (this.stars.indexOf(order) > -1);
	}

	earnStar(order) {
		if(this.lastStarRank() < order) {
			this.stars.push(order);
			return true;
		}
		return false;
	}

	unearnStar(order) {
		if(this.lastStarRank() == order) {
			this.stars = this.stars.slice(0, this.stars.length-1);
			return true;
		}
		return false;
	}
}

class Game {
	constructor(data) {
		this.map = new Map(data);
	}

	// update with new mouse drag
	update(dX, dY) {
		var dTheta = Math.atan2(dY, dX);
		
		// if other events have updated the game state, we should update player constraints
		//game.updatePlayerConstraints();


		// extinguish any dX/dY value that runs the player into a wall
		if(this.map.player.left.blocked) {
			dX = Math.max(dX, 0);
		}
		if(this.map.player.top.blocked) {
			dY = Math.max(dY, 0);
		}
		if(this.map.player.right.blocked) {
			dX = Math.min(dX, 0);
		}
		if(this.map.player.bottom.blocked) {
			dY = Math.min(dY, 0);
		}
		
		// if we extend 40% into the next cell, perform a move
		var snapFactor = 1.4;
		if(dX > 0.5*snapFactor) {
			this.map.moveRight();
		}
		else if(dX < -0.5*snapFactor) {
			this.map.moveLeft();
		}
		
		if(dY > 0.5*snapFactor) {
			this.map.moveDown();
		}
		else if(dY < -0.5*snapFactor) {
			this.map.moveUp();
		}

		// modify dX and dY based on some factor to increase stretch 
		var stretchFactor = 1.1;
		if(dX != 0) {
			var cosTheta = Math.abs(Math.cos(dTheta));
			dX = Math.min(Math.pow(dX, 2) *stretchFactor*cosTheta, 0.75) * dX/Math.abs(dX);
		}
		if(dY != 0) {
			var sinTheta = Math.abs(Math.sin(dTheta));
			dY = Math.min(Math.pow(dY, 2) *stretchFactor*sinTheta, 0.75) * dY/Math.abs(dY);
		}
		
		// neutralize smaller stretching force
		var lockDirection = true;
		if(lockDirection) {
			if(Math.abs(dX) > Math.abs(dY)) {
				dY = 0;
			}
			else {
				dX = 0;
			}
		}
		
		// set desired square bounds and adjust with stretching values
		this.map.player.left.desired = this.map.player.leftSide();
		this.map.player.top.desired = this.map.player.topSide();
		this.map.player.right.desired = this.map.player.rightSide();
		this.map.player.bottom.desired = this.map.player.bottomSide();

		if(dX > 0) {
			this.map.player.right.desired += dX;
		}
		else if(dX < 0) {
			this.map.player.left.desired += dX;
		}
		if(dY > 0) {
			this.map.player.bottom.desired += dY;
		}
		else if(dY < 0) {
			this.map.player.top.desired += dY;
		}

		this.map.player.update();
	}

	draw(ctx, cellSize) {
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, this.map.width*cellSize, this.map.height*cellSize);
		
		ctx.lineWidth = 1.0;
		ctx.strokeStyle = 'black';
		for(var i=0;i<=Math.max(this.width*cellSize, this.height*cellSize);i+=cellSize) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, this.height*cellSize);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, i);
			ctx.lineTo(this.width*cellSize, i);
			ctx.stroke();
		}
		
		var maxValue = this.map.cellAtPlayer().value;

		for(var i=0;i<this.map.height;i++) {
			for(var j=0;j<this.map.width;j++) {
				var cell = this.map.cellAt(j, i);
				if(cell.type == MapCell.Type.WALL) {
					ctx.fillStyle = 'black';
					ctx.fillRect(j*cellSize, i*cellSize, cellSize, cellSize);
				}
				else if(cell.value > 0) {
					// we should say the last, say, 5 values are 100, 95, 90, 85, 80
					// and the rest are 80 to 50 in a gradient?
					var alpha = 0.5;
					if(maxValue - cell.value < 5) {
						alpha = 1.0 - (maxValue - cell.value)*0.1;
					}
					else {
						// todo: for long streaks can we have it do something log-related?
						alpha = 0.25 + (cell.value / (maxValue-4)) * 0.25;
					}

					// todo: can we highlight obtained stars as orange squares?
					if(cell.type == MapCell.Type.STAR && this.map.earnedStar(cell.order)) {
						var orangeAlpha = 1.0 - (1.0-alpha)*0.3;
						ctx.fillStyle = 'rgba(255,190,0,'+orangeAlpha+')';
					}
					else {
						ctx.fillStyle = 'rgba(1,205,239,'+alpha+')';
					}

					ctx.fillRect(j*cellSize, i*cellSize, cellSize, cellSize);
				}
				else if(cell.type == MapCell.Type.STAR) {
					var eligible = (cell.order > this.map.lastStarRank());
					var color = eligible ? 'rgba(255,190,0,1.0)' : 'rgba(255,190,0,0.3)';
					//var margin = 0.08*(4-cell.order);
					//ctx.fillRect((j+margin)*cellSize, (i+margin)*cellSize, (1.0-margin*2)*cellSize, (1.0-margin*2)*cellSize);
					//var margin = Math.floor(cellSize*0.09)*(4-cell.order);
					//ctx.fillRect(j*cellSize+margin, i*cellSize+margin, cellSize-margin*2, cellSize-margin*2);
					if(cell.order == 1) {
						this.drawOneStar(ctx, color, j, i, cellSize);
					}
					else if(cell.order == 2) {
						this.drawTwoStars(ctx, color, j, i, cellSize);
					}
					else if(cell.order == 3) {
						this.drawThreeStars(ctx, color, j, i, cellSize);
					}
				}
			}
		}
		
		//ctx.fillStyle = '#01cdef';
		//box2.draw(ctx);
		ctx.fillStyle = '#0199f8';
		this.map.player.draw(ctx, cellSize);
	}

	drawStar(ctx, color, x, y, points, major, minor) {
		ctx.fillStyle = color;

		ctx.beginPath();
		ctx.moveTo(x, y-major);

		for(var i=1;i<=points*2;i++) {
			var angle = -Math.PI/2 + (i/points/2)*Math.PI*2;
			var length = (i%2 == 0) ? major : minor;
			ctx.lineTo(x+Math.cos(angle)*length, y+Math.sin(angle)*length);
		}
		ctx.fill();
	}

	drawOneStar(ctx, color, x, y, cellSize) {
		this.drawStar(ctx, color, (x+0.5)*cellSize, (y+0.55)*cellSize, 5, 0.5*cellSize, 0.25*cellSize);
	}

	drawTwoStars(ctx, color, x, y, cellSize) {
		this.drawStar(ctx, color, (x+0.66)*cellSize, (y+0.325)*cellSize, 5, 0.3*cellSize, 0.15*cellSize);
		this.drawStar(ctx, color, (x+0.34)*cellSize, (y+0.725)*cellSize, 5, 0.3*cellSize, 0.15*cellSize);
	}

	drawThreeStars(ctx, color, x, y, cellSize) {
		this.drawStar(ctx, color, (x+0.475)*cellSize, (y+0.3)*cellSize, 5, 0.25*cellSize, 0.125*cellSize);
		this.drawStar(ctx, color, (x+0.275)*cellSize, (y+0.725)*cellSize, 5, 0.25*cellSize, 0.125*cellSize);
		this.drawStar(ctx, color, (x+0.725)*cellSize, (y+0.65)*cellSize, 5, 0.25*cellSize, 0.125*cellSize);
	}
}