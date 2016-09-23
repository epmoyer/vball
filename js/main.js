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
					case States.END:
						var newState = new FlynnStateEnd(self.mcp, self.mcp.custom.score, self.mcp.custom.leaderboard, FlynnColors.CYAN, 'BEST TIMES', 'YOUR TIME IS AMONG THE BEST!');
						newState.scoreToString = function(score){return flynnTicksToTime(score);};  // Render score as time
						return newState;
					case States.CONFIG:
						return new FlynnStateConfig(self.mcp, FlynnColors.ORANGE, FlynnColors.YELLOW, FlynnColors.CYAN, FlynnColors.MAGENTA);
				}
			}
		);
		this.mcp.nextState = States.MENU;
		this.mcp.custom.score = 0;

		this.mcp.custom.leaderboard = new FlynnLeaderboard(
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
			this.input.addVirtualButton('P1 left', FlynnKeyboardMap['a'], FlynnConfigurable);
			this.input.addVirtualButton('P1 right', FlynnKeyboardMap['s'], FlynnConfigurable);
			this.input.addVirtualButton('P1 thrust', FlynnKeyboardMap['d'], FlynnConfigurable);
			this.input.addVirtualButton('P1 punch left', FlynnKeyboardMap['f'], FlynnConfigurable);
			this.input.addVirtualButton('P1 punch right', FlynnKeyboardMap['g'], FlynnConfigurable);

			this.input.addVirtualButton('P2 left', FlynnKeyboardMap['i'], FlynnConfigurable);
			this.input.addVirtualButton('P2 right', FlynnKeyboardMap['o'], FlynnConfigurable);
			this.input.addVirtualButton('P2 thrust', FlynnKeyboardMap['p'], FlynnConfigurable);
			this.input.addVirtualButton('P2 punch left', FlynnKeyboardMap['['], FlynnConfigurable);
			this.input.addVirtualButton('P2 punch right', FlynnKeyboardMap[']'], FlynnConfigurable);
		}else{
			this.input.addVirtualButton('P1 left', FlynnKeyboardMap['ICADE_left'], FlynnConfigurable);
			this.input.addVirtualButton('P1 right', FlynnKeyboardMap['ICADE_right'], FlynnConfigurable);
			this.input.addVirtualButton('P1 thrust', FlynnKeyboardMap['ICADE_up'], FlynnConfigurable);
			this.input.addVirtualButton('P1 punch left', FlynnKeyboardMap['ICADE_T1'], FlynnConfigurable);
			this.input.addVirtualButton('P1 punch right', FlynnKeyboardMap['ICADE_T2'], FlynnConfigurable);

			this.input.addVirtualButton('P2 left', FlynnKeyboardMap['ICADE_B1'], FlynnConfigurable);
			this.input.addVirtualButton('P2 right', FlynnKeyboardMap['ICADE_B2'], FlynnConfigurable);
			this.input.addVirtualButton('P2 thrust', FlynnKeyboardMap['ICADE_B3'], FlynnConfigurable);
			this.input.addVirtualButton('P2 punch left', FlynnKeyboardMap['ICADE_T3'], FlynnConfigurable);
			this.input.addVirtualButton('P2 punch right', FlynnKeyboardMap['ICADE_T4'], FlynnConfigurable);
		}		

		if(this.mcp.developerModeEnabled){
			this.input.addVirtualButton('dev_metrics', FlynnKeyboardMap['6'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_slow_mo', FlynnKeyboardMap['7'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_fps_20', FlynnKeyboardMap['\\'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_add_points_0', FlynnKeyboardMap['8'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_add_points_1', FlynnKeyboardMap['9'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_reset', FlynnKeyboardMap['0'], FlynnNotConfigurable);
		}
		if(this.mcp.arcadeModeEnabled && !this.mcp.iCadeModeEnabled){
			// Re-map game keys
			this.input.addVirtualButton('P1 left', FlynnKeyboardMap['left'], FlynnConfigurable);
			this.input.addVirtualButton('P1 right', FlynnKeyboardMap['right'], FlynnConfigurable);
			this.input.addVirtualButton('P1 thrust', FlynnKeyboardMap['enter'], FlynnConfigurable);
			this.input.addVirtualButton('P1 punch left', FlynnKeyboardMap['z'], FlynnConfigurable);
			this.input.addVirtualButton('P1 punch right', FlynnKeyboardMap['spacebar'], FlynnConfigurable);

			this.input.addVirtualButton('P2 left', FlynnKeyboardMap['d'], FlynnConfigurable);
			this.input.addVirtualButton('P2 right', FlynnKeyboardMap['g'], FlynnConfigurable);
			this.input.addVirtualButton('P2 thrust', FlynnKeyboardMap['i'], FlynnConfigurable);
			this.input.addVirtualButton('P2 punch left', FlynnKeyboardMap['o'], FlynnConfigurable);
			this.input.addVirtualButton('P2 punch right', FlynnKeyboardMap['p'], FlynnConfigurable);
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
		this.mcp.optionManager.addOption('musicEnabled', FlynnOptionType.BOOLEAN, true, true, 'MUSIC', null, null);
		this.mcp.optionManager.addOption('resetScores', FlynnOptionType.COMMAND, true, true, 'RESET HIGH SCORES', null,
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