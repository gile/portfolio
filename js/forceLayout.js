function createForceLayout(selector) {
	var	maxRadius = 37;

	function radius(f) { 
		var	f = f || 0.8; return maxRadius * f
	}

	var cv_data = {
		"programming": [
			{name: "javascript", radius: radius(1), focus: 0, cluster: 0, main: true, color: RED},
			{name: "d3", radius: radius(0.4), focus: 0, cluster: 0, main: false, color: RED},
			{name: "jQuery", radius: radius(0.7), focus: 0, cluster: 0, main: false, color: RED},

			{name: "C", radius: radius(0.45), focus: 0, cluster: 1, main: true, color: BLUE},
			{name: "C++", radius: radius(0.6), focus: 0, cluster: 1, main: false, color: BLUE},

			{name: "HTML 5", radius: radius(0.85), focus: 0, cluster: 2, main: true, color: ORANGE},
			{name: "CSS 3", radius: radius(0.7), focus: 0, cluster: 2, main: false, color: ORANGE},

			{name: "illustrator", radius: radius(1), focus: 0, cluster: 3, main: true, color: GREEN},
			{name: "photoshop", radius: radius(1), focus: 0, cluster: 3, main: false, color: GREEN},
			{name: "indesign", radius: radius(0.9), focus: 0, cluster: 3, main: false, color: GREEN}
		],

		"languages": [
			{name: "hebrew", radius: radius(), focus: 1, cluster: 10, main: true, color: BLUE},
			{name: "english", radius: radius(), focus: 1, cluster: 11, main: true, color: RED},
			{name: "spanish", radius: radius(),  focus: 2,cluster: 12, main: true, color: ORANGE},
			{name: "italian", radius: radius(),  focus: 2,cluster: 13, main: true, color: GREEN},			
			{name: "russian", radius: radius(),  focus: 3,cluster: 14, main: true, color: PURPLE}
		]
	}
	 
	// MENU
	var menu =  d3.selectAll('#cv-menu-skills');

	var   keys = [ ];

	menu.selectAll('.btn-cv').on('click', click);

	$.each(cv_data, function(key) {
		keys.push(key);
	});


	// SVG
	var 	width = $(selector).parent().width() * 0.85,
		height = 300;

	var  	padding = 0, // separation between same-color nodes
		clusterPadding = 0; // separation between different-color nodes

	var 	duration = 350;
	var 	fill = d3.scale.category10();

	var 	focusHeight = height * 0.7,
		focusHeightTop = height * 0.55;

	var 	positions = {
			centerHigh: {x: width * 0.5, y: focusHeightTop},
			left:       {x: width * 0.25, y: focusHeight},
			center: {x: width * 0.5, y: focusHeight},
			right:    {x: width * 0.75, y: focusHeight},

			leftExit:   {x: width * -0.5, y: focusHeight},
			rightExit: {x: width * 1.5, y: focusHeight}
	}

	foci = {
		"programming":  [positions.centerHigh, positions.rightExit, positions.rightExit, positions.rightExit],
		"languages":       [positions.leftExit, positions.left, positions.center, positions.right]
	}

	levels = [
		{name: 'fluent', position: positions.left},
		{name: 'intermediate', position: positions.center},
		{name: 'beginner', position: positions.right}
	]

	var 	svg = d3.select(selector).append("svg")
			.attr("width", width)
			.attr("height", height);

	var 	test = d3.layout.pack()
			.sort(null)
			.size([width, height])
			.children(function(d) { return d.values; })
			.value(function(d) { return d.radius * d.radius; })
			.nodes({
				values: d3.nest()
					.key(function(d) { return d.cluster; })
					.entries(cv_data[keys[0]])
			});

	var 	nodes = cv_data[keys[0]].concat(cv_data[keys[1]]),
		clusters = nodes.filter(function(d) {return d.main}),
		currentFoci;

	// keep other clusters offstage on init
	nodes.forEach(function(d) {
		if (d.cluster > 10) d.x = width + 100;
	});


	var 	force = d3.layout.force()
			.nodes(nodes)
			.links([])
			.gravity(0)
			.friction(0.8) // convergence speed
			.size([width, height])
			.on("tick", tick);

	var 	node = svg.selectAll("g").data(nodes);

	var	 g = node.enter().append("g")
			.attr("class", function(d) {return "node node-" + (d.cluster < 10 ? "p" : "n")})
			//.style("stroke", function(d) { return d3.rgb(fill(d.id)).darker(2); })
			.call(force.drag)

	g.append("circle")
		.attr("r", function(d) {return d.radius})
		.style("fill", function(d) { return d.color})

	g.append("text")
		.attr("class", "label")
		.attr("x", 0)
		.attr("y", 0)
		.attr("dy", 3)
		.text(function(d) { return capitalise(d.name)})

	svg.append('g').attr('class', 'level-g')
	      .selectAll('text')
		.data(levels).enter()
	      .append('text')
		.attr('class', 'level small-caps' )
		.attr('x', function(d) {return d.position.x})
		.attr('y', height * 0.4)
		.text(function(d) {return d.name})

	init();

	//////////////////////////////////////////////////////////////////////////////////  	
	function capitalise(string)
	{
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function tick(e) {
		var 	k = .1 * e.alpha;

		// Push nodes toward their designated focus.
		nodes.forEach(function(o, i) {
			o.y += (currentFoci[o.focus].y - o.y) * k;
			o.x += (currentFoci[o.focus].x - o.x) * k;
		});

		node
			.each(collide(.5))
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	}

	function init() {		
		click(menu.selectAll('.btn-cv').first(true))
		d3.select('.level-g').style('opacity', 0);
		currentFoci = foci["programming"];
		force.start();
	}

	function click(el) {
		
		var	el = el ? $(el) : $(this),	
			siblings = el.siblings('.btn-cv');

		siblings.removeClass('selected')
		el.addClass('selected');

		change();
	}

	function change() {
		var 	value = menu.selectAll('.btn-cv.selected').first().attr('name');
		
		currentFoci = foci[value];


		if (value === keys[0]) {
			d3.selectAll('.node-p').transition().duration(duration * 2).style('opacity', 1);
			d3.selectAll('.node-n').transition().duration(duration  * 1.5).style('opacity', 0);
			d3.select('.level-g').transition()
				.duration(duration)
				.style('opacity', 0);//.selectAll('text').attr('y', 0);;
		}
		else {
			d3.selectAll('.node-n').transition().duration(duration * 2).style('opacity', 1);
			d3.selectAll('.node-p').transition().duration(duration  * 1.5).style('opacity', 0);	
			d3.select('.level-g').transition()
				.delay(duration )
				.duration(duration * 2)
				.style('opacity', 1);
			//d3.select('.level-g').selectAll('text').attr('y', height / 6);		
		}

		//force.resume().start();
		nodes.forEach(function(o, i) {
		    o.x += (Math.random() - .5) * 40;
		    o.y += (Math.random() - .5) * 40;
		});
		  
		force.resume();
	}


	// Move d to be adjacent to the cluster node.
	function cluster(alpha) {
		return function(d) {
			var 	cluster = clusters[d.cluster];

			if (cluster === d) return;

			var 	x = d.x - cluster.x,
				y = d.y - cluster.y,
				l = Math.sqrt(x * x + y * y),
				r = d.radius + cluster.radius;

			if (l != r) {
				l = (l - r) / l * alpha;
				d.x -= x *= l;
				d.y -= y *= l;
				cluster.x += x;
				cluster.y += y;
			}
		};
	}

	// Resolves collisions between d and all other circles.
	function collide(alpha) {
		var quadtree = d3.geom.quadtree(nodes);

		return function(d) {
			var 	r = d.radius + maxRadius + Math.max(padding, clusterPadding),
				nx1 = d.x - r,
				nx2 = d.x + r,
				ny1 = d.y - r,
				ny2 = d.y + r;

			quadtree.visit(function(quad, x1, y1, x2, y2) {
				if (quad.point && (quad.point !== d)) {
					var 	x = d.x - quad.point.x,
						y = d.y - quad.point.y,
						l = Math.sqrt(x * x + y * y),
						r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);

					if (l < r) {
						l = (l - r) / l * alpha;
						d.x -= x *= l;
						d.y -= y *= l;
						quad.point.x += x;
						quad.point.y += y;
					}
				}

				return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
			});
		};
	}
}