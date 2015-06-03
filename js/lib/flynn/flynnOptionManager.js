var FlynnOptionType = {
	BOOLEAN: 0,
	MULTI: 1,
	COMMAND: 2,
	INPUT_KEY: 3,
};

var FlynnOptionDescriptor = Class.extend({

	init: function(keyName, type, defaultValue, currentValue, promptText, promptValues, commandHandler){
		this.keyName = keyName;
		this.type = type;
		this.defaultValue = defaultValue;
		this.currentValue = currentValue;
		this.promptText = promptText;
		this.promptValues = promptValues;
		this.commandHandler = commandHandler;
	},

	currentPromptValueIndex: function(){
		for (var i=0, len=this.promptValues.length; i<len; i++){
			if(this.currentValue === this.promptValues[i][1]){
				return i;
			}
		}
		return null;
	}
});

// These current value for all shadowed options will be maintained in mcp.options.<keyName> for convenience
var FlynnShadowedOptionTypes = [FlynnOptionType.MULTI, FlynnOptionType.BOOLEAN];

var FlynnOptionManager = Class.extend({

	init: function(mcp){
		this.mcp = mcp;
		this.optionDescriptors = {};

		var self = this;
		this.addOption('revertDefaults', FlynnOptionType.COMMAND, true, true, 'REVERT TO DEFAULTS', null,
			function(){self.revertToDefaults();});
	},

	addOption: function(keyName, type, defaultValue, currentValue, promptText, promptValues, commandHandler){
		var descriptor = new FlynnOptionDescriptor(keyName, type, defaultValue, currentValue, promptText, promptValues, commandHandler);
		if (type in FlynnShadowedOptionTypes){
			this.mcp.options[keyName] = currentValue;
		}
		this.optionDescriptors[keyName] = descriptor;
	},

	addOptionFromVirtualButton: function(virtualButtonName){
		var keyCode = this.mcp.input.getVirtualButtonBoundKeyCode(virtualButtonName);
		var keyName = virtualButtonName;
		var descriptor = new FlynnOptionDescriptor(keyName, FlynnOptionType.INPUT_KEY, keyCode, keyCode, keyName, null, null);
		this.optionDescriptors[keyName] = descriptor;
	},

	setOption: function(keyName, value){
		if(keyName in this.optionDescriptors){
			var optionDescriptor = this.optionDescriptors[keyName];
			optionDescriptor.currentValue = value;
			if(optionDescriptor.type in FlynnShadowedOptionTypes){
				this.mcp.options[keyName] = value;
			}
			if(optionDescriptor.type === FlynnOptionType.INPUT_KEY){
				this.mcp.input.bindVirtualButtonToKey(keyName, value);
			}
		}
		else{
			console.print('DEV: Warnining: FlynnOptionManager.setOption() called for key "' +
				keyName + '", which does not match an existing option.  Doing nothing.');
		}
	},

	getOption: function(keyName){
		if(keyName in this.optionDescriptors){
			return(this.optionDescriptors[keyName].currentValue);
		}
		else{
			console.print('DEV: Warnining: FlynnOptionManager.getOption() called for key "' +
				keyName + '", which does not match an existing option.  Returning null.');
			return null;
		}
	},

	revertToDefaults: function(){
		for (var keyName in this.optionDescriptors){
			var descriptor = this.optionDescriptors[keyName];
			descriptor.currentValue = descriptor.defaultValue;
			if(descriptor.type in FlynnShadowedOptionTypes){
				this.mcp.options[keyName] = descriptor.defaultValue;
			}
		}
	},

	executeCommand: function(keyName){
		if(keyName in this.optionDescriptors && this.optionDescriptors[keyName].type === FlynnOptionType.COMMAND){
			this.optionDescriptors[keyName].commandHandler();
		}
		else{
			console.print('DEV: Warnining: FlynnOptionManager.executeCommand() called for key "' +
				keyName + '", which does not exist or is not of type COMMAND.  Doing nothing.');
		}
	},

	getOptionKeyNames: function(){
		// Get all option key names and return them ordered by input keys, multi options, booleans, and commands.

		var keyNamesInputKey = [];
		var keyNamesCommand = [];
		var keyNamesMulti = [];
		var keyNamesBoolean = [];

		for (var keyName in this.optionDescriptors){
			switch(this.optionDescriptors[keyName].type){
				case FlynnOptionType.INPUT_KEY:
					keyNamesInputKey.push(keyName);
					break;
				case FlynnOptionType.COMMAND:
					keyNamesCommand.push(keyName);
					break;
				case FlynnOptionType.MULTI:
					keyNamesMulti.push(keyName);
					break;
				case FlynnOptionType.BOOLEAN:
					keyNamesBoolean.push(keyName);
					break;

			}
		}
		return keyNamesInputKey.concat(keyNamesMulti, keyNamesBoolean, keyNamesCommand);
	},

});