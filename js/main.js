var 	id,
	duration = 500;

var 	columnOffset = {
		'home': 0,
		'case-study': -1,
		'maps': -2,
		'cv': -3,
		'contact': -4
	};

var 	numColumns = Object.keys(columnOffset).length,
		columnWidth,
		$currentColumn;




/////////////////////////////////////////////////////////////
// Init Code
/////////////////////////////////////////////////////////////
$('document').ready(function() {

	

	$('.header-link').click(function() {
		var name = $(this).attr('name');
		headerLinkClick(name);
	});

	$('.toc-item').click(function() {
		var name = $(this).attr('name');
		headerLinkClick(name);
	});

	$currentColumn = $('#column-home');
	$('.main-container').css({height: $currentColumn.height()});

	doneResizing();		

	$( '#fwslider-create-widget' ).cbpFWSlider();	
	$( '#fwslider-move-widget' ).cbpFWSlider();		
	$( '#fwslider-product-screenshots' ).cbpFWSlider();		

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


	var 	str = "Table of Contents";
	var 	initial_delay = 1000,
		delay_step = 50;

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
			d3.select('#toc-container').style('visibility', 'visible');
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


function headerLinkClick(columnName) {
	var mainContainerCss,
		$thisColumn = $('#column-' + columnName);

	if ($currentColumn.attr('id') === $thisColumn.attr('id') ) return; 

	$currentColumn.animate({opacity: 0});
	$thisColumn.animate({opacity: 1});
	$currentColumn = $thisColumn;

	mainContainerCss = {
		height: $thisColumn.height(),
		marginLeft: columnWidth * columnOffset[columnName]
	}

	$('.main-container').animate(mainContainerCss, duration);

	console.log('CLICK', columnName, $('.main-container').height());
}	 