class Anchor {
	constructor(value) {
		this.value = value;
		this.velocity = 0;
		this.desired = this.value;
		this.friction = 0.5; // smaller = less bounce
		this.acceleration = 0.5; // larger = more snappy
		this.blocked = false;
	}
	update() {
		var delta = this.desired - this.value;
		this.velocity += delta * this.friction;
		this.velocity *= this.acceleration;
		this.value += this.velocity;
	}
}