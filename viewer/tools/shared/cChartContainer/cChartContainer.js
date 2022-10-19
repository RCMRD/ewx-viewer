var cChartContainer = {
    options: {
        delayRender: true,
        requiredBlocks: ['cGraphTool', 'cMapWindow', 'cMapPanel'],
        groupBy: 'cMapWindow',
        events: [
			'datatypechanged',
			'graphtypechanged', 
			'periodschanged', 
			'boundaryidchanged', 
			'periodformatchanged', 
			'attributesupdated', 
			'rendercomponent', 
			'activate',
			'periodsync',
			'truncatingstart',
			'truncatingend',
			'startpointset'
		]
    },
    getDefaultChartOptions : function (selectedChart, chartAttributes) {
        var title = chartAttributes.overlayTitle;
        var yAxisTitle = chartAttributes.yAxisLabel;
        
        return {
            /**
             * options: The chart configurations supported by AmCharts. Passed directly into the AmCharts.makeChart function.
             *
             * Documentation: https://docs.amcharts.com/3/
             */
            options: this.chartOptions[selectedChart].getAmChartsOptions(this, chartAttributes),
            /**
             * events: Allows setting event handlers on the chart.
             */
            events: {},
            /**
             * custom: Custom objects used for the chart.
             *
             * Custom objects are passed as the string name to the chart handler and automatically assigned to 
             * a class in either (core) mapper.amcharts[objectKey] or custom.amcharts[objectKey]
             */
            custom: this.chartOptions[selectedChart].getCustomOptions(this, chartAttributes)
        };
    },
    chartOptions: {
        annual: {
			canTruncate: false,
            chartTypes: {
                bar: 'BarGraph',
                line: 'LineGraph'
            },
            periodFormat: 'years',
            cumulative: false,
            getName: function(chartAttributes) {
                return mapper.periodsConfig[chartAttributes.period].fullName;
            },
            getAmChartsOptions: function(itemDefinition, chartAttributes) {
                return {
                    "type" : "serial",
                    "theme" : "none",
                    "pathToImages" : "lib/amcharts_3.21.14/amcharts/images/",
                    "columnWidth" : 1,
                    "categoryField" : "x",
                    "categoryAxis" : {
                        "parseDates" : true,
                        "markPeriodChange" : false,
                        "gridPosition" : "start",
                        "autoGridCount" : false,
                        "equalSpacing": true,
                        "gridCount" : 12,
                        "labelFunction" : mapper.amcharts.common.formatMonthCategory
                    },
                    "valueAxes" : [{
                            "title" : chartAttributes.yAxisLabel,
                            "fontSize" : 8,
                            "id" : "ValueAxis-1",
                            "position" : "left",
                            "axisAlpha" : 0
                        }
                    ],
                    "chartCursor": {
                        "categoryBalloonFunction": mapper.amcharts.common.getCategoryBalloonFunction(chartAttributes.startMonth, chartAttributes.period)
                    },
                    "export" : {
                        "enabled" : true,
                        "menu" : [],
                        "dataDateFormat" : "MM-DD",
                        "legend" : {
                            "position" : "bottom"
                        }
                    },
                    "chartScrollbar" : {
                        "autoGridCount" : false,
                        "gridCount": 0,
                        "scrollbarHeight" : 15
                    }
                };
            },
            getCustomOptions: function(itemDefinition, chartAttributes) {
                return {
                    /**
                     * chartBuilder: Manipulates chart data, sets chart specific defaults, adds graphs to the chart, etc.
                     *
                     * Objects in core:
                     *     DefaultChartBuilder: A default chart builder used if none is specified.
                     *     ChartBuilder: A basic chart builder used for handling most charts.
                     *     AnnualChartBuilder: A special chart builder used for displaying data across years.
                     *     GradientChartBuilder: A special chart builder used for displaying a gradient next to a data chart.
                     *     MinMaxChartBuilder: A chart builder that also calculates min, max, and average.
                     */
                    "chartBuilder" : "ChartBuilder",
                    
                    /**
                     * chartType: Dynamically builds out graphs to be added to the chart.
                     *
                     * Objects in core:
                     *     StaticChartType: A default chart type if none is specified. Does nothing. Use if statically assigning graphs through the AmCharts configs.
                     *     LineGraph: Dynamically builds out basic line graphs based on the selected years.
                     *     BarGraph: Dynamically builds out basic bar graphs based on the selected years.
                     *     AnnualBarGraph: Dynamically build out special bar graphs to display specific period across years.
                     *     AnnualLineGraph: Dynamically build out special line graphs to display specific period across years.
                     *     LineGraphWithSD: Same as LineGraph but adds +-1 standard deviation graphs.
                     *     MinMaxLineGraph: Same as LineGraph but adds the min, max, and averate lines.
                     *     GradientGraph: Special chart type for gradient graphs.
                     */
                    "chartType" : "BarGraph",
                    
                    /**
                     * exporters: Defines objects used for exporting this chart.
                     *
                     * Supported formats: PNG, CSV
                     */
                    "exporters" : {
                        
                        /**
                         * PNG: Exports chart as png.
                         *
                         * Objects in core: 
                         *     defaultExport: Uses Basic AmCharts functionality.
                         */
                        "PNG" : "defaultExport",
                        
                        /**
                         * CSV: Exports chart as csv.
                         * 
                         * Objects in core:
                         *     monthlyExport: Exports monthly data.
                         *     yearlyExport: Exports annual data.
                         *     sevenDayExport: Special exporter used for weekly data.
                         */
                        "CSV" : "monthlyExport"
                    }
                };
            }
        },
        annual_cumulative: {
			canTruncate: true,
            chartTypes: {
                bar: 'BarGraph',
                line: 'LineGraph'
            },
            periodFormat: 'years',
            cumulative: true,
            getName: function(chartAttributes) {
                return 'Cumulative';
            },
            getAmChartsOptions: function(itemDefinition, chartAttributes) {
                return {
                    "type" : "serial",
                    "theme" : "none",
                    "pathToImages" : "lib/amcharts_3.21.14/amcharts/images/",
                    "columnWidth" : 1,
                    "categoryField" : "x",
                    "categoryAxis" : {
                        "parseDates" : true,
                        "equalSpacing": true,
                        "markPeriodChange" : false,
                        "gridPosition" : "start",
                        "autoGridCount" : false,
                        "gridCount" : 12,
                        "labelFunction" : mapper.amcharts.common.formatMonthCategory
                    },
                    "valueAxes" : [{
                            "title" : chartAttributes.yAxisLabel,
                            "fontSize" : 8,
                            "id" : "ValueAxis-1",
                            "position" : "left",
                            "axisAlpha" : 0
                        }
                    ],
                    "chartCursor": {
                        "categoryBalloonFunction": mapper.amcharts.common.getCategoryBalloonFunction(chartAttributes.startMonth, chartAttributes.period),
						"listeners": [{
							"event": "changed",
							"method": function(e) {
								e.chart.lastCursorPosition = e.index;
							}
						}]
                    },
                    "export" : {
                        "enabled" : true,
                        "menu" : [],
                        "dataDateFormat" : "MM-DD"
                    },
                    "chartScrollbar" : {
                        "autoGridCount" : false,
                        "gridCount": 0,
                        "scrollbarHeight" : 15
                    },
                };
            },
            getCustomOptions: function(itemDefinition, chartAttributes) {
                return {
                    "chartBuilder" : "ChartBuilder",
                    "chartType" : "BarGraph",
                    "exporters" : {
                        "PNG" : "defaultExport",
                        "CSV" : "monthlyExport"
                    }
                };
            }
        },
        interannual: {
			canTruncate: false,
            chartTypes: {
                bar: 'AnnualBarGraph',
                line: 'AnnualLineGraph'
            },
            periodFormat: 'periods',
            cumulative: false,
            getName: function(chartAttributes) {
                return 'Interannual';
            },
            getAmChartsOptions: function(itemDefinition, chartAttributes) {
                return {
                    "type" : "serial",
                    "theme" : "none",
                    "pathToImages" : "lib/amcharts_3.21.14/amcharts/images/",
                    "columnWidth" : 1,
                    "categoryField" : "x",
                    "categoryAxis" : {
                        "fontSize" : 9,
                        "labelRotation" : 90,
                        "minHorizontalGap" : 5,
                        "markPeriodChange" : false,
                        "autoGridCount" : true,
                    },
                    "valueAxes" : [{
                            "title" : chartAttributes.yAxisLabel,
                            "fontSize" : 8,
                            "id" : "ValueAxis-1",
                            "position" : "left",
                            "axisAlpha" : 0
                        }
                    ],
                    "chartCursor": {
                        
                    },
                    "export" : {
                        "enabled" : true,
                        "menu" : [],
                        "legend" : {
                            "position" : "bottom"
                        }
                    },
                    "chartScrollbar" : {
                        "autoGridCount" : false,
                        "gridCount": 0,
                        "scrollbarHeight" : 15
                    }
                };
            },
            getCustomOptions: function(itemDefinition, chartAttributes) {
                return {
                    "chartBuilder" : "AnnualChartBuilder",
                    "chartType" : "AnnualBarGraph",
                    "exporters" : {
                        "PNG" : "defaultExport",
                        "CSV" : "yearlyExport"
                    }
                };
            }
        },
        minmax: {
			canTruncate: false,
            chartTypes: {
                bar: 'MinMaxBarGraph',
                line: 'MinMaxLineGraph'
            },
            periodFormat: 'years',
            cumulative: false,
            getName: function(chartAttributes) {
                return mapper.periodsConfig[chartAttributes.period].fullName;
            },
            getAmChartsOptions: function(itemDefinition, chartAttributes) {
                return {
                    "type" : "serial",
                    "theme" : "none",
                    "pathToImages" : "lib/amcharts_3.21.14/amcharts/images/",
                    "columnWidth" : 1,
                    "categoryField" : "x",
                    "categoryAxis" : {
                        "parseDates" : true,
                        "equalSpacing": true,
                        "markPeriodChange" : false,
                        "gridPosition" : "start",
                        "autoGridCount" : false,
                        "gridCount" : 12,
                        "labelFunction" : mapper.amcharts.common.formatMonthCategory
                    },
                    "valueAxes" : [{
                            "title" : chartAttributes.yAxisLabel,
                            "fontSize" : 8,
                            "id" : "ValueAxis-1",
                            "position" : "left",
                            "axisAlpha" : 0
                        }
                    ],
                    "chartCursor": {
                        "categoryBalloonFunction": mapper.amcharts.common.getCategoryBalloonFunction(chartAttributes.startMonth, chartAttributes.period)
                    },
                    "export" : {
                        "enabled" : true,
                        "menu" : [],
                        "dataDateFormat" : "MM-DD",
                        "legend" : {
                            "position" : "bottom"
                        }
                    },
                    "chartScrollbar" : {
                        "autoGridCount" : false,
                        "gridCount": 0,
                        "scrollbarHeight" : 15
                    },
                };
            },
            getCustomOptions: function(itemDefinition, chartAttributes) {
                return {
                    "chartBuilder" : "MinMaxChartBuilder",
                    "chartType" : "LineGraph",
                    "exporters" : {
                        "PNG" : "defaultExport",
                        "CSV" : "monthlyExport"
                    }
                };
            }
        },
        minmax_cumulative: {
			canTruncate: true,
            chartTypes: {
                bar: 'MinMaxBarGraph',
                line: 'MinMaxLineGraph'
            },
            periodFormat: 'years',
            cumulative: true,
            getName: function(chartAttributes) {
                return 'Cumulative';
            },
            getAmChartsOptions: function(itemDefinition, chartAttributes) {
                return {
                    "type" : "serial",
                    "theme" : "none",
                    "pathToImages" : "lib/amcharts_3.21.14/amcharts/images/",
                    "columnWidth" : 1,
                    "categoryField" : "x",
                    "categoryAxis" : {
                        "parseDates" : true,
                        "equalSpacing": true,
                        "markPeriodChange" : false,
                        "gridPosition" : "start",
                        "autoGridCount" : false,
                        "gridCount" : 12,
                        "labelFunction" : mapper.amcharts.common.formatMonthCategory
                    },
                    "valueAxes" : [{
                            "title" : chartAttributes.yAxisLabel,
                            "fontSize" : 8,
                            "id" : "ValueAxis-1",
                            "position" : "left",
                            "axisAlpha" : 0
                        }
                    ],
                    "chartCursor": {
                        "categoryBalloonFunction": mapper.amcharts.common.getCategoryBalloonFunction(chartAttributes.startMonth, chartAttributes.period)
                    },
                    "export" : {
                        "enabled" : true,
                        "menu" : [],
                        "dataDateFormat" : "MM-DD"
                    },
                    "chartScrollbar" : {
                        "autoGridCount" : false,
                        "gridCount": 0,
                        "scrollbarHeight" : 15
                    }
                };
            },
            getCustomOptions: function(itemDefinition, chartAttributes) {
                return {
                    "chartBuilder" : "MinMaxChartBuilder",
                    "chartType" : "LineGraph",
                    "exporters" : {
                        "PNG" : "defaultExport",
                        "CSV" : "monthlyExport"
                    }
                };
            }
        },
        annual_prelim: {
			canTruncate: false,
            chartTypes: {
                bar: 'PrelimBarGraph',
                line: 'PrelimLineGraph'
            },
            periodFormat: 'years',
            cumulative: false,
            getName: function(chartAttributes) {
                return mapper.periodsConfig[chartAttributes.period].fullName;
            },
            getAmChartsOptions: function(itemDefinition, chartAttributes) {
                return itemDefinition.chartOptions.annual.getAmChartsOptions(itemDefinition, chartAttributes);
            },
            getCustomOptions: function(itemDefinition, chartAttributes) {
                return {
                    "chartBuilder" : "PrelimChartBuilder",
                    "chartType" : "PrelimBarGraph",
                    "exporters" : {
                        "PNG" : "defaultExport",
                        "CSV" : "monthlyExport"
                    }
                };
            }
        },
        annual_cumulative_prelim: {
			canTruncate: true,
            chartTypes: {
                bar: 'PrelimBarGraph',
                line: 'PrelimLineGraph'
            },
            periodFormat: 'years',
            cumulative: true,
            getName: function(chartAttributes) {
                return 'Cumulative';
            },
            getAmChartsOptions: function(itemDefinition, chartAttributes) {
                return itemDefinition.chartOptions.annual_cumulative.getAmChartsOptions(itemDefinition, chartAttributes);
            },
            getCustomOptions: function(itemDefinition, chartAttributes) {
                return {
                    "chartBuilder" : "PrelimChartBuilder",
                    "chartType" : "PrelimLineGraph",
                    "exporters" : {
                        "PNG" : "defaultExport",
                        "CSV" : "monthlyExport"
                    }
                };
            }
        },
        interannual_prelim: {
            chartTypes: {
                bar: 'AnnualBarGraph',
                line: 'AnnualLineGraph'
            },
            periodFormat: 'periods',
            cumulative: false,
            getName: function(chartAttributes) {
                return 'Interannual';
            },
            getAmChartsOptions: function(itemDefinition, chartAttributes) {
                return itemDefinition.chartOptions.interannual.getAmChartsOptions(itemDefinition, chartAttributes);
            },
            getCustomOptions: function(itemDefinition, chartAttributes) {
                return {
                    "chartBuilder" : "AnnualPrelimChartBuilder",
                    "chartType" : "AnnualPrelimLineGraph",
                    "exporters" : {
                        "PNG" : "defaultExport",
                        "CSV" : "yearlyExport"
                    }
                };
            }
        }
    },
	
	// Although we configure the charts in the template.json in two places, we only use one at a time. 
    enabledChartContainerId: null,
	
	// This method will be ran before any blocks are created.
    init: function(blueprint) {
		// Get a reference to the cMapPanel and cGraphTool blueprints.
        var requiredBlockBlueprints = blueprint.requiredBlockBlueprints;
        var graphToolBlueprint;
		var mapPanelBlueprint;
        for (var i = 0, len = requiredBlockBlueprints.length; i < len; i+=1) {
            var requiredBlock = requiredBlockBlueprints[i];
            if (requiredBlock.blockConfigs.name === 'cMapPanel') {
                mapPanelBlueprint = requiredBlock;
            }
            if (requiredBlock.blockConfigs.name === 'cGraphTool') {
                graphToolBlueprint = requiredBlock;
            }
        }
		
		// Track all other chart container blocks that are created.
		blueprint.trackedBlocks = [];
        
		// Set the enabled chart container id to the default. Since this method can be 
		// called multiple times by different copies of the chart container blueprint,
		// we only set it once by checking for null value.
        if (blueprint.itemDefinition.enabledChartContainerId === null && blueprint.blockConfigs.isDefault === true) {
            blueprint.itemDefinition.enabledChartContainerId = blueprint.id;
        }
        
		mapPanelBlueprint.on('blockcreated', function(blueprint, mapPanelBlock) {
			// Open charts on map click but only if the graph tool is selected.
			mapPanelBlock.on('click', function(callbackObject, postingObject, eventObject) {
				var blueprint = callbackObject;
				if (blueprint.id !== blueprint.itemDefinition.enabledChartContainerId) return;
				var graphTool = graphToolBlueprint.block.extendedTool;
				if (graphTool.enabled === false || graphTool.component.pressed === false) return;
				
				var mapWindowBlock = mapPanelBlock.getReferencedBlock('cMapWindow');
				var layersConfigId = mapWindowBlock.extendedTool.layersConfigId;
				var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);
				var map = eventObject.map;
				var projection = map.getView().getProjection().getCode();
				// Get mapping of chart configs to layer configs.
				var chartMapping = mapper.amcharts.getChartMapping(layersConfig, eventObject.coordinate, projection);
				
				// Destroy any open chart windows belonging to a map window before creating new ones.
				var trackedBlocks = blueprint.trackedBlocks;
				for (var i = 0, len = trackedBlocks.length; i < len; i+=1) {
					var trackedBlock = trackedBlocks[i];
					if (trackedBlock.rendered === true) trackedBlock.unRender();
					trackedBlock.remove();
				}
				blueprint.trackedBlocks = [];
				
				blueprint.undelayRender();

				// For each item in the chart mapping, create a new chart block.
				// First one will create it on this blueprint but subsequent ones will 
				// automatically create a copy of this blueprint and create a block for it.
                var renderedParent;
                for (var overlayId in chartMapping) {
					var chartAttributes = chartMapping[overlayId];
					
                    var chartContainerBlock = blueprint.createBlock();
					blueprint.trackedBlocks.push(chartContainerBlock);
					
                    renderedParent = chartContainerBlock.getClosestRenderedParent();
                    chartContainerBlock.chartAttributes = chartAttributes;
                    chartContainerBlock.selectedBoundaryId = chartAttributes[0].boundaryId;
					chartContainerBlock.lastClickCoord = eventObject.coordinate;
                }
				renderedParent.render();
			}, blueprint);
		}, blueprint);
    },
    createExtendedTool: function(owningBlock) {
        var uniqueId = 'chart-container-' + mapper.common.getRandomString(32, 36);
        
		// When docking charts in or out of a map window, we need to pass state between them.
        var selectedBoundaryId = (owningBlock.selectedBoundaryId) ? owningBlock.selectedBoundaryId : null;
        var selectedDataType = (owningBlock.selectedDataType) ? owningBlock.selectedDataType : owningBlock.chartAttributes[0].chart_types[0].data_type;
        var selectedGraphType = (owningBlock.selectedGraphType) ? owningBlock.selectedGraphType : owningBlock.chartAttributes[0].chart_types[0].graph_types[0];
        var selectedPeriods = (owningBlock.selectedPeriods) ? owningBlock.selectedPeriods : ['stm', 2016, 2015];
        var periodFormat = (owningBlock.periodFormat) ? owningBlock.periodFormat : 'years';
        var addLegend;
        if (owningBlock.hasOwnProperty('addLegend')) addLegend = owningBlock.addLegend;
        
        var extendedTool = {
            owningBlock: owningBlock,
			
			truncateStartPeriod: null,
			truncating: false,
			canTruncate: function() {
				var dataType = this.selectedDataType;
				return this.owningBlock.itemDefinition.chartOptions[dataType].canTruncate;
			},
			startTruncating: function() {
				var chart = this.getChartObj().chart;
				if (this.canTruncate() === false || this.truncating === true) return;
				this.truncating = true;
				var extendedTool = this;
				this.truncateCallback = function(e) {
					var period = 1;
					if (!isNaN(chart.lastCursorPosition)) {
						var index = chart.lastCursorPosition;
						period = parseInt(chart.dataProvider[index].period) - 1;
						//extendedTool.truncateStartPeriod = parseInt(chart.dataProvider[index].period) - 1;
					} else {
						//extendedTool.truncateStartPeriod = null;
					}
					
					if (period > 1) {
						extendedTool.truncateStartPeriod = period;
					} else {
						extendedTool.truncateStartPeriod = null;
					}
					
					extendedTool.owningBlock.fire('startpointset', extendedTool);
					extendedTool.refreshChart();
				}
				
				// AmCharts does not have an event for clicking the chart so register to the dom element.
				chart.chartDiv.addEventListener('click', this.truncateCallback);
				this.owningBlock.fire('truncatingstart', this);
			},
			stopTruncating: function() {
				if (this.truncating === false) return;
				var chart = this.getChartObj().chart;
				chart.chartDiv.removeEventListener('click', this.truncateCallback);
				this.truncating = false;
				this.owningBlock.fire('truncatingend', this);
			},
			resetStartPoint: function() {
				this.truncateStartPeriod = null;
				this.refreshChart();
			},
			
			getChartObj: function() {
				var attributes = this.getAttributes();
				return this.chartHandler.getChartById(attributes.id);
			},
            uniqueId: uniqueId,
			
			// Prevent the first request for timeseries from beings sent multiple times.
			isInitialRequest: false,
			// Store the last request made so we can cancel them if new requests
			// are made but the previous ones have not returned yet.
			// A chart can get data from multiple sources so lastRequests is an array.
            lastRequests: [], 
            chartAttributes: owningBlock.chartAttributes,
			// Value in the cPeriodTypeCombo tool.
            selectedDataType: selectedDataType,
			// Value in the cChartTypeCombo tool.
            selectedGraphType: selectedGraphType,
			// Value in the cYearsCombo tool.
            selectedPeriods: selectedPeriods,
			// Either periods for interannual charts or years for all other charts.
            periodFormat: periodFormat,
			// Value in the cZonesCombo tool.
            selectedBoundaryId: selectedBoundaryId,
            chartHandler: null,
            dataHandler: null,
            destroy: function() {
                this.owningBlock.destroy();
            },
            setSelectedBoundaryId: function(boundaryId) {
                this.selectedBoundaryId = boundaryId;
                this.owningBlock.fire('boundaryidchanged', this);
                this.getData();
            },
            setSelectedPeriods: function(periods) {
                this.selectedPeriods = periods;
                this.owningBlock.fire('periodschanged', this);
                if (this.owningBlock.rendered === true && this.dataHandler !== null) this.refreshChart();
            },
            syncSelectedPeriods: function(periodList) {
                this.owningBlock.fire('periodsync', this, periodList);
            },
            setSelectedGraphType: function(graphType) {
                this.selectedGraphType = graphType;
                var attributes = this.getAttributes();
                if (this.chartHandler !== null) {
                    var chart = this.chartHandler.getChartById(attributes.id);
                    if (chart !== null) chart.setChartType(chart.getNewChartType(this.getSelectedGraphType()));
                }
                this.owningBlock.fire('graphtypechanged', this);
                this.refreshChart();
            },
            setSelectedDataType: function(dataType) {
                this.selectedDataType = dataType;
                var chartConfig = this.getChartOptions();
                var html = '<div id="' + this.component.id + '-chart"></div>';
                this.component.update(html);
                this.chartHandler = new mapper.amcharts.ChartHandler(chartConfig);
                this.refreshChart();
                this.owningBlock.fire('datatypechanged', this);
            },
            setSelectedPeriodFormat: function(periodFormat) {
                this.periodFormat = periodFormat;
                this.owningBlock.fire('periodformatchanged', this);
            },
            getPeriodFormat: function(dataType) {
                if (typeof(dataType) === 'undefined') dataType = this.selectedDataType;
                return this.owningBlock.itemDefinition.chartOptions[dataType].periodFormat;
            },
            getDataTypeName: function(dataType) {
                if (typeof(dataType) === 'undefined') dataType = this.selectedDataType;
                return this.owningBlock.itemDefinition.chartOptions[dataType].getName(this.getAttributes());
            },
			// Get the configured graph types for the selected data type in the charts.json.
            getGraphTypes: function() {
                var attributes = this.getAttributes();
                var chartTypes = attributes.chart_types;
                var selectedDataType = this.selectedDataType;
                
                for (var i = 0, len = chartTypes.length; i < len; i+=1) {
                    if (chartTypes[i].data_type === selectedDataType) {
                        return chartTypes[i].graph_types;
                    }
                }
                
                return null;
            },
			// Get the chart types in the charts.json.
            getChartTypes: function() {
                var chartAttributes = this.chartAttributes;
                var boundaryId = this.selectedBoundaryId;
                
                for (var i = 0, len = chartAttributes.length; i < len; i+=1) {
                    var attributes = chartAttributes[i];
                    if (attributes.boundaryId === boundaryId) {
                        return attributes.chart_types;
                    }
                }
            },
			// Gets the attributes for the selected boundary.
            getAttributes: function() {
                var boundaryId = this.selectedBoundaryId;
                
                for (var i = 0, len = this.chartAttributes.length; i < len; i+=1) {
                    var attributes = this.chartAttributes[i];
                    if (boundaryId === null || attributes.boundaryId === boundaryId) {
                        return attributes;
                    }
                }
                return null;
            },
            getAllAttributes: function() {
                return this.chartAttributes;
            },
			// Get the AmCharts configurations for a legend.
            getLegendOptions: function(legendPosition) {
                return {
                    "rollOverGraphAlpha" : .2,
                    "switchable" : false,
                    "labelText" : "[[title]]",
                    "position" : legendPosition,
                    "fontSize" : 9,
                    "autoMargins" : false,
                    "marginLeft" : 5,
                    "marginRight" : 0,
                    "spacing" : 5,
                    "valueText": "",
                    "valueWidth": 0
                };
            },
			// Get the actual name of the chart type object in mapper.
            getSelectedGraphType: function() {
                var attributes = this.getAttributes();
                var graphType = this.selectedGraphType;
                var selectedDataType = this.selectedDataType;
                return this.owningBlock.itemDefinition.chartOptions[selectedDataType].chartTypes[graphType];
            },
            getChartOptions: function () {
                var selectedDataType = this.selectedDataType;
                var attributes = this.getAttributes();
                var chartOptions = [];
                var defaultOptions = this.owningBlock.itemDefinition.getDefaultChartOptions(selectedDataType, attributes);
                
                var scrollbarBackgroundColor = this.owningBlock.blockConfigs.scrollbarBackgroundColor;
                var scrollbarSelectedBackgroundColor = this.owningBlock.blockConfigs.scrollbarSelectedBackgroundColor;
                if (typeof(scrollbarBackgroundColor) !== 'undefined') {
                    defaultOptions.options.chartScrollbar.backgroundColor = scrollbarBackgroundColor;
                }
                if (typeof(scrollbarSelectedBackgroundColor) !== 'undefined') {
                    defaultOptions.options.chartScrollbar.selectedBackgroundColor = scrollbarSelectedBackgroundColor;
                }

                defaultOptions.custom.chartType = this.getSelectedGraphType();
                
                defaultOptions.options.legend = this.getLegendOptions('bottom');

                if (attributes.period === '7-day') {
                    defaultOptions.custom.exporters.CSV = "sevenDayExport";
                } else if (attributes.period === '1-day') {
                    defaultOptions.custom.exporters.CSV = "oneDayExport";
                }
                
                if (attributes.layerName && attributes.layerName !== "null") {
                    defaultOptions.options.titles = [{
                        text: attributes.layerName,
                        size: 12
                    }]
                }

                chartOptions.push({
                    id : attributes.id,
                    name : this.uniqueId + '-chart',
                    options : defaultOptions.options,
                    custom : defaultOptions.custom,
                    events : defaultOptions.events,
                });

				// Gradient charts are no longer used.
                if (mapper.amcharts.configZ.gradient) {
                    var gradientOptions = {
                        "options" : {
                            "type" : "serial",
                            "theme" : "light",
                            "categoryField" : "date",
                            "sequencedAnimation" : false,
                            "categoryAxis" : {
                                "markPeriodChange" : false,
                                "gridPosition" : "start",
                                "labelsEnabled" : false,
                                "gridAlpha" : false,
                                "fontSize" : 9,
                                "startOnAxis" : true,
                                "autoGridCount" : true,
                            },
                            "legend" : {
                                "enabled" : true,
                            },
                            "export" : {
                                "enabled" : true,
                                "menu" : []//disable menu
                            },
                            "trendLines" : [],
                            "guides" : [],
                            "valueAxes" : [{
                                    "fontSize" : 8,
                                    "id" : "ValueAxis-2",
                                    "position" : "left",
                                    "axisAlpha" : 0,
                                    "gridAlpha" : 0,
                                    "labelsEnabled" : false,
                                    "stackType" : "regular",
                                }
                            ],
                            "allLabels" : [],
                            "balloon" : {},
                        },
                        "events" : {},
                        "custom" : {
                            "chartBuilder" : "GradientChartBuilder",
                            "chartType" : "GradientGraph",
                        },
                    };

                    chartOptions.push({
                        id : attributes.chartId + '-gradient',
                        name : this.component.id + '-yaxis-legend',
                        options : gradientOptions.options,
                        custom : gradientOptions.custom,
                        events : gradientOptions.events,
                    });
                }

                return chartOptions;
            },
            resizeChart: function(width, height) {
                if (this.chartHandler) this.chartHandler.setChartSize(width, height);
            },
			truncatePrelimData(data, prelimData) {
				var newData = {};
				var latestSeason = 0, latestPeriod = 0;
				for (var season in data) {
					if (!isNaN(parseInt(season)) && parseInt(season) > latestSeason) {
						latestSeason = parseInt(season);
					}
				}
				if (latestSeason !== 0 && prelimData.hasOwnProperty(latestSeason.toString())) {
					for (var i = 0, len = data[latestSeason].length; i < len; i+=1) {
						var x = parseInt(data[latestSeason][i].x);
						if (x > latestPeriod) {
							latestPeriod = x;
						}
					}
					
					if (latestPeriod !== 0) {
						for (var season in prelimData) {
							if (season === latestSeason.toString()) {
								newData[season] = [];
								for (var i = 0, len = prelimData[season].length; i < len; i+=1) {
									var x = parseInt(prelimData[season][i].x);
									if (x > latestPeriod) {
										newData[season].push(prelimData[season][i]);
									}
								}
							} else if (parseInt(season) > latestSeason) {
								newData[season] = prelimData[season];
							}
						}
					} else {
						newData = prelimData;
					}
				} else {
					newData = prelimData;
				}
				return newData;
			},
			getSeasons() {
				var attributes = this.getAttributes();
				var seasons = JSON.parse(JSON.stringify(attributes.seasons));
				if (attributes.staticSeasonNames) {
					seasons = seasons.concat(attributes.staticSeasonNames);
				}
                seasons.reverse();
				return seasons;
			},
			// Send the requests for timeseries data and build the chart after it's complete.
            getData: function() {
                for (var i = 0, len = this.lastRequests.length; i < len; i+=1) {
                    var request = this.lastRequests[i];
                    if (request.returned !== true) {
                        request.canceled = true;
                    }
                }
                this.dataHandler = null;
                this.lastRequests = [];
                this.data = {}; // Stores data from each request by overlay id.
                
                var attributes = this.getAttributes();
                var dataRoot;
                for (var i = 0, len = attributes.chart_types.length; i < len; i+=1) {
                    var chartType = attributes.chart_types[i];
                    if (chartType.data_type === selectedDataType) {
                        dataRoot = chartType.data_root;
                    }
                }
                
                var dataSources = attributes.dataSources;
                var totalSources = dataSources.length;
                var totalCompleted = 0;
                
                for (var i = 0, len = dataSources.length; i < len; i+=1) {
                    var dataSource = dataSources[i];
                    var request = mapper.common.asyncAjax({
                        type: 'GET',
                        jsonp: (dataSource.callbackType === 'jsonp') ? true : false,
                        url : dataSource.url,
                        callbackObj : {
                            extendedTool: this,
                            overlayId: dataSource.overlayId
                        },
                        callback : function (request, callbackObj) {
							// If the chart was closed or the user clicked the map again before 
							// this request is complete, prevent the callback from doing anything.
                            if (request.canceled === true) return;
                            var extendedTool = callbackObj.extendedTool;
                            var overlayId = callbackObj.overlayId;
                            var data = JSON.parse(request.responseText);
							
							// Check for no data responses from the servlet.
                            if (data.hasOwnProperty('message')) {
								extendedTool.data[overlayId] = {};
							} else if (typeof(dataRoot) === 'string') {
                                extendedTool.data[overlayId] = mapper.common.convertPathToObjReference(data, dataRoot);
                            } else {
                                extendedTool.data[overlayId] = mapper.common.convertPathToObjReference(data, dataRoot[overlayId]);
                            }
                            
							// Only execute the following code once all requests are complete.
							// Right now, only prelim charts should have multiple data sources.
                            totalCompleted += 1;
                            if (totalCompleted !== totalSources) return;
                            
                            if (attributes.overlay.type === 'single') {
                                extendedTool.dataHandler = new mapper.amcharts.DataHandler(extendedTool.data[overlayId], {period: attributes.period});
                            } else if (attributes.overlay.type === 'consecutive') {
								// For prelim charts, we have multiple data sources so we need multiple data handlers for it.
                                var overlayIds = attributes.overlay.timeseries_source_layer_ids;
								var data = extendedTool.data[overlayIds[0]];
								var prelimData = extendedTool.truncatePrelimData(data, extendedTool.data[overlayIds[1]]);
                                extendedTool.dataHandler = [
									new mapper.amcharts.DataHandler(data, {
										period: attributes.period
									}),
									new mapper.amcharts.DataHandler(prelimData, {
										period: attributes.period
									})
								];
                            }
                            
                            if (extendedTool.owningBlock.rendered === true) {
                                extendedTool.chartHandler = null;
                                extendedTool.refreshChart();
                            }
                        }
                    });
                    
                    request.returned = false;
                    this.lastRequests.push(request);
                }
            },
			// Rebuilds 
            refreshChart: function() {
                this.maskComponent();
				
                if (this.chartHandler === null) {
                    this.component.update('<div id="' + this.uniqueId + '-chart"></div>');
                    var chartConfig = this.getChartOptions();
                    this.chartHandler = new mapper.amcharts.ChartHandler(chartConfig);
                }
                
                var attributes = this.getAttributes();
                var chartFixedValues;
                for (var i = 0, len = attributes.chart_types.length; i < len; i+=1) {
                    var chartType = attributes.chart_types[i];
                    if (chartType.data_type === this.selectedDataType) {
                        chartFixedValues = (chartType.hasOwnProperty('y_axis_range')) ? chartType.y_axis_range : 'auto';
                    }
                }
                
                var seasons = this.getSeasons();
                var chartColors = mapper.amcharts.getChartColors({
                    fullSeasons : seasons,
                });
                
                var options = {
                    id : this.component.id + '-chart',
                    name : this.component.id + '-chart',
					truncateStartPeriod: this.truncateStartPeriod,
                    period : attributes.period,
                    years : this.selectedPeriods,
                    startMonth : attributes.startMonth,
                    colors : chartColors,
                    dataType : this.selectedDataType,
                    cumulative : this.owningBlock.itemDefinition.chartOptions[this.selectedDataType].cumulative,
                    /**
                     * yAxisRange: string|object 
                     *
                     * Possible values:
                     *   string 'auto' Automatically adjusts y axis to fit the data.
                     *   object {min:[value], max:[value]} set the min and/or max value of the y axis.
                     */
                    yAxisRange : chartFixedValues
                };
                
				// I originally used Extjs' task manager to set an interval to check for the existence 
				// of the chart div but for some reason, any error that happens in here or in 
				// any function called from here is suppressed.
                /*Ext.TaskManager.start({
                    scope : this,
                    interval : 100,
                    run : function () {
                        var container = Ext.fly(this.component.id + '-chart');
                        if (container) {
                            this.chartHandler.buildCharts(this.dataHandler, options);
                            if (this.addLegend === false) {
                                var attributes = this.getAttributes();
                                var chart = this.chartHandler.getChartById(attributes.id);
                                chart.chart.removeLegend();
                            }
                            
                            var bodyEl = document.getElementById(this.component.id + '-body');
                            this.resizeChart(parseInt(bodyEl.style.width), parseInt(bodyEl.style.height));
                            
                            setTimeout(function (extendedTool) {
                                extendedTool.unMaskComponent();
                            }, 200, this);
                            return false;
                        } else {
                            return true;
                        }
                    }
                });*/
				
				// We can't guarantee that the chart div will actually be rendered to the page before this code executes.
				// The Extjs component's afterrender event does not work for custom html added inside a component.
				var test = function () {
					var container = Ext.fly(extendedTool.component.id + '-chart');
					if (container) {
						extendedTool.chartHandler.buildCharts(extendedTool.dataHandler, options);
						if (extendedTool.addLegend === false) {
							var attributes = extendedTool.getAttributes();
							var chart = extendedTool.chartHandler.getChartById(attributes.id);
							chart.chart.removeLegend();
						}
						
						var bodyEl = document.getElementById(extendedTool.component.id + '-body');
						extendedTool.resizeChart(parseInt(bodyEl.style.width), parseInt(bodyEl.style.height));
						
						setTimeout(function () {
							extendedTool.unMaskComponent();
						}, 200);
						return false;
					} else {
						return true;
					}
				};
				
				setTimeout(function () 
				{
					test();
				}, 500);
            },
            mask: null,
            isMasked: false,
            maskComponent: function() {
                if (this.isMasked === true) return;
                if (this.mask === null) {
                    this.mask = new Ext.LoadMask(this.component, {
                        msg : "Loading Chart ..."
                    });
                }
                this.mask.show();
                this.isMasked = true;
            },
            unMaskComponent: function() {
                if (this.isMasked === false) return;
                this.isMasked = false;
                this.mask.hide();
            }
        };
        
        var graphToolBlock = owningBlock.getReferencedBlock('cGraphTool');
		// The graph tool sends the feature info request on map click.
        graphToolBlock.on('featureinfoupdated', function(callbackObj, postingObj) {
            var extendedTool = callbackObj;
            var mapperWindow = postingObj;
            extendedTool.attributesUpdated = true;
            
            var chartAttributes = extendedTool.chartAttributes;
            var layersConfig = mapper.layers.getLayersConfigById(mapperWindow.layersConfigId);
            var layers = {};
            
			// Most of the chart attributes can be pulled from the configs but 
			// a fews parts need to be added later from the feature info.
            for (var i = 0, len = chartAttributes.length; i < len; i+=1) {
                var attributes = chartAttributes[i];
                var overlay, boundary;
                if (layers.hasOwnProperty(attributes.overlayId)) {
                    overlay = layers[attributes.overlayId];
                } else {
                    overlay = mapper.layers.query(
                        layersConfig.overlays,
                        {id: attributes.overlayId}
                    )[0];
                    layers[attributes.overlayId] = overlay;
                }
                
                if (layers.hasOwnProperty(attributes.boundaryId)) {
                    boundary = layers[attributes.boundaryId];
                } else {
                    boundary = mapper.layers.query(
                        layersConfig.boundaries,
                        {id: attributes.boundaryId}
                    )[0];
                    layers[attributes.boundaryId] = boundary;
                }
                
                var newAttributes = mapper.amcharts.getChartAttributes(attributes, overlay, boundary);
                for (var prop in newAttributes) {
                    extendedTool.chartAttributes[i][prop] = newAttributes[prop];
                }
            }
			
			// If the chart handler exists, we know the chart is built and can set the title.
			// If not, the title will be set once the chart is built.
			if (extendedTool.chartHandler) {
				var attributes = extendedTool.getAttributes();
				if (attributes.layerName) {
					extendedTool.chartHandler.setTitle(attributes.id, attributes.layerName);
				}
			}
            
            extendedTool.owningBlock.fire('attributesupdated', extendedTool);
            extendedTool.getData();
        },
        extendedTool, extendedTool.owningBlock.id);
        
        if (typeof(addLegend) !== 'undefined') {
            extendedTool.addLegend = addLegend;
        }
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var attributes = extendedTool.getAttributes();
		var chartTitle = attributes.chartTitle ? attributes.chartTitle : attributes.yAxisLabel;
        
        var chartContainer = {
            extendedTool : extendedTool,
            id : extendedTool.uniqueId,
            ghost : false,
            height : block.height,
            width : block.width,
            title : chartTitle,
            closable : (typeof(block.closable) !== 'undefined') ? block.closable : true,
            collapsible : (typeof(block.collapsible) !== 'undefined') ? block.collapsible : false,
            collapsed : (typeof(block.collapsed) !== 'undefined') ? block.collapsed : false,
			// Add the div the chart will render to.
            html : '<div id="' + extendedTool.uniqueId + '-chart"></div>',
            bodyCls: 'chart-container-body',
            listeners: {
                afterrender: function(chartContainer) {
                    this.extendedTool.component = chartContainer;
                    this.extendedTool.owningBlock.component = chartContainer;
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.maskComponent();
					
					var attributes = this.extendedTool.getAttributes();
					// If data handler exists, then the timeseries data is already available.
                    if (this.extendedTool.dataHandler !== null) {
                        this.extendedTool.refreshChart();
                    } else if (attributes.startMonth !== null) {
						// Start month can be set in the charts.json or returned from the feature info request.
						this.extendedTool.isInitialRequest = true;
						this.extendedTool.getData();
					}
                    
                    this.extendedTool.owningBlock.fire('rendercomponent', this.extendedTool);
                },
                resize: function(chartWindow, width, height) {
                    var bodyEl = document.getElementById(this.id+'-body');
                    this.extendedTool.resizeChart(parseInt(bodyEl.style.width), parseInt(bodyEl.style.height));
                },
                close: function() {
					// When the chart is closed, remove the target on the map showing clicked location and clear feature info.
                    var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                    var layersConfigId = mapWindowBlock.extendedTool.layersConfigId;
                    var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);
                    var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    var layer;
                    if (layer = mapper.OpenLayers.getCrosshairLayer(map)) {
                        map.removeLayer(layer);
                    }
                    
                    mapper.layers.clearFeatureInfo(layersConfig);
                    this.extendedTool.owningBlock.remove();
                },
                activate: function() {
                    this.extendedTool.resizeChart();
                    this.extendedTool.owningBlock.fire('activate', this.extendedTool);
                }
            }
        };
        
		// Customize the toolbar to broadcast an overflowmenushow event 
		// so tools can handle Extjs' bugs when moving them to the menu.
        var toolbarConfigs = {
            enableOverflow: true,
            chartContainer: extendedTool,
            overflowGraphComboUpdated: false,
            listeners: {
                overflowchange: function() {
                    if (this.overflowGraphComboUpdated === false) {
                        this.overflowGraphComboUpdated = true;
                        var menu = this.layout.overflowHandler.menu;
                        menu.wrapper = this;
                        menu.on('show', function() {
                            this.wrapper.chartContainer.owningBlock.fire('overflowmenushow');
                        });
                    }
                },
                afterrender: function() {
                    this.chartContainer.componentToolbar = this;
                }
            }
        };
        chartContainer = skin.blocks.addToolBarItems(block, chartContainer, toolbar, toolbarConfigs);
        chartContainer = skin.ExtJSPosition(chartContainer, block);
        
        return chartContainer;
    }
};

export var toolName = "cChartContainer";
export var tool = cChartContainer;