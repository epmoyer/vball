if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.CANVAS_HEIGHT = 768;
Game.CANVAS_WIDTH = 1024;
Game.SPEED_FACTOR = 0.7;

Game.States = {
    NO_CHANGE: 0,
    MENU:      1,
    CONFIG:    2,
    GAME:      3,
    END:       4
};

Game.Main = Class.extend({
    
    init: function() {
        "use strict";

        var self = this;
        
        this.input = new Flynn.InputHandler();

        this.mcp = new Flynn.Mcp(Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT, this.input, Game.States.NO_CHANGE, Game.SPEED_FACTOR);
        this.mcp.setStateBuilderFunc(
            function(state){
                switch(state){
                    case Game.States.MENU:
                        return new Game.StateMenu(self.mcp);
                    case Game.States.GAME:
                        return new Game.StateGame(self.mcp);
                    case Game.States.END:
                        var newState = new Flynn.StateEnd(
                            self.mcp,
                            self.mcp.custom.score,
                            self.mcp.custom.leaderboard,
                            Flynn.Colors.CYAN,
                            'BEST TIMES',
                            'YOUR TIME IS AMONG THE BEST!',
                            Game.States.MENU
                            );
                        newState.scoreToString = function(score){return Flynn.Util.ticksToTime(score);};  // Render score as time
                        return newState;
                    case Game.States.CONFIG:
                        return new Flynn.StateConfig(
                            self.mcp, 
                            Flynn.Colors.ORANGE, 
                            Flynn.Colors.YELLOW,
                            Flynn.Colors.CYAN,
                            Flynn.Colors.MAGENTA,
                            Game.States.MENU
                            );
                }
            }
        );
        this.mcp.nextState = Game.States.MENU;
        this.mcp.custom.score = 0;

        this.mcp.custom.leaderboard = new Flynn.Leaderboard(
            this.mcp,
            ['name', 'score'],  // attributeList
            5,                  // maxItems
            false               // sortDescending
            );
        this.mcp.custom.leaderboard.setDefaultList(
            [
                {'name': 'FIENDFODDER', 'score': 120*60},
                {'name': 'ROCKEM',      'score': 128*60},
                {'name': 'SOCKEM',      'score': 130*60},
                {'name': 'BECKAM',      'score': 160*60},
                {'name': 'ALI',         'score': 170*60},
            ]);
        this.mcp.custom.leaderboard.loadFromCookies();
        this.mcp.custom.leaderboard.saveToCookies();

        // Setup inputs
        if(!this.mcp.iCadeModeEnabled){
            this.input.addVirtualButton('P1 left', Flynn.KeyboardMap.a, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 right', Flynn.KeyboardMap.s, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 thrust', Flynn.KeyboardMap.d, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 punch left', Flynn.KeyboardMap.f, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 punch right', Flynn.KeyboardMap.g, Flynn.BUTTON_CONFIGURABLE);

            this.input.addVirtualButton('P2 left', Flynn.KeyboardMap.i, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 right', Flynn.KeyboardMap.o, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 thrust', Flynn.KeyboardMap.p, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 punch left', Flynn.KeyboardMap.left_bracket, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 punch right', Flynn.KeyboardMap.right_bracket, Flynn.BUTTON_CONFIGURABLE);
        }else{
            this.input.addVirtualButton('P1 left', Flynn.KeyboardMap.icade_left, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 right', Flynn.KeyboardMap.icade_right, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 thrust', Flynn.KeyboardMap.icade_up, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 punch left', Flynn.KeyboardMap.icade_t1, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 punch right', Flynn.KeyboardMap.icade_t2, Flynn.BUTTON_CONFIGURABLE);

            this.input.addVirtualButton('P2 left', Flynn.KeyboardMap.icade_b1, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 right', Flynn.KeyboardMap.icade_b2, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 thrust', Flynn.KeyboardMap.icade_b3, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 punch left', Flynn.KeyboardMap.icade_t3, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 punch right', Flynn.KeyboardMap.icade_t4, Flynn.BUTTON_CONFIGURABLE);
        }       

        if(this.mcp.developerModeEnabled){
            this.input.addVirtualButton('dev_metrics', Flynn.KeyboardMap.num_6, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('dev_slow_mo', Flynn.KeyboardMap.num_7, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('dev_fps_20', Flynn.KeyboardMap.backslash, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('dev_add_points_0', Flynn.KeyboardMap.num_8, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('dev_add_points_1', Flynn.KeyboardMap.num_9, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('dev_reset', Flynn.KeyboardMap.num_0, Flynn.BUTTON_NOT_CONFIGURABLE);
        }
        if(this.mcp.arcadeModeEnabled && !this.mcp.iCadeModeEnabled){
            // Re-map game keys
            this.input.addVirtualButton('P1 left', Flynn.KeyboardMap.left, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 right', Flynn.KeyboardMap.right, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 thrust', Flynn.KeyboardMap.enter, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 punch left', Flynn.KeyboardMap.z, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P1 punch right', Flynn.KeyboardMap.spacebar, Flynn.BUTTON_CONFIGURABLE);

            this.input.addVirtualButton('P2 left', Flynn.KeyboardMap.d, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 right', Flynn.KeyboardMap.g, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 thrust', Flynn.KeyboardMap.i, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 punch left', Flynn.KeyboardMap.o, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('P2 punch right', Flynn.KeyboardMap.p, Flynn.BUTTON_CONFIGURABLE);
        }

        // Options
        this.mcp.optionManager.addOptionFromVirtualButton('P1 left');
        this.mcp.optionManager.addOptionFromVirtualButton('P1 right');
        this.mcp.optionManager.addOptionFromVirtualButton('P1 thrust');
        this.mcp.optionManager.addOptionFromVirtualButton('P1 punch left');
        this.mcp.optionManager.addOptionFromVirtualButton('P1 punch right');
        this.mcp.optionManager.addOptionFromVirtualButton('P2 left');
        this.mcp.optionManager.addOptionFromVirtualButton('P2 right');
        this.mcp.optionManager.addOptionFromVirtualButton('P2 thrust');
        this.mcp.optionManager.addOptionFromVirtualButton('P2 punch left');
        this.mcp.optionManager.addOptionFromVirtualButton('P2 punch right');
        this.mcp.optionManager.addOption('musicEnabled', Flynn.OptionType.BOOLEAN, true, true, 'MUSIC', null, null);
        this.mcp.optionManager.addOption('resetScores', Flynn.OptionType.COMMAND, true, true, 'RESET HIGH SCORES', null,
            function(){self.resetScores();});

        // Restore user option settings from cookies
        this.mcp.optionManager.loadFromCookies();
        
        // Set resize handler and force a resize
        this.mcp.setResizeFunc( function(width, height){
            if(self.mcp.browserSupportsTouch){
                // self.input.addTouchRegion("rotate left",0,0,width/4,height); // Left quarter
                // self.input.addTouchRegion("rotate right",width/4+1,0,width/2,height); // Left second quarter
                // self.input.addTouchRegion("thrust",width/2+1,0,width,height); // Right half
                // self.input.addTouchRegion("UI_enter",0,0,width,height); // Whole screen
            }
        });
        this.mcp.resize();
    },

    resetScores: function(){
        this.mcp.custom.leaderboard.restoreDefaults();
    },

    run: function() {
        // Start the game
        this.mcp.run();
    }
});