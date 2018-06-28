var game = null;
var canvas = null;
$(document).ready(() => {
	canvas = $('#canvas');
	var ctx = canvas[0].getContext('2d');

	var cellSize = 0;
	var width = canvas.width();
	var height = canvas.height();

	// todo: consider using elixir for procedural generation of maps


	game = null;

	init();

	var mouseX = 0;
	var mouseY = 0;
	var mouseActive = false;

	var mouseUnlocked = false;
	var mouseUnlockDistance = 1.8;

	$('body').on('mousemove', e => {
		var rect = canvas[0].getBoundingClientRect();

		var actualMouseX = (e.clientX - rect.left - window.scrollX);
		var actualMouseY = (e.clientY - rect.top - window.scrollY);

		if(actualMouseX < 0 || actualMouseY < 0 || actualMouseX > width || actualMouseY > height) {
			mouseActive = false;
		}
		else {
			// we need to unlock the mouse by nearing it at least once
			if(!mouseUnlocked) {
				var actualDeltaX = actualMouseX - game.map.player.centerX()*cellSize;
				var actualDeltaY = actualMouseY - game.map.player.centerY()*cellSize;
				var actualDelta = Math.sqrt((actualDeltaX*actualDeltaX) + (actualDeltaY*actualDeltaY));
				if(actualDelta < cellSize*mouseUnlockDistance) {
					mouseUnlocked = true;
				}
			}

			// after which point, we can continue to use it from any distance
			if(mouseUnlocked) {
				mouseX = actualMouseX/cellSize;
				mouseY = actualMouseY/cellSize;
				mouseActive = true;
			}
			resetUpdateTimeout();
		}

	});

	// snap back to square size on mobile when finger is released
	$('body').on('mouseup', e => {
		mouseActive = false;
		resetUpdateTimeout();
	});

	// keyboard input
	
	$('body').on('keydown', e => {
		if(e.key == 'ArrowLeft') {
			game.map.moveLeft();
		}
		else if(e.key == 'ArrowRight') {
			game.map.moveRight();
		}
		else if(e.key == 'ArrowUp') {
			game.map.moveUp();
		}
		else if(e.key == 'ArrowDown') {
			game.map.moveDown();
		}
		else {
			return;
		}
		// todo: keystroke to rewind one? rewind all? reset/new?
		mouseActive = false;
		resetUpdateTimeout();
	});
	

	var fps = 50;
	var fpsWait = 1000/fps;
	var maxWaitBeforePausing = 1000;

	var rewindSpeed = 0;

	var pauseCounter = 0;
	var updateInterval = null;
	function resetUpdateTimeout() {
		pauseCounter = 0;
		if(updateInterval == null) {
			updateInterval = setInterval(update, fpsWait);
			update();
		}
	}


	function incrementUpdateTimeout() {
		pauseCounter += fpsWait;
		if(pauseCounter >= maxWaitBeforePausing) {
			clearInterval(updateInterval);
			updateInterval = null;
		}
	}

	// todo: as we rewind, we should go faster the further away we are
	// so that it snaps back elastically
	function resetGame() {
		// can rewind speed be set each time to game.map.cellAtPlayer().value * const?
		rewindSpeed = Math.max(80 - game.map.cellAtPlayer().value, 0);
		rewinding = true;
		mouseUnlocked = false;
		resetUpdateTimeout();
	}

	function newGame() {
		var size = Math.floor(Math.random()*3) + 6;
		game = new Game(size, size);
		cellSize = width/size;
		mouseUnlocked = false;
		resetUpdateTimeout();
	}
	newGame();

	// todo: animations for stars
	// todo: nice keyboard input?

	var moveTimer = 0;
	var rewinding = false;
	function update() {

		
		// todo: start player where they finished last map
			// if map changes size how do we handle that?


		// todo: use contours as a measure of difficulty instead of just open space
		if(rewinding) {
			if(moveTimer > 0) {
				moveTimer--;
			}
			else {
				if(!game.map.moveBackwards()) {

					rewinding = false;
				}
				else {

					if(rewindSpeed > 0) {
						var value = game.map.cellAtPlayer().value;
						var maxValue = game.map.maxValue;

						rewindSpeed = 30*(1.0 - value/maxValue) + 10;
					}
					moveTimer = rewindSpeed/fpsWait;
				}
			}
			
			game.update(0, 0);

			resetUpdateTimeout();
			mouseActive = false;
		}
		else {

			// normal game loop, accepting user input

			if(game.map.finished) {

				// perhaps we can go into a different mode for finishing?
				for(var i=0;i<game.map.height;i++) {
					for(var j=0;j<game.map.width;j++) {
						var cell = game.map.cellAt(j, i);
						if(cell.type != MapCell.Type.WALL) {
							cell.value -= 1;
							if(cell.value <= 0) {
								cell.type = MapCell.Type.WALL;
							}
						}
					}
				}

				mouseActive = false;
				// todo: deactivate motion better across the board

				game.map.maxValue--;
				resetUpdateTimeout();
				if(game.map.maxValue <= 1) {
					newGame();
				}

				// todo: finishing a level?
				// if we satisfy some win condition, lock and animate-out, then reset
				// should clicking reset allow you to skip this animation?
			}

			if(mouseActive) {
				var dX = mouseX - game.map.player.centerX();
				var dY = mouseY - game.map.player.centerY();
				game.update(dX, dY);
			}
			else {
				game.update(0, 0);
			}
		}
		
		game.draw(ctx, cellSize);
		incrementUpdateTimeout();
	}
	resetUpdateTimeout();

	$('#reset-button').on('mouseup', resetGame);
	$('#new-button').on('mouseup', newGame);
});



// so right now update is being invoked at 50 fps
// instead what we'd like is
// any time there's input
// if paused, unpause, update immediately
// regardless, set timer to pause back to 0