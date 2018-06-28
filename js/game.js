class Game {
	constructor(width, height) {
		this.map = new Map(width, height);
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