var 	id,
	duration = 500;

var 	GREY = 	'#222',
	RED =		'#f86767',
	GREEN = 	'#73b43b',
	//BLUE =	'#63b6e5',
	BLUE = 	'#7199F1',
	ORANGE = 	'#FF7F50',
	PURPLE =	'#9370DB';

var 	pages = [
		{id: 'home', name: "", color: GREY},
		{id: 'ux', name: "ux examples", color: BLUE},
		{id: 'maps', name: "maps", color: GREEN},
		{id: 'cv', name: "curriculum vitae", color: PURPLE},
		{id: 'contact', name: "contact", color: ORANGE}
	];

// $.each(pages, function( index, value ) {
// 	columnOffset[value.id] = -1 * (index);
// });



var 	columnOffset = pages.reduce(function(total, current, index) {
	total[current.id] = index * -1;
	return total;
}, {})

var 	numColumns = pages.length,
		columnWidth,
		$currentColumn;

var 	headerColor = BLUE,//'#4682b4',
	headerColorHover = '#63b6e5';
	// headerActiveColor = RED; // red

/////////////////////////////////////////////////////////////
// Init Code
/////////////////////////////////////////////////////////////
$(window).load(function(){
    setTimeout(function() {
        $('html, body').animate({scrollTop: 0}, 500);
    }, 10);
});

$(document).ready(function() {

	$('.header-link').click(function() {
		var name = $(this).attr('name');
		headerLinkClick(name);
	});

	$('.header-link').mouseover(function() {
		var name = $(this).attr('name');
		headerLinkMouseover(this, name);
	});

	$('.header-link').mouseout(function() {
		var name = $(this).attr('name');
		headerLinkMouseout(this);
	});

	$('.toc-item a').click(function() {
		console.log(this);
		var name = $(this).attr('name');
		headerLinkClick(name);
	});

	$currentColumn = $('#column-home');
	//$('.main-container').css({height: $currentColumn.height()});

	doneResizing();		

	$( '#fwslider-sisense-mockups' ).cbpFWSlider();	
	$( '#fwslider-sisense-screenshots' ).cbpFWSlider();
	$( '#fwslider-zennet-mockups' ).cbpFWSlider();		
	$( '#fwslider-zennet-screenshots' ).cbpFWSlider();		

	// Provide your access token
	L.mapbox.accessToken = 'pk.eyJ1IjoiZ2lsIiwiYSI6IkpEOGJQbmsifQ.osSn7vDwwoyfBKEc5wRsfA';
	// Create a map in the div #map
	L.mapbox.map('contact-map', 'gil.io75e0n1', {
		center: [
			32.0565,
			34.7650
		],
		zoom: 14
	});	

	$('.info-text').mouseover(function() {
		//console.log('FFFF');
	});

	$('.info-text').mouseout(function() {
		//console.log('FFFF');
	});


	headerSetActive('home', 0)

	runTocAnimation();

});



/////////////////////////////////////////////////////////////
// Global Event Handlers
/////////////////////////////////////////////////////////////
$(window).resize(function() {
	$('body').hide();
	clearTimeout(id);
	id = setTimeout(doneResizing, 500);
    
});	

/////////////////////////////////////////////////////////////
// Private Methods
/////////////////////////////////////////////////////////////	

