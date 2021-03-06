function createBars(selector) {
	var 	cv_data = {
			"academic": [
				{name: "technion", start:  new Date(2000, 9, 1), end:new Date(2005, 5, 1), content: "B.Sc Computer Science | avg 90.3", color: BLUE},
				{name: "shenkar", start:  new Date(2009, 9, 1), end:new Date(2011, 5, 1), content: "Graphic Design | avg 88", color: RED}
			],

			"professional": [
				{name: "intel", start:  new Date(2002, 4, 1), end:new Date(2005, 6, 1), content: "sw dev (intern)", color: BLUE},
				{name: "sisense" , start:  new Date(2012, 7, 1), end:new Date(2014, 6, 1), content: "UX + sw dev", color: ORANGE},				
				{name: "kontera" , start:  new Date(2011, 3, 1), end:new Date(2012, 4, 1), content: "sw dev", color: GREEN},
				{name: "avaya" , start:  new Date(2005, 9, 1), end:new Date(2009, 2, 1), content: "sw dev", color: RED},
				{name: "zennet" , start:  new Date(2014, 9, 1), end:new Date(2015, 1, 1), content: "UX Lead", color: PURPLE}
			]
		}

	var cvFirstRun = false;

	// set the stage for the visualization
	var 	margin = {top: 10, right: 40, bottom: 30, left: 10},
		width = $(selector).parent().width() * 0.9,
		height = 85;

	

	var	x = d3.time.scale().range([0, width - margin.left - margin.right]),
		y = d3.scale.ordinal().rangeRoundBands([0, height - margin.top - margin.bottom], .1);

	var 	barHeight = height / 2;
	var 	color = d3.scale.category10(); // to generate a different color for each line

	var 	duration = 1000;

	var	dateFormat = d3.time.format("%B-%Y");

	var 	cv_keys = [ ];

	$.each(cv_data, function(key) {
	 	cv_keys.push(key);
	});

	var menu = d3.selectAll('#cv-menu-history');


	// add svg box where viz will go    
	var 	svg = d3.select(selector).append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		       .append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// define the x axis and its class, append it to svg 
	var 	xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(d3.time.years, 1)		

	// define the y axis and its class, append it to svg
	var 	yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")	
			//.rangeRoundBands([0, height], .1);

	menu.selectAll('.btn-cv').on('click', click);

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")");

	svg.append("g")
		.attr("class", "y axis")
		.append("line")
		.attr("class", "domain")
		.attr("y2", height);


	click(menu.selectAll('.btn-cv').first(true))

	redraw();

	function capitalise(string)
	{
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function click(el) {
		var	el = el ? $(el) : $(this),	
			siblings = el.siblings('.btn-cv');

		siblings.removeClass('selected')
		el.addClass('selected');

		change();
	}

	function change() {
		d3.transition()
			.duration(duration)
			.each(redraw);
	}

	function redraw() {

		var	key = menu.selectAll('.btn-cv.selected').first().attr('name'),
			data = cv_data[ key ];

		x.domain([
			d3.time.month.offset(d3.min(data, function(c) { return c.start; } ), -6),
			d3.time.month.offset(d3.max(data, function(c) { return c.end; } ), 6)
		]);
		
		y.domain(data.map(function(d) { return d.name; }));

		var bar = svg.selectAll(".bar")
			.data(data, function(d) { return d.name; });


		// ENTER //
		var barEnter = bar.enter().append("g")
			.attr("class", "bar")
			//.attr("transform", function(d) { return "translate(0," + (y(d.name) + height) + ")"; })
			.attr("transform", function(d) { return "translate(" + x(d.start) + ", " + (height - barHeight) + ")"; })
			//.style("fill-opacity", 0);

		barEnter.append("rect")
			.attr('id', function(d) {return 'bar-' + d.name;})
			.attr("width",0)
			.attr("height",barHeight)
			.style('fill', function(d, i) {return d.color})			

		var text = barEnter.append("text")
			.attr("class", "label")
			.attr("x", 0)
			.attr("y", 0)
			.attr("dy", "-25px")
			.attr("text-anchor", "start")
			.style('opacity', 0)
			

		text.append('tspan')
			.attr("x", 0)
			.attr("y", 0)
			.style('fill', function(d, i) {return d.color})
			.text(function(d) { return d.name})

		text.append('tspan')
			.attr('class', 'text-small')
			.attr("x", 0)
			.attr("y", 0)
			.attr("dy", "-8px")
			.style('fill', DARK_GREY)
			.text(function(d) { return d.content})

		// UPDATE //
		bar.selectAll("rect").transition()
			.delay(function() {return cvFirstRun ? 0 :duration; })
			.duration(duration)
			.attr("width", function(d) { return w(d); })
			.each("end", function(d) {
				cvFirstRun = false;
			});		

		bar.selectAll(".label").transition()
			.delay(function() {return cvFirstRun ? 0 :duration; })
			.style('opacity', 1)

		// EXIT //
		var	 barExit = bar.exit().transition()
				.duration(duration)
				.remove();

		barExit.select("rect")
			.duration(duration)
			//.attr("transform", function(d) { return "translate(" + ( x(d.start) + w(d) ) + ", " + 0 + ")"; })
			.attr("width", 0);

		barExit.select(".label")
			.style('opacity', 0);

		// AXIS //
		d3.transition(svg).select(".x.axis")
			.call(xAxis);

		function w(d) {
			if (!d || !d.start || !d.end) return 0;

	    		return x(d.end) - x(d.start);
	    	}
	}
}