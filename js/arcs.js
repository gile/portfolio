var ARC_MAP_EXTENSION = {
    options: {
        defaultOptions: {
            scaleFactor:  0.15,
            translateFactor: [0.71, 0.35],
            //translateDelta: [-150, 20] ,winkel
            translateDelta: [-220, 90] ,// hill
            chartRelativeWidth: 0.3
        },
        units: "$"
    },

    browserInfo: get_browser(),

    createArcMap: function(mapName, input_data, parent, indexMap, userOptions) {

        //console.log('\ncreateArcMap(', mapName, input_data, parent, indexMap, userOptions, ')');

        //defineUtilityFunctions();

        var MAP_TYPE = "ARC_MAP",
            MAX_INT = 9007199254740992,
            DURATION = 1000,
            ZOOM_OUT_LEVEL = 1,
            ZOOM_IN_LEVEL = 4,
            SRC_COLOR = "#f4af02",
            DEST_COLOR = "steelblue",
            TRANSPARENT_CLASS = "transparent",
            HIGHLIGHT_SHAPE_CLASS = "highlight",
            HIGHLIGHT_STROKE_CLASS = "highlight_stroke",
            HIGHLIGHT_STROKE_SRC_ARC_CLASS = "highlight_stroke_src_arc",
            HIGHLIGHT_STROKE_DEST_ARC_CLASS = "highlight_stroke_dest_arc",
            HIGHLIGHT_STROKE_SRC_SHAPE_CLASS = "highlight_stroke_src_shape",
            HIGHLIGHT_STROKE_DEST_SHAPE_CLASS = "highlight_stroke_dest_shape";

        var mapName = mapName.replaceSpaces();

        var indexMap = indexMap || {src: 'src', dest: 'dest', measure: 'measure'};

        ARC_MAP_EXTENSION.options[mapName] = ARC_MAP_EXTENSION.options.defaultOptions;
        $.extend(ARC_MAP_EXTENSION.options[mapName], userOptions, true);
        var options = ARC_MAP_EXTENSION.options[mapName];

        $(parent).empty();

        function getIdSelector(elementName, withoutHash) {
            return '#' + mapName.replaceSpaces() + ' #' + elementName;
        }

        function getClassSelector(elementName) {
            var selector = "";
            if (_.isArray(elementName)) {
                for (var i=0; i<elementName.length; ++i) {
                    if (i > 0) {
                        selector = selector + ", ";
                    }
                    selector = selector + '.' + MAP_TYPE.replaceSpaces() + ' .' + elementName[i];
                }
            }
            else {
                selector = '.' + MAP_TYPE.replaceSpaces() + ' .' + elementName;
            }
            return selector;
        }

        var ids = {};
        ids.wrapperName = function() { return "statesContainer";};
        ids.statesName = function() { return "states";};
        ids.countryName = function(country) { return "country_" + country;};
        ids.countryCenterName = function(country) { return "country_center_" + country;};
        ids.infoDisplayName = function() { return "infoDisplay";};
        ids.arcName = function (dataIndex, i) { return "arc_" + dataIndex + "_" + i; };
        ids.anchorName = function (dataIndex) { return "anchor_" + dataIndex; };
        ids.tooltipPlateName = function (dataIndex) { return "tooltip_plate_" + dataIndex; };

        ids.getWrapperId = function() {  return getIdSelector(ids.wrapperName()); };
        ids.getStatesId = function() { return getIdSelector("states");};
        ids.getCountryId = function(country) { return getIdSelector("country_" + country);};
        ids.getCountryCenterId = function(country) { return getIdSelector("country_center_" + country);};
        ids.getInfoDisplayId = function() { return getIdSelector("infoDisplay");};
        ids.getArcId = function (dataIndex, i) { return getIdSelector("arc_" + dataIndex + "_" + i); };
        ids.getAnchorId = function (dataIndex) { return getIdSelector("anchor_" + dataIndex); };
        ids.getTooltipPlateId = function (dataIndex) { return getIdSelector("tooltip_plate_" + dataIndex); };

        var width = $(parent).width(),
            height = $(parent).height(),
            centered,
            i;
        
        String.prototype.replaceSpaces = function() {
            return this.replace(/ /g,'_');
        };

        var points = [];
        var dataArray = input_data.data;
        var metadata = input_data.metadata;

        var srcIndex = metadata[indexMap.src].index,
            destIndex = metadata[indexMap.dest].index,
            measureIndex = metadata[indexMap.measure].index;

        _.each(dataArray, function (d) {

            if (d[destIndex] == 'Uk') d[destIndex] = "United Kingdom";
            if (d[srcIndex] == 'Uk') d[srcIndex] = "United Kingdom";
        });
        dataArray = _.filter(dataArray, function(d) {

            return (d[destIndex] != null)  &&
                //(d[destIndex] != d[srcIndex]) &&
                (d[srcIndex] != null)  &&
                !(d[destIndex] == 'My' && d[srcIndex] == "United States")  &&
                !(d[srcIndex] == 'My' && d[destIndex] == "United States");
        } );


        var dataMap = {min: MAX_INT, max: 0};
        for (i=0; i<dataArray.length; ++i) {
            var src = formatCountryName(dataArray[i][srcIndex]),
                dest = formatCountryName(dataArray[i][destIndex]),
                amount = dataArray[i][measureIndex].data ?
                    parseFloat(dataArray[i][measureIndex].data.toFixed(2)) :
                    parseFloat(dataArray[i][measureIndex].text.removeCommas()),
                amountText = dataArray[i][measureIndex].text;

            if (!dataMap[src]) {
                dataMap[src] = {import: [], export: [], importTotal: 0, exportTotal: 0};
            }
            if (!dataMap[dest]) {
                dataMap[dest] = {import: [], export: [], importTotal: 0, exportTotal: 0};
            }

            if (src === dest) {
                dataMap[src].internal = amountText;
            }
            else {
                if (amount > dataMap.max) {
                    dataMap.max = amount;
                }
                if (amount < dataMap.min) {
                    dataMap.min = amount;
                }

                dataMap[src].export.push({name: dest, amount: amount, text: amountText});
                dataMap[src].exportTotal += amount;

                dataMap[dest].import.push({name: src, amount: amount, text: amountText});
                dataMap[dest].importTotal += amount;
            }
        }

        // sort the import/export arrays for each country
        $.each(dataMap, function (key, entry) {
            if (key !== 'min' && key !== 'max') {
                entry.import.sort(sort);
                entry.export.sort(sort);
            }
        })
        //console.log(dataMap);

    var chartRelativeWidth = options.chartRelativeWidth,
            chartRelativeHeight = 1,
            mapRelativeWidth = 1 - chartRelativeWidth;

        var initialScale = width * options.scaleFactor,
            translateDelta = {x: options.translateDelta[0], y:options.translateDelta[1]},
            initialTranslate = [
                parseFloat(width * mapRelativeWidth * options.translateFactor[0] + translateDelta.x),
                parseFloat(height * options.translateFactor[1] + translateDelta.y)
            ],
            initialTranslateWithoutDelta = [
                parseFloat(width * options.translateFactor[0]),
                parseFloat(height * options.translateFactor[1])
            ],
            zoomScaleFactor = ZOOM_OUT_LEVEL,
            currentScale = initialScale,
            currentTranslate = [0, 0];

        var arcWidth = d3.scale.linear()
            .domain([dataMap.min, dataMap.max])
            .range([3, 10]);

        var countryColor = d3.scale.category10();

        var projection = projector = d3.geo.hill()//winkel3()
            .scale(initialScale)
            .translate([0, 20]);

        var path = d3.geo.path()
            .projection(projection);

//        var zoom = d3.behavior.zoom()
//            .translate(projection.translate())
//            .scale(projection.scale())
//            .scaleExtent([initialScale, initialScale * 8])
//            .on("zoom", zoom);

        // var drag = d3.behavior.drag()
        //     //.origin(Object)
        //     .on("drag", drag);

        var $widgetContainer = createDomElement($(parent), mapName),
            widgetContainer = $widgetContainer.get(0);

        $widgetContainer.addClass(MAP_TYPE);

        var svg = d3.select(widgetContainer).append("svg")
            .attr("width", width)
            .attr("height", height);

        var mapContainerWidth = width * mapRelativeWidth;
        var mapContainer = svg.append("svg:g")
            .attr("id", "map_container")
            .attr("width", mapContainerWidth)
            .attr("height", height)
            .attr("transform", "translate(" + initialTranslate[0] + "," + initialTranslate[1] + ")")
            //.call(drag);

        mapContainer.append("svg:rect")
            .attr("class", "background map_background")
            .attr("id", mapName + "_map_background")
            .attr("width", mapContainerWidth)
            .attr("height", height)
            .attr("transform", "translate(" + (-initialTranslate[0]) + "," + -initialTranslate[1] + ")")
            //.style("fill", "lightsteelblue")
            .on("click", click)
            //.call(drag);

        var states = mapContainer.append("svg:g")
            .attr("class", ids.statesName())
            .attr("id", ids.statesName())
            .attr("width", mapContainerWidth);

        var myCountries = [ "My", "United States", "United Kingdom", "Germany", "Australia" ];

        states.selectAll("path")
            .data(WORLD_COUNTRIES.features)
        .enter().append("svg:path")
            .attr("class", function (d) {
                var name = d.properties.name,
                    classStr = "country",
                    i;

                if (dataMap[name]) {
                    for (i=0; i<dataMap[name].import.length; ++i) {
                        classStr = classStr + " shape_dest_" + dataMap[name].import[i].name.replaceSpaces();
                    }
                    for (i=0; i<dataMap[name].export.length; ++i) {
                        classStr = classStr + " shape_src_" + dataMap[name].export[i].name.replaceSpaces();
                    }
                }

                return classStr;
            })
            .attr("id", function(d) { return ids.countryName(d.properties.name.replaceSpaces()); })
            .attr("name", function(d) {return d.properties.name.replaceSpaces()})
            .attr('center_x', function(d) { return path.centroid(d)[0] })
            .attr('center_y', function(d) { return path.centroid(d)[1] })
            .attr("d", path)
            .on("click", click);

        var infoDisplay = mapContainer.append("svg:g")
            .attr("id", "infoDisplay");

        for (var i = 0; i < dataArray.length ; i++) {
            //svg.append('<div id="tooltip_plate_' + i + '" class="tooltip_plate"><div id="tooltip_text"></div></div>');
            drawArcBetweenCountries(i);
        }

        var chartTranslate = [mapContainerWidth, 0],
            chartContainerWidth = width * chartRelativeWidth,
            chartContainerHeight = height * chartRelativeHeight,
            chartPadding = {top: 30, bottom: 5, left: 10, right: 5},
            chartTitleRelativeHight = 0.06,
            chartCountryNameRelativeHeight = 0.04,
            chartInternalRelativeHeight = 0.03,
            chartExportRelativeHeight = 0.45,
            chartImportRelativeHeight = 0.45;

        var chartContainer =  svg.append("g")
            .attr("class", "chart_container")
            .attr("width", chartContainerWidth)
            .attr("height", chartContainerHeight)
            .attr("transform", "translate(" + chartTranslate[0] + "," + chartTranslate[1] + ")")

        chartContainer.append("svg:rect")
            .attr("class", "background chart_background")
            .attr("id", mapName + "_chart_background")
            .attr("width", chartContainerWidth)
            .attr("height", chartContainerHeight);

        chartContainer.append("svg:line")
            .attr('id', mapName + '_chart_border')
            .attr('class', 'chart_border')
            .attr('x1', 0)
            .attr('y1', 45)
            .attr('x2', 0)
            .attr('y2', chartContainerHeight- 45)
            .style('stroke-width', 0.5)
            .style('stroke', '#777');

        var chartTextTranslate = [20, 20];
        var titleContainerHeight = chartContainerHeight * chartTitleRelativeHight,
            titleContainerWidth = chartContainerWidth,
            titleTranslate = [
                chartPadding.left,
                chartPadding.top
            ],
            titleTextTranslate = [
                titleContainerWidth / 2,
                chartTextTranslate[1]
            ];
        var titleContainer = chartContainer.append("svg:g")
            .attr('id', mapName + '_chart_title_container')
            .attr('class', 'chart_title_container')
            .attr("width", titleContainerWidth)
            .attr("height", titleContainerHeight)
            .attr("transform", "translate(" + titleTranslate[0] + "," + titleTranslate[1] + ")");

        titleContainer.append("text")
            .attr("class",'chart_text_title')
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + titleTextTranslate[0] + "," + titleTextTranslate[1] + ")")
            .text("Export/Import Revenues");

        var countryNameContainerHeight = chartContainerHeight * chartCountryNameRelativeHeight,
            countryNameContainerWidth = chartContainerWidth,
            countryNameTranslate = [
                chartPadding.left,
                chartPadding.top + titleContainerHeight
            ],
            countryNameTextTranslate = [
                countryNameContainerWidth / 2 ,
                chartTextTranslate[1]
            ];
        var countryNameContainer = chartContainer.append("svg:g")
            .attr('id', mapName + '_chart_country_name_container')
            .attr('class', 'chart_country_name_container')
            .attr("width", countryNameContainerWidth)
            .attr("height", countryNameContainerHeight)
            .attr("transform", "translate(" + countryNameTranslate[0] + "," + countryNameTranslate[1] + ")");

        countryNameContainer.append("text")
            .attr("id", mapName + '_chart_country_name_text')
            .attr("class",'chart_text_country_name')
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + countryNameTextTranslate[0] + "," + countryNameTextTranslate[1] + ")")
            .text("");

        var internalContainerHeight = chartContainerHeight * chartInternalRelativeHeight,
            internalContainerWidth = chartContainerWidth,
            internalTranslate = [
                chartPadding.left,
                chartPadding.top
            ];
        var internalContainer = chartContainer.append("svg:g")
            .attr('id', mapName + '_chart_internal_container')
            .attr('class', 'chart_internal_container')
            .attr("width", internalContainerWidth)
            .attr("height", internalContainerHeight)
            .attr("transform", "translate(" + internalTranslate[0] + "," + internalTranslate[1] + ")");

        var exportContainerHeight = chartContainerHeight * chartExportRelativeHeight,
            exportContainerWidth = chartContainerWidth,
            exportTranslate = [
                chartPadding.left,
                chartPadding.top
            ],
            exportTextTranslate;
        var exportContainer = chartContainer.append("svg:g")
            .attr('id', mapName + '_chart_export_container')
            .attr('class', 'chart_export_container')
            .attr("width", exportContainerWidth)
            .attr("height", exportContainerHeight)
            .attr("transform", "translate(" + exportTranslate[0] + "," + exportTranslate[1] + ")");

