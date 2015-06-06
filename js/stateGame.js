//--------------------------------------------
// StateGame class
//    Core gameplay
//--------------------------------------------
var GRAVITY_X = 0;
var GRAVITY_Y = 0.0; //9.8;
var RENDER_SCALE = 100; // 100 pixels == 1 meter

var PUNCH_EXTEND_SPEED = 8.0;
var PUNCH_RETRACT_SPEED = 2.0;
var PUNCH_EXTEND_TICKS = 4;
var PUNCH_RETRACT_TICKS = 6;
var PUNCH_MAX_FORCE = 4;

var ROBOT_BODY_WIDTH = 40;
var ROBOT_BODY_HEIGHT = 20;
var ROBOT_ARM_WIDTH = 10;
var ROBOT_ARM_HEIGHT = 45;

var ROBOT_THRUST_IMPULSE = 0.02;

var StateGame = FlynnState.extend({

	init: function(mcp) {
		this._super(mcp);
		
		this.canvasWidth = mcp.canvas.ctx.width;
		this.canvasHeight = mcp.canvas.ctx.height;
		this.center_x = this.canvasWidth/2;
		this.center_y = this.canvasHeight/2;

		// this.ship = new Ship(Points.LANDER, 2.5,
		// 	ShipStartX,
		// 	ShipStartY,
		// 	ShipStartAngle, FlynnColors.YELLOW);

		// this.ship.visible = true;

		this.gameOver = false;
		this.lives = 3;
		// this.lifepolygon = new FlynnPolygon(Points.LANDER, FlynnColors.YELLOW);
		// this.lifepolygon.setScale(1.2);
		// this.lifepolygon.setAngle(0);

        this.viewport_v = new Victor(0,0);

		this.score = 0;
		this.highscore = this.mcp.highscores[0][1];
	
		// this.soundBonus = new Howl({
		// 	src: ['sounds/Bonus.ogg','sounds/Bonus.mp3'],
		// 	volume: 0.5,
		// });

		var names = this.mcp.input.getConfigurableVirtualButtonNames();
		this.controls = [];
		for(var i=0, len=names.length; i<len; i++){
			this.controls.push(names[i] + ' : ' + this.mcp.input.getVirtualButtonBoundKeyName(names[i]));
		}

		// Game Clock
		this.gameClock = 0;

		this.physics = new FlynnPhysics(mcp.canvas.ctx, GRAVITY_X, GRAVITY_Y, RENDER_SCALE);

		// Create some walls
		var WALL_THICKNESS = 10;
		// Left wall
		new FlynnBody(this.physics, { type: "static",
			x: (WALL_THICKNESS/2)/RENDER_SCALE,
			y: this.canvasHeight/2/RENDER_SCALE,
			height: this.canvasHeight/RENDER_SCALE,
			width: WALL_THICKNESS/RENDER_SCALE });
		// Right wall
		new FlynnBody(this.physics, { type: "static",
			x: (this.canvasWidth-WALL_THICKNESS/2)/RENDER_SCALE,
			y: this.canvasHeight/2/RENDER_SCALE,
			height: this.canvasHeight/RENDER_SCALE,
			width: WALL_THICKNESS/RENDER_SCALE });
		// Top Wall
		new FlynnBody(this.physics, { type: "static",
			x: this.canvasWidth/2/RENDER_SCALE,
			y: WALL_THICKNESS/2/RENDER_SCALE,
			height: WALL_THICKNESS/RENDER_SCALE,
			width: (this.canvasWidth-2*WALL_THICKNESS)/RENDER_SCALE });
		// Bottom Wall
		new FlynnBody(this.physics, { type: "static",
			x: this.canvasWidth/2/RENDER_SCALE,
			y: (this.canvasHeight-WALL_THICKNESS/2)/RENDER_SCALE,
			height: WALL_THICKNESS/RENDER_SCALE,
			width: (this.canvasWidth-2*WALL_THICKNESS)/RENDER_SCALE });
		

		var SPAWN_MARGIN = 50;
		for(var i = 0; i<0; i++){
			new FlynnBody(this.physics, {
				x: (SPAWN_MARGIN +  Math.random() * (this.canvasWidth  - 2*SPAWN_MARGIN))/RENDER_SCALE,
				y: (SPAWN_MARGIN +  Math.random() * (this.canvasHeight - 2*SPAWN_MARGIN))/RENDER_SCALE, shape:"circle" });
			new FlynnBody(this.physics, {
				x: (SPAWN_MARGIN +  Math.random() * (this.canvasWidth  - 2*SPAWN_MARGIN))/RENDER_SCALE,
				y: (SPAWN_MARGIN +  Math.random() * (this.canvasHeight - 2*SPAWN_MARGIN))/RENDER_SCALE});
		}

		this.robotBody = new FlynnBody(this.physics, {
				x: 200/RENDER_SCALE,
				y: 200/RENDER_SCALE,
				width: ROBOT_BODY_WIDTH/RENDER_SCALE,
				height: ROBOT_BODY_HEIGHT/RENDER_SCALE,
			}).body;
		leftArm = new FlynnBody(this.physics, {
				x: (200 - ROBOT_BODY_WIDTH/2 - ROBOT_ARM_WIDTH/2 -.1)/RENDER_SCALE,
				y: 200/RENDER_SCALE,
				width: ROBOT_ARM_WIDTH/RENDER_SCALE,
				height: ROBOT_ARM_HEIGHT/RENDER_SCALE,
			}).body;
		rightArm = new FlynnBody(this.physics, {
				x: (200 + ROBOT_BODY_WIDTH/2 + ROBOT_ARM_WIDTH/2 )/RENDER_SCALE,
				y: 200/RENDER_SCALE,
				width: ROBOT_ARM_WIDTH/RENDER_SCALE,
				height: ROBOT_ARM_HEIGHT/RENDER_SCALE,
			}).body;


		def = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
		def.Initialize(leftArm, this.robotBody,
			new b2Vec2((200-ROBOT_BODY_WIDTH/2)/RENDER_SCALE, 200/RENDER_SCALE),
			new b2Vec2(0,1));
		def.enableLimit = true;
		// def.lowerTranslation = -(ROBOT_ARM_HEIGHT/2 - ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
		// def.upperTranslation = (ROBOT_ARM_HEIGHT/2 - ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;		
		def.lowerTranslation = (ROBOT_ARM_HEIGHT/2 - ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
		def.upperTranslation = (ROBOT_ARM_HEIGHT/2 + ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
		def.enableMotor = false;
        def.maxMotorForce = PUNCH_MAX_FORCE;
        def.motorSpeed = 4.0;
		this.leftArmJoint = this.physics.world.CreateJoint(def);
		//this.leftArmJoint.EnableMotor(true);

		def = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
		def.Initialize(rightArm, this.robotBody,
			new b2Vec2((200+ROBOT_BODY_WIDTH/2)/RENDER_SCALE, 200/RENDER_SCALE),
			new b2Vec2(0,1));
		def.enableLimit = true;
		def.lowerTranslation = (ROBOT_ARM_HEIGHT/2 - ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
		def.upperTranslation = (ROBOT_ARM_HEIGHT/2 + ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
		def.enableMotor = false;
        def.maxMotorForce = PUNCH_MAX_FORCE;
        def.motorSpeed = 4.0;
		this.rightArmJoint  = this.physics.world.CreateJoint(def);

		// Ball
		new FlynnBody(this.physics, {
				x: this.canvasWidth/2/RENDER_SCALE,
				y: this.canvasHeight/2/RENDER_SCALE,
				shape:"circle",
				radius: .2
				});

		// Timers
		//this.mcp.timers.add('shipRespawnDelay', ShipRespawnDelayGameStartTicks, null);  // Start game with a delay (for start sound to finish)
		//this.mcp.timers.add('shipRespawnAnimation', 0, null);
		this.mcp.timers.add('PunchLeftExtend', 0);
		this.mcp.timers.add('PunchLeftRetract', 0);
		this.mcp.timers.add('PunchRightExtend', 0);
		this.mcp.timers.add('PunchRightRetract', 0);
	},


	addPoints: function(points, unconditional){
		// Points only count when not visible, unless unconditional
		// Unconditional is used for bonuses,etc. Which may be applied when not visible.
		if(this.ship.visible || unconditional){
			if(Math.floor(this.score / ExtraLifeScore) !== Math.floor((this.score + points) / ExtraLifeScore)){
				// Extra life
				this.lives++;
				this.soundExtraLife.play();
			}
			this.score += points;
		}

		// Update highscore if exceeded
		if (this.score > this.highscore){
			this.highscore = this.score;
		}
	},

	resetShip: function(){
		this.ship.world_x = ShipStartX;
		this.ship.world_y = ShipStartY;
		this.ship.angle = ShipStartAngle;
		this.ship.vel.x = 0;
		this.ship.vel.y = 0;
		this.ship.visible = true;
	},

	hideShip: function(){
		// Hide (but don't kill) the ship.
		// Used for idle time during level advancement.
		this.engine_sound.stop();
		this.engine_is_thrusting = false;
		this.ship.visible = false;
	},

	doShipDie: function(){
		// Visibility
		this.ship.visible = false;

		// Lives
		this.lives--;
		if(this.lives <= 0){
			this.gameOver = true;
			// this.mcp.timers.set('levelCompleteMessage', 0);
			// this.mcp.timers.set('levelBonusDelay', 0);
			// this.mcp.timers.set('levelBonus', 0);

		}

		// Sounds
		//this.engine_sound.stop();
		//this.soundPlayerDie.play();

		// Explosion
		// this.particles.explosion(
		// 	this.ship.world_x,
		// 	this.ship.world_y,
		// 	this.ship.vel.x,
		// 	this.ship.vel.y,
		// 	ShipNumExplosionParticles,
		// 	ShipExplosionMaxVelocity,
		// 	FlynnColors.YELLOW,
		// 	ParticleTypes.PLAIN);
		// this.particles.explosion(
		// 	this.ship.world_x,
		// 	this.ship.world_y,
		// 	this.ship.vel.x,
		// 	this.ship.vel.y,
		// 	ShipNumExplosionParticles / 2,
		// 	ShipExplosionMaxVelocity,
		// 	FlynnColors.YELLOW,
		// 	ParticleTypes.EXHAUST);
		
		// // Timers
		// this.mcp.timers.set('shipRespawnDelay', ShipRespawnDelayTicks);
		// this.mcp.timers.set('shipRespawnAnimation', 0); // Set to zero to deactivate it
	},

	handleInputs: function(input, paceFactor) {

		if(this.mcp.developerModeEnabled){
			// Metrics toggle
			if (input.virtualButtonIsPressed("dev_metrics")){
				this.mcp.canvas.showMetrics = !this.mcp.canvas.showMetrics;
			}

			// Toggle DEV pacing mode slow mo
			if (input.virtualButtonIsPressed("dev_slow_mo")){
				this.mcp.toggleDevPacingSlowMo();
			}

			// Toggle DEV pacing mode fps 20
			if (input.virtualButtonIsPressed("dev_fps_20")){
				this.mcp.toggleDevPacingFps20();
			}

			// Points
			if (input.virtualButtonIsPressed("dev_add_points")){
				this.addPoints(100);
			}

			// Die
			if (input.virtualButtonIsPressed("dev_die") && this.ship.visible){
				this.doShipDie();
			}
		}

		var angle, force, center, engine_v, center_v, engine_world_v;
		angle = this.robotBody.GetAngle() - Math.PI/2;
		force = ROBOT_THRUST_IMPULSE;
		center = this.robotBody.GetWorldCenter();
		center_v = new Victor(center.x, center.y);
		if(input.virtualButtonIsDown("thrust left")){
			engine_v = new Victor(-ROBOT_BODY_WIDTH/2/RENDER_SCALE, ROBOT_BODY_HEIGHT/2/RENDER_SCALE);
			engine_world_v = engine_v.clone().rotate((angle + Math.PI/2)).add(center_v);
			console.log(center_v, engine_v, engine_world_v);
			this.robotBody.ApplyImpulse({ x: Math.cos(angle)*force, y: Math.sin(angle)*force }, new b2Vec2(engine_world_v.x, engine_world_v.y));
		}
		if(input.virtualButtonIsDown("thrust right")){
			engine_v = new Victor(ROBOT_BODY_WIDTH/2/RENDER_SCALE, ROBOT_BODY_HEIGHT/2/RENDER_SCALE);
			engine_world_v = engine_v.clone().rotate((angle + Math.PI/2)).add(center_v);
			console.log(center_v, engine_v, engine_world_v);
			this.robotBody.ApplyImpulse({ x: Math.cos(angle)*force, y: Math.sin(angle)*force }, new b2Vec2(engine_world_v.x, engine_world_v.y));
		}

		if(input.virtualButtonIsPressed("punch left")){
			this.leftArmJoint.SetMotorSpeed(PUNCH_EXTEND_SPEED);
			this.leftArmJoint.EnableMotor(true);
			this.mcp.timers.set('PunchLeftExtend', PUNCH_EXTEND_TICKS);
		}
		if(this.mcp.timers.hasExpired('PunchLeftExtend')){
			this.leftArmJoint.SetMotorSpeed(-PUNCH_RETRACT_SPEED);
			this.mcp.timers.set('PunchLeftRetract', PUNCH_RETRACT_TICKS);
		}
		if(this.mcp.timers.hasExpired('PunchLeftExtend')){
			this.leftArmJoint.SetMotorSpeed(0);
			this.leftArmJoint.EnableMotor(false);
		}

		if(input.virtualButtonIsPressed("punch right")){
			this.rightArmJoint.SetMotorSpeed(PUNCH_EXTEND_SPEED);
			this.rightArmJoint.EnableMotor(true);
			this.mcp.timers.set('PunchRightExtend', PUNCH_EXTEND_TICKS);
		}
		if(this.mcp.timers.hasExpired('PunchRightExtend')){
			this.rightArmJoint.SetMotorSpeed(-PUNCH_RETRACT_SPEED);
			this.mcp.timers.set('PunchRightRetract', PUNCH_RETRACT_TICKS);
		}
		if(this.mcp.timers.hasExpired('PunchRightExtend')){
			this.rightArmJoint.SetMotorSpeed(0);
			this.rightArmJoint.EnableMotor(false);
		}

		
		// if(!this.ship.visible){
		// 	if (input.virtualButtonIsPressed("UI_enter")){
		// 		if (this.gameOver){
		// 			if(this.mcp.browserSupportsTouch){
		// 				// On touch devices just update high score and go back to menu
		// 				this.mcp.updateHighScores("NONAME", this.score);

		// 				this.mcp.nextState = States.MENU;
		// 			} else {
		// 				this.mcp.nextState = States.END;
		// 			}
		// 			this.mcp.custom.score = this.score;
		// 			return;
		// 		}
		// 	}
		// 	return;
		// }

		// if (input.virtualButtonIsDown("rotate left")){
		// 	this.ship.rotate_by(-ShipRotationSpeed * paceFactor);
		// }
		// if (input.virtualButtonIsDown("rotate right")){
		// 	this.ship.rotate_by(ShipRotationSpeed * paceFactor);
		// }

		// if (input.virtualButtonIsDown("thrust")){
		// 	this.thrustHasOccurred = true;
		// 	this.popUpThrustPending = false;
		// 	if(!this.engine_is_thrusting){
		// 		this.engine_sound.play();
		// 		this.engine_is_thrusting = true;
		// 	}
		// 	this.ship.vel.x += Math.cos(this.ship.angle - Math.PI/2) * ShipThrust * paceFactor;
		// 	this.ship.vel.y += Math.sin(this.ship.angle - Math.PI/2) * ShipThrust * paceFactor;
		// 	this.particles.exhaust(
		// 		this.ship.world_x + Math.cos(this.ship.angle + Math.PI/2) * ShipToExhastLength - 1,
		// 		this.ship.world_y + Math.sin(this.ship.angle + Math.PI/2) * ShipToExhastLength,
		// 		this.ship.vel.x,
		// 		this.ship.vel.y,
		// 		ShipExhaustRate,
		// 		ShipExhaustVelocity,
		// 		this.ship.angle + Math.PI/2,
		// 		ShipExhaustSpread,
		// 		paceFactor
		// 	);

		// 	// Cancel PopUp
		// 	if(this.popUpThrustActive){
		// 		this.popUpLife = Math.min(PopUpCancelTime, this.popUpLife);
		// 	}
		// } else {
		// 	if (this.engine_is_thrusting){
		// 		this.engine_sound.stop();
		// 		this.engine_is_thrusting = false;
		// 	}
		// }
	},

	update: function(paceFactor) {
		this.gameClock += paceFactor;
		this.physics.update(paceFactor);
	},

	render: function(ctx){
		//ctx.clearAll();
		this.physics.render(ctx);

		//------------
		// Text
		//------------
		var y = 50;
		var x = 50;
		for(var i = 0, len = this.controls.length; i<len; i++){
			ctx.vectorText(this.controls[i], 2, x, y, null, FlynnColors.GRAY);
			y += 20;
		}

		// Game Over
		if(this.gameOver){
			ctx.vectorText("GAME OVER", 6, null, 200, null, FlynnColors.CYAN);
			ctx.vectorText("PRESS <ENTER>", 2, null, 250, null, FlynnColors.CYAN);
		}
	}
});