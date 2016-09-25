//--------------------------------------------
// StateGame class
//    Core gameplay
//--------------------------------------------
if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.StateGame = Flynn.State.extend({

    GRAVITY_X: 0,
    GRAVITY_Y: 0.0,     
    RENDER_SCALE: 100, // 100 pixels == 1 meter

    PLAYER_COLORS: [Flynn.Colors.BLUE, Flynn.Colors.RED],

    PUNCH_EXTEND_SPEED: 8.0,
    PUNCH_RETRACT_SPEED: 2.0,
    PUNCH_EXTEND_TICKS: 4,
    PUNCH_RETRACT_TICKS: 6,
    PUNCH_MAX_FORCE: 4,

    ROBOT_BODY_WIDTH: 40,
    ROBOT_BODY_HEIGHT: 20,
    ROBOT_ARM_WIDTH: 10,
    ROBOT_ARM_HEIGHT: 45,
    ROBOT_THRUST_IMPULSE: 0.06,
    ROBOT_ANGULAR_IMPULSE: 2.0,
    ROBOT_ANGULAR_IMPULSE_LIMIT: 5.0,
    ROBOT_ROTATE_RATE: 4.5,
    
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

    init: function(mcp) {
        var i, len;

        this._super(mcp);
        this.init_constants();
        
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

        this.physics = new Flynn.Physics(mcp.canvas.ctx, this.GRAVITY_X, this.GRAVITY_Y, this.RENDER_SCALE);

        //-------------------
        // Playfield Barriers
        //-------------------
        // Left Barrier
        new Flynn.Body(this.physics, { type: "static",
            x: (this.WALL_THICKNESS/2)/this.RENDER_SCALE,
            y: this.canvasHeight/2/this.RENDER_SCALE,
            height: this.canvasHeight/this.RENDER_SCALE,
            width: this.WALL_THICKNESS/this.RENDER_SCALE,
            color: this.BARRIER_COLOR,
            });
        // Right Barrier
        new Flynn.Body(this.physics, { type: "static",
            x: (this.canvasWidth-this.WALL_THICKNESS/2)/this.RENDER_SCALE,
            y: this.canvasHeight/2/this.RENDER_SCALE,
            height: this.canvasHeight/this.RENDER_SCALE,
            width: this.WALL_THICKNESS/this.RENDER_SCALE,
            color: this.BARRIER_COLOR,
            });
        // Top Barrier
        new Flynn.Body(this.physics, { type: "static",
            x: this.canvasWidth/2/this.RENDER_SCALE,
            y: this.WALL_THICKNESS/2/this.RENDER_SCALE,
            height: this.WALL_THICKNESS/this.RENDER_SCALE,
            width: (this.canvasWidth-2*this.WALL_THICKNESS)/this.RENDER_SCALE,
            color: this.BARRIER_COLOR,
            });
        // Bottom Barrier
        new Flynn.Body(this.physics, { type: "static",
            x: this.canvasWidth/2/this.RENDER_SCALE,
            y: (this.canvasHeight-this.WALL_THICKNESS/2)/this.RENDER_SCALE,
            height: this.WALL_THICKNESS/this.RENDER_SCALE,
            width: (this.canvasWidth-2*this.WALL_THICKNESS)/this.RENDER_SCALE,
            color: this.BARRIER_COLOR,
            });
    
        

        //--------------
        // Bumpers
        //--------------
        // Left Bumper
        new Flynn.Body(this.physics, { type: "static",
            x: (this.BUMPER_MARGIN + this.BUMPER_THICKNESS/2)/this.RENDER_SCALE,
            y: this.canvasHeight/2/this.RENDER_SCALE,
            height: this.BUMPER_LENGTH/this.RENDER_SCALE,
            width: this.BUMPER_THICKNESS/this.RENDER_SCALE,
            color: this.BUMPER_COLOR,
            });
        // // Right Bumper
        new Flynn.Body(this.physics, { type: "static",
            x: (this.canvasWidth - this.BUMPER_MARGIN - this.BUMPER_THICKNESS/2)/this.RENDER_SCALE,
            y: this.canvasHeight/2/this.RENDER_SCALE,
            height: this.BUMPER_LENGTH/this.RENDER_SCALE,
            width: this.BUMPER_THICKNESS/this.RENDER_SCALE,
            color: this.BUMPER_COLOR,
            });
        // // Top Bumper
        new Flynn.Body(this.physics, { type: "static",
            x: this.canvasWidth/2/this.RENDER_SCALE,
            y: (this.BUMPER_MARGIN + this.BUMPER_THICKNESS/2)/this.RENDER_SCALE,
            height: this.BUMPER_THICKNESS/this.RENDER_SCALE,
            width: this.BUMPER_LENGTH/this.RENDER_SCALE,
            color: this.BUMPER_COLOR,
            });
        // // Bottom Bumper
        new Flynn.Body(this.physics, { type: "static",
            x: this.canvasWidth/2/this.RENDER_SCALE,
            y: (this.canvasHeight - this.BUMPER_MARGIN - this.BUMPER_THICKNESS/2)/this.RENDER_SCALE,
            height: this.BUMPER_THICKNESS/this.RENDER_SCALE,
            width: this.BUMPER_LENGTH/this.RENDER_SCALE,
            color: this.BUMPER_COLOR,
            });
        

        //var SPAWN_MARGIN = 50;
        // for(var i = 0; i<0; i++){
        //  new Flynn.Body(this.physics, {
        //      x: (SPAWN_MARGIN +  Math.random() * (this.canvasWidth  - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
        //      y: (SPAWN_MARGIN +  Math.random() * (this.canvasHeight - 2*SPAWN_MARGIN))/this.RENDER_SCALE, shape:"circle" });
        //  new Flynn.Body(this.physics, {
        //      x: (SPAWN_MARGIN +  Math.random() * (this.canvasWidth  - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
        //      y: (SPAWN_MARGIN +  Math.random() * (this.canvasHeight - 2*SPAWN_MARGIN))/this.RENDER_SCALE});
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
                }).body;
            this.leftArm[player] = new Flynn.Body(this.physics, {
                    x: (this.ROBOT_START_X[player] - this.ROBOT_BODY_WIDTH/2 - this.ROBOT_ARM_WIDTH/2 - 0.1)/this.RENDER_SCALE,
                    y: this.ROBOT_START_Y[player]/this.RENDER_SCALE,
                    width: this.ROBOT_ARM_WIDTH/this.RENDER_SCALE,
                    height: this.ROBOT_ARM_HEIGHT/this.RENDER_SCALE,
                    color: this.PLAYER_COLORS[player],
                    // fixedRotation: true,
                }).body;
            this.rightArm[player] = new Flynn.Body(this.physics, {
                    x: (this.ROBOT_START_X[player] + this.ROBOT_BODY_WIDTH/2 + this.ROBOT_ARM_WIDTH/2 )/this.RENDER_SCALE,
                    y: this.ROBOT_START_Y[player]/this.RENDER_SCALE,
                    width: this.ROBOT_ARM_WIDTH/this.RENDER_SCALE,
                    height: this.ROBOT_ARM_HEIGHT/this.RENDER_SCALE,
                    color: this.PLAYER_COLORS[player],
                    // fixedRotation: true,
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
                x: this.canvasWidth/2/this.RENDER_SCALE,
                y: this.canvasHeight/2/this.RENDER_SCALE,
                shape:"circle",
                color: this.BALL_COLOR,
                radius:  this.BALL_RADIUS/this.RENDER_SCALE,
                density: 0.2,
                });

        var self = this;
        ball.contact = function (contact, impulse, first) {
            var magnitude = Math.sqrt(
                impulse.normalImpulses[0] * impulse.normalImpulses[0] + impulse.normalImpulses[1] * impulse.normalImpulses[1]);

            if (magnitude > 0.020 && !self.mcp.timers.isRunning('bounceLockout')){
                self.soundBounce.play();
                self.mcp.timers.set('bounceLockout', this.BOUNCE_LOCKOUT_TICKS);
            }
            
        };
        this.ballBody = ball.body;
        this.physics.collision();


        // Timers
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
        //  this.highscore = this.gameClock;
        // }
        if(this.numPlayers === 1){
            this.goalsRemaining--;
            if(this.goalsRemaining === 0){
                this.gameOver = true;
                this.ballBody.SetPosition(new Box2D.Common.Math.b2Vec2(100,100)); //TODO: Do this better.  Moving off screen for now.
            }
        }
        else{
            this.score[player]++;
            if(this.score[player] >= this.numGoalsToWin2Player){
                this.gameOver = true;
                this.ballBody.SetPosition(new Box2D.Common.Math.b2Vec2(100,100)); //TODO: Do this better.  Moving off screen for now.
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
            force = this.ROBOT_THRUST_IMPULSE;
            center = this.robotBody[i].GetWorldCenter();
            center_v = new Victor(center.x, center.y);
            var rotationApplied = false;
            if(input.virtualButtonIsDown(pNum + 'left')){
                this.robotBody[i].SetAngularVelocity(-this.ROBOT_ROTATE_RATE);
                this.rotationDampenPending = true;
                rotationApplied = true;
            }
            if(input.virtualButtonIsDown(pNum + 'right')){
                this.robotBody[i].SetAngularVelocity(this.ROBOT_ROTATE_RATE);
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
                this.leftArmJoint[i].SetMotorSpeed(this.PUNCH_EXTEND_SPEED);
                this.leftArmJoint[i].EnableMotor(true);
                this.mcp.timers.set(pNum + 'PunchLeftExtend', this.PUNCH_EXTEND_TICKS);
            }
            if(this.mcp.timers.hasExpired(pNum + 'PunchLeftExtend')){
                this.leftArmJoint[i].SetMotorSpeed(-this.PUNCH_RETRACT_SPEED);
                this.mcp.timers.set(pNum + 'PunchLeftRetract', this.PUNCH_RETRACT_TICKS);
            }
            if(this.mcp.timers.hasExpired(pNum + 'PunchLeftRetract')){
                // this.leftArmJoint.SetMotorSpeed(0);
                // this.leftArmJoint.EnableMotor(false);
            }

            if(input.virtualButtonIsPressed(pNum + 'punch right')){
                this.rightArmJoint[i].SetMotorSpeed(this.PUNCH_EXTEND_SPEED);
                this.rightArmJoint[i].EnableMotor(true);
                this.mcp.timers.set(pNum + 'PunchRightExtend', this.PUNCH_EXTEND_TICKS);
            }
            if(this.mcp.timers.hasExpired(pNum + 'PunchRightExtend')){
                this.rightArmJoint[i].SetMotorSpeed(-this.PUNCH_RETRACT_SPEED);
                this.mcp.timers.set(pNum + 'PunchRightRetract', this.PUNCH_RETRACT_TICKS);
            }
            if(this.mcp.timers.hasExpired(pNum + 'PunchRightRetract')){
                // this.rightArmJoint.SetMotorSpeed(0);
                // this.rightArmJoint.EnableMotor(false);
            }
        }
    },

    update: function(paceFactor) {
        if(!this.gameOver){
            this.gameClock += paceFactor;
        }
        this.physics.update(paceFactor);

        var ball_pos = this.ballBody.GetPosition();
        var x = ball_pos.x * this.RENDER_SCALE;
        var y = ball_pos.y * this.RENDER_SCALE;
        for(var i=0, len=this.numPlayers; i<len; i++){
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
        ctx.clearAll();

        //------------
        // Text
        //------------
        if(this.numPlayers === 1){
            ctx.vectorText('GOALS REMAIING: ' + this.goalsRemaining, 2, this.canvasWidth-230, 30, null, Flynn.Colors.YELLOW);
            ctx.vectorText('TIME ' + Flynn.Util.ticksToTime(this.gameClock),
                2, this.canvasWidth-180, 50, null, Flynn.Colors.YELLOW);
        }
        else{
            ctx.vectorText(this.score[0], 3, 30, 30, null, this.PLAYER_COLORS[0]);
            ctx.vectorText(this.score[1], 3, this.canvasWidth-30, 30, 0, this.PLAYER_COLORS[1]);
        }

        for(i=0, len=this.numPlayers; i<len; i++){
            ctx.vectorRect(this.GOAL_X[i], this.GOAL_Y[i], this.GOAL_SIZE, this.GOAL_SIZE, this.GOAL_COLORS[i]);
        }
        this.physics.render(ctx);

        ctx.vectorRect(this.WALL_THICKNESS-1,this.WALL_THICKNESS-1,this.canvasWidth-this.WALL_THICKNESS*2+2, this.canvasHeight-this.WALL_THICKNESS*2+2, Flynn.Colors.GRAY);

        // Game Over
        if(this.gameOver){
            ctx.vectorText("GAME OVER", 6, null, 230, null, Flynn.Colors.YELLOW);
            ctx.vectorText("PRESS <ENTER>", 2, null, 280, null, Flynn.Colors.YELLOW);
        }
    }
});