function runTocAnimation() {	

	var nodes = pages.slice(1);

	var links = pages.slice(2).map(function(value, index) {
		return {"source": index, "target": index+1, "value": 10};
	});

	
	// var	links = function() {
	// 	var	numLinks = 4;,
	// 		array = [],
	// 		domain = [0, 1],
	// 		range = [0,  pages.length],
	// 		scale = d3.scale.linear(),
	// 		sourceScale =,
	// 		dest; 

	// 	for (var i=0; i<numLinks; ++i) {
	// 		source = scale.domain(domain).range(range)(Math.random());
	// 		dest = 
	// 		array.push({

	// 		})
	// 	}
	// }

	//var	links = [];

	var 	width = 960,
		height = 500,
		radius = 35;

	var 	gravity = 0.01,
		charge = -300,
		linkDistance = 300;

	var 	fontSize = 27;

	var 	stroke = 1,
		hoverStroke = 4;

	var	hoverRadiusFactor = 1.05,
		enlargedFontFactor = 1,
		totalRadius = (radius * hoverRadiusFactor) + hoverStroke;

	var 	textOffset = 10,
		textOffsetHover = 25;

	var	force = d3.layout.force()
			.gravity(gravity)
			.charge(charge)
			.linkDistance(linkDistance)
			.size([width, height])
			.nodes(nodes)
			.links(links)
			.on("tick", tick)
			.start();

	var 	svg = d3.select("#toc-svg")
			.attr("width", width)
			.attr("height", height);

	var 	link = svg.selectAll("line")
			 .data(links)
		     .enter().append("line")
			.attr("class", "link");

	var 	node = svg.selectAll("node")
			.data(nodes)
		     .enter().append("g")
		     	.attr("class", "node")
		     	.attr("name", function(d) { return d.id})	
		     	.attr("color", function(d) { return d.color})		
			.on("mouseover", mouseover)
			.on("mouseout", mouseout)		
			.on("click", click)
			.call(force.drag);

	node.append("circle")
		.attr("r", radius)
		.style("fill", function(d) { return d.color })
		.style('stroke-width', stroke)
		.style("stroke", function(d) { return d3.rgb(d.color).brighter(); })

	node.append("text")
		    .attr("x", totalRadius + textOffset)
		    .attr("dy", "10px")
		    .style('font-size', fontSize + 'px')
		    .style("fill", function(d) { return d.color})
		    .text(function(d) { return d.name; });
		 

	function tick() {
		node
			.attr("transform", function(d) { 
				var tr = totalRadius;
				d.x = Math.max(tr, Math.min(width - tr - 150, d.x));
				d.y = Math.max(tr, Math.min(height - tr, d.y)); 
				return "translate(" + d.x + "," + d.y + ")"; 
			});

		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
	}

	function hoverRadius() {
		return radius * hoverRadiusFactor;
	}

	function mouseover() {
		var 	el = d3.select(this),
			color = el.attr('color');


		el.select("circle").transition()
			.duration(250)
			.attr("r", hoverRadius())
			//.style("fill", d3.rgb( color ).brighter() )
			.style("stroke-width", hoverStroke)
			

		el.select("text").transition()
			.duration(200)
			//.ease('cubic')
			.attr("x", totalRadius +textOffsetHover )
			//.style("fill", d3.rgb( color ).brighter() )
			//.style("opacity", 0.6)
			//.style('font-weight', 700)
			.style('font-size', (fontSize * enlargedFontFactor) + 'px');
	}

	function mouseout() {
		var 	el = d3.select(this),
			color = el.attr('color');

		el.select("circle").transition()
			.duration(250)
			.attr("r", radius)
			//.style("fill", color)
			.style("stroke-width", stroke);

		el.select("text").transition()
			.duration(200)
			.attr("x", totalRadius + textOffset )
			//.style("fill", color)
			//.style("opacity", 1)
			//.style('font-weight', 400)

			.style('font-size', fontSize + 'px');
	}

	function click() {
		var name = d3.select(this).attr('name');
		headerLinkClick(name);
	}
}


function doneResizing(){
	var columnName = $currentColumn.attr('name'),
		columnHeight = $currentColumn.height(),
		mainContainerCss;

	$('body').show();

	columnWidth = $('html').width();			

	// must be set before we get $currentColumn.height()
	$('.column').width(columnWidth);

	mainContainerCss = {
		width: columnWidth * numColumns,
		//height: $currentColumn.height(),
		marginLeft: columnWidth * columnOffset[columnName]
	};			
	
	$('.main-container').css(mainContainerCss);				
}

function headerSetActive(name, duration) {	
	var headerActiveColor = pages.filter(function(d) {return d.id === name})[0].color;

	if (!duration || duration === 0) {
		
		d3.selectAll('.header-link span')
			.style('opacity', 0);

		d3.selectAll('.header-link')
			.style('color', '');

		d3.selectAll('#link-' + name + ' span')
			.style('opacity', 1);

		d3.selectAll('#link-' + name)
			.style('color', headerActiveColor);
	}

	else {
		d3.selectAll('.header-link span').transition()
			.duration(duration)
			.style('opacity', 0);

		d3.selectAll('.header-link').transition()
			.duration(duration)
			.style('color', '');		

		d3.selectAll('#link-' + name + ' span').transition()
			.delay(duration + 50)
			.duration(duration)
			.style('opacity', 1);

		d3.selectAll('#link-' + name).transition()
			.delay(duration + 50)
			.duration(duration)
			.style('color', headerActiveColor);
	}
}

function headerLinkMouseover(element, name) {

	var color = pages.filter(function(d) {return d.id === name})[0].color;

	d3.select(element).style('color', color);

	console.log( d3.select(element));
}

function headerLinkMouseout(element) {
	d3.select(element).style('color', '');
}

