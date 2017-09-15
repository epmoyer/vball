var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.VERSION = '1.12.0';
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

        var self = this;

        Flynn.init(
            Game.CANVAS_WIDTH,
            Game.CANVAS_HEIGHT, 
            Game.States.NO_CHANGE,
            Game.SPEED_FACTOR,
            function(state){
                switch(state){
                    case Game.States.MENU:
                        Game.state_game = null;
                        return new Game.StateMenu();
                    case Game.States.GAME:
                        if(!Game.state_game){
                            // Start new game
                            Game.state_game = new Game.StateGame();
                        }
                        return Game.state_game;
                    case Game.States.END:
                        Game.state_game = null;
                        var newState = new Flynn.StateEnd(
                            Game.config.score.time,
                            Game.config.leaderboard,
                            Flynn.Colors.CYAN,
                            'BEST TIMES',
                            'YOUR TIME IS AMONG THE BEST!',
                            Game.States.MENU
                            );
                        newState.scoreToString = function(score){return Flynn.Util.ticksToTime(score);};  // Render score as time
                        return newState;
                    case Game.States.CONFIG:
                        return new Flynn.StateConfig(
                            Flynn.Colors.ORANGE, 
                            Flynn.Colors.YELLOW,
                            Flynn.Colors.CYAN,
                            Flynn.Colors.MAGENTA,
                            Game.state_game ? Game.States.GAME : Game.States.MENU, // Parent state
                            Game.States.MENU,         // Abort state
                            Game.state_game !== null  // Abort enable
                            );
                }
            }
        );
        Flynn.mcp.changeState(Game.States.MENU);

        Game.config = {};
        Game.config.score = {
            // Scoring for 2 player games
            goals: [   
                0, // player 1
                0  // player 2
            ],
            // Scoring for 1 player games
            time: 0
        };
        Game.config.leaderboard = new Flynn.Leaderboard(
            ['name', 'score'],   // attributeList
            5,                  // maxItems
            false               // sortDescending
            );
        Game.config.leaderboard.setDefaultList(
            [
                {'name': 'FIENDFODDER', 'score': 120*60},
                {'name': 'ROCKEM',      'score': 128*60},
                {'name': 'SOCKEM',      'score': 130*60},
                {'name': 'BECKAM',      'score': 160*60},
                {'name': 'ALI',         'score': 170*60},
            ]);
        Game.config.leaderboard.loadFromCookies();
        Game.config.leaderboard.saveToCookies();

        // Setup inputs
        var input = Flynn.mcp.input;
        if(!Flynn.mcp.iCadeModeEnabled){
            input.addVirtualButton('P1 left',        Flynn.KeyboardMap.a,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 right',       Flynn.KeyboardMap.s,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 thrust',      Flynn.KeyboardMap.d,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 punch left',  Flynn.KeyboardMap.f,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 punch right', Flynn.KeyboardMap.g,             Flynn.BUTTON_CONFIGURABLE);

            input.addVirtualButton('P2 left',        Flynn.KeyboardMap.i,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 right',       Flynn.KeyboardMap.o,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 thrust',      Flynn.KeyboardMap.p,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 punch left',  Flynn.KeyboardMap.left_bracket,  Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 punch right', Flynn.KeyboardMap.right_bracket, Flynn.BUTTON_CONFIGURABLE);
        }else{
            input.addVirtualButton('P1 left',        Flynn.KeyboardMap.icade_left,    Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 right',       Flynn.KeyboardMap.icade_right,   Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 thrust',      Flynn.KeyboardMap.icade_up,      Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 punch left',  Flynn.KeyboardMap.icade_t1,      Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 punch right', Flynn.KeyboardMap.icade_t2,      Flynn.BUTTON_CONFIGURABLE);
     
            input.addVirtualButton('P2 left',        Flynn.KeyboardMap.icade_b1,      Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 right',       Flynn.KeyboardMap.icade_b2,      Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 thrust',      Flynn.KeyboardMap.icade_b3,      Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 punch left',  Flynn.KeyboardMap.icade_t3,      Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 punch right', Flynn.KeyboardMap.icade_t4,      Flynn.BUTTON_CONFIGURABLE);
        }       

        if(Flynn.mcp.developerModeEnabled){
            input.addVirtualButton('dev_metrics',    Flynn.KeyboardMap.num_6,         Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_slow_mo',    Flynn.KeyboardMap.num_7,         Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_fps_20',     Flynn.KeyboardMap.backslash,     Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_add_points_0', Flynn.KeyboardMap.num_8,       Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_add_points_1', Flynn.KeyboardMap.num_9,       Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_reset',      Flynn.KeyboardMap.num_0,         Flynn.BUTTON_NOT_CONFIGURABLE);
        }
        if(Flynn.mcp.arcadeModeEnabled && !Flynn.mcp.iCadeModeEnabled){
            // Re-map game keys
            input.addVirtualButton('P1 left',        Flynn.KeyboardMap.left,          Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 right',       Flynn.KeyboardMap.right,         Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 thrust',      Flynn.KeyboardMap.enter,         Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 punch left',  Flynn.KeyboardMap.z,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P1 punch right', Flynn.KeyboardMap.spacebar,      Flynn.BUTTON_CONFIGURABLE);

            input.addVirtualButton('P2 left',        Flynn.KeyboardMap.d,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 right',       Flynn.KeyboardMap.g,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 thrust',      Flynn.KeyboardMap.i,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 punch left',  Flynn.KeyboardMap.o,             Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('P2 punch right', Flynn.KeyboardMap.p,             Flynn.BUTTON_CONFIGURABLE);
        }

        //----------------------
        // Sounds
        //----------------------
        Game.sounds = {
            music:{ 
                intro: new Howl({
                    src: ['sounds/DST-ClubFight.mp3'],
                    loop: true,
                    buffer: !this.browserIsIos,  // Buffering causes problems on iOS devices
                    volume: 0.3 }),
            },

            // Interface
            insert_coin: new Howl({
                src: ['sounds/InsertCoin.ogg','sounds/InsertCoin.mp3'],
                volume: 0.5 }),

            start_game: new Howl({
                src: ['sounds/Tripple_blip.ogg','sounds/Tripple_blip.mp3'],
                volume: 0.5 }),

            // Primary
            bounce: new Howl({
                src: ['sounds/BallBounce.webm','sounds/BallBounce.mp3'],
                volume: 0.5 }),
            score: new Howl({
                src: ['sounds/Tripple_blip.ogg','sounds/Tripple_blip.mp3'],
                volume: 0.5 }),
            thrust0: new Howl({
                src: ['sounds/Engine0.mp3'],
                volume: 0.2,
                loop: true }),
            thrust1: new Howl({
                src: ['sounds/Engine1.mp3'],
                volume: 0.2,
                loop: true }),
        };

        Game.updateMusic = function(){
            var enabled = (
                Flynn.mcp.optionManager.getOption('musicEnabled') &&
                Flynn.mcp.optionManager.getOption('soundEnabled')
                );
            if(enabled){
                if(!Game.sounds.music.intro.playing()){
                    Game.sounds.music.intro.play();
                }
            }
            else{
                Game.sounds.music.intro.stop();
            }
        };
        Game.updateSound = function(){
            var sound_enabled = Flynn.mcp.optionManager.getOption('soundEnabled');
            Flynn.mcp.muteAudio(!sound_enabled);
            Game.updateMusic();
        };
        Game.updateSoundOptionChange = function(){
            Game.updateSound();
            var sound;
            var sound_enabled = Flynn.mcp.optionManager.getOption('soundEnabled');
            if (sound_enabled){
                Flynn.sounds.ui_select.play();
            }
        };

        // Options
        Flynn.mcp.optionManager.addOptionFromVirtualButton('P1 left');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('P1 right');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('P1 thrust');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('P1 punch left');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('P1 punch right');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('P2 left');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('P2 right');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('P2 thrust');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('P2 punch left');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('P2 punch right');
        Flynn.mcp.optionManager.addOption('soundEnabled', Flynn.OptionType.BOOLEAN, true, true, 'SOUND', null,
            Game.updateSoundOptionChange // Callback on option change
            );
        Flynn.mcp.optionManager.addOption('musicEnabled', Flynn.OptionType.BOOLEAN, true, true, 'MUSIC', null,
            Game.updateMusic // Callback on option change
            );
        Flynn.mcp.optionManager.addOption('resetScores', Flynn.OptionType.COMMAND, true, true, 'RESET HIGH SCORES', null,
            function(){self.resetScores();});

        // Restore user option settings from cookies
        Flynn.mcp.optionManager.loadFromCookies();
        
        // Set resize handler and force a resize
        Flynn.mcp.setResizeFunc( function(width, height){
            // No action
        });
        Flynn.mcp.resize();

        // Initialize sound and music
        Game.updateSound();
        Game.updateMusic();
    },

    resetScores: function(){
        Game.config.leaderboard.restoreDefaults();
    },

    run: function() {
        // Start the game
        Flynn.mcp.run();
    }
});

}()); // "use strict" wrapper