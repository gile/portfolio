function maps() {	

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var parentPie = $('.map.PIE').get(0);

	var totalRevenueScale = d3.scale.linear().domain([0,1]).range([10, 100000]);

	var worldCountries = //WORLD_COUNTRIES.features;
	    [
	    	// Europe
	    	"United Kingdom",
	    	"France",
	    	"Ukraine",
	    	"Germany",
	    	"Spain",
	    	"Portugal",
	    	"Italy",
	    	"Poland",
	    	"Sweden",
	    	"Greece",
	    	"Hungary",
	    	"Russia",
	    	"Bulgaria",

	    	//Asia
	    	"China",
	    	"Japan",
	    	"South Korea",
	    	"Thailand",
	    	"India",
	    	"Israel",
	    	"Turkey",

	    	//Americas
	    	"United States",
	    	"Canada",
	    	"Mexico",
	    	"Panama",
	    	"Brazil",
	    	"Argentina",
	    	"Peru",

	    	// Africa
	    	"South Africa",
	    	"Nigeria",
	    	"Ghana",
	    	"Ethiopia",
	    	"Angola",

	    	//Oceania
	    	"Indonesia",
	    	"Australia"
	    ];

	    var inputDataPie = {
	    	metadata: {
	    		"country": {index: 0},
	    		"myBrand": {index: 1},
	    		"totalRevenue": {index: 2},
	    		"byIndex": {0: {title: "country"}, 1: {title: "myBrand"}, 2: {title: "totalRevenue"}}
	    	},
	    	data: []
	    };

	    for (var i=0; i<worldCountries.length; ++i) {

	    	var totalRevenue = totalRevenueScale(Math.random()),
	    		myBrand = Math.random();

	    	var entry = [
	    		//worldCountries[i].properties.name,
	    		worldCountries[i],
	    		{data: myBrand, text: myBrand.toFixed(0)},
	    		{data: totalRevenue, text: totalRevenue.toFixed(0)}	    		
	    	];

	    	inputDataPie.data.push(entry);
		    
	    }	    

	    var pieMap = PIE_MAP_EXTENSION.createPieMap("pie", inputDataPie, parentPie, null, {});	   	   

	    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	    var parentArcs = $('.map.ARCS').get(0);

	    var measureScale = d3.scale.linear().domain([0,1]).range([10, 1000]);

	    var countryLinks = [
	    		{name: "United States", exportDest: ["Argentina", "United Kingdom", "Kenya", "Japan", "China", "Canada"]},
	    		{name: "United Kingdom", exportDest:  ["United States", "Spain", "Italy", "Egypt", "Brazil"]},
	    		{name: "Germany", exportDest:  ["Poland", "Turkey", "India", "Canada"]},
	    		{name: "Israel", exportDest:  ["United States", "Russia", "China"]},
	    		{name: "China", exportDest:  ["Indonesia", "Pakistan", "South Africa", "South Korea", "India", "Russia", "Cameroon"]},
	    		{name: "Ghana", exportDest: ["Nigeria", "Tanzania", "Saudi Arabia", "Kenya"]}
	    	];

	    var inputDataArcs = {
	    	metadata: {
	    		"src": {index: 0},
	    		"dest": {index: 1},
	    		"measure": {index: 2},
	    		"byIndex": {0: {title: "src"}, 1: {title: "dest"}, 2: {title: "measure"}}
	    	},
	    	data: []
	    };

	    for (var i=0; i<countryLinks.length; ++i) {
	    	for (var j=0; j<countryLinks[i].exportDest.length; ++j) {
		    	var measure = measureScale(Math.random());

		    	var entry = [
		    		countryLinks[i].name,
		    		countryLinks[i].exportDest[j],
		    		{data: measure, text: measure.toFixed(0)}		    		
		    	];

		    	inputDataArcs.data.push(entry);
		    }
	    }

	    ARC_MAP_EXTENSION.createArcMap("arcs", inputDataArcs, parentArcs, null, {});

	     /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	    var parentChoro = $('.map.CHORO').get(0);

	    var features = US_STATES.features;

	    var growthScale = d3.scale.linear().domain([0,1]).range([-10, 10]);

	    var inputDataChoro = {
	    	metadata: {
	    		"state": {index: 0},
	    		"myGrowth": {index: 1},
	    		"marketGrowth": {index: 2},
	    		"gap": {index: 3},
	    		"byIndex": {0: {title: "state"}, 1: {title: "myGrowth"}, 2: {title: "marketgrowth"}, 3: {title: "gap"}}
	    	},
	    	data: []
	    };

	    for (var i=0; i<features.length; ++i) {
	    	var myGrowth = growthScale(Math.random()),
	    		marketGrowth = growthScale(Math.random()) ,
	    		gap = myGrowth - marketGrowth;

	    	var entry = [
	    		features[i].properties.name, // state name
	    		{data: myGrowth, text: myGrowth.toFixed(2) + '%'},
	    		{data: marketGrowth, text: marketGrowth.toFixed(2) + '%'},
	    		{data: gap, text: gap.toFixed(2) + '%'}
	    	];

	    	inputDataChoro.data.push(entry);
	    }

	    CHORO_MAP_EXTENSION.createChoroMap("choro", inputDataChoro, parentChoro, null, {});

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var menu = d3.selectAll('#map-menu');

	menu.selectAll('.btn-map').on('click', click);

	click(menu.selectAll('.btn-map').first(true))

	function click(el) {
		var duration = 300;

		var	$el = el ? $(el) : $(this),	
			siblings = $el.siblings('.btn-map'),
			name = $el.attr('name').toUpperCase(),
			selector = '.map-container div.map.' + name,
			selectorNot = '.map-container > div.map:not(' + selector + ')';

		siblings.removeClass('selected')
		$el.addClass('selected');

		$(selectorNot).animate({'opacity': 0}, duration);

		$(selector).removeClass('hidden');
		$(selector).animate({'opacity': 1}, duration);
		
		setTimeout(function() {
			$(selectorNot).addClass('hidden');			
		}, duration);

	}
}

