class MapCell {
	constructor(type) {
		// the type of cell
		this.type = type;
		// the path value of this cell indicating the order stepped on by the player
		this.value = -1;
	}
}
MapCell.Type = {};
MapCell.Type.WALL = -1;
MapCell.Type.EMPTY = 0;
MapCell.Type.STAR = 1;

class Map {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		
		var coverage = 0.5;
		do {
			this.initialize();
		} while(this.maxValue < this.width*this.height*coverage);

		var starList = [];
		while(starList.length < 3) {
			var value = Math.floor(Math.random()*(this.maxValue-2)+2);
			if(starList.indexOf(value) == -1) {
				starList.push(value);
			}
		}
		starList.sort((a, b) => {return a > b;});

		for(var y=0;y<this.height;y++) {
			for(var x=0;x<this.width;x++) {
				var cell = this.cellAt(x, y);
				if(cell.value == -1) {
					cell.type = MapCell.Type.WALL;
				}
				else {
					if(cell.value == 1) {
						this.player.x = x;
						this.player.y = y;
					}
					else {
						var starIndex = starList.indexOf(cell.value) + 1;
						if(starIndex > 0) {
							cell.type = MapCell.Type.STAR;
							cell.order = starIndex;
						}
						cell.value = -1;
					}
				}
			}
		}

		this.stars = [];
		
		this.finished = false;

		this.updatePlayerConstraints();
	}

	initialize() {
		this.maxValue = 0;
		this.finished = false;
		this.data = [];
		var x, y;
		for(y=0;y<this.height;y++) {
			var row = [];
			for(x=0;x<this.width;x++) {
				row.push(new MapCell(MapCell.Type.EMPTY));
			}
			this.data.push(row);
		}

		var randomWalls = Math.random()*8;
		// note: it's possible we pick the same cell multiple times when creating walls
		for(var i=0;i<randomWalls+1;i++) {
			x = Math.floor(Math.random()*this.width);
			y = Math.floor(Math.random()*this.height);
			this.cellAt(x, y).type = MapCell.Type.WALL;
		}
		this.cellAt(x, y).type = MapCell.Type.EMPTY;
		this.cellAt(x, y).value = 1;
		this.player = new Box(x, y);

		while(this.moveRandomly()) {

		}

		this.maxValue = this.cellAtPlayer().value;

	}

	/*loadData(data) {
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
	}*/

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