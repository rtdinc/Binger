/****************************************
*
*	background.js
*	Script file for Binger extension.
*	Runs in the background.
*
****************************************/



document.addEventListener('DOMContentLoaded', function () {
	var startButton = document.getElementById('startButton');
	var title = document.getElementById('title');
	var dashboardButton = document.getElementById('dashboardButton');
	var totalSearches = document.getElementById('totalSearches');
	var delay = document.getElementById('delay');
	
	/* Load saved values or use default for first use */
	chrome.storage.local.get(['savedSearches','savedDelay'],function(result){
		switch(result.savedSearches)
		{
		case "null": //First use, no saved input
			$('#searches-radio3').addClass("active"); //Default value
			break;
		case "5":
			$('#searches-radio1').addClass("active");
			break;
		case "30":
			$('#searches-radio2').addClass("active");
			break;
		case "90":
			$('#searches-radio3').addClass("active");
			break;
		}	
		switch(result.savedDelay)
		{
		case "null": //First use, no saved input
			$('#delay-radio2').addClass("active"); //Default value
			break;
		case "0.5":
			$('#delay-radio1').addClass("active");
			break;
		case "1":
			$('#delay-radio2').addClass("active");
			break;
		case "3":
			$('#delay-radio3').addClass("active");
			break;
		}
	});
	

	/* Make Binger link link to the Binger Chrome Web Store page */
	title.addEventListener('click', function () {
		chrome.tabs.create({ url: "https://chrome.google.com/webstore/detail/binger/ihngfhjjlpneihgjggelbegdefmfapam" });
	});
	
	/* Make dashboard button link to the Bing Dashboard */
	dashboardButton.addEventListener('click', function () {
		chrome.tabs.create({ url: "http://www.bing.com/rewards/dashboard" }, function(tab) {
			/* Save tab ID to use in case they start searching after vieweing the dashboard */
	    	//chrome.storage.local.set({'tabId': tab.id});
		});
	});
	
	/* Store searches and delay values when buttons are clicked */
	$(function() {
		$(".searches-radio").click(function(e){
			chrome.storage.local.set({ 'savedSearches': $(this).html() });
		});
	});
	$(function() {
		$(".delay-radio").click(function(e){
			if(this.id == "delay-radio1") {
				chrome.storage.local.set({ 'savedDelay': "0.5" });
			}
			else chrome.storage.local.set({ 'savedDelay': $(this).html() });
		});
	});
	
	/* Make start button begin the searches */
	startButton.addEventListener('click', function () {
	    chrome.storage.local.get(['savedSearches','savedDelay'],function(result){
			start(result.savedSearches, result.savedDelay);
		});
	});
	
});


function start(totalSearches, delaySeconds)
{
	var newURL = getRandomUrl();
	chrome.storage.local.get('tabId',function(result){
		if (result.tabId == null) {
		    chrome.tabs.create({ url: newURL, active:false }, function(tab){
				
				chrome.browserAction.setBadgeText({ text: String(totalSearches-1) });   
				
		    	chrome.storage.local.set({
		    		'tabId': tab.id,
		    		'searches': totalSearches,
		    		'delay': delaySeconds,
		    		'searchesLeft': totalSearches-1
		    	});
				
				// Make tab active after previous functions to ensure the popup doesn't go away too soon (advice from Stack Overflow).
				chrome.tabs.update(tab.id,{active:true});
				
		    });
		}
		else {
			chrome.browserAction.setBadgeText({ text: String(totalSearches-1) });   
				
	    	chrome.storage.local.set({
	    		'searches': totalSearches,
	    		'delay': delaySeconds,
	    		'searchesLeft': totalSearches-1
	    	});
			
			// Make tab active after previous functions to ensure the popup doesn't go away too soon (advice from Stack Overflow).
			chrome.tabs.update(result.tabId,{url: newURL, active:true});
		}
    });
}

/*
function checkInputs() {
	var totalSearches = document.getElementById('totalSearches');
	var delay = document.getElementById('delay');
	
	if (validateInputs() == true) {
		return true;
	}
	else {
		return false;
	}
}
*/


/*
getRandomUrl
	Gets a random words and puts it in a Bing search url
	Returns: String url
*/
function getRandomUrl() {
	var rnd = Math.ceil(Math.random() * words.length);
	var rndWord1 = words[rnd];
	var rnd2 = Math.ceil(Math.random() * words.length);
	var rndWord2 = words[rnd2];
    var url = "http://www.bing.com/search?q="+rndWord1+"+"+rndWord2;
    return url;
}



chrome.tabs.onUpdated.addListener(function( tabId , info ) {
    if ( info.status == "complete" ) {
	    chrome.storage.local.get(['tabId','searches','delay','searchesLeft'],function(result){
		    console.log("Tab " + result.tabId + " retrieved!" + tabId); 
	    	if (tabId == result.tabId) {
	    		chrome.tabs.get(tabId, function(tab) {
		    		if (tab.url != "http://www.bing.com/rewards/dashboard"){
		    			//if (result.searchesLeft != 0) {
			    			msDelay = result.delay * 1000;
				    		setTimeout(function(){updateTab(result.tabId)},msDelay);
			    		//}
			    		//else {	// Show Bing dashboard without delay
				    	//	updateTab(result.tabId);
			    		//}
			    	}
		    	});
		    }
		});
    }
});


chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	/* If tab is closed before searches are done, remove badge text */
	chrome.storage.local.get('tabId',function(result){
		if (tabId == result.tabId) {
			finish(false);
		}
	});
});


function updateTab(tabId) {
	chrome.storage.local.get('searchesLeft',function(result){
		if(result.searchesLeft != 0){	// Still have searches left to do
			var newURL = getRandomUrl();
			chrome.tabs.update(tabId, { url: newURL }, function(tabId){
					chrome.storage.local.set({'searchesLeft': String(result.searchesLeft-1)}, function() {
						chrome.storage.local.get('searchesLeft',function(result){
							if(tabId != null) {		// Make sure we don't update a tab that was closed
									console.log(tabId);
									console.log(result.searchesLeft);
						    		chrome.browserAction.setBadgeText({ text: result.searchesLeft });
							}
					    });
					});
			});
		}
		else {		// Searches are done, so show the Bing dashboard
			chrome.tabs.update(tabId, { url: "http://www.bing.com/rewards/dashboard" }, function() {
				finish(false);
			});
			
		}
	});
}


/*
function decBadgeText() {
	chrome.browserAction.getBadgeText(function (result){
		newBadgeText = String(result - 1);
		chrome.browserAction.setBadgeText({ text: newBadgeText });   
	});
}
*/


function isValidNumber(str) {
	var pattern = /[^0-9]/;
	var result = pattern.test(removeSpaces(str));
	if (result == true || str == "") {
		return !result;
	}
	else {
		return true;
	}
}


function removeSpaces(str) {
	trimmedStr = str.replace(/\s+/g, '');
	return trimmedStr;
}


function finish(keepTab) {
	chrome.browserAction.setBadgeText({ text: "" });
	if(keepTab == false){
		chrome.storage.local.set({ 'tabId': null });
	}
}



var words = [
"abaculus",
"Acrididae",
"Acridiidae",
"acridine",
"acridinic",
"acridinium",
"acridity",
"Acridium",
"acridly",
"acridness",
"acridone",
"acridonium",
"acridophagus",
"acridyl",
"acriflavin",
"acriflavine",
"acrimonious",
"acrimoniously",
"acrimoniousness",
"acrimony",
"acrindoline",
"acrinyl",
"acrisia",
"Acrisius",
"Acrita",
"acritan",
"acrite",
"acritical",
"acritol",
"Acroa",
"acroaesthesia",
"acroama",
"capriped",
"capripede",
"caprizant",
"caproate",
"caproic",
"caproin",
"Capromys",
"caprone",
"capronic",
"capronyl",
"caproyl",
"capryl",
"caprylate",
"caprylene",
"caprylic",
"caprylin",
"caprylone",
"caprylyl",
"capsa",
"capsaicin",
"Capsella",
"capsheaf",
"capshore",
"Capsian",
"capsicin",
"Capsicum",
"capsicum",
"capsid",
"Capsidae",
"capsizal",
"capsize",
"capstan",
"capstone",
"capsula",
"capsulae",
"capsular",
"capsulate",
"capsulated",
"capsulation",
"capsule",
"capsulectomy",
"capsuler",
"capsuliferous",
"capsuliform",
"capsuligerous",
"capsulitis",
"capsulociliary",
"capsulogenous",
"capsulolenticular",
"capsulopupillary",
"capsulorrhaphy",
"capsulotome",
"capsulotomy",
"capsumin",
"captaculum",
"captain",
"captaincy",
"captainess",
"captainly",
"captainry",
"captainship",
"captance",
"captation",
"caption",
"captious",
"captiously",
"captiousness",
"captivate",
"captivately",
"captivatingkatatonia",
"katatonic",
"katatype",
"katchung",
"katcina",
"Kate",
"kath",
"Katha",
"katha",
"kathal",
"Katharina",
"Katharine",
"katharometer",
"katharsis",
"kathartic",
"kathemoglobin",
"kathenotheism",
"Kathleen",
"kathodic",
"Kathopanishad",
"Kathryn",
"Kathy",
"Katie",
"Katik",
"Katinka",
"katipo",
"Katipunan",
"Katipuneros",
"katmon",
"katogle",
"Katrine",
"Katrinka",
"katsup",
"Katsuwonidae",
"katuka",
"Katukina",
"katun",
"katurai",
"Katy",
"katydid",
"Kauravas",
"kauri",
"kava",
"kavaic",
"kavass",
"Kavi",
"Kaw",
"kawaka",
"Kawchodinne",
"kawika",
"Kay",
"kay",
"kayak",
"kayaker",
"Kayan",
"Kayasth",
"Kayastha",
"kayles",
"kayo",
"Kayvan",
"Kazak",
"kazi",
"kazoo",
"Kazuhiro",
"kea",
"keach",
"keacorn",
"Keatsian",
"keawe",
"perpetuation",
"perpetuator",
"perpetuity",
"perplantar",
"perplex",
"perplexable",
"perplexed",
"perplexedly",
"perplexedness",
"perplexer",
"perplexing",
"perplexingly",
"perplexity",
"perplexment",
"perplication",
"perquadrat",
"stylostegium",
"stylotypite",
"stylus",
"stymie",
"Stymphalian",
"Stymphalid",
"Stymphalides",
"Styphelia",
"styphnate",
"styphnic",
"stypsis",
"styptic",
"styptical",
"pokemon"
]