//        exportContainer.append("text")
//            .attr("id", mapName + '_chart_export_text')
//            .attr("text-anchor", "left")
//            .attr("transform", "translate(" + exportTextTranslate[0] + "," + exportTextTranslate[1] + ")")
//            .text("");

        var importContainerHeight = chartContainerHeight * chartImportRelativeHeight,
            importContainerWidth = chartContainerWidth,
            importTranslate = [
                chartPadding.left,
                chartPadding.top
            ],
            importTextTranslate;
        var importContainer = chartContainer.append("svg:g")
            .attr('id', mapName + '_chart_import_container')
            .attr('class', 'chart_import_container')
            .attr("width", importContainerWidth)
            .attr("height", importContainerHeight)
            .attr("transform", "translate(" + importTranslate[0] + "," + importTranslate[1] + ")");

//        importContainer.append("text")
//            .attr("id", mapName + '_chart_import_text')
//            .attr("text-anchor", "left")
//            .attr("transform", "translate(" + importTextTranslate[0] + "," + importTextTranslate[1] + ")")
//            .text("");
        var legendContainer = mapContainer.append("svg:g")
            .attr("class", "legend_container")
            .attr("width", 300)
            .attr("height", 20)
            .attr("transform", "translate(" + (-30) /*(-mapContainerWidth/2 + 150) */+ ", " + ( height/3  - 40) + ")");

        legendContainer.append("svg:rect")
            .attr("class", "legend_square")
            .attr("width", 10)
            .attr("height", 10)
            //.attr("transform", "translate(" + (-mapContainerWidth/2 + 90) + ", " + ( height/3 + 60) + ")")
            .attr("transform", "translate(10, 10)")
            .style("fill", "#f4af02");

        legendContainer.append("svg:text")
            .attr("class", "legend_text")
            .attr("text-anchor", "left")
            .attr("transform", "translate(25, 18)")
            //.attr("transform", "translate(" + (-mapContainerWidth/2 + 105) + ", " + ( height/3 + 70) + ")")
            .text("export site");

        legendContainer.append("svg:rect")
            .attr("class", "legend_square")
            .attr("width", 10)
            .attr("height", 10)
            .attr("transform", "translate(140, 10)")
            //.attr("transform", "translate(" + (-mapContainerWidth/2 + 200) + ", " + ( height/3 + 60) + ")")
            .style("fill", DEST_COLOR);

        legendContainer.append("svg:text")
            .attr("class", "legend_text")
            .attr("text-anchor", "left")
            .attr("transform", "translate(155, 18)")
            //.attr("transform", "translate(" + (-mapContainerWidth/2 + 215) + ", " + ( height/3 + 70) + ")")
            .text("export destination");

        setCountryHoverBehaviour();
        /////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////

        function formatCountryName(name) {
            // fix names which arrived fucked up in the input

            if ( name === "Korea, South") name = "South Korea";
            if ( name === "Korea, North") name = "North Korea";
            if ( name === "Azerbaijan Republic") name = "Azerbaijan";
            if ( name === "Bahamas, The") name = "The Bahamas";
            if ( name === "Democratic Republic of the Congo") name = "DR Congo";
            if ( name === "Micronesia, Federated States of") name = "Micronesia";
            if ( name === "South Georgia South Sandwich Islands") name = "South Georgia";
            if ( name === "Falkland Islands (Islas Malvinas)") name = "Falkland Islands";
            if ( name === "French Southern and Antarctic Lands") name = "French Antarctic";
            if ( name === "Heard Island and McDonald Islands") name = "Heard Island";
            if ( name === "Holy See (Vatican City)") name = "Vatican City";
            if ( name === "Saint Vincent and the Grenadines") name = "St. Vincent";
            return name;
        }

        function sort(a, b) {
            if (a.amount > b.amount) return -1;
            else if (a.amount < b.amount) return 1;
            return 0;
        }

        function click(d) {
            var x = 0,
                y = 0;

            if (d && centered !== d) {
                var centroid = path.centroid(d);

                x = currentTranslate[0] - centroid[0];
                y = currentTranslate[1] - centroid[1];

                //var area = path.area(d);
                //zoomScaleFactor = width / (50 + Math.ceil(path.area(d))); //zoom to "appropriate" levels
                zoomScaleFactor = ZOOM_IN_LEVEL;
                centered = d;
            }
            else {
                centered = null;
                zoomScaleFactor = ZOOM_OUT_LEVEL;
            }

            projection
                .translate([x,y]);

            states
                .selectAll("path")
                .classed("active", centered && function(d) { return d === centered; });

            states
                .transition()
                .duration(DURATION)
                .attr("transform", "scale(" + zoomScaleFactor + ")translate(" + x + "," + y + ")")
                .style('stroke-width', (zoomScaleFactor === ZOOM_IN_LEVEL) ? 0.2 : 1.5 );

            infoDisplay
                .transition()
                .duration(DURATION)
                .attr("transform", "scale(" + zoomScaleFactor + ")translate(" + x + "," + y + ")");

            var arcs = d3.selectAll(getClassSelector("arc"));
            arcs
                .transition()
                .duration(DURATION)
                .style('stroke-width', (zoomScaleFactor === ZOOM_IN_LEVEL) ? 1 : 2.5);

            currentTranslate = [x, y];
        }

        function drawArcBetweenCountries(dataIndex) {

            var srcCountryName = formatCountryName(dataArray[dataIndex][srcIndex]),
                destCountryName = formatCountryName(dataArray[dataIndex][destIndex]);

            if (srcCountryName === 'My') srcCountryName = "United States";
            if (!srcCountryName || !destCountryName || srcCountryName === destCountryName) return;

            var srcSelector = ids.getCountryId(srcCountryName.toString().replaceSpaces()),
                destSelector = ids.getCountryId(destCountryName.toString().replaceSpaces()),
                $src = $(srcSelector),
                $dest = $(destSelector);

            //console.log($src, $dest);
            if ($src.length === 0) {
                console.log("WARNING: " + srcCountryName + " is not a legal country name");
                return;
            }
            if ($dest.length === 0) {
                console.log("WARNING: " + destCountryName + " is not a legal country name");
                return;
            }
            var srcX = parseFloat($src.attr('center_x')),
                srcY = parseFloat($src.attr('center_y')),
                destX = parseFloat($dest.attr('center_x')),
                destY = parseFloat($dest.attr('center_y')),
                srcCoordinates = {longitude:srcX, latitude:srcY },
                destCoordinates = { longitude:destX, latitude:destY };

            //svg.append('svg:circle');
            drawArc(srcCoordinates, srcCountryName, destCoordinates, destCountryName, true, dataIndex);

            d3.select(srcSelector).classed('country_site',true);
            d3.select(destSelector).classed('country_dest',true);
        }

        function drawArc (startCoords, srcCountryName, endCoords, destCountryName, curve, dataIndex) {
/**
            var curveLevel = d3.scale.linear()
                .domain([5, 800])
                .range([15, 300]);
 /*/
            function curveLevel(distance) {
                if (distance < 50) return 15;
                if (distance < 100) return 40;
                if (distance < 400) return 100;
                return 200;
            }
/**/
            dataIndex = dataIndex || 0;

            if (typeof light === "undefined") {
              light = false;
            }

            var targetXY = [startCoords.longitude, startCoords.latitude],
                sourceXY = [endCoords.longitude, endCoords.latitude],
                midpointXY = [((targetXY[0] + sourceXY[0]) / 2), ( ((targetXY[1] + sourceXY[1]) / 2) )];

            var distance = Math.sqrt(Math.pow(Math.abs(targetXY[0] - sourceXY[0]), 2) + Math.pow(Math.abs(targetXY[1] - sourceXY[1]), 2));
            //console.log(srcCountryName + ' --> ' + destCountryName, distance);

            var srcClass = "arc_src_" + srcCountryName.replaceSpaces(),
                destClass = "arc_dest_" + destCountryName.replaceSpaces();

            var t = 1,
                delta = .025,
                line = d3.svg.line().x(x).y(y),
                stroke = d3.scale.category20b();

            bezier = {};
            points[dataIndex] = [{x: targetXY[0], y: targetXY[1]}, {x: midpointXY[0], y: midpointXY[1] - curveLevel(distance)}, {x: sourceXY[0], y: sourceXY[1]}];

            var states = d3.select(ids.getStatesId());
            var i = 1, c = getCurve(3, dataIndex)[0];

            /*
                This is the line & arc that are visible to the user. They have no mouse events attached.
             */
            var arc =  infoDisplay//d3.select(ids.getStatesId())
              .append("svg:path")
              .attr("class", "arc " + srcClass + " " + destClass)
              .attr("id", ids.arcName(dataIndex, 0));
              //.style("stroke-width", function() {return arcWidth(dataArray[dataIndex][measureIndex].data) + "px";});
              //  .style("stroke-width", 2);

            var $arc = $($(arc)[0]);
            $arc.data('dataIndex', dataIndex);
            $arc.data('tooltipAnchor', {left:midpointXY[0], top:midpointXY[1] - (curve ? 50: 0)});

            i=1;
            d3.timer(function(d) {
                arc.data([c.slice(0,i+1)])
                    .attr('d', line);
                i += 5;
                if (i > c.length+1) return true;
            });

           
            function getLevels(d, t_, dataIndex) {

                if (arguments.length < 2) t_ = t;
                var x = [points[dataIndex].slice(0, d)];
                for (var i=1; i<d; i++) {
                  x.push(interpolate(x[x.length-1], t_));
                }
                return x;
            }

            function getCurve(d, dataIndex) {
                var curve;//= bezier[d]; [GE] - to allow multiple curve animations simultaniously
                if (!curve) {
                    curve = bezier[d] = [];
                    for (var t_=0; t_<=1+delta; t_+=delta) {
                        var x = getLevels(d, t_, dataIndex);
                        curve.push(x[x.length-1][0]);
                    }
                }
                return [curve];
            }
        }

        function interpolate(d, p) {
            if (arguments.length < 2) p = t;
            var r = [];
            for (var i=1; i<d.length; i++) {
                var d0 = d[i-1], d1 = d[i];
                r.push({x: d0.x + (d1.x - d0.x) * p, y: d0.y + (d1.y - d0.y) * p});
            }
            return r;
        }

        function x(d) { return d.x; }
        function y(d) { return d.y; }

          //key largo
        hostCoords = {longitude: -80.32, latitude: 25.5};

        function setCountryHoverBehaviour() {
            var $shapes = $(getClassSelector('country'));

            if(ARC_MAP_EXTENSION.browserInfo.browser === 'msie' ) {
                $shapes.mouseover(shapeMouseover);
                $shapes.mouseout(shapeMouseout);

            }
            else {
                $shapes.mouseenter(shapeMouseover);
                $shapes.mouseleave(shapeMouseout);
            }
        }

        function highlight(selector, class_name, enable) {

             //countrySelector = getIdSelector('country_' + countryName.replaceSpaces()),
             var $shapes = $( selector ),
                 $shape,
                 $lastSibling;

            if (enable) {
                // place this country as last sibling so that the highlight os not hidden by other countries' borders
                // unless it's already the last one
                for (var i=0; i<$shapes.length; ++i) {
                    $shape = $($shapes[i]);
                    $lastSibling = $shape.parent().find(':last-child');
                    if ($shape.attr('id') !== $lastSibling.attr('id')) {
                        $shape.insertAfter($lastSibling);
                    }
                }
                d3.selectAll(selector).classed(class_name, true);
                d3.selectAll(selector).classed("hide", false);
            }
            else {
                d3.selectAll(selector).classed(class_name, false);
            }
        }

        function shapeMouseover(e) {

            var formatAmount = d3.format(",");

            var i,
                $shape = $(this),
                shapeId = $shape.attr('id'),
                shapeNameWOSpaces = $shape.attr('name'),
                shapeName =  shapeNameWOSpaces.restoreSpaces(),
                shapeSelector = getIdSelector('country_' + shapeName.replaceSpaces()),
                countryNameTextElement = d3.select(getIdSelector(mapName + '_chart_country_name_text')),
                exportTextElement = d3.select(getIdSelector(mapName + '_chart_export_text')),
                importTextElement = d3.select(getIdSelector(mapName + '_chart_import_text')),
                itemIndentation = 5,
                headerLeading = 22,
                numberIndentation = 150,
                itemLeading = 18,
                textHeight = 2,
                isMySite = false;

            if (dataMap[shapeName]) {
                if (dataMap[shapeName].internal) {
                    var internalTextTranslate = [
                        chartTextTranslate[0],
                        chartPadding.top +
                            chartTextTranslate[1] +
                            titleContainerHeight +
                            countryNameContainerHeight
                    ];
                    internalContainer.append("text")
                        .attr("class", 'chart_text chart_text_header')
                        .attr("text-anchor", "left")
                        .attr("transform", "translate(" + internalTextTranslate[0] + "," + internalTextTranslate[1] + ")")
                        .text("Internal: $" + dataMap[shapeName].internal);

                    internalContainerHeight = headerLeading + itemLeading;
                }
                else {
                    internalContainerHeight = 0;
                }

                if (dataMap[shapeName].export.length > 0) {
                   isMySite = true;
                   exportTextTranslate = [
                       chartTextTranslate[0],
                       chartPadding.top +
                           chartTextTranslate[1] +
                           titleContainerHeight +
                           countryNameContainerHeight + +
                            internalContainerHeight
                    ];
                    exportContainer.append("text")
                        .attr("class", 'chart_text chart_text_header')
                        .attr("text-anchor", "left")
                        .attr("transform", "translate(" + exportTextTranslate[0] + "," + exportTextTranslate[1] + ")")
                        .text("Export:");

                    for (i=0; i<dataMap[shapeName].export.length; ++i) {
                        exportContainer.append("text")
                            .attr("class", 'chart_text chart_text_item')
                            .attr("text-anchor", "left")
                            .attr("transform", "translate(" +
                                (exportTextTranslate[0] + itemIndentation) + "," +
                                (exportTextTranslate[1] + headerLeading + itemLeading * i) + ")")
                            .text(dataMap[shapeName].export[i].name + ": ");

                        exportContainer.append("text")
                            .attr("class", 'chart_text chart_text_amount')
                            .attr("text-anchor", "right")
                            .attr("transform", "translate(" +
                                numberIndentation + "," +
                                (exportTextTranslate[1] + headerLeading + itemLeading * i) + ")")
                            .text("$" + dataMap[shapeName].export[i].text);
                    }

                    exportContainer.append("text")
                        .attr("class", 'chart_text chart_text_total chart_text_export_total')
                        .attr("text-anchor", "left")
                        .attr("transform", "translate(" +
                            (exportTextTranslate[0] + itemIndentation) + "," +
                            (exportTextTranslate[1] + headerLeading + itemLeading * i) + ")")
                        .text("Total: ");

                    exportContainer.append("text")
                        .attr("class", 'chart_text chart_text_total chart_text_export_total')
                        .attr("text-anchor", "right")
                        .attr("transform", "translate(" +
                            numberIndentation + "," +
                            (exportTextTranslate[1] + headerLeading + itemLeading * i) + ")")
                        .text("$"+ formatAmount(Math.round(dataMap[shapeName].exportTotal)));

                    exportContainerHeight = textHeight + headerLeading + ( (textHeight + itemLeading) * ++i);
                }
                else {
                    exportContainerHeight = 0;
                }

                

                if (dataMap[shapeName].import.length > 0) {
                    importTextTranslate = [
                        chartTextTranslate[0],
                        chartPadding.top +
                            chartTextTranslate[1] +
                            titleContainerHeight +
                            countryNameContainerHeight +
                            internalContainerHeight +
                            exportContainerHeight
                    ];

                    importContainer.append("text")
                        .attr("class", 'chart_text chart_text_header')
                        .attr("text-anchor", "left")
                        .attr("transform", "translate(" + importTextTranslate[0] + "," + importTextTranslate[1] + ")")
                        .text("Import:");

                    for (i=0; i<dataMap[shapeName].import.length; ++i) {
                        importContainer.append("text")
                            .attr("class", 'chart_text chart_text_item')
                            .attr("text-anchor", "left")
                            .attr("transform", "translate(" +
                                (importTextTranslate[0] + itemIndentation) + "," +
                                (importTextTranslate[1] + headerLeading + itemLeading * i) + ")")
                            .text(dataMap[shapeName].import[i].name + ": ");

                        importContainer.append("text")
                            .attr("class", 'chart_text chart_text_amount')
                            .attr("text-anchor", "right")
                            .attr("transform", "translate(" +
                                numberIndentation + "," +
                                (importTextTranslate[1] + headerLeading + itemLeading * i) + ")")
                            .text("$" + dataMap[shapeName].import[i].text);
                    }

                    importContainer.append("text")
                        .attr("class", 'chart_text chart_text_total chart_text_import_total')
                        .attr("text-anchor", "left")
                        .attr("transform", "translate(" +
                        (importTextTranslate[0] + itemIndentation) + "," +
                        (importTextTranslate[1] + headerLeading + itemLeading * i) + ")")
                        .text("Total: ");

                    importContainer.append("text")
                        .attr("class", 'chart_text chart_text_total chart_text_import_total')
                        .attr("text-anchor", "right")
                        .attr("transform", "translate(" +
                            numberIndentation + "," +
                            (importTextTranslate[1] + headerLeading + itemLeading * i) + ")")
                        .text("$" + formatAmount(Math.round(dataMap[shapeName].importTotal)));
                }

                // highlight all connected shapes
                var srcArcSelector = getClassSelector("arc_src_" + shapeNameWOSpaces),
                    destArcSelector = getClassSelector("arc_dest_" + shapeNameWOSpaces),
                    srcShapeSelector = getClassSelector("shape_src_" + shapeNameWOSpaces),
                    destShapeSelector = getClassSelector("shape_dest_" + shapeNameWOSpaces);

                

                d3.selectAll(getClassSelector("country")).classed("transparent", true);
                d3.selectAll(getClassSelector("arc")).classed("hide", true);              

                highlight(srcArcSelector, HIGHLIGHT_STROKE_SRC_ARC_CLASS, true);
                highlight(destArcSelector, HIGHLIGHT_STROKE_DEST_ARC_CLASS, true);

                // make sure exporting countries who are importing from us are colored blue...
                d3.selectAll(destShapeSelector).style('fill', DEST_COLOR);

                // ... unless they are also exporting to us
                d3.selectAll(srcShapeSelector).style('fill', '');

                highlight(srcShapeSelector, HIGHLIGHT_STROKE_SRC_SHAPE_CLASS, true);
                highlight(destShapeSelector, HIGHLIGHT_STROKE_DEST_SHAPE_CLASS, true);
                //console.log(d3.selectAll(srcSelector));

                if (isMySite) {
                    highlight(shapeSelector, "highlight_src_shape_selected", true);
                }
                else {
                    highlight(shapeSelector, "highlight_dest_shape_selected", true);
                }

            }
            else {
                // highlight selected country
                highlight(shapeSelector, HIGHLIGHT_SHAPE_CLASS, true);
            }


            $shape.addClass("selected");
            countryNameTextElement.text(formatCountryName(shapeName));
        }

        function shapeMouseout(e) {
            var $shape = $(this),
                shapeId = $shape.attr('id'),
                shapeNameWOSpaces = $shape.attr('name'),
                shapeName =  shapeNameWOSpaces.restoreSpaces(),
                shapeSelector = getIdSelector('country_' + shapeName.replaceSpaces()),
                countryNameTextElement = d3.select(getIdSelector(mapName + '_chart_country_name_text'));

            // de-highlight selected country
            highlight(shapeSelector, HIGHLIGHT_SHAPE_CLASS, false);
            highlight(shapeSelector, "highlight_src_shape_selected", false);
            highlight(shapeSelector, "highlight_dest_shape_selected", false);

            // de-highlight all connected shapes
            var srcArcSelector = getClassSelector("arc_src_" + shapeNameWOSpaces),
                destArcSelector = getClassSelector("arc_dest_" + shapeNameWOSpaces),
                srcShapeSelector = getClassSelector("shape_src_" + shapeNameWOSpaces),
                destShapeSelector = getClassSelector("shape_dest_" + shapeNameWOSpaces);

            highlight(srcArcSelector, HIGHLIGHT_STROKE_SRC_ARC_CLASS, false);
            highlight(destArcSelector, HIGHLIGHT_STROKE_DEST_ARC_CLASS, false);
            highlight(srcShapeSelector, HIGHLIGHT_STROKE_SRC_SHAPE_CLASS, false);
            highlight(destShapeSelector, HIGHLIGHT_STROKE_DEST_SHAPE_CLASS, false);

            d3.selectAll(getClassSelector("arc")).classed("hide", false);
            d3.selectAll(getClassSelector("country")).classed("transparent", false);

            countryNameTextElement.text("");
            d3.selectAll(getClassSelector('chart_text')).remove();

            $shape.removeClass("selected");

            d3.selectAll(destShapeSelector).style('fill', '');
        }

        function setHelperArcHoverBehaviour($arc, dataIndex) {

            var srcCountryName = dataArray[dataIndex][srcIndex],
                destCountryName = dataArray[dataIndex][destIndex],
                srcSelector = ids.getCountryId(srcCountryName.toString().replaceSpaces()),
                destSelector = ids.getCountryId(destCountryName.toString().replaceSpaces()),
                $src = $(srcSelector),
                $dest = $(destSelector);
            /*
            $dest.mouseover(function () {


                highlightArc($arc[0], dataIndex);
                highlightCountry(this);
            });
            $dest.mouseout(function () {

                dehighlightArc($arc[0]);
                dehighlightCountry(this);
            });*/

            $arc.mouseover(function (e) {

                var dataIndex = $(this).data('dataIndex'),
                    destCountryName = dataArray[dataIndex][destIndex],
                    srcCountryName = dataArray[dataIndex][srcIndex],
                    destSelector = ids.getCountryId(destCountryName.toString().replaceSpaces()),
                    srcSelector = ids.getCountryId(srcCountryName.toString().replaceSpaces()),
                    $src = $(srcSelector),
                    $dest = $(destSelector);
                highlightArc(this, dataIndex);
                highlightCountry($dest[0]);
            });
            $arc.mouseout(function (e) {

                var dataIndex = $(this).data('dataIndex'),
                    destCountryName = dataArray[dataIndex][destIndex],
                    srcCountryName = dataArray[dataIndex][srcIndex],
                    destSelector = ids.getCountryId(destCountryName.toString().replaceSpaces()),
                    srcSelector = ids.getCountryId(srcCountryName.toString().replaceSpaces()),
                    $src = $(srcSelector),
                    $dest = $(destSelector);
                dehighlightArc(this);
                dehighlightCountry($dest[0]);
            });

            var highlightArc = function (arc, dataIndex) {

                var dest = dataArray[dataIndex][destIndex].replaceSpaces(),
                    revenue = dataArray[dataIndex][measureIndex].data,
                    anchorSelector = ids.getAnchorId(dataIndex),
                    anchorPosition = $(anchorSelector).position();
                    //anchorPosition = $(arc).data('tooltipAnchor');

//                tooltipText = 'Country: <span id="dest_name">' + dest + '</span><br>Revenue: <span id="revenue">' + revenue + '</span>';
//                $(getIdSelector('tooltip_text')).html(tooltipText);
//
//                $(ids.getAnchorId(dataIndex)).qtip('show');
//
//                // display tooltip
//                $(ids.getTooltipPlateId(dataIndex)).removeClass('hide');
//
//                // position tooltip
//                $(ids.getTooltipPlateId(dataIndex)).position(anchorPosition);

//                d3.selectAll(getClassSelector('arc_' + dataIndex))
//                        // remove transparency
//                        .classed('transparent', false)
//                        // highight arc
//                        .classed('selectedArc', true);
                //$('.arc_' + dataIndex).addClass('selectedArc');
            };

            var dehighlightArc = function (arc) {

                // Hide tooltip
                //$(ids.getTooltipPlateId(dataIndex)).addClass('hide');

                $(ids.getAnchorId(dataIndex)).qtip('hide');

                d3.selectAll(getClassSelector('arc_' + dataIndex))
                        // Add transparency
                        .classed('transparent', true)
                        // De-highight arc
                        .classed('selectedArc', false);
            };

            var highlightCountry = function ($country) {

                d3.select($country).classed('destCountry', true);
            };
            var dehighlightCountry = function ($country) {

                d3.select($country).classed('destCountry', false);
            }
        }
    }
};
