//--------------------------------------------
// StateMenu class
//    Startup screen
//--------------------------------------------
var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.StateMenu = Flynn.State.extend({

    IS_CENTERED: true,
    VIEW_PHASES:{
        NORMAL: 0,
        SCORES: 1,
        CREDITS: 2,
    },
    VIEW_PHASE_TICKS_NORMAL: 60 * 7,
    VIEW_PHASE_TICKS_SCORES: 60 * 4,
    VIEW_PHASE_TICKS_CREDITS: 60 * 4,

    init: function(){
        this.view_phase = this.VIEW_PHASES.NORMAL;

        this.timers = new Flynn.Timers();
        this.timers.add("view_phase", this.VIEW_PHASE_TICKS_NORMAL, null);

        this.va_logo = new Flynn.VALogo(
            new Victor(60, Flynn.mcp.canvasHeight - 60),
            1,
            false);
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
                Game.sounds.insert_coin.play();
            }
        }

        if ( input.virtualButtonWasPressed("UI_start1")
             && ( !Flynn.mcp.arcadeModeEnabled 
                  || ( Flynn.mcp.arcadeModeEnabled && (Flynn.mcp.credits > 0)))){
            Flynn.mcp.credits -= 1;
            Flynn.mcp.changeState(Game.States.GAME);
            Flynn.mcp.numPlayers = 1;
            Game.sounds.start_game.play();
        }
        if ( input.virtualButtonWasPressed("UI_start2")
             && ( !Flynn.mcp.arcadeModeEnabled 
                  || ( Flynn.mcp.arcadeModeEnabled && (Flynn.mcp.credits > 0)))){
            Flynn.mcp.credits -= 2;
            Flynn.mcp.changeState(Game.States.GAME);
            Flynn.mcp.numPlayers = 2;
            Game.sounds.start_game.play();
        }

        if (input.virtualButtonWasPressed("UI_escape")) {
            Flynn.mcp.changeState(Game.States.CONFIG);
        }

        if (input.virtualButtonWasPressed("UI_exit") && Flynn.mcp.backEnabled){
            window.history.back();
        }
    },

    update: function(paceFactor) {
        // View phase transitions
        this.timers.update(paceFactor);
        if(this.timers.hasExpired("view_phase")){
            switch(this.view_phase){
                case this.VIEW_PHASES.NORMAL:
                    this.view_phase = this.VIEW_PHASES.SCORES;
                    this.timers.set("view_phase", this.VIEW_PHASE_TICKS_SCORES);
                    break;
                case this.VIEW_PHASES.SCORES:
                    this.view_phase = this.VIEW_PHASES.CREDITS;
                    this.timers.set("view_phase", this.VIEW_PHASE_TICKS_CREDITS);
                    break;
                case this.VIEW_PHASES.CREDITS:
                    this.view_phase = this.VIEW_PHASES.NORMAL;
                    this.timers.set("view_phase", this.VIEW_PHASE_TICKS_NORMAL);
                    break;
            }
        }

        this.va_logo.update(paceFactor);
    },

    render: function(ctx) {
        ctx.clearAll();
        var title_step = 5;
        var is_world = false;
        var i, len, leader;

        var title = 'V-BALL';
        var x_pos = Game.CANVAS_WIDTH /2;
        var y_pos = 14;
        ctx.vectorText(title, 10, x_pos, y_pos, 'center', Flynn.Colors.CYAN, is_world, Flynn.Font.Block);
        ctx.vectorText(title, 10,  x_pos + 3, y_pos +3, 'center', Flynn.Colors.GREEN, is_world, Flynn.Font.Block);

        ctx.vectorText("VERSION " + Game.VERSION, 1.5, null, 130, null, Flynn.Colors.CYAN);

        var startText;
        var controlsText1='', controlsText2='';
        var credit_text, y_step, y_text, line_text, line_color;

        switch(this.view_phase){
            case this.VIEW_PHASES.NORMAL:
                if (Flynn.mcp.arcadeModeEnabled) {
                    startText = "PRESS START";
                    controlsText1 = "LEFTMOST WHITE BUTTONS TO ROTATE        FAR RIGHT WHITE BUTTON TO THRUST";
                    controlsText2 = " ";
                }
                else {
                    if (!Flynn.mcp.browserSupportsTouch) {
                        startText = 
                            "PRESS 1 FOR ONE PLAYER START" +
                            // Game.get_keyname('UI_start1') + 
                            "     " +
                            "PRESS 2 FOR TWO PLAYER START";
                            // Game.get_keyname('UI_start2');
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
                ctx.vectorText("A BOX2D THRUST/PUNCH TECH DEMO", 1.5, null, 530, null, Flynn.Colors.CYAN);

                ctx.vectorText("CREATED BY ERIC MOYER (FIENDFODDER)", 1.5, null, 700, null, Flynn.Colors.CYAN);
                break;

             case this.VIEW_PHASES.SCORES:
                var y_top = 315;
                ctx.vectorText('HIGH SCORES', 2, null, y_top-25*2, null, Flynn.Colors.CYAN);
                for (i = 0, len = Game.config.leaderboard.leaderList.length; i < len; i++) {
                    leader = Game.config.leaderboard.leaderList[i];
                    ctx.vectorText(leader.name, 2, 360, y_top+25*i, 'left', Flynn.Colors.CYAN);
                    ctx.vectorText(Flynn.Util.ticksToTime(leader.score), 2, 660, y_top+25*i,'right', Flynn.Colors.CYAN);
                }
                break;

            case this.VIEW_PHASES.CREDITS:
                credit_text = [
                    'CREDITS',
                    '',
                    "CREATED BY ERIC MOYER",
                    '',
                    'MUSIC "CLUBFIGHT" BY DST (NOSOAPRADIO.US)',
                    '',
                    'MORE GAMES AT VECTORALCHEMY.COM',
                    '',
                    'WANT TO HELP?',
                    '*WWW.PATREON.COM/VECTORALCHEMY'
                ];
                y_step = 25;
                y_text = Game.CANVAS_HEIGHT/2 - y_step*credit_text.length/2;
                for(i=0; i<credit_text.length; i++){
                    line_text = credit_text[i];
                    line_color = Flynn.Colors.GREEN;
                    if(line_text.startsWith('*')){
                        line_color = Flynn.Colors.ORANGE;
                        line_text = line_text.substring(1);
                    }
                    ctx.vectorText(line_text, 2, null, y_text + y_step*i, null, line_color);
                }

                break;
        } // end switch
        if(Flynn.mcp.arcadeModeEnabled){
            ctx.vectorText(Flynn.mcp.credits + " Credits", 2, 10, Game.CANVAS_HEIGHT - 20, 'left', Flynn.Colors.CYAN);
        }

        ctx.vectorText('PRESS <ESCAPE> TO CONFIGURE CONTROLS', 1.5, null, 715, null, Flynn.Colors.GRAY);
        if(Flynn.mcp.backEnabled){
            ctx.vectorText('PRESS <TAB> TO EXIT GAME', 1.5, null, 730, null, Flynn.Colors.GRAY);
        }
        
        Flynn.mcp.renderLogo(ctx);
        this.va_logo.render(ctx);
    }
});

Game.get_keyname = function(virtual_button_name){
    return Flynn.mcp.input.getVirtualButtonBoundKeyName(virtual_button_name).toUpperCase();
};

}()); // "use strict" wrapper