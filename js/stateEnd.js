//--------------------------------------------
// StateEnd class
//    End of game screens (high score entry/table)
//--------------------------------------------

var CursorBlinkRate = 2;
var EndScreenColor = FlynnColors.CYAN;

var StateEnd = FlynnState.extend({

	/**
	 * Constructor
	 * 
	 * @param  {Game} game manager for the state
	 */
	init: function(mcp) {
		this._super(mcp);

		this.nick = "";
		this.score = mcp.custom.score;
		if (mcp.custom.score < mcp.highscores[mcp.highscores.length-1][1]){
			this.hasEnteredName = false;
		} else {
			this.hasEnteredName = true;
		}

		// get and init input field from DOM
		this.namefield = document.getElementById("namefield");
		this.namefield.value = this.nick;
		this.namefield.focus();
		this.namefield.select();
		this.cursorBlinkTimer = 0;
	},

	/**
	 * @override State.handleInputs
	 *
	 * @param  {InputHandeler} input keeps track of all pressed keys
	 */
	handleInputs: function(input, paceFactor) {
		if (this.hasEnteredName) {
			if (input.virtualButtonIsPressed("UI_enter")) {
				// change the game state
				this.mcp.nextState = States.MENU;
			}
		} else {
			if (input.virtualButtonIsPressed("UI_enter")) {
				// take sate to next stage
				this.hasEnteredName = true;
				this.namefield.blur();

				// cleanup and append score to hiscore array
				this.nick = this.nick.replace(/[^a-zA-Z0-9\s]/g, "");
				this.nick = this.nick.trim();
				this.nick = this.nick.substring(0,13); // Limit name length

				this.mcp.updateHighScores(this.nick, this.score, false);
			}
		}
	},

	/**
	 * @override State.update
	 */
	update: function(paceFactor) {
		this.cursorBlinkTimer += ((CursorBlinkRate*2)/60) * paceFactor;
		if (!this.hasEnteredName) {
			this.namefield.focus(); // focus so player input is read
			// exit if same namefield not updated
			if (this.nick === this.namefield.value) {
				return;
			}

			// Remove leading spaces
			this.namefield.value = this.namefield.value.replace(/^\s+/, "");

			// clean namefield value and set to nick variable
			this.namefield.value = this.namefield.value.replace(/[^a-zA-Z0-9\s]/g, "");
			this.nick = this.namefield.value;
		}
	},

	/**
	 * @override State.render
	 * 
	 * @param  {context2d} ctx augmented drawing context
	 */
	render: function(ctx) {
		ctx.clearAll();

		if (this.hasEnteredName) {
			// manually tweaked positions for, straightforward text
			// positioning
			ctx.vectorText("BEST TIMES", 4, null, 130, null, EndScreenColor);
			for (var i = 0, len = this.mcp.highscores.length; i < len; i++) {
				var hs = this.mcp.highscores[i];
				ctx.vectorText(hs[0], 2, 390, 200+25*i, null, EndScreenColor);
				ctx.vectorText(flynnTicksToTime(hs[1]), 2, 520, 200+25*i,   10, EndScreenColor);
			}
			ctx.vectorText("PRESS <ENTER> TO CONTINUE", 2, null, 450, null, EndScreenColor);

		} else {

			ctx.vectorText("YOUR TIME IS AMONG THE BEST!", 4, null, 100, null, EndScreenColor);
			ctx.vectorText("TYPE YOUR NAME AND PRESS ENTER", 2, null, 180, null, EndScreenColor);
			if(this.cursorBlinkTimer%2 > 1){
				ctx.vectorText(" " + this.nick + "_", 3, null, 220, null, EndScreenColor);
			} else{
				ctx.vectorText(this.nick, 3, null, 220, null, EndScreenColor);
			}
			ctx.vectorText(flynnTicksToTime(this.score), 3, null, 300, null, EndScreenColor);
		}
	}
});