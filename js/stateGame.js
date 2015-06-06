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

var ROBOT_START_X = 100;
var ROBOT_START_Y = 320;
var ROBOT_BODY_WIDTH = 40;
var ROBOT_BODY_HEIGHT = 20;
var ROBOT_ARM_WIDTH = 10;
var ROBOT_ARM_HEIGHT = 45;
var ROBOT_THRUST_IMPULSE = 0.04;
var ROBOT_ANGULAR_IMPULSE = 2.0;
var ROBOT_COLOR = FlynnColors.BLUE;
var ROBOT_ANGULAR_IMPULSE_LIMIT = 5.0;
var ROBOT_ROTATE_RATE = 4.5;

var BALL_COLOR = FlynnColors.GREEN;
var BALL_RADIUS = 20;

var WALL_THICKNESS = 10;
var BARRIER_COLOR = null;

var GOAL_SIZE = 100;
var GOAL_X = 1024 - 140;
var GOAL_Y = 768/2 - GOAL_SIZE/2;
var GOAL_COLOR = "#004000";

var BUMPER_LENGTH = 240;
var BUMPER_THICKNESS = 10;
var BUMPER_MARGIN = 190;
var BUMPER_COLOR = FlynnColors.GRAY;

var StateGame = FlynnState.extend({

	init: function(mcp) {
		this._super(mcp);
		
		this.canvasWidth = mcp.canvas.ctx.width;
		this.canvasHeight = mcp.canvas.ctx.height;
		this.center_x = this.canvasWidth/2;
		this.center_y = this.canvasHeight/2;

		this.gameOver = false;

        this.viewport_v = new Victor(0,0);

		this.goalsRemaining = 3;
		this.highscore = this.mcp.highscores[0][1];
		this.rotationDampenPending = false;
	
		this.soundBounce = new Howl({
			src: ['sounds/Blocked.ogg','sounds/Blocked.mp3'],
			volume: 0.5,
		});
		this.soundScore = new Howl({
			src: ['sounds/Tripple_blip.ogg','sounds/Tripple_blip.mp3'],
			volume: 0.5,
		});

		var names = this.mcp.input.getConfigurableVirtualButtonNames();
		this.controls = [];
		for(var i=0, len=names.length; i<len; i++){
			this.controls.push(names[i] + ' : ' + this.mcp.input.getVirtualButtonBoundKeyName(names[i]));
		}

		// Game Clock
		this.gameClock = 0;

		this.physics = new FlynnPhysics(mcp.canvas.ctx, GRAVITY_X, GRAVITY_Y, RENDER_SCALE);

		//-------------------
		// Playfield Barriers
		//-------------------
		// Left Barrier
		new FlynnBody(this.physics, { type: "static",
			x: (WALL_THICKNESS/2)/RENDER_SCALE,
			y: this.canvasHeight/2/RENDER_SCALE,
			height: this.canvasHeight/RENDER_SCALE,
			width: WALL_THICKNESS/RENDER_SCALE,
			color: BARRIER_COLOR,
			});
		// Right Barrier
		new FlynnBody(this.physics, { type: "static",
			x: (this.canvasWidth-WALL_THICKNESS/2)/RENDER_SCALE,
			y: this.canvasHeight/2/RENDER_SCALE,
			height: this.canvasHeight/RENDER_SCALE,
			width: WALL_THICKNESS/RENDER_SCALE,
			color: BARRIER_COLOR,
			});
		// Top Barrier
		new FlynnBody(this.physics, { type: "static",
			x: this.canvasWidth/2/RENDER_SCALE,
			y: WALL_THICKNESS/2/RENDER_SCALE,
			height: WALL_THICKNESS/RENDER_SCALE,
			width: (this.canvasWidth-2*WALL_THICKNESS)/RENDER_SCALE,
			color: BARRIER_COLOR,
			});
		// Bottom Barrier
		new FlynnBody(this.physics, { type: "static",
			x: this.canvasWidth/2/RENDER_SCALE,
			y: (this.canvasHeight-WALL_THICKNESS/2)/RENDER_SCALE,
			height: WALL_THICKNESS/RENDER_SCALE,
			width: (this.canvasWidth-2*WALL_THICKNESS)/RENDER_SCALE,
			color: BARRIER_COLOR,
			});
	
		

		//--------------
		// Bumpers
		//--------------
		// Left Bumper
		new FlynnBody(this.physics, { type: "static",
			x: (BUMPER_MARGIN + BUMPER_THICKNESS/2)/RENDER_SCALE,
			y: this.canvasHeight/2/RENDER_SCALE,
			height: BUMPER_LENGTH/RENDER_SCALE,
			width: BUMPER_THICKNESS/RENDER_SCALE,
			color: BUMPER_COLOR,
			});
		// // Right Bumper
		new FlynnBody(this.physics, { type: "static",
			x: (this.canvasWidth - BUMPER_MARGIN - BUMPER_THICKNESS/2)/RENDER_SCALE,
			y: this.canvasHeight/2/RENDER_SCALE,
			height: BUMPER_LENGTH/RENDER_SCALE,
			width: BUMPER_THICKNESS/RENDER_SCALE,
			color: BUMPER_COLOR,
			});
		// // Top Bumper
		new FlynnBody(this.physics, { type: "static",
			x: this.canvasWidth/2/RENDER_SCALE,
			y: (BUMPER_MARGIN + BUMPER_THICKNESS/2)/RENDER_SCALE,
			height: BUMPER_THICKNESS/RENDER_SCALE,
			width: BUMPER_LENGTH/RENDER_SCALE,
			color: BUMPER_COLOR,
			});
		// // Bottom Bumper
		new FlynnBody(this.physics, { type: "static",
			x: this.canvasWidth/2/RENDER_SCALE,
			y: (this.canvasHeight - BUMPER_MARGIN - BUMPER_THICKNESS/2)/RENDER_SCALE,
			height: BUMPER_THICKNESS/RENDER_SCALE,
			width: BUMPER_LENGTH/RENDER_SCALE,
			color: BUMPER_COLOR,
			});
		

		//var SPAWN_MARGIN = 50;
		// for(var i = 0; i<0; i++){
		// 	new FlynnBody(this.physics, {
		// 		x: (SPAWN_MARGIN +  Math.random() * (this.canvasWidth  - 2*SPAWN_MARGIN))/RENDER_SCALE,
		// 		y: (SPAWN_MARGIN +  Math.random() * (this.canvasHeight - 2*SPAWN_MARGIN))/RENDER_SCALE, shape:"circle" });
		// 	new FlynnBody(this.physics, {
		// 		x: (SPAWN_MARGIN +  Math.random() * (this.canvasWidth  - 2*SPAWN_MARGIN))/RENDER_SCALE,
		// 		y: (SPAWN_MARGIN +  Math.random() * (this.canvasHeight - 2*SPAWN_MARGIN))/RENDER_SCALE});
		// }

		this.robotBody = new FlynnBody(this.physics, {
				x: ROBOT_START_X/RENDER_SCALE,
				y: ROBOT_START_Y/RENDER_SCALE,
				width: ROBOT_BODY_WIDTH/RENDER_SCALE,
				height: ROBOT_BODY_HEIGHT/RENDER_SCALE,
				color: ROBOT_COLOR,
				fixedRotation: true,
			}).body;
		this.leftArm = new FlynnBody(this.physics, {
				x: (ROBOT_START_X - ROBOT_BODY_WIDTH/2 - ROBOT_ARM_WIDTH/2 - 0.1)/RENDER_SCALE,
				y: ROBOT_START_Y/RENDER_SCALE,
				width: ROBOT_ARM_WIDTH/RENDER_SCALE,
				height: ROBOT_ARM_HEIGHT/RENDER_SCALE,
				color: ROBOT_COLOR,
				// fixedRotation: true,
			}).body;
		this.rightArm = new FlynnBody(this.physics, {
				x: (ROBOT_START_X + ROBOT_BODY_WIDTH/2 + ROBOT_ARM_WIDTH/2 )/RENDER_SCALE,
				y: ROBOT_START_Y/RENDER_SCALE,
				width: ROBOT_ARM_WIDTH/RENDER_SCALE,
				height: ROBOT_ARM_HEIGHT/RENDER_SCALE,
				color: ROBOT_COLOR,
				// fixedRotation: true,
			}).body;


		def = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
		def.Initialize(this.leftArm, this.robotBody,
			new b2Vec2((ROBOT_START_X-ROBOT_BODY_WIDTH/2)/RENDER_SCALE, ROBOT_START_Y/RENDER_SCALE),
			new b2Vec2(0,1));
		def.enableLimit = true;
		def.lowerTranslation = (ROBOT_ARM_HEIGHT/2 - ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
		def.upperTranslation = (ROBOT_ARM_HEIGHT/2 + ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
		def.enableMotor = true;
        def.maxMotorForce = PUNCH_MAX_FORCE;
        def.motorSpeed = -PUNCH_RETRACT_SPEED;
		this.leftArmJoint = this.physics.world.CreateJoint(def);

		def = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
		def.Initialize(this.rightArm, this.robotBody,
			new b2Vec2((ROBOT_START_X+ROBOT_BODY_WIDTH/2)/RENDER_SCALE, ROBOT_START_Y/RENDER_SCALE),
			new b2Vec2(0,1));
		def.enableLimit = true;
		def.lowerTranslation = (ROBOT_ARM_HEIGHT/2 - ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
		def.upperTranslation = (ROBOT_ARM_HEIGHT/2 + ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
		def.enableMotor = true;
        def.maxMotorForce = PUNCH_MAX_FORCE;
        def.motorSpeed = -PUNCH_RETRACT_SPEED;
		this.rightArmJoint  = this.physics.world.CreateJoint(def);

		// Ball
		var ball = new FlynnBody(this.physics, {
				x: this.canvasWidth/2/RENDER_SCALE,
				y: this.canvasHeight/2/RENDER_SCALE,
				shape:"circle",
				color: BALL_COLOR,
				radius:  BALL_RADIUS/RENDER_SCALE,
				density: 0.2,
				});

		var self = this;
		ball.contact = function (contact, impulse, first) {
			var magnitude = Math.sqrt(
				impulse.normalImpulses[0] * impulse.normalImpulses[0] + impulse.normalImpulses[1] * impulse.normalImpulses[1]);

			console.log('mag:' + magnitude);
			if (magnitude > 0.020) {
				self.soundBounce.play();
			}
			
		};
		this.ballBody = ball.body;
		this.physics.collision();


		// Timers
		//this.mcp.timers.add('shipRespawnDelay', ShipRespawnDelayGameStartTicks, null);  // Start game with a delay (for start sound to finish)
		//this.mcp.timers.add('shipRespawnAnimation', 0, null);
		this.mcp.timers.add('PunchLeftExtend', 0);
		this.mcp.timers.add('PunchLeftRetract', 0);
		this.mcp.timers.add('PunchRightExtend', 0);
		this.mcp.timers.add('PunchRightRetract', 0);

		this.ballBody.setHome();
		this.robotBody.setHome();
		this.leftArm.setHome();
		this.rightArm.setHome();

		this.resetLevel();
	},

	resetLevel: function(){
		// this.ballBody.SetPosition(new b2Vec2(this.canvasWidth/2/RENDER_SCALE, this.canvasHeight/2/RENDER_SCALE));
		// this.ballBody.SetAngle(0);
		// this.ballBody.SetLinearVelocity(new b2Vec2(0,0));
		// this.ballBody.SetAngularVelocity(0);
		
		// this.robotBody.SetPosition(new b2Vec2(200/RENDER_SCALE, 200/RENDER_SCALE));
		// this.robotBody.SetAngle(0);
		// this.robotBody.SetLinearVelocity(new b2Vec2(0,0));
		// this.robotBody.SetAngularVelocity(0);
		// this.ballBody.GetUserData().resetToHome();
		// this.robotBody.GetUserData().resetToHome();
		this.ballBody.resetToHome();
		this.robotBody.resetToHome();
		this.leftArm.resetToHome();
		this.rightArm.resetToHome();
	},


	scoreGoal: function(){
		// Update highscore if exceeded
		if (this.gameClock < this.highscore){
			this.highscore = this.gameClock;
		}
		this.goalsRemaining--;
		if(this.goalsRemaining === 0){
			this.gameOver = true;
			this.ballBody.SetPosition(new b2Vec2(100,100)); //TODO: Do this better.  Moving off screen for now.
		}
		this.soundScore.play();
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
				this.scoreGoal();
			}

			// Die
			if (input.virtualButtonIsPressed("dev_reset")){
				this.resetLevel();
			}
		}

		if (this.gameOver && input.virtualButtonIsPressed("UI_enter")){
			this.mcp.nextState = States.MENU;
		}

		var angle, force, center, engine_v, center_v, engine_world_v;
		angle = this.robotBody.GetAngle() - Math.PI/2;
		force = ROBOT_THRUST_IMPULSE;
		center = this.robotBody.GetWorldCenter();
		center_v = new Victor(center.x, center.y);
		// if(input.virtualButtonIsDown("thrust left")){
		// 	engine_v = new Victor(-ROBOT_BODY_WIDTH/2/RENDER_SCALE, ROBOT_BODY_HEIGHT/2/RENDER_SCALE);
		// 	engine_world_v = engine_v.clone().rotate((angle + Math.PI/2)).add(center_v);
		// 	console.log(center_v, engine_v, engine_world_v);
		// 	this.robotBody.ApplyImpulse({ x: Math.cos(angle)*force, y: Math.sin(angle)*force }, new b2Vec2(engine_world_v.x, engine_world_v.y));
		// }
		// if(input.virtualButtonIsDown("thrust right")){
		// 	engine_v = new Victor(ROBOT_BODY_WIDTH/2/RENDER_SCALE, ROBOT_BODY_HEIGHT/2/RENDER_SCALE);
		// 	engine_world_v = engine_v.clone().rotate((angle + Math.PI/2)).add(center_v);
		// 	console.log(center_v, engine_v, engine_world_v);
		// 	this.robotBody.ApplyImpulse({ x: Math.cos(angle)*force, y: Math.sin(angle)*force }, new b2Vec2(engine_world_v.x, engine_world_v.y));
		// }
		var rotationApplied = false;
		if(input.virtualButtonIsDown("left")){
			// engine_v = new Victor(-ROBOT_BODY_WIDTH/2/RENDER_SCALE, ROBOT_BODY_HEIGHT/2/RENDER_SCALE);
			// engine_world_v = engine_v.clone().rotate((angle + Math.PI/2)).add(center_v);
			// //console.log(center_v, engine_v, engine_world_v);
			// this.robotBody.ApplyImpulse({ x: Math.cos(angle)*force, y: Math.sin(angle)*force }, new b2Vec2(engine_world_v.x, engine_world_v.y));
			// this.robotBody.ApplyTorque(-force);

			// if(this.robotBody.GetAngularVelocity() > -ROBOT_ANGULAR_IMPULSE_LIMIT){
			// 	this.robotBody.ApplyAngularImpulse(-ROBOT_ANGULAR_IMPULSE);
			// }
			this.robotBody.SetAngularVelocity(-ROBOT_ROTATE_RATE);
			this.rotationDampenPending = true;
			rotationApplied = true;
		}
		if(input.virtualButtonIsDown("right")){
			// engine_v = new Victor(ROBOT_BODY_WIDTH/2/RENDER_SCALE, ROBOT_BODY_HEIGHT/2/RENDER_SCALE);
			// engine_world_v = engine_v.clone().rotate((angle + Math.PI/2)).add(center_v);
			// //console.log(center_v, engine_v, engine_world_v);
			// this.robotBody.ApplyImpulse({ x: Math.cos(angle)*force, y: Math.sin(angle)*force }, new b2Vec2(engine_world_v.x, engine_world_v.y));
			// this.robotBody.ApplyTorque(force);
			
			// if(this.robotBody.GetAngularVelocity() < ROBOT_ANGULAR_IMPULSE_LIMIT){
			// 	this.robotBody.ApplyAngularImpulse(ROBOT_ANGULAR_IMPULSE);
			// }
			this.robotBody.SetAngularVelocity(ROBOT_ROTATE_RATE);
			this.rotationDampenPending = true;
			rotationApplied = true;
		}
		if(!rotationApplied && this.rotationDampenPending){
			this.robotBody.SetAngularVelocity(0);
			// this.leftArm.SetAngularVelocity(0);
			// this.rightArm.SetAngularVelocity(0);
			// var vel = this.robotBody.GetLinearVelocity();
			// this.leftArm.SetLinearVelocity(vel.Copy());
			// this.rightArm.SetLinearVelocity(vel.Copy());
			this.rotationDampenPending = false;
			console.log("dampened");
		}

		if(input.virtualButtonIsDown("thrust")){
			this.robotBody.ApplyImpulse({ x: Math.cos(angle)*force, y: Math.sin(angle)*force }, center);
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
		if(this.mcp.timers.hasExpired('PunchLeftRetract')){
			// this.leftArmJoint.SetMotorSpeed(0);
			// this.leftArmJoint.EnableMotor(false);
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
		if(this.mcp.timers.hasExpired('PunchRightRetract')){
			// this.rightArmJoint.SetMotorSpeed(0);
			// this.rightArmJoint.EnableMotor(false);
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
		if(!this.gameOver){
			this.gameClock += paceFactor;
		}
		this.physics.update(paceFactor);

		var ball_pos = this.ballBody.GetPosition();
		var x = ball_pos.x * RENDER_SCALE;
		var y = ball_pos.y * RENDER_SCALE;
		if( (x>GOAL_X + BALL_RADIUS) &&
			(x<GOAL_X + GOAL_SIZE - BALL_RADIUS) &&
			(y>GOAL_Y + BALL_RADIUS) &&
			(y<GOAL_Y + GOAL_SIZE - BALL_RADIUS)
			){
			this.resetLevel();
			this.scoreGoal();
		}
	},

	render: function(ctx){
		ctx.clearAll();

		//------------
		// Text
		//------------
		var y = 30;
		var x = 30;
		for(var i = 0, len = this.controls.length; i<len; i++){
			ctx.vectorText(this.controls[i], 2, x, y, null, FlynnColors.GRAY);
			y += 20;
		}

		ctx.vectorText('GOALS REMAIING: ' + this.goalsRemaining, 2, this.canvasWidth-230, 30, null, FlynnColors.YELLOW);
		var time_in_seconds = (this.gameClock / 60);
		var hundredths = Math.floor((time_in_seconds - Math.floor(time_in_seconds)) * 100);
		var minutes = Math.floor(time_in_seconds / 60);
		var seconds = Math.floor((this.gameClock - (minutes * 60 * 60)) / 60);
		ctx.vectorText('TIME ' + 
			flynnZeroPad(minutes,2) + ':' + 
			flynnZeroPad(seconds,2) + ':' +
			flynnZeroPad(hundredths,2),
			2, this.canvasWidth-180, 50, null, FlynnColors.YELLOW);


		ctx.vectorRect(GOAL_X, GOAL_Y, GOAL_SIZE, GOAL_SIZE, GOAL_COLOR);
		this.physics.render(ctx);

		ctx.vectorRect(WALL_THICKNESS-1,WALL_THICKNESS-1,this.canvasWidth-WALL_THICKNESS*2+2, this.canvasHeight-WALL_THICKNESS*2+2, FlynnColors.GRAY);

		// Game Over
		if(this.gameOver){
			ctx.vectorText("GAME OVER", 6, null, 230, null, FlynnColors.YELLOW);
			ctx.vectorText("PRESS <ENTER>", 2, null, 280, null, FlynnColors.YELLOW);
		}
	}
});