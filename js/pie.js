/*** VER 1.0 ***/

var PIE_MAP_EXTENSION = {
    options: {
        defaultOptions: {
            scaleFactor:  0.235,
            translateFactor: [0.5, 0.5],
            translateDelta: [-90, 70],
            bigPie: {
                translateFactor: [0, 0.2],
                translateDelta: [0, 0]
            },
            units: "$"
        }
    },

    browserInfo: get_browser(),

    createPieMap: function(mapName, input_data, parent, indexMap, userOptions) {
        
        //console.log('\ncreatePieMap!!(', mapName, input_data, parent, indexMap, userOptions, ')');
        var isChrome = PIE_MAP_EXTENSION.browserInfo.browser === "Chrome",
              isIE = PIE_MAP_EXTENSION.browserInfo.browser === "MSIE",
              isFirefox = PIE_MAP_EXTENSION.browserInfo.browser === "Firefox";

        //defineUtilityFunctions();
        var indexMap = indexMap || {country: 'country', myBrand: 'myBrand', totalRevenue: 'totalRevenue'};

        PIE_MAP_EXTENSION.options[mapName] = PIE_MAP_EXTENSION.options.defaultOptions;
        $.extend(PIE_MAP_EXTENSION.options[mapName], userOptions, true);

        var options = PIE_MAP_EXTENSION.options[mapName];

        $(parent).empty();
        $(parent).parent().parent().addClass('widget_frame');

        var BRAND_NAME = "My Brand",
            MAP_TYPE = "PIE_MAP",
            COLOR_PALETTE = {
                mapColor:  '#aaa',//'getMyColor("dark_grey"),
                smallPieColors: [
                //'#a22',  // Red
                //'#8B4513', //Reddish Brown

                //'#87b716', //  green
                //'#e53338', //  red
                //'#0063d1', //  blue
                //'#f4af02', //  yellow

                //'#696969'     // Grey
                //'#8e8989'     // Grey
                //'#939598' //  grey
                getMyColor("green"),
                getMyColor("dark_grey")
                ],
                bigPieColors: {
                    myBrandColor:  getMyColor("green"),
                    otherBrandsColor: getMyColor("dark_grey"),
                    labelsColorDark:  getMyColor("dark_grey"),
                    labelsColorLight: '#777',
                    valueColors: getMyColor("green")
                }
            },
            COUNTRY_KEYS,
            LABELS = [BRAND_NAME, "All Other Brands"],
            DURATION = 1000,
            ZOOM_OUT_LEVEL = 1,
            ZOOM_IN_LEVEL = 4,
            MAX_ZOOM_LEVEL = 10,
            MIN_ZOOM_LEVEL = 0;

        var width = $(parent).width(),
            height = $(parent).height();

        console.log('PIE', 'w', width, 'h', height);

        var offset = $(parent).offset(),
            top = offset.top,
            left = offset.left,
            isWide = (width > 800) ? true : false,
            bigPieOuterRadius = isWide ? 100 : 70,
            bigPieInnerRadius = isWide ? 50 : 40,
            littlePieInnerRadius = 0,
            textOffset = 14,
            tweenDuration = 500,
            dataIndex = 0;

        var dataArray = input_data.data;
        var mapArray = WORLD_COUNTRIES.features;
        var metadata = input_data.metadata;


        //console.log(dataArray);

        var countryIndex = metadata[indexMap.country].index,
            myBrandIndex = metadata[indexMap.myBrand].index,
            revenueIndex = metadata[indexMap.totalRevenue].index;

        COUNTRY_KEYS = createCountryKeys();
        //console.log(revenueMax);
        //dataArray = myData;

        //OBJECTS TO BE POPULATED WITH DATA LATER
        var lines, valueLabels, nameLabels,
            centered,
            pieData = [],
            oldPieData = [],
            filteredPieData = [],
            pieSlices,
            littlePieRadiusRange = [
                isWide ? 3 : 2,
                isWide ? 15: 9
            ],
            newNullPieData = function(countryName) {
                var nullPieData = [];

                nullPieData[0] = {
                    label: "N/A",
                    country: countryName.replaceSpaces(),
                    revenue: 0,
                    percent: 0,
                    dataIndex: -1,
                    valid: false
                };
                nullPieData[1] = {
                    label: "N/A",
                    country: countryName.replaceSpaces(),
                    revenue: 0,
                    percent: 0,
                    dataIndex: -1,
                    valid: false
                };
                return nullPieData;
            },
            zoomLevel = 0,
            initialScale = width * options.scaleFactor,
            translateDelta = {x: options.translateDelta[0], y:options.translateDelta[1]},
            initialTranslate = [
                parseFloat(width * options.translateFactor[0] + translateDelta.x),
                parseFloat(height * options.translateFactor[1] + translateDelta.y)
            ],
            initialTranslateWithoutDelta = [
                parseFloat(width * options.translateFactor[0]),
                parseFloat(height * options.translateFactor[1])
            ],
            zoomScaleFactor = ZOOM_OUT_LEVEL,
            currentScale = initialScale,
            currentTranslate = [0, 0];
            //currentTranslate = initialTranslate;

        var projection = d3.geo.winkel3()
            //var projection = projector = d3.geo.kavrayskiy7().scale(width)
        //var projection = projector = d3.geo.equirectangular().scale(width)
        //var projection = projector = d3.geo.bonne().scale(width/4)
        //var projection = d3.geo.albers().scale(width/5)
        //var projection = d3.geo.mercator().scale(width)
        //var projection = d3.geo.azimuthal().scale(width/5)
            .scale(initialScale)
            .translate([0,0]);

        var path = d3.geo.path()
            .projection(projection);

//        var zoom = d3.behavior.zoom()
//            .translate(projection.translate())
//            .scale(projection.scale())
//            .scaleExtent([initialScale, initialScale * 8])
//            .on("zoom", zoom);

        var drag = d3.behavior.drag()
            .on("drag", drag);

        //D3 helper function to populate pie slice parameters from array data
        var donut = d3.layout.pie().value(function(d){
            return d.revenue;
        });

        //D3 helper function to create colors from an ordinal scale
        var color = function(index) {return COLOR_PALETTE.smallPieColors[index];}//d3.scale.category20();

        ///////////////////////////////////////////////////////////
        // CREATE MAP GROUPS ////////////////////////////////////
        ///////////////////////////////////////////////////////////

        //var $widget = $(parent).createDomElement(mapName),
        var $widget = createDomElement($(parent), mapName),
              widget = $widget.get(0);

        $widget.addClass(MAP_TYPE);

//        $widget.createDomElement("title");
//        var $title = $(getClassSelector("title"));
//            $title.text("scroll to zoom | drag to move");

        var svg = d3.select(widget).append("svg")
          .attr('class', 'canvas')
          .attr("width", width)
          .attr("height", height);

        var wrapper = svg.append("svg:g")
          .attr("id", "wrapper")
          .attr("class", "wrapper")
          .attr("transform", "translate(" + initialTranslate[0] + "," + initialTranslate[1] + ")")
          .call(drag);


        var states = wrapper.append("svg:g")
            .attr("id", "states")
            .style('fill', COLOR_PALETTE.mapColor);

        states.append("svg:rect")
            .attr("class", "background")
            .attr("id", "background")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + (-initialTranslateWithoutDelta[0]) + "," + (-initialTranslateWithoutDelta[1]) + ")")
            .on("click", click);

        states.selectAll("path")
            .data(mapArray)
          .enter().append("svg:path")
            .attr("class", "country")
            .attr("id", function(d) { return 'country_' + d.properties.name.replaceSpaces(); })
            .attr("name", function(d) {return d.properties.name.replaceSpaces();})
            .attr('center_x', function(d) { return path.centroid(d)[0] })
            .attr('center_y', function(d) { return path.centroid(d)[1] })
            .attr("d", path)
            .on("click", click);

        // if no data, return
        if (dataArray.length === 0) {
            setHoverBehaviour();
            return;
        }

        ///////////////////////////////////////////////////////////
        // SET PIE BEHAVIOUR   ////////////////////////////////////
        ///////////////////////////////////////////////////////////
        var littlePieRadius = d3.scale.log()
            .domain(d3.extent(dataArray, function(d) { return getNumericValue(d[revenueIndex]);}))
            .range(littlePieRadiusRange);

        // calculate the radius for the little pie charts
        var getLittlePieOuterRadius = function(dataIndex) {
            // the index argument refers to the input data.
            // we want to calculate the index in the country polygon list so that we can retrieve
            //
            var radius = 0;

            if(dataIndex >= 0) {
                var revenue = dataArray[dataIndex][revenueIndex].data ?
                    dataArray[dataIndex][revenueIndex].data :
                    parseInt(dataArray[dataIndex][revenueIndex].text.removeCommas());

                if (dataArray.length > 1) {
                    radius = littlePieRadius(revenue);
                }
                else {
                    radius = 10;
                }
                //console.log(countryName, revenue, Math.round(radius));
            }

            return Math.round(radius);
        }

        //D3 helper function to draw arcs, populates parameter "d" in path object
        var bigPieArc = d3.svg.arc()
            .startAngle(function(d){ return d.startAngle; })
            .endAngle(function(d){ return d.endAngle; })
            .innerRadius(bigPieInnerRadius)
            .outerRadius(bigPieOuterRadius);

        var littlePieArc = d3.svg.arc()
            .startAngle(function(d){ return d.startAngle; })
            .endAngle(function(d){ return d.endAngle; })
            .innerRadius(littlePieInnerRadius)
            .outerRadius(function(d, dataIndex) {return getLittlePieOuterRadius(dataIndex)});

        var infoDisplay = wrapper.append("svg:g")
          .attr("id", "infoDisplay")
          .attr('class', 'infoDisplay');

        ///////////////////////////////////////////////////////////
        // CREATE LITTLE CHARTS   ////////////////////////////////////
        ///////////////////////////////////////////////////////////

        var littlePieChartContainer  = infoDisplay.append("svg:g")
            .attr('class', 'little_pie_chart_container')
            .attr('id', 'little_pie_chart_container');


        var littlePieChartGroup  = littlePieChartContainer.selectAll('g')
            .data(mapArray)
          .enter()
          .append('svg:g')
            .attr("class", function(d) {
                // hide empty pie charts (for countries with no input data)
                return (getCountryKeyByName(d.properties.name, "data") === -1) ? "hide" : "little_pie_chart_group";
            })
            .attr("name", function(d) { return d.properties.name.replaceSpaces();})
            .attr("id", function(d) { return 'little_pie_chart_' + d.properties.name.replaceSpaces(); })
            .attr("mapIndex", function(d) {return getCountryKeyByName(d.properties.name, "map");})
            .attr("dataIndex", function(d) {return getCountryKeyByName(d.properties.name, "data");})
            .attr("transform", function(d) {
                return "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")";
            })
            .on("click", click);

        ///////////////////////////////////////////////////////////
        // CREATE BIG CHART GROUPS  ///////////////////////////////
        ///////////////////////////////////////////////////////////

        //GROUP FOR ARCS/PATHS
        var bigPieTranslate = {
          x: -translateDelta.x + width*options.bigPie.translateFactor[0] + options.bigPie.translateDelta[0],
          y: -translateDelta.y + height*options.bigPie.translateFactor[1] + options.bigPie.translateDelta[1]
        };
        var big_pie_chart_container  = infoDisplay.append("svg:g")
            .attr('class', 'big_pie_chart_container hide')
            .attr('id', 'big_pie_chart_container')
            .attr("transform", "translate(" + bigPieTranslate.x + "," + bigPieTranslate.y + ")");

        var arc_group = big_pie_chart_container.append("svg:g")
            .attr("class", "big_pie_arc_group");

        //GROUP FOR LABELS
        var label_group = big_pie_chart_container.append("svg:g")
            .attr("class", "label_group");

        //GROUP FOR CENTER TEXT
        var center_group = big_pie_chart_container.append("svg:g")
            .attr("class", "center_group");

        //PLACEHOLDER GRAY CIRCLE
        var paths = arc_group.append("svg:circle")
            .attr("fill", "#EFEFEF")
            .attr("r", bigPieOuterRadius);

        ///////////////////////////////////////////////////////////
        // BIG PIE CENTER TEXT ////////////////////////////////////
        ///////////////////////////////////////////////////////////

        //WHITE CIRCLE BEHIND LABELS
        var whiteCircle = center_group.append("svg:circle")
            .attr("fill", "white")
            .attr("r", bigPieInnerRadius);

        // "TOTAL" LABEL
        var totalLabel = center_group.append("svg:text")
            .attr("class", "label")
            .attr("dy", function() {return isWide ? -30 : -23;})
            .attr("text-anchor", "middle") // text-align: right
            .text("TOTAL");

        //TOTAL SALES VALUE
        var totalValue = center_group.append("svg:text")
            .attr("class", "total")
            .attr("dy", function() {return isWide ? -18 : -10;})
            .attr("text-anchor", "middle"); // text-align: right

        // "COUNTRY" LABEL
        var countryLabel = center_group.append("svg:text")
            .attr("class", "label")
            .attr("dy", function() {return isWide ? 5 : 7;})
            .attr("text-anchor", "middle") // text-align: right
            .text("COUNTRY");

        //COUNTRY VALUE
        var countryValueContainer = center_group.append("svg:g")
            .attr("class", "total_container")
            .attr("id", "country_name_container");

        var initialDataIndex = dataArray.length - 1;

        ///////////////////////////////////////////////////////////
        //    RUN      ////////////////////////////////////////////
        ///////////////////////////////////////////////////////////
        updateBigChart(initialDataIndex);
        updateLittleCharts();
        setHoverBehaviour();


        ///////////////////////////////////////////////////////////
        // FUNCTIONS //////////////////////////////////////////////
        ///////////////////////////////////////////////////////////
        function getIdSelector(elementName) {
            return '#' + mapName.replaceSpaces() + ' #' + elementName;
        }

        function getClassSelector(elementName) {
            return '.' + MAP_TYPE.replaceSpaces() + ' .' + elementName;
        }


        function labelAnchorPosition(d) {
            return (d.startAngle + d.endAngle) / 2;
        }

        function createPieSlices(dataIndex) {
            if (dataIndex < 0) {
                return newNullPieData("N/A");
            }

            var pieSlices = [],
                dataElement = dataArray[dataIndex],
                countryName = dataArray[dataIndex][countryIndex],
                myBrandPercent = (dataElement[myBrandIndex].data) ?
                    dataElement[myBrandIndex].data :
                    parseInt(dataElement[myBrandIndex].text.removeCommas()) ,
                otherBrandsPercent = 1 - myBrandPercent,
                totalRevenue = (dataElement[revenueIndex].data) ?
                    dataElement[revenueIndex].data :
                    parseInt(dataElement[revenueIndex].text.removeCommas()),
                myBrandRevenue = totalRevenue * myBrandPercent,
                otherBrandsRevenue = totalRevenue * otherBrandsPercent;

            if (countryName === null || !countryName) {
                pieSlices = newNullPieData("N/A");
            }

            else  {
                pieSlices[0] = {
                    label: LABELS[0],
                    country: countryName.replaceSpaces(),
                    revenue: myBrandRevenue,
                    percent: myBrandPercent,
                    dataIndex: dataIndex,
                    valid: true
                };
                pieSlices[1] = {
                    label: LABELS[1],
                    country: countryName.replaceSpaces(),
                    revenue: otherBrandsRevenue,
                    percent: otherBrandsPercent,
                    dataIndex: dataIndex,
                    valid: true
                };
            }
            return pieSlices;
        }

        function filterData(element, index, pieSlices) {
            element.name = pieSlices[index].data.label;
            element.value = pieSlices[index].data.revenue;

            return pieSlices[index].data.valid;
        }

        function isValidPieDatum(pieData) {
            if (isNaN(pieData[0].startAngle) ||
                isNaN(pieData[0].endAngle) ||
                isNaN(pieData[1].startAngle) ||
                isNaN(pieData[1].endAngle)) {
                return false;
            }
            return true;
        }

        function updateLittleCharts() {
            //console.log('updateLittleCharts');
            var pieArcs = littlePieChartGroup.selectAll("path")
                .data(function(d) {

                    var countryName = d.properties.name,
                        dataIndex =  getCountryKeyByName(countryName, 'data'),
                        pieSlices,
                        pieData,
                        filteredPieData;

                    pieSlices = createPieSlices(dataIndex);
                    pieData = donut(pieSlices);
                    filteredPieData = pieData.filter(filterData);

                    return filteredPieData;
                });

            pieArcs.enter().append("svg:path")
                .attr('class', 'little_pie_arc')
                .attr("stroke", "white")
                .attr('name', function(d) {
                    return d.data.country ?
                        d.data.country.replaceSpaces() :
                        "";
                })
                .attr('dataIndex', function(d) {return d.data.dataIndex;})
                .attr("stroke-width", 0.5)
                .attr("fill", function(d, i) { return color(i); })
                //.call(pieZoom)
              .transition()
                .duration(tweenDuration)
                .attrTween("d", pieTween);
            pieArcs
              .transition()
                .duration(tweenDuration)
                .attrTween("d", pieTween);
            pieArcs.exit()
              .transition()
                .duration(tweenDuration)
                .attrTween("d", removePieTween)
                .remove();
        }

        // to run each time data is generated
        function updateBigChart(dataIndex) {
            //console.log('updateBigChart');
            var countryName = dataArray[dataIndex][countryIndex];
                totalRevenue = dataArray[dataIndex][revenueIndex].data ?
                    Math.round(dataArray[dataIndex][revenueIndex].data) :
                    parseInt(dataArray[dataIndex][revenueIndex].text.removeCommas()),
                totalRevenueText = dataArray[dataIndex][revenueIndex].text;

            if (!countryName) {
                return;
            }

            pieSlices = createPieSlices(dataIndex);
            oldPieData = filteredPieData;
            pieData = donut(pieSlices);

            filteredPieData = pieData.filter(filterData);

            //console.log(filteredPieData);
            if(filteredPieData.length > 0 && oldPieData.length > 0){

                //REMOVE PLACEHOLDER CIRCLE
                arc_group.selectAll("circle").remove();

                totalValue.text(function(){
                    return options.units + totalRevenueText;
                });

                $(getIdSelector('country_name_container')).empty();



                // SVG:text doesn't support line breaks, so we manually break the name at the spaces,
                //  and decrease the font size if necessary
                var countryNameArray = [],
                    i = 0,
                    smallFont = false,
                    maxNameLength = 15;

                //console.log(countryName.length);

                if (countryName.length > maxNameLength) {
                    countryNameArray = countryName.split(' ');

                    // look for word combinations to place on same line
                    for (i=0; i<countryNameArray.length; ++i) {
                        if ( countryNameArray[i].toLowerCase() === "and" && countryNameArray[i+1].toLowerCase() === "the") {
                            countryNameArray[i] = "and the";
                            countryNameArray.splice(i+1, 1);
                            break;
                        }
                    }

                    // we don't want names more than 3 lines long
                    for (i=3; i<countryNameArray.length; ++i) {
                        countryNameArray[1] = countryNameArray[0] + ' ' + countryNameArray[1];
                        countryNameArray.shift();
                    }
                }
                else{
                    countryNameArray[0] =  countryName;
                }

                for (i=0; i<countryNameArray.length; ++i) {
                    countryValueContainer.append("svg:text")
                        .attr("class", "country_name total")
                        .attr("id", "country_name_" + i)
                        .attr("text-anchor", "middle")
                        .attr("transform", "translate(0, " + i*11 + ")")
                        .attr("dy", 17)
                        .text( countryNameArray[i] );

                    if (countryNameArray[i].length > maxNameLength) {
                        smallFont = true;
                    }
                }

                // check if we need to use smaller fonts for this country name

                var countryNameClass = getClassSelector('country_name');
                if ( smallFont ) {
                    d3.select(countryNameClass).classed('small', true);
                }
                else {
                    d3.select(countryNameClass).classed('small', false);
                }

                //DRAW ARC PATHS
                paths = arc_group.selectAll("path").data(filteredPieData);
                paths.enter().append("svg:path")
                    .attr('class', 'big_pie_arc')
                    .attr("stroke", "white")
                    .attr("stroke-width", 0.5)
                    .attr("fill", function(d, i) { return color(i); })
                    .transition()
                    .duration(tweenDuration)
                    .attrTween("d", pieTween);
                paths
                  .transition()
                    .duration(tweenDuration)
                    .attrTween("d", pieTween);

                paths.exit()

                  .transition()
                    .duration(tweenDuration)
                    .attrTween("d", removePieTween)
                    .remove();


//                //DRAW TICK MARK LINES FOR LABELS
//                lines = label_group.selectAll("line").data(filteredPieData);
//                lines.enter().append("svg:line")
//                    .attr("x1", 0)
//                    .attr("x2", 0)
//                    .attr("y1", -bigPieOuterRadius - 3)
//                    .attr("y2", -bigPieOuterRadius - 8)
//                    .attr("stroke", "gray")
//                    .attr("transform", function(d) {
//                        return "rotate(" + (d.startAngle+d.endAngle)/2 * (180/Math.PI) + ")";
//                    });
//                lines.transition()
//                    .duration(tweenDuration)
//                    .attr("transform", function(d) {
//                        return "rotate(" + (d.startAngle+d.endAngle)/2 * (180/Math.PI) + ")";
//                    });
//                lines.exit().remove();

//                var valueContainers = label_group.selectAll("svg:g")
//                    .data(filteredPieData)
//                  .append("svg:g")
//                    .attr("class", "value_container")
//                    .attr("transform", function(d) {
//                        return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (bigPieOuterRadius+textOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (bigPieOuterRadius+textOffset) + ")";
//                    })
//                    .attr("dy", function(d){
//                        if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
//                            return 5;
//                        } else {
//                            return -7;
//                        }
//                    });

//              //DRAW LABEL CONTAINER SQUARES
                var valueRects = label_group.selectAll("rect.value_rect").data(filteredPieData);

                valueRects.enter().append("svg:rect")
                    .attr("class", "value_rect")
                    .attr('rx', 5) // rounded corners
                    .attr('ry', 5); // rounded corners

                // UPDATE
                valueRects
                    .attr('y', function(d) {

                        if (labelAnchorPosition(d) > Math.PI/2 && labelAnchorPosition(d) < Math.PI*1.5 ) {
                            return -8;
                        }
                        else {
                            return -20;
                        }
                    })
                    .attr('height', 30)
                  .transition()
                    .duration(tweenDuration)
                    .attrTween("transform", textTween);

                valueRects.exit().remove();

                //DRAW LABELS WITH PERCENTAGE VALUES
                valueLabels = label_group.selectAll("text.value").data(filteredPieData);

                // ENTER
                valueLabels.enter().append("svg:text")
                    .attr("class", function(d) {
                        if (d.name === BRAND_NAME) {
                            return "value my_label";
                        }
                        else {
                            return "value others_label";
                        }
                    })
                    .attr("transform", function(d) {

                        return "translate(" +
                            Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (bigPieOuterRadius+textOffset) + "," +
                            Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (bigPieOuterRadius+textOffset) + ")";
                    })
                    .attr("dy", function(d){
                        if (labelAnchorPosition(d) > Math.PI/2 && labelAnchorPosition(d) < Math.PI*1.5 ) {
                            return 5;
                        } else {
                            return -7;
                        }
                    })
                    .attr("text-anchor", function(d){
                        if ( labelAnchorPosition(d) < Math.PI ){
                            return "beginning";
                        } else {
                            return "end";
                        }
                    }).text(function(d){
                        var percentage = d.data.percent * 100;
                        return percentage.toFixed(1) + "%";
                    });

                // UPDATE
                valueLabels
                    .attr("dy", function(d){
                        if (labelAnchorPosition(d) > Math.PI/2 && labelAnchorPosition(d) < Math.PI*1.5 ) {
                            return 5;
                        } else {
                            return -7;
                        }
                    })
                    .attr("text-anchor", function(d){
                        var anchorPosition = labelAnchorPosition(d);
                        // if labelAnchorPosition is really close to PI, just make it equal PI
                        if (Math.PI - labelAnchorPosition(d) <0.0000000000001 && Math.PI - labelAnchorPosition(d) > 0) {
                            anchorPosition = Math.PI;
                        }

                        if ( anchorPosition < Math.PI ){

                            return "beginning";
                        } else {

                            return "end";
                        }
                    })
                    .text(function(d){
                        var percentage = d.data.percent * 100;
                        return percentage.toFixed(1) + "%";
                    })
                  .transition()
                    .duration(tweenDuration)
                    .attrTween("transform", textTween);

                // EXIT
                valueLabels.exit().remove();

                //DRAW LABELS WITH ENTITY NAMES
                nameLabels = label_group.selectAll("text.percent_label").data(filteredPieData);

                // ENTER
                nameLabels.enter().append("svg:text")
                    .attr("class", "percent_label")
                    .attr("id", function(d) {
                        return (d.data.label === BRAND_NAME) ? "percent_label_mine" : "percent_label_others";
                    })
                    .attr("transform", function(d) {
                        return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (bigPieOuterRadius+textOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (bigPieOuterRadius+textOffset) + ")";
                    })
                    .attr("dy", function(d){
                        if (labelAnchorPosition(d) > Math.PI/2 && labelAnchorPosition(d) < Math.PI*1.5 ) {
                            return 17;
                        } else {
                            return 5;
                        }
                    })
                    .attr("text-anchor", function(d){
                        if (labelAnchorPosition(d) < Math.PI ) {
                            return "beginning";
                        } else {
                            return "end";
                        }
                    })
                    .style('fill', COLOR_PALETTE.bigPieColors.labelsColorLight)
                    .text(function(d){
                        return d.data.label.toLowerCase();
                    });

                // UPDATE
                nameLabels
                    .attr("dy", function(d){
                        if (labelAnchorPosition(d) > Math.PI/2 && labelAnchorPosition(d) < Math.PI*1.5 ) {
                            return 17;
                        } else {
                            return 5;
                        }
                    })
                    .attr("text-anchor", function(d){
                        var anchorPosition = labelAnchorPosition(d);

                        // if labelAnchorPosition is really close to PI, just make it equal PI
                        if (Math.PI - labelAnchorPosition(d) <0.0000000000001 && Math.PI - labelAnchorPosition(d) > 0) {
                            anchorPosition = Math.PI;
                        }

                        if (anchorPosition < Math.PI ) {
                            return "beginning";
                        } else {
                            return "end";
                        }
                    }).text(function(d){
                        return d.data.label.toLowerCase();
                    })
                  .transition()
                    .duration(tweenDuration)
                    .attrTween("transform", textTween);

                // EXIT
                nameLabels.exit().remove();


                // we set the width and x position last because we need to already have the labels strings ready in order to
                // calculate their length
                d3.selectAll(getClassSelector('value_rect'))
                    .attr('width', function(d) {
                        var width,
                        selector;

                        if (d.data.label === BRAND_NAME) {
                            selector = "percent_label_mine";
                        }
                        else {
                            selector = "percent_label_others";
                        }

                        width = $(getIdSelector(selector)).width();

                        // IE9 and FF won't get width of SVG element directly, so need to use the bounding box
                        if (width === 0) {
                            width = $(getIdSelector(selector))[0].getBBox ().width;
                        }

                        // AARRRGH!!
                        // just set a fixed width
                        if (width === 0) {
                            width = d.data.label === BRAND_NAME ? 60 : 100;
                        }                     

                        return width + 10;//                       
                    })
                    .attr('x', function(d) {
                        // Majority Slice
                        var id = (d.data.label === BRAND_NAME) ? "percent_label_mine" : "percent_label_others",
                            width = $(getIdSelector(id)).width(),
                            x = d3.scale.linear()
                                .domain([26, 40, 69])
                                .range([54, 56, 85]);
                                
                        if ( labelAnchorPosition(d) >= Math.PI/2 && labelAnchorPosition(d) < Math.PI*1.5 ) {
                            // My Brand
                            if ( d.data.label === LABELS[0] ){
                                if (d.data.percent === 1) { // 100%
                                    //console.log('1');
                                    if (isChrome) {
                                        return -x(width) + 10;
                                    }
                                    else {
                                        return -x(width) - 20;
                                    }
                                }
                                //console.log('2');
                                return -5;
                            }

                            // All Other Brands
                            else {
                                if (d.data.percent === 1) { // 100%
                                    //console.log('3');
                                    if (isChrome) {
                                        return -105;
                                    }
                                    else {
                                        return -125;
                                    }
                                }
                                //console.log('4');
                                return -5;
                            }
                        }

                        // Minority Slice
                        else {
                            // My Brand
                            if ( d.data.label === LABELS[0] ){
                                //console.log('5');
                                if (isChrome) {
                                    return -x(width) + 10;
                                }
                                else {
                                     return -x(width) - 18;
                                }
                            }

                            // All Other Brands
                            else {
                                //console.log('6');
                                if (isChrome) {
                                    return -108;
                                }
                                else {
                                     return -126;
                                }
                            }
                        }
                    })
            }
        }

        function createCountryKeys() {
            var map_country_keys = {},
                data_country_keys = {},
                country_keys = {},
                country,
                i;

            // map the country polygon list
            for (i=0; i<mapArray.length; ++i) {
                country = mapArray[i].properties.name;
                map_country_keys[country] = i;

            }
            country_keys.map_keys = map_country_keys;

            // map the countries received in the input data
            for (i=0; i<dataArray.length; ++i) {
                country = dataArray[i][countryIndex];

                // fix names which arrived fucked up in the input
                switch (country) {
                     case "Korea, South":
                         country = "South Korea";
                         break;
                     case "Korea, North":
                         country = "North Korea";
                         break;
                     case "Russian Federation":
                         //country = "Russia";
                         break;
                     case "Azerbaijan Republic":
                         country = "Azerbaijan";
                         break;
                     case "Congo, Republic of the":
                         country = "Republic of the Congo";
                         break;
                     case "Congo, Democratic Republic of the":
                         country = "Democratic Republic of the Congo";
                         break;
                    case "Cote d'Ivoire":
                    case "Cote d\'Ivoire":
                        country = "Cote dIvoire";
                        break;
                    case "Bahamas, The":
                        country = "The Bahamas";
                        break;
                }
                dataArray[i][countryIndex] = country; // save the fixed names
                data_country_keys[country] = i;
            }
            country_keys.data_keys = data_country_keys;
            return country_keys;
        }

        function getCountryKeyByName(countryName, source) {
            var key = -1;
            if (source === "map" && countryName && COUNTRY_KEYS.map_keys[countryName] >= 0) {

                key = COUNTRY_KEYS.map_keys[countryName];
            }
            else if (source === "data" && countryName && COUNTRY_KEYS.data_keys[countryName]  >= 0) {
                key = COUNTRY_KEYS.data_keys[countryName];
            }

            return key;
        }

        // Interpolate the arcs in data space.
        function pieTween(d, i) {
            //console.log(d, i);
            //console.log(this);
            var arcType = $(this).attr('class');
            var dataIndex = d3.select(this).attr('dataIndex');

            var s0;
            var e0;
            if(oldPieData[i]){
                s0 = oldPieData[i].startAngle;
                e0 = oldPieData[i].endAngle;
            } else if (!(oldPieData[i]) && oldPieData[i-1]) {
                s0 = oldPieData[i-1].endAngle;
                e0 = oldPieData[i-1].endAngle;
            } else if(!(oldPieData[i-1]) && oldPieData.length > 0){
                s0 = oldPieData[oldPieData.length-1].endAngle;
                e0 = oldPieData[oldPieData.length-1].endAngle;
            } else {
                s0 = 0;
                e0 = 0;
            }
//            console.log('');
            //console.log('dataIndex: ' + dataIndex);
            //console.log(this);
            var interpolate = d3.interpolate({startAngle: s0, endAngle: e0}, {startAngle: d.startAngle, endAngle: d.endAngle});
            return function(t) {
                var b = interpolate(t);
                //return (arcType === "bigPieArc") ? bigPieArc(b) : littlePieArc(b, dataIndex);
                return (arcType === "little_pie_arc") ? littlePieArc(b, dataIndex) : bigPieArc(b);
            };
        }

        function removePieTween(d, i) {
            var arcType = $(this).attr('class');
            var dataIndex = d3.select(this).attr('dataIndex');
            s0 = 2 * Math.PI;
            e0 = 2 * Math.PI;
            var i = d3.interpolate({startAngle: d.startAngle, endAngle: d.endAngle}, {startAngle: s0, endAngle: e0});
            return function(t) {
                var b = i(t);
                return (arcType === "little_pie_arc") ? littlePieArc(b, dataIndex) : bigPieArc(b);
            };
        }

        function textTween(d, i) {
            var a;
            if(oldPieData[i]){
                a = (oldPieData[i].startAngle + oldPieData[i].endAngle - Math.PI)/2;
            } else if (!(oldPieData[i]) && oldPieData[i-1]) {
                a = (oldPieData[i-1].startAngle + oldPieData[i-1].endAngle - Math.PI)/2;
            } else if(!(oldPieData[i-1]) && oldPieData.length > 0) {
                a = (oldPieData[oldPieData.length-1].startAngle + oldPieData[oldPieData.length-1].endAngle - Math.PI)/2;
            } else {
                a = 0;
            }
            var b = (d.startAngle + d.endAngle - Math.PI)/2;

            var fn = d3.interpolateNumber(a, b);
            return function(t) {
                var val = fn(t);
                return "translate(" + Math.cos(val) * (bigPieOuterRadius+textOffset) + "," + Math.sin(val) * (bigPieOuterRadius+textOffset) + ")";
            };
        }

        function setHoverBehaviour() {
            var $littlePieCharts = $(getClassSelector('little_pie_chart_group')),
                $bigPieCharts = $(getClassSelector('big_pie_chart_container')),
                $countries = $(getClassSelector('country'));

            // create the tooltip plate
            //$(parent).append('<div id="tooltip_plate" class="tooltip_plate hide"><div id="tooltip_text"></div></div>');
            var $tooltipPlate = createDomElement($widget, "tooltip_plate");
            $tooltipPlate.addClass("hide");
            createDomElement($tooltipPlate, "tooltip_text");

            $tooltipPlate.offset({top:0, left:0});

            if(PIE_MAP_EXTENSION.browserInfo.browser === 'msie' ) {
                $bigPieCharts.mouseover(disableMouseEvents);
                $bigPieCharts.mouseout(disableMouseEvents);
                $littlePieCharts.mouseover(littlePieMouseover);
                $littlePieCharts.mouseout(littlePieMouseout);
                $countries.mouseover(countryMouseover);
                $countries.mouseout(countryMouseout);
            }
            else {
                $bigPieCharts.mouseenter(disableMouseEvents);
                $bigPieCharts.mouseleave(disableMouseEvents);
                $littlePieCharts.mouseenter(littlePieMouseover);
                $littlePieCharts.mouseleave(littlePieMouseout);
                $countries.mouseenter(countryMouseover);
                $countries.mouseleave(countryMouseout);
            }

        }
/*
        function zoom() {
            console.log('zoom');
            var newScale = d3.event.scale,
                littlePieScale;

            // zoom-in
            if (newScale > currentScale && zoomLevel < MAX_ZOOM_LEVEL) {
                zoomLevel++;
            }
            // zoom out
            else  if(newScale < currentScale && zoomLevel > MIN_ZOOM_LEVEL) {
                zoomLevel--;
            }

            currentScale = newScale;

            // scale the map projection according to the mouse position and zoom amount
            projection.scale(d3.event.scale)
                .translate(d3.event.translate);

            // redraw the countries
            states.selectAll("path").attr("d", path);

            // recalculate the position for the little pie charts
            littlePieChartGroup.data(mapArray)
                .attr("transform", function(d) {
                    return "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")";
                });

            // scale the little pie charts
            littlePieScale = (1 + zoomLevel / 10);
            d3.selectAll('.little_pie_arc')
                .attr("transform", "scale(" + littlePieScale + ")");
        }
*/
        function drag() {
            var translate = [d3.event.dx/zoomScaleFactor + currentTranslate[0], d3.event.dy/zoomScaleFactor + currentTranslate[1]];
            currentTranslate = translate;

            projection
                .translate(translate);

            states
                .attr("transform", "scale(" + zoomScaleFactor + ")translate(" + translate[0] + "," + translate[1] + ")");

            littlePieChartContainer
                .attr("transform", "scale(" + zoomScaleFactor + ")translate(" + translate[0] + "," + translate[1] + ")");
        }

        function click(d) {
            console.log('click', this);
            var x = 0,
                y = 0;

            if (d && centered !== d) {
                var centroid = path.centroid(d);

                x = currentTranslate[0] - centroid[0];
                y = currentTranslate[1] - centroid[1];
                zoomScaleFactor = ZOOM_IN_LEVEL;
                centered = d;
            }
            else {
                centered = null;
                zoomScaleFactor = ZOOM_OUT_LEVEL;
            }

            projection
                .translate([x,y]);

            // mark the country we are centering the map on
            states
                .selectAll("path")
                .classed("active", centered && function(d) { return d === centered; });

            // scale the country polygons
            states
                .transition()
                .duration(DURATION)
                .attr("transform", "scale(" + zoomScaleFactor + ")translate(" + x + "," + y + ")");

            // redraw the country border
            d3.selectAll(getClassSelector("country"))
                .transition()
                .duration(DURATION)
                .style("stroke-width", (0.5 / zoomScaleFactor) + "px");

            // recalculate the position for the little pie charts
            littlePieChartContainer
                .transition()
                .duration(DURATION)
                .attr("transform", "scale(" + zoomScaleFactor + ")translate(" + x + "," + y + ")");

            // redraw the pie border
            d3.selectAll(getClassSelector("little_pie_arc"))
                .transition()
                .duration(DURATION)
                .style("stroke-width", (0.5 / zoomScaleFactor) + "px");

            // scale the little pie charts
            var littlePieScale = (1 / zoomScaleFactor);
            d3.selectAll('.little_pie_arc')
                .transition()
                .duration(DURATION)
                .attr("transform", "scale(" + littlePieScale + ")");

            currentTranslate = [x, y];
        }

        //////////////////////////////////////////////////////////////////////////
        /////////////////////  EVENT HANDLERS  ///////////////////////////////////
        //////////////////////////////////////////////////////////////////////////
        function disableMouseEvents(e) {
            //console.log('disableMouseEvents');
            e.stopPropagation();
            e.stopImmediatePropagation();
            if (e.preventDefault()) {
                e.preventDefault();
            }
            e.returnValue = false;
            return false;
        }

        function littlePieMouseover() {
            //console.log('littlePieMouseover');
                var id = $(this).attr('id'),
                    pieSelector = getIdSelector(id),
                    dataIndex = d3.select(pieSelector).attr('dataIndex'),
                    countryName = d3.select(this).attr('name'),
                    $bigPieChartContainer = $(getClassSelector('big_pie_chart_container'));

                // highlight the country polygon
                highlight(countryName, true);

                $bigPieChartContainer.attr('class', 'big_pie_chart_container');
                updateBigChart(dataIndex);

        }

        function littlePieMouseout() {
            var countryName = d3.select(this).attr('name');

            highlight(countryName, false);
            $(getClassSelector('big_pie_chart_container')).attr('class', 'big_pie_chart_container hide');
        }

        function countryMouseover(e) {

            var $country = $(this),
                countryName = d3.select(this).attr('name'),
                tooltipPlateSelector = getIdSelector('tooltip_plate'),
                tooltipTextSelector = getIdSelector('tooltip_text'),
                $tooltipText = $(tooltipTextSelector),
                $tooltipPlate = $(tooltipPlateSelector),
                tooltipTop = e.pageY + 10,
                tooltipLeft = e.pageX + 10;



            // display tooltip
            $tooltipPlate.removeClass('hide');

            // highlight the country polygon
            highlight(countryName, true);


            var tooltipText = $country.attr('name').restoreSpaces();
            $tooltipText.html(tooltipText);

            // position tooltip
            $tooltipPlate.offset({top:tooltipTop, left:tooltipLeft});
        }

        function countryMouseout(e) {
            var countryName = d3.select(this).attr('name');

            // remove highlight for country polygon
            highlight(countryName, false);

            // hide tooltip
            $(getIdSelector('tooltip_plate')).addClass('hide');

            e.stopPropagation();
        }

        function highlight(countryName, enable) {
            var countrySelector = getIdSelector('country_' + countryName.replaceSpaces()),
                $country = $( countrySelector ),
                $lastSibling = $country.parent().find(':last-child');

            if (enable) {
                // place this country as last sibling so that the highlight os not hidden by other countries' borders
                // unless it's already the last one
                if ($country.attr('id') !== $lastSibling.attr('id')) {
                    $country.insertAfter($lastSibling);
                }
                $country.attr('class', 'country highlight');
            }
            else {
                $country.attr('class', 'country');
            }
        }

        var that = this;

        that.projection = projection;
        that.states = states;
        that.littlePieChartContainer = littlePieChartContainer;

        that.initialScale = initialScale;
        that.initialTranslate = initialTranslateWithoutDelta;

        that.scale = function(scale) {
            var translate,
                scaleFactor;

            if (isNaN(scale)) {
                console.log('scale is ', that.projection.scale());
                return that.projection.scale();
            }

           
            
            
            scaleFactor = scale / that.initialScale;
            translate = [that.initialTranslate[0] * scaleFactor, that.initialTranslate[1] * scaleFactor];

            that.projection.scale(scale).translate(translate);

            that.states
                .attr("transform", "scale(" + scaleFactor + ")translate(" + translate[0] + "," + translate[1] + ")");

            that.littlePieChartContainer
                .attr("transform", "scale(" + scaleFactor + ")translate(" + translate[0] + "," + translate[1] + ")");

            //console.log('setting scale to ' + scale, translate);

            return that;
        }

        return that;
    }
}

