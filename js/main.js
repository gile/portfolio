var 	id,
	duration = 500;

var 	columnOffset = {
		'home': 0,
		'ux': -1,
		'maps': -2,
		'cv': -3,
		'contact': -4
	};

var 	numColumns = Object.keys(columnOffset).length,
		columnWidth,
		$currentColumn;

var 	headerColor = '#4682b4',
	headerColorHover = '#63b6e5',
	headerActiveColor = '#f86767'; // red


/////////////////////////////////////////////////////////////
// Init Code
/////////////////////////////////////////////////////////////
$('document').ready(function() {

	
	
	$('.header-link').click(function() {
		var name = $(this).attr('name');
		headerLinkClick(name);
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

	$('.slides-container img')
	//runTocAnimation();


	// $('#create-widget-list' ).magnificPopup({
	// 	delegate: 'a', // child items selector, by clicking on it popup will open
 //  		type: 'image',
 //  		gallery:{enabled:true},
 //  		image: {
	// 	    // options for image content type
	// 	    titleSrc: 'title'
 // 		}
 //  		// other options
	// });
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
	var 	str = "Table of Contents";

	var 	initial_delay = 1000,
		delay_step = 20;

	var 	text = "";

	var 	titleText = d3.select('#home-title-text')

	for (var i =0; i < str.length; ++i) {
		titleText.transition()
			.delay(initial_delay + i*delay_step)
			.text(str.slice(0, i))
	}
		
	titleText.transition()
	  	.delay( initial_delay + ((str.length + 1) * delay_step) )	
	  	.each("end", function() {
	  		d3.select('#home-title-cursor').style('visibility', 'hidden');
			d3.select('#home-content').style('visibility', 'visible');
		});
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
