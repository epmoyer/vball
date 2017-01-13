//--------------------------------------------
// StateGame class
//    Core gameplay
//--------------------------------------------
var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.StateGame = Flynn.State.extend({

    GRAVITY_X: 0,
    GRAVITY_Y: 0.0,     
    RENDER_SCALE: 100, // 100 pixels == 1 meter

    PLAYER_COLORS: [Flynn.Colors.DODGERBLUE, Flynn.Colors.RED],

    PUNCH_EXTEND_SPEED: 8.0,
    PUNCH_RETRACT_SPEED: 2.0,
    PUNCH_EXTEND_TICKS: 4,
    PUNCH_RETRACT_TICKS: 6,
    PUNCH_MAX_FORCE: 4,

    ROBOT_BODY_WIDTH: 40,
    ROBOT_BODY_HEIGHT: 20,
    ROBOT_ARM_WIDTH: 10,
    ROBOT_ARM_HEIGHT: 45,
    ROBOT_THRUST_IMPULSE: 0.04,
    ROBOT_ANGULAR_IMPULSE: 2.0,
    ROBOT_ANGULAR_IMPULSE_LIMIT: 5.0,
    ROBOT_ROTATE_RATE: 4.5,

    RESTITUTION: 0.825, // Elasticity
    
    BALL_COLOR: Flynn.Colors.GREEN,
    BALL_RADIUS: 20,

    WALL_THICKNESS: 10,
    BARRIER_COLOR: null,

    GOAL_SIZE: 100,
    GOAL_COLOR: "#004000",
    GOAL_COLORS: ['#202060', '#400000'],

    BUMPER_LENGTH: 240,
    BUMPER_THICKNESS: 10,
    BUMPER_MARGIN: 190,
    BUMPER_COLOR: Flynn.Colors.GRAY,

    BOUNCE_LOCKOUT_TICKS: 15,
    BOUNCE_MIN_MAGNITUDE: 0.02,
    BOUNCE_LOCKOUT_DISTANCE: 40,

    init_constants: function(){
        // Constants requiring dynamic initialization

        this.ROBOT_START_Y = [390, 390];
        this.ROBOT_START_X = [90, 1024 - 50 - this.ROBOT_BODY_WIDTH];

        this.GOAL_X = [
            1024 - 140,
            40];
        this.GOAL_Y = [
            768/2 - this.GOAL_SIZE/2,
            768/2 - this.GOAL_SIZE/2];
    },

    init: function() {
        var i, len;
        var def;

        this.init_constants();
        
        this.center_x = Game.CANVAS_WIDTH/2;
        this.center_y = Game.CANVAS_HEIGHT/2;

        this.numGoalsToWin2Player = 3;
        Game.config.score.time  = 0;       // 1 player score
        Game.config.score.goals = [0,0];   // 2 player scores
        this.numPlayers = Flynn.mcp.numPlayers;

        this.gameOver = false;

        this.viewport_v = new Victor(0,0);

        this.goalsRemaining = 3;
        this.rotationDampenPending = [false, false];
        this.thrusting = [false, false];

        var names = Flynn.mcp.input.getConfigurableVirtualButtonNames();
        this.controls = [];
        for(i=0, len=names.length; i<len; i++){
            this.controls.push(names[i] + ' : ' + Flynn.mcp.input.getVirtualButtonBoundKeyName(names[i]));
        }

        this.physics = new Flynn.Physics(Flynn.mcp.canvas.ctx, this.GRAVITY_X, this.GRAVITY_Y, this.RENDER_SCALE);

        // Fix so slow objects bounce off walls
        Box2D.Common.b2Settings.b2_velocityThreshold=0;

        //-------------------
        // Playfield Barriers
        //-------------------
        // Left Barrier
        new Flynn.Body(this.physics, { type: "static",
            x: (this.WALL_THICKNESS/2)/this.RENDER_SCALE,
            y: Game.CANVAS_HEIGHT/2/this.RENDER_SCALE,
            height: Game.CANVAS_HEIGHT/this.RENDER_SCALE,
            width: this.WALL_THICKNESS/this.RENDER_SCALE,
            color: this.BARRIER_COLOR,
            restitution: this.RESTITUTION,
            });
        // Right Barrier
        new Flynn.Body(this.physics, { type: "static",
            x: (Game.CANVAS_WIDTH-this.WALL_THICKNESS/2)/this.RENDER_SCALE,
            y: Game.CANVAS_HEIGHT/2/this.RENDER_SCALE,
            height: Game.CANVAS_HEIGHT/this.RENDER_SCALE,
            width: this.WALL_THICKNESS/this.RENDER_SCALE,
            color: this.BARRIER_COLOR,
            restitution: this.RESTITUTION,
            });
        // Top Barrier
        new Flynn.Body(this.physics, { type: "static",
            x: Game.CANVAS_WIDTH/2/this.RENDER_SCALE,
            y: this.WALL_THICKNESS/2/this.RENDER_SCALE,
            height: this.WALL_THICKNESS/this.RENDER_SCALE,
            width: (Game.CANVAS_WIDTH-2*this.WALL_THICKNESS)/this.RENDER_SCALE,
            color: this.BARRIER_COLOR,
            restitution: this.RESTITUTION,
            });
        // Bottom Barrier
        new Flynn.Body(this.physics, { type: "static",
            x: Game.CANVAS_WIDTH/2/this.RENDER_SCALE,
            y: (Game.CANVAS_HEIGHT-this.WALL_THICKNESS/2)/this.RENDER_SCALE,
            height: this.WALL_THICKNESS/this.RENDER_SCALE,
            width: (Game.CANVAS_WIDTH-2*this.WALL_THICKNESS)/this.RENDER_SCALE,
            color: this.BARRIER_COLOR,
            restitution: this.RESTITUTION,
            });
    
        

        //--------------
        // Bumpers
        //--------------
        // Left Bumper
        new Flynn.Body(this.physics, { type: "static",
            x: (this.BUMPER_MARGIN + this.BUMPER_THICKNESS/2)/this.RENDER_SCALE,
            y: Game.CANVAS_HEIGHT/2/this.RENDER_SCALE,
            height: this.BUMPER_LENGTH/this.RENDER_SCALE,
            width: this.BUMPER_THICKNESS/this.RENDER_SCALE,
            color: this.BUMPER_COLOR,
            restitution: this.RESTITUTION,
            });
        // // Right Bumper
        new Flynn.Body(this.physics, { type: "static",
            x: (Game.CANVAS_WIDTH - this.BUMPER_MARGIN - this.BUMPER_THICKNESS/2)/this.RENDER_SCALE,
            y: Game.CANVAS_HEIGHT/2/this.RENDER_SCALE,
            height: this.BUMPER_LENGTH/this.RENDER_SCALE,
            width: this.BUMPER_THICKNESS/this.RENDER_SCALE,
            color: this.BUMPER_COLOR,
            restitution: this.RESTITUTION,
            });
        // // Top Bumper
        new Flynn.Body(this.physics, { type: "static",
            x: Game.CANVAS_WIDTH/2/this.RENDER_SCALE,
            y: (this.BUMPER_MARGIN + this.BUMPER_THICKNESS/2)/this.RENDER_SCALE,
            height: this.BUMPER_THICKNESS/this.RENDER_SCALE,
            width: this.BUMPER_LENGTH/this.RENDER_SCALE,
            color: this.BUMPER_COLOR,
            restitution: this.RESTITUTION,
            });
        // // Bottom Bumper
        new Flynn.Body(this.physics, { type: "static",
            x: Game.CANVAS_WIDTH/2/this.RENDER_SCALE,
            y: (Game.CANVAS_HEIGHT - this.BUMPER_MARGIN - this.BUMPER_THICKNESS/2)/this.RENDER_SCALE,
            height: this.BUMPER_THICKNESS/this.RENDER_SCALE,
            width: this.BUMPER_LENGTH/this.RENDER_SCALE,
            color: this.BUMPER_COLOR,
            restitution: this.RESTITUTION,
            });
        

        //var SPAWN_MARGIN = 50;
        // for(var i = 0; i<0; i++){
        //  new Flynn.Body(this.physics, {
        //      x: (SPAWN_MARGIN +  Math.random() * (Game.CANVAS_WIDTH  - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
        //      y: (SPAWN_MARGIN +  Math.random() * (Game.CANVAS_HEIGHT - 2*SPAWN_MARGIN))/this.RENDER_SCALE, shape:"circle" });
        //  new Flynn.Body(this.physics, {
        //      x: (SPAWN_MARGIN +  Math.random() * (Game.CANVAS_WIDTH  - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
        //      y: (SPAWN_MARGIN +  Math.random() * (Game.CANVAS_HEIGHT - 2*SPAWN_MARGIN))/this.RENDER_SCALE});
        // }

        this.robotBody = [null, null];
        this.leftArm = [null, null];
        this.rightArm = [null, null];
        this.leftArmJoint =[null, null];
        this.rightArmJoint = [null, null];

        var player;
        for(player=0, len=this.numPlayers; player<len; player++){
            this.robotBody[player] = new Flynn.Body(this.physics, {
                    x: this.ROBOT_START_X[player]/this.RENDER_SCALE,
                    y: this.ROBOT_START_Y[player]/this.RENDER_SCALE,
                    width: this.ROBOT_BODY_WIDTH/this.RENDER_SCALE,
                    height: this.ROBOT_BODY_HEIGHT/this.RENDER_SCALE,
                    color: this.PLAYER_COLORS[player],
                    fixedRotation: true,
                    restitution: this.RESTITUTION,
                }).body;
            this.leftArm[player] = new Flynn.Body(this.physics, {
                    x: (this.ROBOT_START_X[player] - this.ROBOT_BODY_WIDTH/2 - this.ROBOT_ARM_WIDTH/2 - 0.1)/this.RENDER_SCALE,
                    y: this.ROBOT_START_Y[player]/this.RENDER_SCALE,
                    width: this.ROBOT_ARM_WIDTH/this.RENDER_SCALE,
                    height: this.ROBOT_ARM_HEIGHT/this.RENDER_SCALE,
                    color: this.PLAYER_COLORS[player],
                    // fixedRotation: true,
                    restitution: this.RESTITUTION,
                }).body;
            this.rightArm[player] = new Flynn.Body(this.physics, {
                    x: (this.ROBOT_START_X[player] + this.ROBOT_BODY_WIDTH/2 + this.ROBOT_ARM_WIDTH/2 )/this.RENDER_SCALE,
                    y: this.ROBOT_START_Y[player]/this.RENDER_SCALE,
                    width: this.ROBOT_ARM_WIDTH/this.RENDER_SCALE,
                    height: this.ROBOT_ARM_HEIGHT/this.RENDER_SCALE,
                    color: this.PLAYER_COLORS[player],
                    // fixedRotation: true,
                    restitution: this.RESTITUTION,
                }).body;


            def = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
            def.Initialize(this.leftArm[player], this.robotBody[player],
                new Box2D.Common.Math.b2Vec2((this.ROBOT_START_X[player]-this.ROBOT_BODY_WIDTH/2)/this.RENDER_SCALE, this.ROBOT_START_Y[player]/this.RENDER_SCALE),
                new Box2D.Common.Math.b2Vec2(0,1));
            def.enableLimit = true;
            def.lowerTranslation = (this.ROBOT_ARM_HEIGHT/2 - this.ROBOT_BODY_HEIGHT/2)/this.RENDER_SCALE;
            def.upperTranslation = (this.ROBOT_ARM_HEIGHT/2 + this.ROBOT_BODY_HEIGHT/2)/this.RENDER_SCALE;
            def.enableMotor = true;
            def.maxMotorForce = this.PUNCH_MAX_FORCE;
            def.motorSpeed = -this.PUNCH_RETRACT_SPEED;
            this.leftArmJoint[player] = this.physics.world.CreateJoint(def);

            def = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
            def.Initialize(this.rightArm[player], this.robotBody[player],
                new Box2D.Common.Math.b2Vec2((this.ROBOT_START_X[player]+this.ROBOT_BODY_WIDTH/2)/this.RENDER_SCALE, this.ROBOT_START_Y[player]/this.RENDER_SCALE),
                new Box2D.Common.Math.b2Vec2(0,1));
            def.enableLimit = true;
            def.lowerTranslation = (this.ROBOT_ARM_HEIGHT/2 - this.ROBOT_BODY_HEIGHT/2)/this.RENDER_SCALE;
            def.upperTranslation = (this.ROBOT_ARM_HEIGHT/2 + this.ROBOT_BODY_HEIGHT/2)/this.RENDER_SCALE;
            def.enableMotor = true;
            def.maxMotorForce = this.PUNCH_MAX_FORCE;
            def.motorSpeed = -this.PUNCH_RETRACT_SPEED;
            this.rightArmJoint[player] = this.physics.world.CreateJoint(def);

            this.robotBody[player].setHome();
            this.leftArm[player].setHome();
            this.rightArm[player].setHome();
        }

        // Ball
        var ball = new Flynn.Body(this.physics, {
                x: Game.CANVAS_WIDTH/2/this.RENDER_SCALE,
                y: Game.CANVAS_HEIGHT/2/this.RENDER_SCALE,
                shape:"circle",
                color: this.BALL_COLOR,
                radius:  this.BALL_RADIUS/this.RENDER_SCALE,
                density: 0.2,
                restitution: this.RESTITUTION,
                });

        var self = this;
        ball.contact = function (contact, impulse, first) {
            var magnitude = Math.sqrt(
                impulse.normalImpulses[0] * impulse.normalImpulses[0] + impulse.normalImpulses[1] * impulse.normalImpulses[1]);
            console.log("Bounce magnitude:" + magnitude);   
            // if (magnitude > self.BOUNCE_MIN_MAGNITUDE && !Flynn.mcp.timers.isRunning('bounceLockout')){
            if (magnitude > self.BOUNCE_MIN_MAGNITUDE){
                var in_hand = false;
                var ball_pos = self.ballBody.GetPosition();
                var i, body_pos;
                // Check whether a player is holding the ball
                for(i=0; i<self.numPlayers; i++){                
                    body_pos = self.robotBody[i].GetPosition();
                    if(Flynn.Util.distance(ball_pos.x, ball_pos.y, body_pos.x, body_pos.y) < self.BOUNCE_LOCKOUT_DISTANCE / self.RENDER_SCALE){
                        in_hand = true;
                    }
                }
                if (!in_hand){
                    Game.sounds.bounce.play();
                }
                Flynn.mcp.timers.set('bounceLockout', self.BOUNCE_LOCKOUT_TICKS);
            }
            
        };
        this.ballBody = ball.body;
        this.physics.collision();


        // Timers
        Flynn.mcp.timers.add('P1 PunchLeftExtend', 0);
        Flynn.mcp.timers.add('P1 PunchLeftRetract', 0);
        Flynn.mcp.timers.add('P1 PunchRightExtend', 0);
        Flynn.mcp.timers.add('P1 PunchRightRetract', 0);
        Flynn.mcp.timers.add('P2 PunchLeftExtend', 0);
        Flynn.mcp.timers.add('P2 PunchLeftRetract', 0);
        Flynn.mcp.timers.add('P2 PunchRightExtend', 0);
        Flynn.mcp.timers.add('P2 PunchRightRetract', 0);
        Flynn.mcp.timers.add('bounceLockout', 0);

        this.ballBody.setHome();

        this.resetLevel();
    },

    destructor: function(){
        Game.sounds.thrust.stop();
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
        // if (Game.config.score.time < this.highscore){
        //  this.highscore = Game.config.score.time;
        // }
        if(this.numPlayers === 1){
            this.goalsRemaining--;
            if(this.goalsRemaining === 0){
                this.gameOver = true;
                this.ballBody.SetPosition(new Box2D.Common.Math.b2Vec2(100,100)); //TODO: Do this better.  Moving off screen for now.
            }
        }
        else{
            Game.config.score.goals[player]++;
            if(Game.config.score.goals[player] >= this.numGoalsToWin2Player){
                this.gameOver = true;
                this.ballBody.SetPosition(new Box2D.Common.Math.b2Vec2(100,100)); //TODO: Do this better.  Moving off screen for now.
            }
        }
        Game.sounds.score.play();
    },

    handleInputs: function(input, paceFactor) {
        var angle, force, center, engine_v, center_v, engine_world_v, i, len;
        var pNum;

        if(Flynn.mcp.developerModeEnabled){
            // Metrics toggle
            if (input.virtualButtonWasPressed("dev_metrics")){
                Flynn.mcp.canvas.showMetrics = !Flynn.mcp.canvas.showMetrics;
            }

            // Toggle DEV pacing mode slow mo
            if (input.virtualButtonWasPressed("dev_slow_mo")){
                Flynn.mcp.toggleDevPacingSlowMo();
            }

            // Toggle DEV pacing mode fps 20
            if (input.virtualButtonWasPressed("dev_fps_20")){
                Flynn.mcp.toggleDevPacingFps20();
            }

            // Points
            if (input.virtualButtonWasPressed("dev_add_points_0")){
                this.scoreGoal(0);
            }
            if (input.virtualButtonWasPressed("dev_add_points_1")){
                this.scoreGoal(1);
            }

            // Die
            if (input.virtualButtonWasPressed("dev_reset")){
                this.resetLevel();
            }
        }

        if (this.gameOver && input.virtualButtonWasPressed("UI_enter")){
            Game.sounds.thrust.stop();
            if(this.numPlayers==1){
                Flynn.mcp.changeState(Game.States.END);
            }
            else{
                Flynn.mcp.changeState(Game.States.MENU);
            }
        }

        // Config
        if (input.virtualButtonWasPressed("UI_escape")){
            Flynn.mcp.changeState(Game.States.CONFIG);
        }

        for(i=0, len=this.numPlayers; i<len; i++){
            pNum = 'P' + (i+1) + ' ';
            angle = this.robotBody[i].GetAngle() - Math.PI/2;
            force = this.ROBOT_THRUST_IMPULSE;
            center = this.robotBody[i].GetWorldCenter();
            center_v = new Victor(center.x, center.y);
            var rotationApplied = false;
            if(input.virtualButtonIsDown(pNum + 'left')){
                this.robotBody[i].SetAngularVelocity(-this.ROBOT_ROTATE_RATE);
                this.rotationDampenPending[i] = true;
                rotationApplied = true;
            }
            if(input.virtualButtonIsDown(pNum + 'right')){
                this.robotBody[i].SetAngularVelocity(this.ROBOT_ROTATE_RATE);
                this.rotationDampenPending[i] = true;
                rotationApplied = true;
            }
            if(!rotationApplied && this.rotationDampenPending[i]){
                this.robotBody[i].SetAngularVelocity(0);
                this.rotationDampenPending[i] = false;
                //console.log('dampened');
            }

            if(input.virtualButtonIsDown(pNum + 'thrust')){
                this.robotBody[i].ApplyImpulse({ x: Math.cos(angle)*force, y: Math.sin(angle)*force }, center);
                if(!this.thrusting[0] && !this.thrusting[1]){
                    this.thrusting[i]=true;
                    Game.sounds.thrust.play();
                }
            } else{
                this.thrusting[i]=false;
                if(!this.thrusting[0] && !this.thrusting[1]){
                    Game.sounds.thrust.stop();
                }
            }

            if(input.virtualButtonWasPressed(pNum + 'punch left')){
                this.leftArmJoint[i].SetMotorSpeed(this.PUNCH_EXTEND_SPEED);
                this.leftArmJoint[i].EnableMotor(true);
                Flynn.mcp.timers.set(pNum + 'PunchLeftExtend', this.PUNCH_EXTEND_TICKS);
            }
            if(Flynn.mcp.timers.hasExpired(pNum + 'PunchLeftExtend')){
                this.leftArmJoint[i].SetMotorSpeed(-this.PUNCH_RETRACT_SPEED);
                Flynn.mcp.timers.set(pNum + 'PunchLeftRetract', this.PUNCH_RETRACT_TICKS);
            }
            if(Flynn.mcp.timers.hasExpired(pNum + 'PunchLeftRetract')){
                // this.leftArmJoint.SetMotorSpeed(0);
                // this.leftArmJoint.EnableMotor(false);
            }

            if(input.virtualButtonWasPressed(pNum + 'punch right')){
                this.rightArmJoint[i].SetMotorSpeed(this.PUNCH_EXTEND_SPEED);
                this.rightArmJoint[i].EnableMotor(true);
                Flynn.mcp.timers.set(pNum + 'PunchRightExtend', this.PUNCH_EXTEND_TICKS);
            }
            if(Flynn.mcp.timers.hasExpired(pNum + 'PunchRightExtend')){
                this.rightArmJoint[i].SetMotorSpeed(-this.PUNCH_RETRACT_SPEED);
                Flynn.mcp.timers.set(pNum + 'PunchRightRetract', this.PUNCH_RETRACT_TICKS);
            }
            if(Flynn.mcp.timers.hasExpired(pNum + 'PunchRightRetract')){
                // this.rightArmJoint.SetMotorSpeed(0);
                // this.rightArmJoint.EnableMotor(false);
            }
        }
    },

    update: function(paceFactor) {
        var ball_pos, x, y, i, len;

        if(!this.gameOver){
            Game.config.score.time += paceFactor;
        }
        this.physics.update(paceFactor);

        ball_pos = this.ballBody.GetPosition();
        x = ball_pos.x * this.RENDER_SCALE;
        y = ball_pos.y * this.RENDER_SCALE;
        for(i=0, len=this.numPlayers; i<len; i++){
            if( (x>this.GOAL_X[i] + this.BALL_RADIUS) &&
                (x<this.GOAL_X[i] + this.GOAL_SIZE - this.BALL_RADIUS) &&
                (y>this.GOAL_Y[i] + this.BALL_RADIUS) &&
                (y<this.GOAL_Y[i] + this.GOAL_SIZE - this.BALL_RADIUS)
                ){
                this.resetLevel();
                this.scoreGoal(i);
            }
        }
    },

    render: function(ctx){
        var i, len;

        ctx.clearAll();

        //------------
        // Text
        //------------
        if(this.numPlayers === 1){
            ctx.vectorText('GOALS REMAIING: ' + this.goalsRemaining, 2, Game.CANVAS_WIDTH-230, 30, 'left', Flynn.Colors.YELLOW);
            ctx.vectorText('TIME ' + Flynn.Util.ticksToTime(Game.config.score.time),
                2, Game.CANVAS_WIDTH-180, 50, 'left', Flynn.Colors.YELLOW);
        }
        else{
            ctx.vectorText(Game.config.score.goals[0], 3, 30, 30, 'left', this.PLAYER_COLORS[0]);
            ctx.vectorText(Game.config.score.goals[1], 3, Game.CANVAS_WIDTH-30, 30, 'right', this.PLAYER_COLORS[1]);
        }

        for(i=0, len=this.numPlayers; i<len; i++){
            ctx.vectorRect(this.GOAL_X[i], this.GOAL_Y[i], this.GOAL_SIZE, this.GOAL_SIZE, this.GOAL_COLORS[i]);
        }
        this.physics.render(ctx);

        ctx.vectorRect(this.WALL_THICKNESS-1,this.WALL_THICKNESS-1,Game.CANVAS_WIDTH-this.WALL_THICKNESS*2+2, Game.CANVAS_HEIGHT-this.WALL_THICKNESS*2+2, Flynn.Colors.GRAY);

        // Game Over
        if(this.gameOver){
            ctx.vectorText("GAME OVER", 6, null, 230, null, Flynn.Colors.YELLOW);
            ctx.vectorText("PRESS <ENTER>", 2, null, 280, null, Flynn.Colors.YELLOW);
        }
    }
});

}()); // "use strict" wrapper