//--------------------------------------------
// StateGame class
//    Core gameplay
//--------------------------------------------
var GRAVITY_X = 0;
var GRAVITY_Y = 0.0; //9.8;
var RENDER_SCALE = 100; // 100 pixels == 1 meter

var PLAYER_COLORS = [FlynnColors.BLUE, FlynnColors.RED];

var PUNCH_EXTEND_SPEED = 8.0;
var PUNCH_RETRACT_SPEED = 2.0;
var PUNCH_EXTEND_TICKS = 4;
var PUNCH_RETRACT_TICKS = 6;
var PUNCH_MAX_FORCE = 4;

var ROBOT_BODY_WIDTH = 40;
var ROBOT_BODY_HEIGHT = 20;
var ROBOT_ARM_WIDTH = 10;
var ROBOT_ARM_HEIGHT = 45;
var ROBOT_THRUST_IMPULSE = 0.06;
var ROBOT_ANGULAR_IMPULSE = 2.0;
var ROBOT_COLOR = "#4040FF";
var ROBOT_ANGULAR_IMPULSE_LIMIT = 5.0;
var ROBOT_ROTATE_RATE = 4.5;
var ROBOT_START_X = [90, 1024 - 50 - ROBOT_BODY_WIDTH];
var ROBOT_START_Y = [390, 390];

var BALL_COLOR = FlynnColors.GREEN;
var BALL_RADIUS = 20;

var WALL_THICKNESS = 10;
var BARRIER_COLOR = null;

var GOAL_SIZE = 100;
var GOAL_X = [
	1024 - 140,
	40];
var GOAL_Y = [
	768/2 - GOAL_SIZE/2,
	768/2 - GOAL_SIZE/2];
var GOAL_COLOR = "#004000";
var GOAL_COLORS = ['#202060', '#400000'];

var BUMPER_LENGTH = 240;
var BUMPER_THICKNESS = 10;
var BUMPER_MARGIN = 190;
var BUMPER_COLOR = FlynnColors.GRAY;

var BOUNCE_LOCKOUT_TICKS = 15;

