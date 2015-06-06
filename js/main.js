var GameCanvasHeight = 768;
var GameCanvasWidth = 1024;
var GameSpeedFactor = 0.7;

var States = {
	NO_CHANGE: 0,
	MENU:      1,
	CONFIG:    2,
	GAME:      3,
	END:       4
};

var Game = Class.extend({
	
	init: function() {
		"use strict";

		var self = this;
        
        this.input = new FlynnInputHandler();

		this.mcp = new FlynnMcp(GameCanvasWidth, GameCanvasHeight, this.input, States.NO_CHANGE, GameSpeedFactor);
		this.mcp.setStateBuilderFunc(
			function(state){
				switch(state){
					case States.MENU:
						return new StateMenu(self.mcp);
					case States.GAME:
						return new StateGame(self.mcp);
					// case States.END:
					// 	return new StateEnd(self.mcp);
					case States.CONFIG:
						return new FlynnStateConfig(self.mcp, FlynnColors.ORANGE, FlynnColors.YELLOW, FlynnColors.CYAN, FlynnColors.MAGENTA);
				}
			}
		);
		this.mcp.nextState = States.MENU;

        // Setup inputs
		this.input.addVirtualButton('punch left', FlynnKeyboardMap['a'], FlynnConfigurable);
		this.input.addVirtualButton('punch right', FlynnKeyboardMap['k'], FlynnConfigurable);
		this.input.addVirtualButton('thrust left', FlynnKeyboardMap['z'], FlynnConfigurable);
		this.input.addVirtualButton('thrust right', FlynnKeyboardMap['m'], FlynnConfigurable);
		if(this.mcp.developerModeEnabled){
			this.input.addVirtualButton('dev_metrics', FlynnKeyboardMap['6'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_slow_mo', FlynnKeyboardMap['7'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_fps_20', FlynnKeyboardMap['\\'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_add_points', FlynnKeyboardMap['8'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_die', FlynnKeyboardMap['9'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_rescue', FlynnKeyboardMap['0'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_base', FlynnKeyboardMap['-'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_kill_human', FlynnKeyboardMap[']'], FlynnNotConfigurable);
		}
		if(this.mcp.arcadeModeEnabled){
			this.input.addVirtualButton('quarter', FlynnKeyboardMap['5'], FlynnConfigurable);
			this.input.addVirtualButton('start_1', FlynnKeyboardMap['1'], FlynnConfigurable);
			//this.input.addVirtualButton('thrust', FlynnKeyboardMap['r'], FlynnConfigurable);
			// In arcade mode re-bind rotate right to spacebar
			//this.input.addVirtualButton('rotate right', FlynnKeyboardMap['spacebar'], FlynnConfigurable);
		}

		// Options
		this.mcp.optionManager.addOptionFromVirtualButton('punch left');
		this.mcp.optionManager.addOptionFromVirtualButton('punch right');
		this.mcp.optionManager.addOptionFromVirtualButton('thrust left');
		this.mcp.optionManager.addOptionFromVirtualButton('thrust right');
		this.mcp.optionManager.addOption('musicEnabled', FlynnOptionType.BOOLEAN, true, true, 'MUSIC', null, null);
		this.mcp.optionManager.addOption('resetScores', FlynnOptionType.COMMAND, true, true, 'RESET HIGH SCORES', null,
			function(){self.resetScores();});

		// Reset Scores
		this.resetScores();
		
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
		this.mcp.highscores = [
			["FIENDFODDER", 2000],
			["ROCKEM", 1300],
			["SOCKEM", 1200],
			["BECKAM", 1100],
			["TURNER", 600],
			["ORTEGA", 500],
		];
		this.mcp.custom.score = 0;
	},

	run: function() {
		// Start the game
		this.mcp.run();
	}
});