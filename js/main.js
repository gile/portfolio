var 	id,
	duration = 500;

// var 	GREY = 	'#222',
// 	RED =		'#f86767',
// 	GREEN = 	'#73b43b',
// 	//BLUE =	'#63b6e5',
// 	BLUE = 	'#7199F1',
// 	ORANGE = 	'#FF7F50',
// 	PURPLE =	'#9370DB';

var	color = d3.scale.category20();

// for(var i=0; i<10; ++i) {color(i)}
// var 	BLUE = 	color(0),
// 	ORANGE = 	color(2),
// 	GREEN = 	color(4),
// 	RED =		color(6),
// 	PURPLE =	color(8),
// 	GREY = 	color(14);

for(var i=0; i<20; ++i) {color(i)}
var 	BLUE = 	color(0),
	ORANGE = 	color(2),
	GREEN = 	color(4),
	RED =		color(6),
	PURPLE =	color(8),
	BROWN = 	color(10)
	GREY = 	color(14);

// var 	BLUE = 	color(0),
// 	ORANGE = 	color(4),
// 	GREEN = 	color(8),
// 	RED =		color(12),
// 	PURPLE =	color(16),
// 	GREY = 	color(14);

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
d3.selection.prototype.first = function(raw) {
	if (raw) {
		return this[0][0]
	}

 	return d3.select(this[0][0]);
};

d3.selection.prototype.last = function(raw) {
	var last = this.size() - 1;

	if (raw) {
		return this[0][last];
	}

	return d3.select(this[0][last]);
};

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
		zoom: 15
	});	

	$('.info-text').mouseover(function() {
		//console.log('FFFF');
	});

	$('.info-text').mouseout(function() {
		//console.log('FFFF');
	});


	headerSetActive('home', 0)

	runTocAnimation();

	createBars("#svg-container-history");

	createForceLayout("#svg-container-skills");

	//$('#column-maps').css('display', 'none')

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

	var 	width = 960,
		height = 500,
		radius = 32;

	var 	gravity = 0.01,
		charge = -300,
		linkDistance = 300;

	var 	fontSize = 27;

	var 	stroke = 1,
		hoverStroke = 2;

	var	hoverRadiusFactor = 1.05,
		enlargedFontFactor = 1,
		totalRadius = (radius * hoverRadiusFactor) + hoverStroke;

	var 	textOffset = 5,
		textOffsetHover = 15;

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

	var num = 1;

	for (var i=0; i<num; ++i) {
		node.append("circle")
			.attr('class', 'c' + (i + 1))
			.attr("r", radius * (1/num) * (num - i))
			.style("fill", function(d) { return d.color })
			.style('stroke-width', (i===0)  ? stroke : 0)
			.style("stroke", function(d) { return d3.rgb(d.color).brighter(); })
	}

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

	function mouseover(e) {
		var 	el = d3.select(this),
			color = el.attr('color'),
			time = 100,
			num = el.selectAll('circle')[0].length;

		

		for (var i =0; i<num; ++ i) {
			el.select("circle.c" +  (i + 1)).transition()
				.duration(time)
				.delay(time * i)
				.attr("r", hoverRadius() * (1/num) * (num - i))
				//.style("fill", function(d) { return (i===num-1) ? d3.rgb(d.color).brighter(1) : d.color })
				.style("fill", function(d) { return d3.rgb(d.color).brighter(1) })
				.style("stroke-width", hoverStroke);
		}
		

		el.select("text").transition()
			.duration(time)
			//.ease('cubic')
			//.attr("x", totalRadius +textOffsetHover )
			.style("fill", d3.rgb( color ).brighter(1) )
			//.style("opacity", 0.6)
			//.style('font-weight', 700)
			//.style('font-size', (fontSize * enlargedFontFactor) + 'px');
	}

	function mouseout(e) {
		var 	el = d3.select(this),
			color = el.attr('color'),
			time = 100,
			num = el.selectAll('circle')[0].length;

		for (var i =0; i<num; ++ i) {
			el.select("circle.c" + (num - i)).transition()
				.duration(time)
				.delay(time * i)
				.attr("r", radius * (1/num) * (i + 1))
				.style("fill", function(d) {return d.color})
				.style("stroke-width", (i===num-1) ? stroke : 0);
		}		

		el.select("text").transition()
			.duration(time)
			//.attr("x", totalRadius + textOffset )
			.style("fill", color)
			//.style("opacity", 1)
			//.style('font-weight', 400)
			//.style('font-size', fontSize + 'px');
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