var StateGame = FlynnState.extend({

	init: function(mcp) {
		var i, len;

		this._super(mcp);
		
		this.canvasWidth = mcp.canvas.ctx.width;
		this.canvasHeight = mcp.canvas.ctx.height;
		this.center_x = this.canvasWidth/2;
		this.center_y = this.canvasHeight/2;

		this.numGoalsToWin2Player = 3;
		this.score = [0,0];
		this.numPlayers = mcp.numPlayers;

		this.gameOver = false;

        this.viewport_v = new Victor(0,0);

		this.goalsRemaining = 3;
		this.highscore = this.mcp.highscores[0][1];
		this.rotationDampenPending = [false, false];
		this.thrusting = [false, false];
	
		this.soundBounce = new Howl({
			src: ['sounds/Blocked.ogg','sounds/Blocked.mp3'],
			volume: 0.5,
		});
		this.soundScore = new Howl({
			src: ['sounds/Tripple_blip.ogg','sounds/Tripple_blip.mp3'],
			volume: 0.5,
		});
		this.soundThrust = new Howl({
			src: ['sounds/Engine.ogg','sounds/Engine.mp3'],
			volume: 0.5,
			loop: true,
		});

		var names = this.mcp.input.getConfigurableVirtualButtonNames();
		this.controls = [];
		for(i=0, len=names.length; i<len; i++){
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

		this.robotBody = [null, null];
		this.leftArm = [null, null];
		this.rightArm = [null, null];
		this.leftArmJoint =[null, null];
		this.rightArmJoint = [null, null];

		var player;
		for(player=0, len=this.numPlayers; player<len; player++){
			this.robotBody[player] = new FlynnBody(this.physics, {
					x: ROBOT_START_X[player]/RENDER_SCALE,
					y: ROBOT_START_Y[player]/RENDER_SCALE,
					width: ROBOT_BODY_WIDTH/RENDER_SCALE,
					height: ROBOT_BODY_HEIGHT/RENDER_SCALE,
					color: PLAYER_COLORS[player],
					fixedRotation: true,
				}).body;
			this.leftArm[player] = new FlynnBody(this.physics, {
					x: (ROBOT_START_X[player] - ROBOT_BODY_WIDTH/2 - ROBOT_ARM_WIDTH/2 - 0.1)/RENDER_SCALE,
					y: ROBOT_START_Y[player]/RENDER_SCALE,
					width: ROBOT_ARM_WIDTH/RENDER_SCALE,
					height: ROBOT_ARM_HEIGHT/RENDER_SCALE,
					color: PLAYER_COLORS[player],
					// fixedRotation: true,
				}).body;
			this.rightArm[player] = new FlynnBody(this.physics, {
					x: (ROBOT_START_X[player] + ROBOT_BODY_WIDTH/2 + ROBOT_ARM_WIDTH/2 )/RENDER_SCALE,
					y: ROBOT_START_Y[player]/RENDER_SCALE,
					width: ROBOT_ARM_WIDTH/RENDER_SCALE,
					height: ROBOT_ARM_HEIGHT/RENDER_SCALE,
					color: PLAYER_COLORS[player],
					// fixedRotation: true,
				}).body;


			def = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
			def.Initialize(this.leftArm[player], this.robotBody[player],
				new b2Vec2((ROBOT_START_X[player]-ROBOT_BODY_WIDTH/2)/RENDER_SCALE, ROBOT_START_Y[player]/RENDER_SCALE),
				new b2Vec2(0,1));
			def.enableLimit = true;
			def.lowerTranslation = (ROBOT_ARM_HEIGHT/2 - ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
			def.upperTranslation = (ROBOT_ARM_HEIGHT/2 + ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
			def.enableMotor = true;
			def.maxMotorForce = PUNCH_MAX_FORCE;
			def.motorSpeed = -PUNCH_RETRACT_SPEED;
			this.leftArmJoint[player] = this.physics.world.CreateJoint(def);

			def = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
			def.Initialize(this.rightArm[player], this.robotBody[player],
				new b2Vec2((ROBOT_START_X[player]+ROBOT_BODY_WIDTH/2)/RENDER_SCALE, ROBOT_START_Y[player]/RENDER_SCALE),
				new b2Vec2(0,1));
			def.enableLimit = true;
			def.lowerTranslation = (ROBOT_ARM_HEIGHT/2 - ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
			def.upperTranslation = (ROBOT_ARM_HEIGHT/2 + ROBOT_BODY_HEIGHT/2)/RENDER_SCALE;
			def.enableMotor = true;
			def.maxMotorForce = PUNCH_MAX_FORCE;
			def.motorSpeed = -PUNCH_RETRACT_SPEED;
			this.rightArmJoint[player] = this.physics.world.CreateJoint(def);

			this.robotBody[player].setHome();
			this.leftArm[player].setHome();
			this.rightArm[player].setHome();
		}

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

			if (magnitude > 0.020 && !self.mcp.timers.isRunning('bounceLockout')){
				self.soundBounce.play();
				self.mcp.timers.set('bounceLockout', BOUNCE_LOCKOUT_TICKS);
			}
			
		};
		this.ballBody = ball.body;
		this.physics.collision();


		// Timers
		//this.mcp.timers.add('shipRespawnDelay', ShipRespawnDelayGameStartTicks, null);  // Start game with a delay (for start sound to finish)
		//this.mcp.timers.add('shipRespawnAnimation', 0, null);
		this.mcp.timers.add('P1 PunchLeftExtend', 0);
		this.mcp.timers.add('P1 PunchLeftRetract', 0);
		this.mcp.timers.add('P1 PunchRightExtend', 0);
		this.mcp.timers.add('P1 PunchRightRetract', 0);
		this.mcp.timers.add('P2 PunchLeftExtend', 0);
		this.mcp.timers.add('P2 PunchLeftRetract', 0);
		this.mcp.timers.add('P2 PunchRightExtend', 0);
		this.mcp.timers.add('P2 PunchRightRetract', 0);
		this.mcp.timers.add('bounceLockout', 0);

		this.ballBody.setHome();

		this.resetLevel();
	},

	destructor: function(){
		this.soundThrust.stop();
	},

	resetLevel: function(){
		for(var player=0, len=this.numPlayers; player<len; player++){
			this.robotBody[player].resetToHome();
			this.leftArm[player].resetToHome();
			this.rightArm[player].resetToHome();
		}
		this.ballBody.resetToHome();
	},


	scoreGoal: function(player){
		// Update highscore if exceeded
		// if (this.gameClock < this.highscore){
		// 	this.highscore = this.gameClock;
		// }
		if(this.numPlayers === 1){
			this.goalsRemaining--;
			if(this.goalsRemaining === 0){
				this.gameOver = true;
				this.ballBody.SetPosition(new b2Vec2(100,100)); //TODO: Do this better.  Moving off screen for now.
			}
		}
		else{
			this.score[player]++;
			if(this.score[player] >= this.numGoalsToWin2Player){
				this.gameOver = true;
				this.ballBody.SetPosition(new b2Vec2(100,100)); //TODO: Do this better.  Moving off screen for now.
			}
		}
		this.soundScore.play();
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
			if (input.virtualButtonIsPressed("dev_add_points_0")){
				this.scoreGoal(0);
			}
			if (input.virtualButtonIsPressed("dev_add_points_1")){
				this.scoreGoal(1);
			}

			// Die
			if (input.virtualButtonIsPressed("dev_reset")){
				this.resetLevel();
			}
		}

		if (this.gameOver && input.virtualButtonIsPressed("UI_enter")){
			this.mcp.nextState = States.END;
			this.mcp.custom.score = this.gameClock;
			this.soundThrust.stop();
		}

		var angle, force, center, engine_v, center_v, engine_world_v, i, len;
		for(i=0, len=this.numPlayers; i<len; i++){
			pNum = 'P' + (i+1) + ' ';
			angle = this.robotBody[i].GetAngle() - Math.PI/2;
			force = ROBOT_THRUST_IMPULSE;
			center = this.robotBody[i].GetWorldCenter();
			center_v = new Victor(center.x, center.y);
			var rotationApplied = false;
			if(input.virtualButtonIsDown(pNum + 'left')){
				this.robotBody[i].SetAngularVelocity(-ROBOT_ROTATE_RATE);
				this.rotationDampenPending = true;
				rotationApplied = true;
			}
			if(input.virtualButtonIsDown(pNum + 'right')){
				this.robotBody[i].SetAngularVelocity(ROBOT_ROTATE_RATE);
				this.rotationDampenPending = true;
				rotationApplied = true;
			}
			if(!rotationApplied && this.rotationDampenPending){
				this.robotBody[i].SetAngularVelocity(0);
				this.rotationDampenPending[i] = false;
				console.log('dampened');
			}

			if(input.virtualButtonIsDown(pNum + 'thrust')){
				this.robotBody[i].ApplyImpulse({ x: Math.cos(angle)*force, y: Math.sin(angle)*force }, center);
				if(!this.thrusting[0] && !this.thrusting[1]){
					this.thrusting[i]=true;
					this.soundThrust.play();
				}
			} else{
				this.thrusting[i]=false;
				if(!this.thrusting[0] && !this.thrusting[1]){
					this.soundThrust.stop();
				}
			}

			if(input.virtualButtonIsPressed(pNum + 'punch left')){
				this.leftArmJoint[i].SetMotorSpeed(PUNCH_EXTEND_SPEED);
				this.leftArmJoint[i].EnableMotor(true);
				this.mcp.timers.set(pNum + 'PunchLeftExtend', PUNCH_EXTEND_TICKS);
			}
			if(this.mcp.timers.hasExpired(pNum + 'PunchLeftExtend')){
				this.leftArmJoint[i].SetMotorSpeed(-PUNCH_RETRACT_SPEED);
				this.mcp.timers.set(pNum + 'PunchLeftRetract', PUNCH_RETRACT_TICKS);
			}
			if(this.mcp.timers.hasExpired(pNum + 'PunchLeftRetract')){
				// this.leftArmJoint.SetMotorSpeed(0);
				// this.leftArmJoint.EnableMotor(false);
			}

			if(input.virtualButtonIsPressed(pNum + 'punch right')){
				this.rightArmJoint[i].SetMotorSpeed(PUNCH_EXTEND_SPEED);
				this.rightArmJoint[i].EnableMotor(true);
				this.mcp.timers.set(pNum + 'PunchRightExtend', PUNCH_EXTEND_TICKS);
			}
			if(this.mcp.timers.hasExpired(pNum + 'PunchRightExtend')){
				this.rightArmJoint[i].SetMotorSpeed(-PUNCH_RETRACT_SPEED);
				this.mcp.timers.set(pNum + 'PunchRightRetract', PUNCH_RETRACT_TICKS);
			}
			if(this.mcp.timers.hasExpired(pNum + 'PunchRightRetract')){
				// this.rightArmJoint.SetMotorSpeed(0);
				// this.rightArmJoint.EnableMotor(false);
			}
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
		for(var i=0, len=this.numPlayers; i<len; i++){
			if( (x>GOAL_X[i] + BALL_RADIUS) &&
				(x<GOAL_X[i] + GOAL_SIZE - BALL_RADIUS) &&
				(y>GOAL_Y[i] + BALL_RADIUS) &&
				(y<GOAL_Y[i] + GOAL_SIZE - BALL_RADIUS)
				){
				this.resetLevel();
				this.scoreGoal(i);
			}
		}
	},

	render: function(ctx){
		ctx.clearAll();

		//------------
		// Text
		//------------
		if(this.numPlayers === 1){
			ctx.vectorText('GOALS REMAIING: ' + this.goalsRemaining, 2, this.canvasWidth-230, 30, null, FlynnColors.YELLOW);
			ctx.vectorText('TIME ' + flynnTicksToTime(this.gameClock),
				2, this.canvasWidth-180, 50, null, FlynnColors.YELLOW);
		}
		else{
			ctx.vectorText(this.score[0], 3, 30, 30, null, PLAYER_COLORS[0]);
			ctx.vectorText(this.score[1], 3, this.canvasWidth-30, 30, 0, PLAYER_COLORS[1]);
		}

		for(i=0, len=this.numPlayers; i<len; i++){
			ctx.vectorRect(GOAL_X[i], GOAL_Y[i], GOAL_SIZE, GOAL_SIZE, GOAL_COLORS[i]);
		}
		this.physics.render(ctx);

		ctx.vectorRect(WALL_THICKNESS-1,WALL_THICKNESS-1,this.canvasWidth-WALL_THICKNESS*2+2, this.canvasHeight-WALL_THICKNESS*2+2, FlynnColors.GRAY);

		// Game Over
		if(this.gameOver){
			ctx.vectorText("GAME OVER", 6, null, 230, null, FlynnColors.YELLOW);
			ctx.vectorText("PRESS <ENTER>", 2, null, 280, null, FlynnColors.YELLOW);
		}
	}
});