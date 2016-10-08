//--------------------------------------------
// StateMenu class
//    Startup screen
//--------------------------------------------
if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.StateMenu = Flynn.State.extend({

    init: function(){

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
        if(Flynn.mcp.developerModeEnabled) {
            if (input.virtualButtonWasPressed("dev_metrics")) {
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
        }
        if(Flynn.mcp.arcadeModeEnabled) {
            if (input.virtualButtonWasPressed("UI_quarter")) {
                Flynn.mcp.credits += 1;
                this.insert_coin_sound.play();
            }
        }

        if (  ( !Flynn.mcp.arcadeModeEnabled && input.virtualButtonWasPressed("UI_enter")) ||
            ( Flynn.mcp.arcadeModeEnabled && (Flynn.mcp.credits > 0) && input.virtualButtonWasPressed("UI_start1")))
        {
            Flynn.mcp.credits -= 1;
            Flynn.mcp.changeState(Game.States.GAME);
            Flynn.mcp.numPlayers = 1;
            this.start_sound.play();
        }
        if (  ( !Flynn.mcp.arcadeModeEnabled && input.virtualButtonWasPressed("UI_enter")) ||
            ( Flynn.mcp.arcadeModeEnabled && (Flynn.mcp.credits > 1) && input.virtualButtonWasPressed("UI_start2")))
        {
            Flynn.mcp.credits -= 2;
            Flynn.mcp.changeState(Game.States.GAME);
            Flynn.mcp.numPlayers = 2;
            this.start_sound.play();
        }

        if (input.virtualButtonWasPressed("UI_escape")) {
            Flynn.mcp.changeState(Game.States.CONFIG);
        }

        if (input.virtualButtonWasPressed("UI_exit") && Flynn.mcp.backEnabled){
            window.history.back();
        }
    },

    update: function(paceFactor) {

    },

    render: function(ctx) {
        ctx.clearAll();
        var title_step = 5;
        var is_world = false;

        var title = 'V-BALL';
        var x_pos = Game.CANVAS_WIDTH /2;
        var y_pos = 14;
        ctx.vectorText(title, 10, x_pos, y_pos, 'center', Flynn.Colors.CYAN, is_world, Flynn.Font.Block);
        ctx.vectorText(title, 10,  x_pos + 3, y_pos +3, 'center', Flynn.Colors.MAGENTA, is_world, Flynn.Font.Block);

        // for (var angle = 0; angle < Math.PI + 0.1; angle += Math.PI) {
        //     var x_pos = 350;
        //     var y_pos = 50;
        //     ctx.vectorText("V-BALL", 10, x_pos, y_pos, 'left', Flynn.Colors.CYAN);
        //     ctx.vectorText("V-BALL", 10,  x_pos + 3, y_pos +3, 'left', Flynn.Colors.MAGENTA);
        // }

        ctx.vectorText("VERSION " + Game.VERSION, 1.5, null, 130, null, Flynn.Colors.CYAN);

        var startText;
        var controlsText1='', controlsText2='';
        if (Flynn.mcp.arcadeModeEnabled) {
            startText = "PRESS START";
            controlsText1 = "LEFTMOST WHITE BUTTONS TO ROTATE        FAR RIGHT WHITE BUTTON TO THRUST";
            controlsText2 = " ";
            // Flynn.mcp.custom.thrustPrompt = "PRESS LEFT BUTTON TO THRUST";
            // Flynn.mcp.custom.shootPrompt = "PRESS RIGHT BUTTON TO SHOOT";
            ctx.vectorText(Flynn.mcp.credits + " Credits", 2, 10, Game.CANVAS_HEIGHT - 20, 'left', Flynn.Colors.CYAN);
        }
        else {
            if (!Flynn.mcp.browserSupportsTouch) {
                startText = "PRESS <ENTER> TO START";
                // controlsText1 =
                //     "PUNCH  LEFT:" +
                //     Flynn.mcp.input.getVirtualButtonBoundKeyName("punch left") +
                //     "      PUNCH  RIGHT:" +
                //     Flynn.mcp.input.getVirtualButtonBoundKeyName("punch right");
                // controlsText2 =
                //     "THRUST LEFT:" +
                //     Flynn.mcp.input.getVirtualButtonBoundKeyName("thrust left") +
                //     "      THRUST RIGHT:" +
                //     Flynn.mcp.input.getVirtualButtonBoundKeyName("thrust right");
            }
            else{
                startText = "PUSH AYWHERE TO START";
                controlsText2 = "THRUST LEFT, THRUST RIGHT, PUNCH LEFT, PUNCH RIGHT";
            }
        }

        //      Flynn.mcp.custom.shootPrompt = "PRESS SPACE TO SHOOT";
        //     } else {
        //         startText = "TAP ANYWHERE TO START";
        //         //              #########################################
        //         controlsText = "TAP LEFT TO THRUST   TAP RIGHT TO SHOOT";
        //         Flynn.mcp.custom.thrustPrompt = "TAP LEFT TO THRUST";
        //         Flynn.mcp.custom.shootPrompt = "TAP RIGHT TO SHOOT";
        //     }
        // }

        // ctx.vectorText(controlsText1, 2, null, 280, null, Flynn.Colors.YELLOW);
        // ctx.vectorText(controlsText2, 2, null, 300, null, Flynn.Colors.YELLOW);
        if(!Flynn.mcp.arcadeModeEnabled || (Flynn.mcp.arcadeModeEnabled && (Flynn.mcp.credits > 0))) {
            if (Math.floor(Flynn.mcp.clock / 40) % 2 == 1) {
                ctx.vectorText(startText, 2, null, 400, null, Flynn.Colors.GREEN);
            }
        }
        var y = 180;
        var x = Game.CANVAS_WIDTH/2 + 50;
        var i, len;
        var names = Flynn.mcp.input.getConfigurableVirtualButtonNames();
        //this.controls = [];
        // for(i=0, len=names.length; i<len; i++){
        //     this.controls.push(names[i] + ' : ' + Flynn.mcp.input.getVirtualButtonBoundKeyName(names[i]));
        // }
        // for(i = 0, len = this.controls.length; i<len; i++){
        //     ctx.vectorText(this.controls[i], 2, x, y, null, Flynn.Colors.YELLOW);
        //     y += 20;
        // }

        for(i = 0, len = names.length; i<len; i++){
            ctx.vectorText(names[i]+":", 2, x-10, y, 'right', Flynn.Colors.YELLOW);
            ctx.vectorText(Flynn.mcp.input.getVirtualButtonBoundKeyName(names[i]), 2, x, y, 'left', Flynn.Colors.YELLOW);
            y += 20;
        }


        ctx.vectorText("PUT THE BALL IN THE THING!", 3, null, 500, null, Flynn.Colors.CYAN);
        ctx.vectorText("A BOX2D THRUST/PUCH TECH DEMO", 1.5, null, 530, null, Flynn.Colors.CYAN);

        ctx.vectorText("WRITTEN BY ERIC MOYER (FIENDFODDER)", 1.5, null, 700, null, Flynn.Colors.CYAN);
        ctx.vectorText('PRESS <ESCAPE> TO CONFIGURE CONTROLS', 1.5, null, 715, null, Flynn.Colors.CYAN);
        if(Flynn.mcp.backEnabled){
            ctx.vectorText('PRESS <TAB> TO EXIT GAME', 1.5, null, 730, null, Flynn.Colors.CYAN);
        }

        Flynn.mcp.renderLogo(ctx);
    }

});