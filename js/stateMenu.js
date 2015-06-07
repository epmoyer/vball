//--------------------------------------------
// StateMenu class
//    Startup screen
//--------------------------------------------

var StateMenu = FlynnState.extend({

	init: function(mcp){
		this._super(mcp);

		this.canvasWidth = mcp.canvas.ctx.width;
		this.canvasHeight = mcp.canvas.ctx.height;

		this.start_sound = new Howl({
			src: ['sounds/Tripple_blip.ogg','sounds/Tripple_blip.mp3'],
			volume: 0.5
		});

        this.insert_coin_sound = new Howl({
            src: ['sounds/InsertCoin.ogg','sounds/InsertCoin.mp3'],
            volume: 0.5
        });
	},

	handleInputs: function(input, paceFactor) {
		// Metrics toggle
        if(this.mcp.developerModeEnabled) {
            if (input.virtualButtonIsPressed("dev_metrics")) {
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
        }
        if(this.mcp.arcadeModeEnabled) {
            if (input.virtualButtonIsPressed("quarter")) {
                this.mcp.credits += 1;
                this.insert_coin_sound.play();
            }
        }

		if (  ( !this.mcp.arcadeModeEnabled && input.virtualButtonIsPressed("UI_enter")) ||
            ( this.mcp.arcadeModeEnabled && (this.mcp.credits > 0) && input.virtualButtonIsPressed("start_1")))
        {
            this.mcp.credits -= 1;
			this.mcp.nextState = States.GAME;
            this.mcp.numPlayers = 1;
			this.start_sound.play();
		}
        if (  ( !this.mcp.arcadeModeEnabled && input.virtualButtonIsPressed("UI_enter")) ||
            ( this.mcp.arcadeModeEnabled && (this.mcp.credits > 1) && input.virtualButtonIsPressed("start_2")))
        {
            this.mcp.credits -= 2;
            this.mcp.nextState = States.GAME;
            this.mcp.numPlayers = 2;
            this.start_sound.play();
        }

        if (input.virtualButtonIsPressed("UI_escape")) {
            this.mcp.nextState = States.CONFIG;
        }
	},

	update: function(paceFactor) {

	},

	render: function(ctx) {
        ctx.clearAll();
        var title_step = 5;

        // Font Test
        //ctx.vectorText("!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`",
        //	2.5, 30, 30, null, FlynnColors.MAGENTA);
        //ctx.vectorText("Unimplemented:{|}~",
        //	2.5, 30, 55, null, FlynnColors.MAGENTA);

        for (var angle = 0; angle < Math.PI + 0.1; angle += Math.PI) {
            x_pos = 350;
            y_pos = 50;
            ctx.vectorText("V-BALL", 10, x_pos, y_pos, null, FlynnColors.CYAN);
            ctx.vectorText("V-BALL", 10,  x_pos + 3, y_pos +3, null, FlynnColors.MAGENTA);
        }

        ctx.vectorText("VERSION 0.3", 1.5, null, 140, null, FlynnColors.CYAN);

        var startText;
        var controlsText1='', controlsText2='';
        if (this.mcp.arcadeModeEnabled) {
            startText = "PRESS START";
            controlsText1 = "LEFTMOST WHITE BUTTONS TO ROTATE        FAR RIGHT WHITE BUTTON TO THRUST";
            controlsText2 = " "
            // this.mcp.custom.thrustPrompt = "PRESS LEFT BUTTON TO THRUST";
            // this.mcp.custom.shootPrompt = "PRESS RIGHT BUTTON TO SHOOT";
            ctx.vectorText(this.mcp.credits + " Credits", 2, 10, this.canvasHeight - 20, null, FlynnColors.CYAN);
        }
        else {
            if (!this.mcp.browserSupportsTouch) {
                startText = "PRESS <ENTER> TO START";
                // controlsText1 =
                //     "PUNCH  LEFT:" +
                //     this.mcp.input.getVirtualButtonBoundKeyName("punch left") +
                //     "      PUNCH  RIGHT:" +
                //     this.mcp.input.getVirtualButtonBoundKeyName("punch right");
                // controlsText2 =
                //     "THRUST LEFT:" +
                //     this.mcp.input.getVirtualButtonBoundKeyName("thrust left") +
                //     "      THRUST RIGHT:" +
                //     this.mcp.input.getVirtualButtonBoundKeyName("thrust right");
            }
            else{
                startText = "PUSH AYWHERE TO START";
                controlsText2 = "THRUST LEFT, THRUST RIGHT, PUNCH LEFT, PUNCH RIGHT";
            }
        }

        //      this.mcp.custom.shootPrompt = "PRESS SPACE TO SHOOT";
        //     } else {
        //         startText = "TAP ANYWHERE TO START";
        //         //              #########################################
        //         controlsText = "TAP LEFT TO THRUST   TAP RIGHT TO SHOOT";
        //         this.mcp.custom.thrustPrompt = "TAP LEFT TO THRUST";
        //         this.mcp.custom.shootPrompt = "TAP RIGHT TO SHOOT";
        //     }
        // }

        // ctx.vectorText(controlsText1, 2, null, 280, null, FlynnColors.YELLOW);
        // ctx.vectorText(controlsText2, 2, null, 300, null, FlynnColors.YELLOW);
        if(!this.mcp.arcadeModeEnabled || (this.mcp.arcadeModeEnabled && (this.mcp.credits > 0))) {
            if (Math.floor(this.mcp.clock / 40) % 2 == 1) {
                ctx.vectorText(startText, 2, null, 400, null, FlynnColors.GREEN);
            }
        }
        var y = 180;
        var x = this.canvasWidth/2 + 50;
        var i, len;
        var names = this.mcp.input.getConfigurableVirtualButtonNames();
        //this.controls = [];
        // for(i=0, len=names.length; i<len; i++){
        //     this.controls.push(names[i] + ' : ' + this.mcp.input.getVirtualButtonBoundKeyName(names[i]));
        // }
        // for(i = 0, len = this.controls.length; i<len; i++){
        //     ctx.vectorText(this.controls[i], 2, x, y, null, FlynnColors.YELLOW);
        //     y += 20;
        // }

        for(i = 0, len = names.length; i<len; i++){
            ctx.vectorText(names[i]+":", 2, x, y, -1, FlynnColors.YELLOW);
            ctx.vectorText(this.mcp.input.getVirtualButtonBoundKeyName(names[i]), 2, x, y, null, FlynnColors.YELLOW);
            y += 20;
        }


        ctx.vectorText("PUT THE BALL IN THE THING!", 3, null, 500, null, FlynnColors.CYAN);
        ctx.vectorText("A BOX2D THRUST/PUCH TECH DEMO", 1.5, null, 530, null, FlynnColors.CYAN);

		ctx.vectorText("WRITTEN BY ERIC MOYER (FIENDFODDER)", 1.5, null, 700, null, FlynnColors.CYAN);
        ctx.vectorText('PRESS <ESCAPE> TO CONFIGURE CONTROLS', 1.5, null, 715, null, FlynnColors.CYAN);


	}

});