function headerLinkClick(columnName) {
	var 	mainContainerCss,
		$thisColumn = $('#column-' + columnName);

	if ($currentColumn.attr('id') === $thisColumn.attr('id') ) return; 

	//$('body').css('overflow-y', 'hidden');
	headerSetActive(columnName, 200);

	$currentColumn.animate({opacity: 0});
	$thisColumn.animate({opacity: 1});
	$currentColumn = $thisColumn;

	mainContainerCss = {
		//height: $thisColumn.height(),
		marginLeft: columnWidth * columnOffset[columnName]
	}

	$('.main-container').animate(mainContainerCss, duration);

	setTimeout(function() {
		window.scrollTo(0, 0);
	}, duration/2);

	setTimeout(function() {
		$('body').css('overflow-y', 'scroll');
	}, duration);

	console.log('CLICK', columnName, $('.main-container').height());
}	


/////////////////////////////////////////////////////////////
// *** TRASH ***
/////////////////////////////////////////////////////////////	

/**
function runTocAnimation() {
	var 	str;

	var 	initial_delay = 500,
		delay_step = 40;

	var 	titleText = d3.select('#home-title-text'),
		uxText = d3.select('.toc-text');
		uxTextLarge = d3.select('.toc-item .large');

	var 	totaDelay = initial_delay;
	var 	textElement,
		textElementLarge;

	for (var j=1; j<pages.length; ++j) { // skip 'home' (j=0)
		textElement = d3.select('#toc-item-' + pages[j].id + ' .toc-text');
		textElementLarge = d3.select('#toc-item-' + pages[j].id + ' .large');
		str = pages[j].name;

		for (var i =0; i <= str.length; ++i) {
			textElement.transition()
				.delay(totaDelay + i*delay_step)
				.text(str.slice(0, i))
			

			if (i<str.length) {
				textElementLarge
				      .transition()
					.delay(totaDelay + i*delay_step)
					.duration(delay_step)
					.text(str[i])
			}
			else {

				textElementLarge.transition()
					.delay(totaDelay + i*delay_step)
					.text('');
			}
		}

		totaDelay += (str.length-1) * delay_step;
	}
	// titleText.transition()
	//   	.delay( initial_delay + ((str.length + 1) * delay_step) )	
	//   	.each("end", function() {
	//   		d3.select('#home-title-cursor').style('visibility', 'hidden');
	// 		d3.select('#home-content').style('visibility', 'visible');
	// 	});
} 

var getMarkerParams = function(id, width, height, stroke_width, stroke_color, fill) {
	  var indent = Math.ceil(width / 10);

	  var markerParams = {
		id: id,
		viewBox: "0 0 " + width + " " + height,
		orient: "auto",
		refX: 10,//width  / 2,
		refY: height / 2,
		markerUnits: 'userSpaceOnUse', //stroke_width,
		markerWidth: width,
		markerHeight: height,
		d: "M0,0 L" + (width - 10) + "," + (height / 2) + " 0," + height + " " + indent + "," + (height / 2) + " Z",
		strokeWidth: stroke_width,
		strokeColor: stroke_color,
		fill: fill
	  }

	return markerParams;
}

function setMarkers() {
	var  markerInfo = {
		//ux: 		getMarkerParams('ux', 30, 30, 0, 'steelblue', 'steelblue'),
		//maps: 		getMarkerParams('maps', 30, 30, 0, 'steelblue', 'steelblue'),
		cv: 		getMarkerParams('cv', 120, 120, 0, 'steelblue', 'steelblue'),
		//contact: 	getMarkerParams('contact', 30, 30, 0, 'steelblue', 'steelblue')
	};

	

	$.each(markerInfo, function(key, data){
		var 	svg = d3.select('#svg-' + key),
			svgdefs = svg.insert("defs",":first-child");

		svgdefs
	              .append("marker")
	           	.attr("id", function(d) { return 'marker' + "-" + key })
			.attr("viewBox", data.viewBox)
			.attr("orient", data.orient)
			.attr('markerUnits', data.markerUnits)
			.attr("refX", data.refX)
			.attr("refY", data.refY)
			.attr("markerWidth", data.markerWidth)
			.attr("markerHeight", data.markerHeight);

	             svg.append("path")
			.attr("d", data.d)
			.attr("stroke-width", data.strokeWidth)
			.attr("stroke-color", data.strokeColor)
			.attr("fill", data.fill);

}




//---------------------------------------------

$('#create-widget-list' ).magnificPopup({
	delegate: 'a', // child items selector, by clicking on it popup will open
		type: 'image',
		gallery:{enabled:true},
		image: {
	    // options for image content type
	    titleSrc: 'title'
		}
		// other options
});

//---------------------------------------------

/**/
