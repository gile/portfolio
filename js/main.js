var 	id,
	index,
	duration = 500;

var 	BLUE = 	'#6baed6',
	BLUE_L = 	'#8bcef6',
	ORANGE = 	'#fdae6b',
	ORANGE_L = '#ffbb78',
	GREEN = 	'#8ca252',
	GREEN_L = 	'#98df8a',
	RED =		'#d6616b',
	RED_L = 	'#ff9896',
	PURPLE =	'#9370db',
	PURPLE_L = 	'#c5b0d5',
	BROWN = 	'#c49c94',
	BROWN_L = 	'#c49c94',
	GREY = 	'#bdbdbd';
	GREY_L = 	'#c7c7c7',
	DARK_GREY =  '#888';
	TURQUOISE = '#63b6e5';

var 	pages = [
		{id: 'home', name: "", color: GREY, hover: GREY_L},
		{id: 'ux', name: "ux examples", color: BLUE, hover: BLUE_L},
		{id: 'maps', name: "maps", color: GREEN, hover: GREEN_L},
		{id: 'cv', name: "curriculum vitae", color: RED, hover: RED_L},
		{id: 'contact', name: "contact", color: ORANGE, hover: ORANGE_L}
	];

var 	pagesIndex = {};

var 	columnOffset = pages.reduce(function(total, current, index) {
	total[current.id] = index * -1;
	return total;
}, {})

var 	numColumns = pages.length,
	columnWidth,
	$currentColumn;

var 	headerColor = BLUE,//'#4682b4',
	headerColorHover = PURPLE;
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

	//***************************************
	// HEADER
	//***************************************
	$.each(pages, function( index, value ) {
		pagesIndex[value.id] = index;
	});

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

	$currentColumn = $('#column-home');
	headerLinkClick('home')
	doneResizing();		

	$(document).keydown(function(e){
		var 	colName,
			newIndex;

		e = e || window.event;
		
		 if (e.keyCode == '37') {
			// left arrow
			newIndex = Math.max(index - 1, 0);
		}
		else if (e.keyCode == '39') {
			// right arrow
			 newIndex = Math.min(index + 1, pages.length - 1);
		}
		else {
			return;
		}

		colName = pages[newIndex].id;

		headerLinkClick(colName);
	});

	createLogo('.header-logo');
	d3.select('.header-logo')
		.on('mouseover', function() { d3.selectAll('.header-logo circle').style('fill', headerColorHover) })
		.on('mouseout', function() { d3.selectAll('.header-logo circle').style('fill', function(d) {return d.color}) })
		.on('click', function() {headerLinkClick('home')});

	//***************************************
	// TOC
	//***************************************
	runTocAnimation();
	
	$('.toc-item a').click(function() {
		console.log(this);
		var name = $(this).attr('name');
		headerLinkClick(name);
	});


	//***************************************
	// UX
	//***************************************
	$( '.cbp-fwslider').cbpFWSlider();

	var menu = d3.selectAll('#ux-menu');

	menu.selectAll('.btn-ux').on('click', uxClick);

	uxClick(menu.selectAll('.btn-ux').first(true))

	function uxClick(el) {
		var	$el = el ? $(el) : $(this),	
			siblings = $el.siblings('.btn-ux'),
			name = $el.attr('name'),
			selector = 'div.ux-container > div#slides-' + name,
			selectorNot = 'div.ux-container > div:not(#slides-' + name + ')';

		siblings.removeClass('selected')
		$el.addClass('selected');		

		$(selectorNot).animate({'opacity': 0}, duration);

		$(selector).removeClass('hidden');
		$(selector).animate({'opacity': 1}, duration);
		
		setTimeout(function() {
			$(selectorNot).addClass('hidden');			
		}, duration);
	}

	$('.slides-list').magnificPopup({
		delegate: 'a', // child items selector, by clicking on it popup will open
		type: 'image',
		gallery:{enabled:true}
		// other options
	});

	//***************************************
	// MAPS
	//***************************************
	setTimeout(maps, 0);


	//***************************************
	// CV
	//***************************************
	createBars("#svg-container-history");
	createForceLayout("#svg-container-skills");


	//***************************************
	// CONTACT
	//***************************************

	// Provide your access token
	L.mapbox.accessToken = 'pk.eyJ1IjoiZ2lsIiwiYSI6IkpEOGJQbmsifQ.osSn7vDwwoyfBKEc5wRsfA';
	// Create a map in the div #map
	L.mapbox.map('contact-map', 'gil.io75e0n1', {
		center: [
			//15
			// 32.0565,
			// 34.7650

			// 12
			// 32.0565,
			// 34.8050

			// 4
			38.0565,
			22.0000
		],
		zoom: 4
	});	
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

	var 	parent = d3.select("#toc-container"),
		$parent = $("#toc-container");

	var 	maxHeight = ( $(window).height() - $('header').height() ) * 0.6;
	
	var 	width = $parent.width(),
		height = Math.min(width, maxHeight),
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

	var 	svg = 	parent.append('svg')
			.attr('id', 'toc-svg')
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
				.style("fill", function(d) {return d.hover})
				.style("stroke-width", 0);
		}
		

		el.select("text").transition()
			.duration(time)
			//.ease('cubic')
			//.attr("x", totalRadius +textOffsetHover )
			.style("fill", function(d) {return d.hover})		
			
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
			.style("fill", function(d) {return d.color})			
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
		marginLeft: columnWidth * columnOffset[columnName]
	};			
	
	$('.main-container').css(mainContainerCss);				
}

function headerSetActive(name, duration) {	
	

	var headerActiveColor = PURPLE;

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

function headerLinkMouseover(element, name) {}

function headerLinkMouseout(element) {}

function headerLinkClick(columnName) {
	var 	mainContainerCss,
		$thisColumn = $('#column-' + columnName);

	if ( index !== undefined && ($currentColumn.attr('id') === $thisColumn.attr('id') )) return; 

	index = pagesIndex[columnName];

	headerSetActive(columnName, 200);

	$currentColumn.animate({opacity: 0});
	$thisColumn.animate({opacity: 1});
	$currentColumn = $thisColumn;

	mainContainerCss = {
		marginLeft: columnWidth * columnOffset[columnName]
	}

	$('.main-container').animate(mainContainerCss, duration);

	if (columnName === 'home') {
		d3.select('.title')
			.style('display', '')
		        .transition()
		        	.delay(400)
			.duration(250)
			.style('opacity', 1);		
	}
	else  {
		d3.select('.title')			
		        .transition()
			.duration(250)
			.style('opacity', 0)
		        .transition()
			.delay(250)
		        	.style('display', 'none')		       
	}

	setTimeout(function() {
		window.scrollTo(0, 0);
	}, duration/2);

	setTimeout(function() {
		$('body').css('overflow-y', 'scroll');
	}, duration);
}	
