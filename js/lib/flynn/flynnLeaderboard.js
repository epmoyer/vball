var FlynnLeaderboard = Class.extend({

	init: function(attributeList, maxItems, primaryAttribute, sortDescending){
		this.attributeList = attributeList;
		this.maxItems = maxItems;
		this.primaryAttribute = primaryAttribute;
		this.sortDescending = sortDescending;
		
		this.leaderList = [];
		this.defaultLeaderList = [];

		console.log('Cookies: enabled=' + Cookies.enabled);
	},

	setDefaultList: function(defaultLeaderList){
		this.defaultLeaderList = defaultLeaderList;
	},

	loadFromCookies: function(){
		this.leaderList =[];
		var numLeaderItems = 0;
		var done = false;
		while(!done){
			var leaderItem = {};
			for(var attributeIndex = 0, len = this.attributeList.length; attributeIndex<len; ++attributeIndex){
				var attributeName = this.attributeList[attributeIndex];
				var key = 'LB' + numLeaderItems + '_' + attributeName;
				var attributeValue = Cookies.get(key);
				console.log('get ' + key + ':' + attributeValue);
				if(attributeValue){
					leaderItem[attributeName] = attributeValue;
				} else{
					done = true;
				}
			}
			if(!done){
				this.leaderList.push(leaderItem);
				++numLeaderItems;
				console.log('Loaded leaderboard item:' + leaderItem);
			}
		}

		if(numLeaderItems===0){
			// No items found in cookies, so use the defaults.
			this.leaderList = this.defaultLeaderList;
		}
	},

	saveToCookies: function(){
		var i, len;
		for(i=0, len=this.leaderList.length; i<len; i++){
			var leaderItem = this.leaderList[i];
			for(var attributeIndex = 0, len2 = this.attributeList.length; attributeIndex<len2; ++attributeIndex){
				var attributeName = this.attributeList[attributeIndex];
				var key = 'LB' + i + '_' + attributeName;
				var value = leaderItem[attributeName];
				Cookies.set(key, value, { expires: Infinity });
				console.log('set ' + key + ':' + value);
			}
		}
	},

	add: function(newEntry){
		this.leaderList.push(newEntry);
		this.sortAndTruncate();
	},

	getBestEntry: function(){
		return this.leaderList[0];
	},

	getWorstEntry: function(){
		return this.leaderList[this.leaderList.length-1];
	},

	sortAndTruncate: function(){
		// sort hiscore in ascending order
		if (this.sortDescending){
			this.leaderList.sort(function(a, b) {
				return b[this.primaryAttribute] - a[this.primaryAttribute];
			});
		} else {
			this.leaderList.sort(function(a, b) {
				return a[this.primaryAttribute] - b[this.primaryAttribute];
			});
		}

		// Drop the last
		var extraItems = this.maxItems - this.leaderList.length;
		if(extraItems > 0){
			this.leaderList.splice(this.highscores.length - extraItems, extraItems);
		}
	},

	restoreDefaults: function(){
		this.leaderList = this.defaultLeaderList;
		this.sortAndTruncate();
	}
});