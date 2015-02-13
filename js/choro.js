var CHORO_MAP_EXTENSION = {
    mutex: false,

    options: {
        defaultOptions: {
            scaleFactor:  0.7,
            translateXfactor: 0,
            translateYfactor: 0,
            translateXDelta: 30,
            translateYDelta: -30,
            //translateYDelta: 0,
            chartTitle: "State Info"
        }
    },

    browserInfo: get_browser(),

    createChoroMap: function(mapName, input_data, parent, indexMap, userOptions) {

        var MAP_TYPE = "CHORO";

        var width = $(parent).width(),
              height = $(parent).height(),
              offset = $(parent).offset();

        var mapName = mapName.replaceSpaces(),
            canvasWidth = width,
            canvasHeight = height,            
            canvasTop = offset.top,
            canvasLeft = offset.left,
            isWide = true;//!!((canvasWidth > 800));

        var indexMap = indexMap || {state: 0, myGrowth: 1, marketGrowth: 2, gap: 3};

        var i;


        // configure the default options
        CHORO_MAP_EXTENSION.options.defaultOptions.translateXfactor = isWide ? 0.06 : 0.01;
        CHORO_MAP_EXTENSION.options.defaultOptions.translateYfactor = isWide ? 0.15 : -0.05;

        // override defaults with user options
        CHORO_MAP_EXTENSION.options[mapName] = CHORO_MAP_EXTENSION.options.defaultOptions;
        $.extend(CHORO_MAP_EXTENSION.options[mapName], userOptions, true);

        var options = CHORO_MAP_EXTENSION.options[mapName];

        $(parent).empty();

        var translateXDelta = options.translateXDelta,
              translateYDelta = options.translateYDelta;

        var COLOR_PALETTE = {
                // -- MAP COLORS --
                stateColorScale: [                
                    getMyColor("green"),
                    getMyColor('white'),
                    getMyColor("red")
                ],
                noMeasureData: getMyColor("light grey"),
                noStateData: getMyColor("dark grey"),

                // -- CHART COLORS --
                chartTitle: getMyColor("dark grey"),
                barName: getMyColor("light grey"),

                barPositive: getMyColor("green"),
                barNegative: getMyColor("red"),
                barZero: getMyColor('white'),

                // percentages
                barLabel: getMyColor('white'),
                barLabel0: getMyColor('black'),
                barLabelNA: getMyColor('grey')
            },
            MAX_MEASURE_VALUE = 1000000,
            MIN_MEASURE_VALUE = -1000000,
            STATE_KEYS,
            CHART_TRANSITION = 500,
            NUM_BARS = 2,
            CHART_RELATIVE_WIDTH = 0.2,
            LEGEND_RELATIVE_WIDTH = 0.05,
            MAX_CHART_WIDTH = 320,
            AVERAGE_TITLE = "US Average";

        var $parent = $(parent);

        var dataArray = [];
        var mapArray = US_STATES.features;
        var metadata = input_data.metadata;

        var stateIndex = metadata.state.index,
            myGrowthIndex = metadata.myGrowth.index,
            marketGrowthIndex = metadata.marketGrowth.index,
            gapIndex = metadata.gap.index;

        // will set which measures are displayed as bars or markers
        var measureIndex = [
            marketGrowthIndex,  // Left Bar
            myGrowthIndex,      // Right Bar
            gapIndex            // Marker
        ]

        // Map state variables
        var currentHoverStateIndex = -1,
            currentDisplayedStateIndex = -1,
            currentMeasureIndex = gapIndex,
            currentStateName = AVERAGE_TITLE;

        // chart state variables
        var barHeight = [],
            barSign = [],
            maxBarIndex,
            minBarIndex,
            maxOldBarIndex,
            minOldBarIndex;

        var barChangedSign = [],
            maxBarChangedSign,
            minBarChangedSign;

        var oldBarHeight = [],
            oldBarSign = [];

        var minMeasures = [],
            maxMeasures = [];

        for (i=0; i<measureIndex.length; ++i) {
            var mIndex = measureIndex[i];
            minMeasures[mIndex] = {name: "", value:MAX_MEASURE_VALUE};
            maxMeasures[mIndex] = {name: "", value:MIN_MEASURE_VALUE};
        }       

        // clean up the data to ignore territories not on the map.
        // also, use this loop to find the min and max values for each measure
        for (i=0; i<input_data.data.length; ++i) {

            var d = input_data.data[i];

            if (d) {
                var stateName = d[stateIndex];

                if (stateName !== null && !CHORO_MAP_EXTENSION.ignoreStatesList[stateName]) {
                    dataArray.push(d);

                    for (var mi=0; mi<measureIndex.length; ++mi) {
                        var mIndex = measureIndex[mi],
                            value = getNumericValue(d[mIndex], true);

                        if (value > maxMeasures[mIndex].value) {
                            maxMeasures[mIndex].value = value;
                            maxMeasures[mIndex].name = stateName;
                        }

                        if (value < minMeasures[mIndex].value) {
                            minMeasures[mIndex].value = value;
                            minMeasures[mIndex].name = stateName;
                        }
                    }
                }
            }
        }
        //printMeasureExtremes();

        STATE_KEYS = createStateKeys();

        // add entry to data array with US average info
        var dataAverageIndex = dataArray.length;
        dataArray[dataAverageIndex] = [];
        dataArray[dataAverageIndex][stateIndex] = "Average";
        dataArray[dataAverageIndex][marketGrowthIndex] = calculateUSAverage(marketGrowthIndex);//{data: 0.32, value: "32.0%"};
        dataArray[dataAverageIndex][myGrowthIndex] = calculateUSAverage(myGrowthIndex);//{data: -0.08, value: "-8.0%"};
        dataArray[dataAverageIndex][gapIndex] = calculateUSAverage(gapIndex);//{data: -0.4, value: "-40.0%"};

        

        var colorScale;
        updateColorScale();

        var $map = createDomElement($parent, mapName);
        $map.addClass(MAP_TYPE);

        // create map buttons container
        var $mapButtonContainer = createDomElement($map, "map_button_container");

        var mapButtonP = createDomElement($mapButtonContainer, "map_button_p", "", "p"),
            $mapButtonP = $(getIdSelector("map_button_p")),
            $mapButtons = [];

        for (var i=0; i<measureIndex.length; ++i) {
            var buttonText = metadata.byIndex[measureIndex[i]].title.toLowerCase();

            if (i !== 0) {
                createDomElement($mapButtonP, 'map_button_separator', i-1, 'span');
            }
            $mapButtons[i] = createDomElement($mapButtonP, 'map_button', i, 'span');
            $mapButtons[i].text(buttonText);
            $mapButtons[i].attr('measure_index', measureIndex[i]);
            //$mapButtons[i].attr('onclick', 'mapButtonClick');
        }

        $(getClassSelector('map_button_separator')).text(" | ");

        var $mapButtons = $(getClassSelector('map_button'));
        if (isWide) {
            $mapButtons.addClass("wide");
        }
        $mapButtons.click(mapButtonClick);

        //$container.append('<div id="svg_container" class="svg_container"></div>');
        createDomElement($map, "svg_container");

        
       
        var buttonsContainerHeight = 40,
            svgWidth = canvasWidth,
            svgHeight = canvasHeight - buttonsContainerHeight,
            chartContainerWidth = Math.min(CHART_RELATIVE_WIDTH * svgWidth, MAX_CHART_WIDTH),
            legendContainerWidth = LEGEND_RELATIVE_WIDTH * svgWidth,
            mapContainerWidth = svgWidth - chartContainerWidth - legendContainerWidth,
            chartContainerHeight = svgHeight * 0.9,
            legendContainerHeight = chartContainerHeight,
            legendBarTranslateX =   5,
            legendTextTranslateX = 30,
            legendRectSpacing = 15,
            legendRectHeight = 15,
            legendRectWidth = 20;

        var projection = d3.geo.albersUsa()
            .scale(canvasWidth * options.scaleFactor)
            .translate([
                 svgWidth * options.translateXfactor,
                 svgHeight * options.translateYfactor
            ]);

        var path = d3.geo.path()
            .projection(projection);
         
        $mapButtonContainer.width(legendContainerWidth + mapContainerWidth);
        $mapButtonContainer.height(buttonsContainerHeight);

        ///////////////////////////////////////////////////////////
        // CREATE MAP GROUPS ////////////////////////////////////
        ///////////////////////////////////////////////////////////

        var svg = d3.select('#svg_container').append("svg")
            .attr('class', 'canvas')
            .attr("width", svgWidth)
            .attr("height", svgHeight);

        svg.append("svg:rect")
            .attr("class", "background")
            .attr("id", "states_background")
            .attr("width", mapContainerWidth)
            .attr("height", svgHeight - buttonsContainerHeight);

        var statesContainer = svg.append("svg:g")
            .attr("id", "states_container")
            .attr("width", mapContainerWidth)
            .attr("height", svgHeight)
            .attr("transform", "translate(" + parseFloat(mapContainerWidth / 2 + translateXDelta) + "," + (svgHeight / 3  + translateYDelta)+ ")");

        var states = statesContainer.selectAll("path")
            .data(mapArray)
          .enter().append("svg:path")
            .attr("class", "state")
            .attr("id", function(d) { return 'state_' + d.properties.name.replaceSpaces(); })
            .attr("dataIndex", function(d) {return getStateKeyByName(d.properties.name, 'data');})
            .attr("mapIndex", function(d) {return getStateKeyByName(d.properties.name, 'map');})
            .attr("name", function(d) {return d.properties.name.replaceSpaces();})
            .attr('center_x', function(d) { return path.centroid(d)[0] })
            .attr('center_y', function(d) { return path.centroid(d)[1] })
            .attr('fill', function(d) {
                var stateName = d.properties.name,
                    dataIndex = getStateKeyByName(stateName, 'data');

                return getStateColor(dataIndex, gapIndex);
            })
            .attr("d", path);


        ///////////////////////////////////////////////////////////
        ///////////////    LEGEND     ////////////////////////////
        //////////////////////////////////////////////////////////

        // create the legend container
        var legendContainer = svg.append("svg:g")
            .attr("id", "legend_container")
            .attr("width", legendContainerWidth)
            .attr("height", svgHeight)
            .attr("transform", "translate(20, 10)");

        legendContainer.append("svg:rect")
            .attr("id", "legend_background")
            .attr("class", "legend_background")
            .attr("width", legendContainerWidth * 2)
            .attr("height", svgHeight);

        // create the gradient for the legend
        var legendGradient = legendContainer.append("svg:linearGradient")
            .attr("id", "legend_gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        // create the legend bar
        var legendBarHeight = legendContainerHeight * 0.8;

        var legendBar = legendContainer.append("svg:rect")
            .attr("class", "legend_bar")
            .attr("width", legendRectWidth)
            .attr("height", legendBarHeight)
            .attr("transform", "translate(" + legendBarTranslateX + ", 0)")
            .style("fill", "url(#legend_gradient)")
            .style("stroke", getMyColor("light grey"));

        // create the legend axis. Note the inverted range for the y-scale: bigger is up!
        var formatPercent = d3.format(".0%");
        var yLegend = d3.scale.linear()
            .range([legendBarHeight, 0]);

        var legendYAxis = d3.svg.axis()
            .scale(yLegend)
            .ticks(10)
            .tickSize(4, 3, 3)
            .tickPadding(6)
            .tickFormat(formatPercent)
            .orient("right");

        // Add the y-axis.
        legendContainer.append("svg:g")
            .attr("class", "axis y_axis y_axis_legend")
            .attr("transform", "translate(" + legendTextTranslateX + ",0)")
            .call(legendYAxis);

        legendContainer.append("svg:rect")
            .attr("class", "legend_rect")
            .attr("width", legendRectWidth)
            .attr("height", legendRectHeight)
            .attr("transform", "translate(" + legendBarTranslateX + ", " + (legendBarHeight + legendRectSpacing) + ")")
            .attr("fill", COLOR_PALETTE.noMeasureData);

        legendContainer.append("svg:text")
            .attr("class", "legend_text")
            .attr("transform", "translate(" + (legendBarTranslateX + legendRectWidth + 10) + ", " +
                (legendBarHeight + legendRectSpacing + legendRectHeight*0.75) + ")")
            .text("- no data for this measure");

        legendContainer.append("svg:rect")
            .attr("class", "legend_rect")
            .attr("width", legendRectWidth)
            .attr("height", legendRectHeight)
            .attr("transform", "translate(" + legendBarTranslateX + ", " +
                (legendBarHeight + legendRectHeight + 2*legendRectSpacing) + ")")
            .attr("fill", COLOR_PALETTE.noStateData);

        legendContainer.append("svg:text")
            .attr("class", "legend_text")
            .attr("transform", "translate(" + (legendBarTranslateX + legendRectWidth + 10) + ", " +
            (legendBarHeight + legendRectHeight + 2*legendRectSpacing + 0.75*legendRectHeight) + ")")
            .text("- no data for this state");

        ///////////////////////////////////////////////////////////
        ///////////////    CHART     ////////////////////////////
        //////////////////////////////////////////////////////////

        // BUILD THE CHART
        var CHART_LEFT_PADDING_FACTOR = isWide ? 0.02 : 0.01,
            CHART_RIGHT_PADDING_FACTOR = 0;//0.055;

        // draw chart display on the side
        var chartHorizontalPadding = chartContainerWidth * 0.1,
            chartPaddingTop = svgHeight * 0.05,
            chartPaddingBottom = 0,//svgHeight * 0.12,
            interBarPadding = svgWidth * 0.01,
            chartPaddingLeft = svgWidth * CHART_LEFT_PADDING_FACTOR,
            chartPaddingRight = svgWidth * CHART_RIGHT_PADDING_FACTOR,
            chartWidth = chartContainerWidth - (chartHorizontalPadding * 2),
            chartHeight = chartContainerHeight - chartPaddingTop - chartPaddingBottom,
            chartCenter = (chartHeight / 2) + 20,
            barWidth = (chartWidth - interBarPadding - chartPaddingLeft - chartPaddingRight) / 2,
            initialBarHeight = 0,
            maxBarHeight = Math.min(chartCenter, chartHeight/2) * 0.7,
            barHeight = getBarHeight(dataAverageIndex),
            stateLabelTopPadding = chartHeight * 0.05,
            barNameTopPadding = stateLabelTopPadding + chartHeight * 0.07,
            gapLabelOffset = -13,
            i = 0;

        var xAxisStart = 0,
            xAxisEnd = chartWidth,
            yAxisStart = 10,
            yAxisEnd = chartHeight - 10;

        var chartContainer = svg.append("svg:g")
            .attr("id", "chartContainer")
            .attr("width", chartContainerWidth)
            .attr("height", svgHeight)
            .attr("transform", "translate(" + (mapContainerWidth - 2) + ", 0)");

        chartContainer.append("svg:rect")
            .attr("class", "background charts_container_background")
            .attr("id", "charts_container_background")
            .attr('width', chartContainerWidth)
            .attr('height', chartContainerHeight);

        var chartTitle = chartContainer.append("svg:text")
            .attr("id", "chart_title")
            .attr("class", "chart_title")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + (chartPaddingLeft + chartContainerWidth / 2) + ", " + (chartPaddingTop - 8) + ")")
            .style('fill', COLOR_PALETTE.chartTitle)
            .text(options.chartTitle);

        var chart = chartContainer.append("svg:g")
            .attr("id", "chart")
            .attr("class", "chart")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("transform", "translate(" + chartHorizontalPadding + ", " + chartPaddingTop + ")");

        var chartBackground = chart.append("svg:rect")
            .attr('class', 'chart_background')
            .attr('width', chartWidth)
            .attr('height', chartHeight)
            .attr('rx', 10)
            .attr('ry', 10);

        var stateLabel =  chart.append("svg:text")
            .attr('id', 'state_label')
            .attr('class', 'state_label')
            .attr('x', chartPaddingLeft + chartWidth / 2)
            .attr('y', 0)
            .attr("dy", stateLabelTopPadding) // padding-top
            .attr("text-anchor", "middle") // text-align: right
            .style('fill', COLOR_PALETTE.chartTitle);

        var stateLabelUnderline = chart.append("svg:line")
            .attr('y1', stateLabelTopPadding + 5)
            .attr('y2', stateLabelTopPadding + 5)
            //.style('stroke-dasharray', "2,2")
            .style('stroke-width', 0.5)
            .style('stroke', COLOR_PALETTE.chartTitle);

        var bars = [];
        for (i=0; i<NUM_BARS; ++i) {
            bars[i] = chart.append("svg:rect")
                .attr('class', 'bar')
                .attr('id', 'bar_' + i)
                .attr('width', barWidth)
                .attr('height', 0)
                .attr('transform', getBarTransform(i, 0))
                .style('fill', getBarColor(i, dataAverageIndex));
        }

        // bar names
        for (i=0; i<NUM_BARS; ++i) {
            chart.append("svg:text")
                .attr('class', 'bar_name')
                .attr('id', 'bar_name_' + i)
                .attr('x', function() {
                    return chartPaddingLeft + (barWidth + interBarPadding) * i + barWidth / 2;
                })
                .attr('y', 0)
                .attr("dy", barNameTopPadding)
                .attr("text-anchor", "middle")
                .style('fill', COLOR_PALETTE.barName)
                .text(metadata.byIndex[measureIndex[i]].title.toLowerCase());
        }

        // gap name
        chart.append("svg:text")
            .attr('class', 'gap_name bar_name')
            .attr('id', 'gap_name')
            .attr('x', chartPaddingLeft + (barWidth + interBarPadding) * NUM_BARS + 18)
            .attr('y', 0)
            .attr("dy", barNameTopPadding)
            .attr("text-anchor", "middle")
            .style('fill', COLOR_PALETTE.barName)
            .text(metadata.byIndex[measureIndex[i]].title.toLowerCase());

        var barNames = d3.selectAll(getClassSelector('bar_name'));
        barNames.classed('wide', isWide);

        // the chart x-axis
        var xAxisChart = chart.append("svg:line")
            .attr('id', 'x_axis_chart')
            .attr('class', 'axis_chart')
            .attr('x1', 0)
            .attr('y1', chartCenter)
            .attr('x2', chartWidth)
            .attr('y2', chartCenter);

        // the chart y-axis
        var yAxisChart = chart.append("svg:line")
            .attr('id', 'y_axis_chart')
            .attr('class', 'axis_chart')
            .attr('x1', 0)
            .attr('y1', yAxisStart)
            .attr('x2', 0)
            .attr('y2', yAxisEnd);

        // the gap marker
        var gapMarker = chart.append("svg:path")
            .attr('class', isWide ? 'gap_marker wide' : 'gqp_marker')
            .attr('d', marker)
            .attr('transform', translateMarker(barHeight))
            .style('stroke', 'red')
            .style('fill', 'none');

        // bar percentages
        var labels = [];
        for (i=0; i<NUM_BARS; ++i) {
            labels[i] = chart.append("svg:text")
                .attr('class', isWide ? 'barLabel wide' : 'barLabel')
                .attr('x', x(i))
                .attr('y', chartCenter)
                .attr("dx", barWidth / 2) // padding-left
                .attr("text-anchor", "middle") // text-align: right
                .style('fill', COLOR_PALETTE.barLabel);
        }

        var gapLabel = chart.append("svg:text")
            .attr('class', isWide ? 'gapLabel wide' : 'gapLabel')
            .attr('transform', translateMarkerLabel(barHeight))
            .attr("dx", barWidth / 2) // padding-left
            .attr("text-anchor", "left") // text-align: right
            .style('fill', 'red');

        for(i=0; i<NUM_BARS; ++i) {
            oldBarHeight[i] = barHeight[i];
            oldBarSign[i] = getSign(barHeight[i]);
        }

        // Initially we both hover over and display the US average
        currentHoverStateIndex = dataAverageIndex;
        currentDisplayedStateIndex = -1;//dataAverageIndex;

        setHoverBehaviour();
        drawChart(dataAverageIndex);
        $(getIdSelector('map_button_2')).trigger('click');


        /////////////////////////////////////////////////////////////////////////////////////
        //////////////   FUNCTIONS  /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////

        function getIdSelector(elementName) {
            return '#' + mapName.replaceSpaces() + ' #' + elementName;
        }

        function getClassSelector(elementName) {
            return '.' + MAP_TYPE.replaceSpaces() + ' .' + elementName;
        }

        function x(barIndex) {
            return (barWidth + interBarPadding) * barIndex + chartPaddingLeft;
        }

        function getColorScale() {
            var color,
                domain,
                range;

            // input has no legal values for this measure
            if (maxMeasures[currentMeasureIndex].value === MIN_MEASURE_VALUE ||
                (maxMeasures[currentMeasureIndex].value === 0 && minMeasures[currentMeasureIndex].value === 0))
            {
                color = function(val) {return COLOR_PALETTE.barZero;};
            }
            else {
                // check if we need both red and green in the scale
                if (0 < maxMeasures[currentMeasureIndex].value && 0 > minMeasures[currentMeasureIndex].value) {
                    domain = [
                        maxMeasures[currentMeasureIndex].value,                  
                        0,                       
                        minMeasures[currentMeasureIndex].value
                    ];
                    range = COLOR_PALETTE.stateColorScale;
                }

                // the color scale is monochromatic
                else {
                    domain = [maxMeasures[currentMeasureIndex].value, minMeasures[currentMeasureIndex].value];

                    // the scale is green
                    if (maxMeasures[currentMeasureIndex].value > 0) { // maxMeasures can be zero
                        range = [
                            COLOR_PALETTE.stateColorScale[0], // white
                            COLOR_PALETTE.stateColorScale[1] // green
                        ];
                    }

                    // the scale is red
                    else {
                        range = [
                            COLOR_PALETTE.stateColorScale[1], // white
                            COLOR_PALETTE.stateColorScale[2] // red
                        ];
                    }
                }
                domain.sort(function(a, b) {
                    if (a === b) {return 0;}

                    if (a > b) { return -1;}

                    return 1;
                });

                color = d3.scale.linear()
                    .domain(domain)
                    .range(range);
                color.clamp(true);
            }

            return color;
        }

        function updateColorScale() {
            colorScale = getColorScale();

            var stopValues,
                data,
                minValue = minMeasures[currentMeasureIndex].value,
                maxValue = maxMeasures[currentMeasureIndex].value,
                midValue = (maxValue + minValue) / 2;

            if (minValue <= 0 && maxValue >= 0) {
                var zeroPosition = 1 - (Math.abs(minValue) / (maxValue - minValue));
                stopValues = [0, zeroPosition * 100, 100];
                data = [colorScale(maxValue), colorScale(0), colorScale(minValue)];
            }
            else {
                stopValues = [0, 50, 100];
                data = [colorScale(maxValue), colorScale(midValue), colorScale(minValue)];
            }

            var stops = d3.select(getIdSelector('legend_gradient')).selectAll('stop')
                .data(data);

            stops.enter().append('stop');

            stops.transition()
                .duration(CHART_TRANSITION)
                .attr('offset', function(d, i) { return stopValues[i] + "%"; })
                .attr('stop-color', function(d) { return d; });

            stops.exit().remove();
        }

        function y(barIndex) {
            var height = barHeight[barIndex],
                sign = getSign(height);

            //console.log(height);
            if (isCloseToZero(maxBarHeight, height)) {
                return chartCenter + (5 * sign);
            }
            return chartCenter - height;
        }

        function isCloseToZero(range, number) {
            var epsilon = 0.12,
                range = range || 0.1;

            if (Math.abs(number) < Math.abs(range * epsilon) ) {
                return true;
            }
            return false;
        }

        function getStateColor(dataIndex, measureIndex) {
            var value;

            if (dataIndex < 0) {
                return COLOR_PALETTE.noStateData;
            }

            value = getNumericValue(dataArray[dataIndex][measureIndex], true);

            return value ? colorScale(value) : COLOR_PALETTE.noMeasureData;
        }

        function getBarColor(barIndex, dataIndex) {
            var mi = measureIndex[barIndex],
                value = dataArray[dataIndex][mi].data;//barHeight[barIndex];


           // if (value === 0) {
            if(isCloseToZero(value)) {
                return COLOR_PALETTE.barZero;            
            }
            return (value > 0) ? COLOR_PALETTE.barPositive : COLOR_PALETTE.barNegative;
        }

        function getMarkerColor(dataIndex) {
            if (!dataArray[dataIndex]) {
                return COLOR_PALETTE.barZero;
            }

            var value = getNumericValue(dataArray[dataIndex][measureIndex[2]], true) || 0;

            return (value > 0) ? COLOR_PALETTE.barPositive : COLOR_PALETTE.barNegative;
        }

        function getLabelColor(labelIndex, epsilon) {
            var value = barHeight[labelIndex];

            //if (value < maxBarHeight && value > -maxBarHeight * 0.15) {
            if (isCloseToZero(maxBarHeight, value)) {
                return COLOR_PALETTE.barLabel0;
            }

            return COLOR_PALETTE.barLabel;
        }

        function getBarHeight(dataIndex) {
            var dataElement,
                normalizationFactor = 3,
                measures = [],
                heightValues = [],
                height;

            if (dataIndex === -1) {
                return [initialBarHeight, initialBarHeight];
            }
            else {
                dataElement = dataArray[dataIndex];
            }

            // set height 0 for measures with non-numeric value (e.g. "N/A")
            measures[0] = getNumericValue(dataElement[measureIndex[0]], true) || 0;
            measures[1] = getNumericValue(dataElement[measureIndex[1]], true) || 0;
            measures[2] = getNumericValue(dataElement[measureIndex[2]], true) || 0;

            // find the max absolute value
            var maxValueIndex = Math.abs(measures[0]) > Math.abs(measures[1]) ? 0 : 1,
                maxValueIndexAbs = Math.abs(measures[maxValueIndex]),
                minValueIndex = 1 - maxValueIndex;

            // find the scale of the difference between the two values
            var normalizedMinValue = measures[minValueIndex],

                // don't divide by zero
                differenceScale = (measures[minValueIndex] === 0) ?
                    1 :
                    Math.abs(measures[maxValueIndex] / measures[minValueIndex]);

            // see if we need to normalize
            if (differenceScale > 10) {
                // find the magnification factor for the smaller measure
                while(differenceScale > 100) {
                    normalizationFactor *= 10;
                    differenceScale /= 10;
                }

                normalizedMinValue *= normalizationFactor;
            }

            height = d3.scale.linear()
                //.domain(d3.extent(dataArray, function(d) { return d[measureIndex].data;}))
                .domain([-maxValueIndexAbs, 0, maxValueIndexAbs])
                //.range([-maxBarHeight, maxBarHeight]),
                .range([-maxBarHeight, 0, maxBarHeight]);

            height.clamp(true);

            heightValues[maxValueIndex] = height(measures[maxValueIndex]);
            heightValues[minValueIndex] = height(normalizedMinValue);
            //console.log(heightValues);
            return heightValues;
        }

        function getBarTransform(barIndex, height) {

            //console.log('getBarTransform');

            // barIndex = 0: Left
            // barIndex = 1: right

            var transform,
                barSign = getSign(height),
                oldBarSign = getSign(oldBarHeight[barIndex]),
                barSignChanged = barSign !== oldBarSign,
                translate = {};

            if (barSign > 0 && barSignChanged) {
                translate.y = chartCenter;
            }
            else if (barSign < 0 && barSignChanged) {
                translate.y = chartCenter;
            }
            else if(barSign > 0) {
                translate.y =  chartCenter - height;
            }
            else {
                translate.y = chartCenter;
            }


            translate.x = x(barIndex);

            oldBarHeight[barIndex] = height;

            transform = "translate(" + translate.x + ", " + translate.y + ")";

            return transform;

        }

        function getMarkerLength() {
            return Math.abs(barHeight[0] - barHeight[1]);
        }

        function getMarkerOffset() {
            var maxBarHeight = d3.max(barHeight),
                offset = {
                    x: chartPaddingLeft + interBarPadding + (barWidth * NUM_BARS) + 5,
                    y: chartCenter - maxBarHeight
                };

            offset.x *= (isWide) ? 1 : 0.98;
            return offset;
        }

        function marker () {
            var length = getMarkerLength(),
                markerWidth = isWide ? 10 : 5;

            return "M0 0 L" + markerWidth + " 0 L" + markerWidth + " " + length + " L0 " + length;
        }


        function translateMarker(barHeight) {
                var markerOffset = getMarkerOffset();
                translate = {
                    x: markerOffset.x,
                    y: markerOffset.y
                };
            return "translate(" + translate.x + ", " + translate.y + ")";
        }

        function translateMarkerLabel(barHeight) {
            var markerLength = Math.abs(barHeight[0] - barHeight[1]),
                maxBarHeight = d3.max(barHeight),
                markerOffset = getMarkerOffset(),
                translate = {
                    x: markerOffset.x + gapLabelOffset, // TODO: check why we need this offset
                    y: chartCenter - maxBarHeight + (markerLength / 2)
                };

            return "translate(" + translate.x + ", " + translate.y + ")";
        }

        function drawChart(dataIndex) {
            //console.log('drawChart', dataIndex);

            updateStateName();

            // check if we are already displaying selected state
            if(dataIndex === currentDisplayedStateIndex) {
                return;
            }

            // check if we are re-entrant
            if(CHORO_MAP_EXTENSION.mutex) {
                //console.log('LOCKED', dataIndex);
                return;
            }
            CHORO_MAP_EXTENSION.mutex = true;
//            console.log('');
//            console.log('Locking', dataIndex);

            currentDisplayedStateIndex = dataIndex;
            barHeight = getBarHeight(dataIndex);
            maxBarIndex = barHeight[0] > barHeight[1] ? 0 : 1;
            minBarIndex = 1 - maxBarIndex;
            maxOldBarIndex = oldBarHeight[0] > oldBarHeight[1] ? 0 : 1;
            minOldBarIndex = 1 - maxOldBarIndex;
            barSign = [
                getSign(barHeight[0]),
                getSign(barHeight[1])
            ],
            barChangedSign = [
                barSign[0] !== oldBarSign[0],
                barSign[1] !== oldBarSign[1]
            ];

            // update the chart (bars and marker)
            for (var i=0; i<bars.length; ++i) {
                updateBar(i);
                updateLabel(i);
            }

            updateMarker(dataIndex);

            function updateBar(barIndex) {
    
                var h = Math.abs(barHeight[barIndex]),
                    barColors = [
                        getBarColor(0, dataIndex),
                        getBarColor(1, dataIndex)
                    ];

                if (barChangedSign[barIndex]) {
                    bars[barIndex]
                        .style("fill", barColors[barIndex])
                      .transition()
                        .duration(CHART_TRANSITION / 2)
                        .ease('linear')
                        .attr('height', 0)
                        .attr("transform", function() {return getBarTransform(barIndex, 0);})
                      .transition()
                        .duration(0)
                        .delay(CHART_TRANSITION / 2)
                        
                      .transition()
                        .duration(CHART_TRANSITION / 2)
                        .delay(CHART_TRANSITION / 2)
                        .ease('linear')
                        .attr("transform", function() {return getBarTransform(barIndex, barHeight[barIndex]);})
                        .attr('height', h);
                }
                else {
                    var delay;
                    if (barHeight[barIndex] === 0) {
                        delay = CHART_TRANSITION;
                    }
                    else {
                        delay = 0
                    }
                    bars[barIndex]
                        .style("fill", barColors[barIndex])
                      .transition()
                        .duration(CHART_TRANSITION)
                        .attr('height', h)
                        .attr("transform", function() {
                            var tr = getBarTransform(barIndex, barHeight[barIndex]);
                            return tr;
                        })                    
                }
            }

            // update the marker.
            function updateMarker(dataIndex) {

                if (maxBarChangedSign || minBarChangedSign) {
                    gapMarker.transition()
                        .duration(CHART_TRANSITION / 2)
                        .attr('d', marker([0, 0]))
                        .attr('transform', translateMarker([0, 0]));

                    gapMarker.transition()
                        .duration(CHART_TRANSITION / 2)
                        .delay(CHART_TRANSITION / 2)
                        .attr('d', marker(barHeight))
                        .attr('transform', translateMarker(barHeight))
                        .style('stroke', function() {
                            if (getMarkerLength() > 0) {
                                return getMarkerColor(dataIndex);
                            }
                            else {
                                return 'grey';
                            }
                        });
                }
                else {

                    gapMarker.transition()
                        .duration(CHART_TRANSITION)
                        .attr('d', marker(barHeight))
                        .attr('transform', translateMarker(barHeight))
                        .style('stroke', function() {
                            if (getMarkerLength() > 0) {
                                return getMarkerColor(dataIndex);
                            }
                            else {
                                return 'grey';
                            }
                        });
                }

                gapLabel.transition()
                    .duration(CHART_TRANSITION)
                    .attr('transform', translateMarkerLabel(barHeight))
                    .style('fill', getMarkerColor(dataIndex))//getStateColor(dataIndex, gapIndex))
                    .text(function() {
                        return (dataIndex < 0 || dataArray[dataIndex][gapIndex].data === 0) ?
                            "" :
                            dataArray[dataIndex][gapIndex].text;
                    });
            }

            function updateLabel(labelIndex) {

                labels[labelIndex].transition()
                    .duration(CHART_TRANSITION)
                    .attr('y', y(labelIndex))
                    .attr("dy", function() {
                        var dy;
                        if (getSign(barHeight[labelIndex]) > 0) {
                            dy = isCloseToZero(maxBarHeight, barHeight[labelIndex]) ?
                                10 :
                                chartHeight * 0.04;
                        }
                        else {
                            dy = isCloseToZero(maxBarHeight, barHeight[labelIndex]) ?
                                0 :
                                -chartHeight * 0.02;
                        }
                        return dy;
                    })
                    .style('fill', function() {
                        if (!dataArray[dataIndex] || dataArray[dataIndex][measureIndex[labelIndex]].text === "N\\A") {
                            return COLOR_PALETTE.barLabelNA;
                        }
                        return getLabelColor(labelIndex);
                    })
                    .text(function() {
                        if (!dataArray[dataIndex]) {
                            return "N\\A";
                        }
                        return dataArray[dataIndex][measureIndex[labelIndex]].text || "N\\A";
                    })
            }

            function updateStateName() {
                stateLabel.text(currentStateName);
            }

            // update old values only after transition finishes so that the bar direction doesn't get confused
            // when we quickly mouse over several states with different value signs
            setTimeout(function() {
                    for(var i=0; i<barHeight.length; ++i) {
                        oldBarHeight[i] = barHeight[i];
                        oldBarSign[i] = barSign[i];
                    }
                    CHORO_MAP_EXTENSION.mutex = false;
                    //console.log('Unlocked', dataIndex);

                    // see if we are hovering over a different state than the one displayed in the chart
                    if(currentDisplayedStateIndex !== currentHoverStateIndex) {
                        drawChart(currentHoverStateIndex);
                    }
                },
                CHART_TRANSITION
            );
        }

        function createStateKeys() {
            var map_state_keys = {},
                data_state_keys = {},
                state_keys = {},
                state,
                i;

            // map the state polygon list
            for (i=0; i<mapArray.length; ++i) {
                state = mapArray[i].properties.name;
                map_state_keys[state] = i;

            }
            state_keys.map_keys = map_state_keys;

            // map the countries received in the input data
            for (i=0; i<dataArray.length; ++i) {
                state = dataArray[i][stateIndex];

                dataArray[i][stateIndex] = state; // save the fixed names
                data_state_keys[state] = i;
            }
            state_keys.data_keys = data_state_keys;

            return state_keys;
        }

        function getStateKeyByName(stateName, source) {
            var key = -1;

            if (source === "map" && stateName && STATE_KEYS.map_keys[stateName] >= 0) {

                key = STATE_KEYS.map_keys[stateName];
            }
            else if (source === "data" && stateName && STATE_KEYS.data_keys[stateName]  >= 0) {
                key = STATE_KEYS.data_keys[stateName];
            }

            return key;
        }


        function calculateUSAverage(measureIndex) {
            var measureValue,
                totalMeasureValue = 0,
                totalStatesEconomySize = 0,
                numStates = CHORO_MAP_EXTENSION.statesRelativeEconomySize.length,
                stateName,
                stateRatio,
                dataIndex;

            for (var i=0; i<numStates; ++i) {
                stateName = CHORO_MAP_EXTENSION.statesRelativeEconomySize[i].name;
                stateRatio = CHORO_MAP_EXTENSION.statesRelativeEconomySize[i].ratio;
                dataIndex = getStateKeyByName(stateName, 'data');

                if (dataIndex >= 0) {
                    measureValue = getNumericValue(dataArray[dataIndex][measureIndex]) || 0;

                    if (measureValue !== 0) {
                        totalMeasureValue += measureValue * stateRatio;
                        totalStatesEconomySize += stateRatio;
                        //console.log(measureIndex, stateName, measureValue, stateRatio);
                    }
                }
            }

            totalMeasureValue /= totalStatesEconomySize;
            
            //return {data: totalMeasureValue, value: (totalMeasureValue * 100).toFixed(1) + '%'};
            return ( isNaN(totalMeasureValue) )
                ? {data: 0, text: "N\\A"}
                : {data: totalMeasureValue, text: (totalMeasureValue).toFixed(2) + '%'};
        }

        function setStateNames() {
            for (var i=0; i<dataArray.length; ++i) {
                dataArray[i][stateIndex] = this.STATE_NAMES[i];
            }
        }

        function setHoverBehaviour() {
            var $states = $(getClassSelector('state')),
                $statesBackground = $(getIdSelector('states_background')),
                $canvas = $(getClassSelector('canvas'));

            // create the tooltip plate
            createDomElement($map, "tooltip_plate");
            var $tooltipPlate = $(getIdSelector("tooltip_plate"));

            createDomElement($tooltipPlate, "tooltip_text");

            // reset the tooltip position
            $tooltipPlate.offset({top:0, left:0});

            // hide it
            $tooltipPlate.addClass('hide');

            if(/*$.browser.msie */ CHORO_MAP_EXTENSION.browserInfo.browser === 'msie') {
                $states.mouseover(stateMouseover);
                $states.mouseout(stateMouseout);

                $statesBackground.mouseover(backgroundMouseover);
            }
            else {
                $states.mouseenter(stateMouseover);
                $states.mouseleave(stateMouseout);

                $statesBackground.mouseenter(backgroundMouseover);
                $canvas.mouseenter(backgroundMouseover);
            }

        }
        //////////////////////////////////////////////////////////////////////////
        /////////////////////  EVENT HANDLERS  ///////////////////////////////////
        //////////////////////////////////////////////////////////////////////////
        function stateMouseover(e) {
            var $state = $(this),
                stateName = d3.select(this).attr('name'),
                stateId = getIdSelector('state_' + stateName),
                stateName = stateName.restoreSpaces(),
                dataIndex = getStateKeyByName(stateName, 'data'),
                $tooltipText = $(getIdSelector('tooltip_text')),
                $tooltipPlate = $(getIdSelector('tooltip_plate')),
                marketGrowth,
                myGrowth,
                gap,
                tooltipText;

            currentStateName = stateName;
            currentHoverStateIndex = dataIndex;

            // highlight the state polygon
            highlight(stateId, true);

            // display the stats for this state
            drawChart(dataIndex);

            // display tooltip
            tooltipText = '<span class="tooltip_state_name"><b>' + $state.attr('name').restoreSpaces() + '</b></span>';
            if (dataIndex > -1) {
                marketGrowth = dataArray[dataIndex][marketGrowthIndex].text;
                myGrowth = dataArray[dataIndex][myGrowthIndex].text;
                gap =  dataArray[dataIndex][gapIndex].text;
                tooltipText = tooltipText +
                              '<br>' +
                              'Market Growth: <span class="tooltip_span" measure_index="2"><b>' + marketGrowth + '</b></span>' +
                              '<br>' +
                              'My Growth: <span class="tooltip_span" measure_index="3"><b>' + myGrowth + '</b></span>' +
                              '<br>' +
                              'Gap: <span class="tooltip_span" measure_index="4"><b>' + gap + '</b></span>';

            }
            //console.log(stateName, dataIndex, marketGrowthIndex, marketGrowth, dataArray[dataIndex][marketGrowthIndex]);

            $tooltipText.html(tooltipText);
            $tooltipPlate.removeClass('hide');

            // position tooltip
            $tooltipPlate.offset({
                top: e.pageY + 10,//(canvasTop + e.offsetY + svgHeight * 0.1),
                left: e.pageX + 10//(canvasLeft + e.offsetX + svgWidth * 0.1)
            });

            // set wide class
            if(isWide) {
                $tooltipText.addClass('wide');
            }
        }

        function stateMouseout(e) {
            var stateName = d3.select(this).attr('name'),
                stateId = getIdSelector('state_' + stateName);

            // remove highlight for state polygon
            highlight(stateId, false);

            // hide tooltip
            $(getIdSelector('tooltip_plate')).addClass('hide');

            e.stopPropagation();
        }

        function backgroundMouseover(e) {

            // show US average
            currentHoverStateIndex = dataAverageIndex;
            currentStateName = AVERAGE_TITLE;

            // display the US average
            drawChart(dataAverageIndex);
        }

        function highlight(stateId, enable) {
            var $state = $(stateId),
                $lastSibling = $(getIdSelector('states_container')).find(':last-child');

            if (enable) {
                // place this state as last sibling so that the highlight os not hidden by other countries' borders
                // unless it's already the last one
                if ($state.attr('id') !== $lastSibling.attr('id')) {
                    $state.insertAfter($lastSibling);
                }
                $state.attr('class', 'state highlight');
            }
            else {
                $state.attr('class', 'state');
            }
        }

        function mapButtonClick() {
            currentMeasureIndex = $(this).attr('measure_index');

            updateColorScale();

            // unselect all buttons
            $(getClassSelector('map_button')).removeClass('map_button_selected');

            // select our button
            $(this).addClass('map_button_selected');

            // unselect all tooltip spans
            $(getClassSelector('tooltip_span')).removeClass('selected');

            // highlight  the span in the tooltip according to selected measure
            //var $spans = $('span.tooltip_span [measure_index=' + measureIndex + ']');
            var $spans = $(getClassSelector('tooltip_span'));
            $(getIdSelector('tooltip_text')).find($spans).addClass('selected');

            states.transition()
                .duration(CHART_TRANSITION)
                .attr('fill', function() {
                    var dataIndex = d3.select(this).attr('dataIndex');

                    return getStateColor(dataIndex, parseInt(currentMeasureIndex));
                });



            // update the legend Y axis (the axis uses a percent format so it multiplies by 100,
            //  which is why we divide by 100 here)
            var legendDomain = [];
            if (maxMeasures[currentMeasureIndex].value === MIN_MEASURE_VALUE) {
                legendDomain = [0, 0];
            }
            else {
                legendDomain = [
                    minMeasures[currentMeasureIndex].value / 100,
                    maxMeasures[currentMeasureIndex].value / 100
                ];
            }
            yLegend.domain(legendDomain);

            var t = svg.transition().duration(CHART_TRANSITION);
            t.select(getClassSelector("y_axis_legend")).call(legendYAxis);
        }

        function printMeasureExtremes() {
            //console.log('printMeasureExtremes');
            for (var i=0; i<measureIndex.length; ++i) {
                var mi = measureIndex[i];
                console.log(mi,
                    minMeasures[mi].name,
                    minMeasures[mi].value,
                    maxMeasures[mi].name,
                    maxMeasures[mi].value
                );
            }
        }
    },

    ignoreStatesList: {
        // U.S. territories
        "American Samoa": "US",
        "Guam": "US",
        "Marshall Islands": "US",
        "Northern Mariana Islands": "US",
        "Palau": "US",
        "Puerto Rico": "US",
        "Virgin Islands": "US",

        // Australia
        "Australian Capital Territory": "AU",
        "New South Wales": "AU",
        "Northern Territory" : "AU",
        "Queensland" : "AU",
        "Tasmania" : "AU",
        "Victoria" : "AU",
        "Western Australia": "AU", 

        // Canada
        "Alberta": "CA",
        "British Columbia": "CA",
        "Manitoba" : "CA",
        "New Brunswick" : "CA",
        "Newfoundland And Labrador": "CA",
        "Northwest Territories": "CA",
        "Nova Scotia": "CA",
        "Nunavut": "CA",
        "Ontario": "CA",
        "Prince Edward Island": "CA",
        "Quebec" : "CA",
        "Saskatchewan" : "CA",
        "Yukon" : "CA"
    },

    economySizeUS: 11432.8,

    statesRelativeEconomySize:[
        {name: "Alabama", ratio: 170},
        {name: "Alaska", ratio: 45.7},
        {name: "Arizona", ratio: 256.3},
        {name: "Arkansas", ratio: 102},
        {name: "California", ratio: 1891},
        {name: "Colorado", ratio: 252.6},
        {name: "Connecticut", ratio: 227.4},
        {name: "Delaware", ratio: 60.6},
        {name: "District of Columbia", ratio: 99.1},
        {name: "Florida", ratio: 737},
        {name: "Giorgia", ratio: 395.2},
        {name: "Hawaii", ratio: 66.4},
        {name: "Idaho", ratio: 54},
        {name: "Illinois", ratio: 630.4},
        {name: "Indiana", ratio: 262.6},
        {name: "Iowa", ratio: 142.3},
        {name: "Kansas", ratio: 125},
        {name: "Kentucky", ratio: 156.5},
        {name: "Louisiana", ratio: 208.4},
        {name: "Maine", ratio: 51.3},
        {name: "Maryland", ratio: 286.8},
        {name: "Massachusetts", ratio: 365.2},
        {name: "Michigan", ratio: 368.4},
        {name: "Minnesota", ratio: 260.7},
        {name: "Mississippi", ratio: 96},
        {name: "Missouri", ratio: 239.7},
        {name: "Montana", ratio: 36},
        {name: "Nebraska", ratio: 86.4},
        {name: "Nevada", ratio: 126.5},
        {name: "New Hampshire", ratio: 59.4},
        {name: "New Jersey", ratio: 483},
        {name: "New Mexico", ratio: 74.8},
        {name: "New York", ratio: 1093.2},
        {name: "North Carolina", ratio: 398},
        {name: "North Dakota", ratio: 31.9},
        {name: "Ohio", ratio: 471.2},
        {name: "Oklahoma", ratio: 153.8},
        {name: "Oregon", ratio: 165.6},
        {name: "Pennsylvania", ratio: 554.8},
        {name: "Rhode Island", ratio: 47.8},
        {name: "South Carolina", ratio: 159.6},
        {name: "South Dakota", ratio: 38.3},
        {name: "Tennessee", ratio: 244.5},
        {name: "Texas", ratio: 1144.7},
        {name: "Utah", ratio: 113},
        {name: "Vermont", ratio: 25.4},
        {name: "Virginia", ratio: 408.4},
        {name: "Washington", ratio: 338.3},
        {name: "West Virginia", ratio: 63.3},
        {name: "Wisconsin", ratio: 244.4},
        {name: "Wyoming", ratio: 37.5}
    ]
};