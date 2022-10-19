/*
 * connects to a service end point(s)
 * rebuilds the configurations
 * sends a config back to the caller
 * custom periodicities and tools can be defined here
 */

custom = {
	remoteResource : {
        // Used for bypassing cross origin restrictions when fetching a GetCapabilities xml document. 
        // You can use the default proxy provided or point this url to your own proxy.
        // Can use the mapper.common.buildUrlParams function to build these urls.
        WMSProxyURL: 'proxies/wmsProxy.php?url={{url}}?SERVICE={{service}}&REQUEST={{request}}',
        WCSProxyURL: 'proxies/wcsProxy.php?layerNameToUse={{wcsLayerName}}&lowerLeftXToUse={{wcsLowerLeftX}}&lowerLeftYToUse={{wcsLowerLeftY}}&upperRightXToUse={{wcsUpperRightX}}&upperRightYToUse={{wcsUpperRightY}}&wcsURLToUse={{wcsUrl}}&resolution={{resolution}}&srsToUse={{wcsInputSrs}}&outputSrsToUse={{wcsOutputSrs}}',
        WCSProxyURL2: 'proxies/wcsProxy2.php?layerNameToUse={{wcsLayerName}}&lowerLeftXToUse={{wcsLowerLeftX}}&lowerLeftYToUse={{wcsLowerLeftY}}&upperRightXToUse={{wcsUpperRightX}}&upperRightYToUse={{wcsUpperRightY}}&wcsURLToUse={{wcsUrl}}&resolution={{resolution}}&pixelHeight={{wcsRasterPixelHeight}}&pixelWidth={{wcsRasterPixelWidth}}&srsToUse={{wcsInputSrs}}&outputSrsToUse={{wcsOutputSrs}}',
        WCSProxyURL3: 'proxies/wcsProxy3.php?layerNameToUse={{wcsLayerName}}&lowerLeftXToUse={{wcsLowerLeftX}}&lowerLeftYToUse={{wcsLowerLeftY}}&upperRightXToUse={{wcsUpperRightX}}&upperRightYToUse={{wcsUpperRightY}}&wcsURLToUse={{wcsUrl}}&resolution={{resolution}}&pixelHeight={{wcsRasterPixelHeight}}&pixelWidth={{wcsRasterPixelWidth}}&nativeSrs={{wcsInputSrs2}}&srsToUse={{wcsInputSrs}}&outputSrsToUse={{wcsOutputSrs}}',
        WCSProxyURLPhenology: 'proxies/wcsProxyPhenology.php?layerNameToUse={{wcsLayerName}}&lowerLeftXToUse={{wcsLowerLeftX}}&lowerLeftYToUse={{wcsLowerLeftY}}&upperRightXToUse={{wcsUpperRightX}}&upperRightYToUse={{wcsUpperRightY}}&wcsURLToUse={{wcsUrl}}&outputSrsToUse={{wcsOutputSrs}}',

        timeseries : [],
		updateLayersConfig : function () {
			var layerNodes = mapper.layers.layersConfig;
			for (var lNode in layerNodes) {
				mapper.layers.layersConfig[lNode] = this.updateLayerAttributes(layerNodes[lNode]); // update config here
			}
		},
        
		updateLayerAttributes : function (layers) {
			for (var o in layers) {
				var layer = layers[o];
				if (layer.type == "folder") {
					layer = this.updateLayerAttributes(layer.folder);
				} else if (layer.type == "layer") {
                    if (!mapper.layers.remoteResource) delete layer.timeseries;
                    if (layer.timeseries != undefined) {
                        var remoteResource = mapper.layers.remoteResource[layer.id];
                        var start = layer.timeseries.start,
                        end = layer.timeseries.end;
                        //mapper.log(start);
                        
                        start.period = mapper.common.convertPathToObjReference(remoteResource, start.period);
                    
                        start.year = mapper.common.convertPathToObjReference(remoteResource, start.year);
                        
                        if (start.month == undefined || start.month == "") {
                            start.month = '';
                        } else {
                            start.month = mapper.common.convertPathToObjReference(remoteResource, start.month);
                        }

                        end.period = mapper.common.convertPathToObjReference(remoteResource, end.period);

                        end.year = mapper.common.convertPathToObjReference(remoteResource, end.year);

                        if (end.month == undefined || end.month == "") {
                            end.month = '';
                        } else {
                            end.month = mapper.common.convertPathToObjReference(remoteResource, end.month);
                        }
                    }
                }
            }

			return layers;
		},
        
		/**
		 * Gets chart attibutes from feature info.
		 */
        getChartAttributes : function(chartItem, overlay, boundary, coords) {
            var chartYAxisLabel = overlay.additionalattributes.chart_yaxis_label;
            var startMonth = (chartItem.startMonth !== null) ? chartItem.startMonth : boundary.featureInfo.SEAS_START.value;
            var allSeasons = [];
            var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
            for (var i = 0, len = chartItem.timeseriesSourceLayerIds.length; i < len; i+=1) {
                var id = chartItem.timeseriesSourceLayerIds[i];
                var layers = mapper.layers.query(
                    layersConfig.overlays,
                    {id: id}
                );
                if (layers.length > 0) {
                    var layer = layers[0];
					// Get the actual season names as they will be shown in the chart.
                    var seasons = custom.common.getSeasonsList(layer, startMonth);
                    for (var j = 0, length = seasons.length; j < length; j+=1) {
                        var season = seasons[j];
                        if (allSeasons.indexOf(season) === -1) {
                            allSeasons.push(season);
                        }
                    }
                }
            }
            
            var attributeObj = {
                seasons: allSeasons,
                startMonth: startMonth
            };
            
			// Even though the variable is called layerName, what it actually stores is the polygon name.
            if (boundary.featureInfo.FEWS_ID) {	
                if (boundary.featureInfo.FEWS_ID.value) {
                    attributeObj.layerName = decodeURIComponent(boundary.featureInfo.FEWS_ID.value);
                } else {
                    mapper.log('FEWS_ID value missing');
                }
            } else if (boundary.featureInfo.Zone_ID) {
                if (boundary.featureInfo.Zone_ID.value) {
                    attributeObj.layerName = overlay.title;
                } else {
                    mapper.log('Zone_ID value missing');
                }
            } else if (boundary.featureInfo.fews_id) {
				if (boundary.featureInfo.fews_id.value) {
					attributeObj.layerName = decodeURIComponent(boundary.featureInfo.fews_id.value);
				} else {
                    mapper.log('fews_id value missing');
                }
			} else if (boundary.featureInfo.FEWS_CODE) {
                if (boundary.featureInfo.FEWS_CODE.value) {
                    //attributeObj.layerName = overlay.title;
                    attributeObj.layerName = decodeURIComponent(boundary.featureInfo.FEWS_CODE.value);
                } else {
                    mapper.log('FEWS_CODE value missing');
                }
            } else {
                mapper.log('FEWS_ID/Zone_ID/FEWS_CODE missing');
            }
            
            return attributeObj;
        },
        
        /**
         *  Location of all getter functions for url parameters used when calling mapper.common.buildUrlParams
         *
         *  The mapper.common.buildUrlParams function will take each variable parameter and replace it with 
         *  the return of the appropriate function below. For example, the parameter {{fewsId}} will convert the parameter 
         *  to a function name of 'getFewsId', call the function by name, and replace {{fewsId}} with the return value.
         */
        urlParamGetters: {
            getWcsLayerName: function(obj) {
                return obj.layer.name;
            },
            getWcsExtentLowerLeftX: function(obj) {
                return obj.layer.layerExtent[0];
            },
            getWcsExtentLowerLeftY: function(obj) {
                return obj.layer.layerExtent[1];
            },
            getWcsExtentUpperRightX: function(obj) {
                return obj.layer.layerExtent[2];
            },
            getWcsExtentUpperRightY: function(obj) {
                return obj.layer.layerExtent[3];
            },
            getWcsRasterPixelHeight: function(obj) {
                return obj.layer.pixelHeight;
            },
            getWcsRasterPixelWidth: function(obj) {
                return obj.layer.pixelWidth;
            },
            getWcsLowerLeftX: function(obj) {
                return (obj.currentExtent[0] < obj.region.bbox[0]) ? obj.region.bbox[0] : obj.currentExtent[0];
            },
            getWcsLowerLeftY: function(obj) {
                return (obj.currentExtent[1] < obj.region.bbox[1]) ? obj.region.bbox[1] : obj.currentExtent[1];
            },
            getWcsUpperRightX: function(obj) {
                return (obj.currentExtent[2] > obj.region.bbox[2]) ? obj.region.bbox[2] : obj.currentExtent[2];
            },
            getWcsUpperRightY: function(obj) {
                return (obj.currentExtent[3] > obj.region.bbox[3]) ? obj.region.bbox[3] : obj.currentExtent[3];
            },
            getWcsUrl: function(obj) {
                var url = obj.layer.source.wcs;
                if (obj.layer.hasOwnProperty('cqlFilter')) {
                    var cqlFilter = [];
                    for (var prop in obj.layer.cqlFilter) {
                        cqlFilter.push(obj.layer.cqlFilter[prop]);
                    }
                    url += '?FILTER=' + cqlFilter.join(' AND ');
                }
                return encodeURIComponent(url);
            },
            getResolution: function(obj) {
                return obj.layer.resolution;
            },
            getPixelHeight: function(obj) 
            {
                return obj.layer.pixelHeight;            
            },
            getPixelWidth: function(obj) 
            {
                return obj.layer.pixelWidth;  
            },

            getWcsInputSrs2: function(obj)
            {
                return obj.layer.srs;
            },
            getWcsInputSrs: function(obj) {
                return obj.region.srs;
            },
            getWcsOutputSrs: function(obj) {

                var returnVal = obj.layer.srs;
                if (typeof(obj.layer.wcsOutputSRS) !== 'undefined')
                {
                    returnVal = obj.layer.wcsOutputSRS;
                }
                return returnVal;
            },
            getFewsId: function(obj) {
                return encodeURIComponent(obj.boundary.featureInfo.FEWS_ID.value);
            },
			getFewsCode: function(obj) {
                return encodeURIComponent(obj.boundary.featureInfo.FEWS_CODE.value);
            },
            getZoneId: function(obj) {
                return encodeURIComponent(obj.boundary.featureInfo.Zone_ID.value);
            },
            getPeriodicity: function(obj) {
                return mapper.periodsConfig[obj.overlay.timeseries.type].alias;
            },
            getStatistic: function(obj) {
                return obj.overlay.additionalattributes.statistic;
            },
            getSeasons: function(obj) {
                var seasons = custom.common.getSeasonsList(obj.overlay, 1);
                return seasons.join('%2C');
            },
            getSnowSeasons: function(obj) {
                var seasons = custom.common.getSeasonsList(obj.overlay, 1);
                return seasons.join('%2C');
            },
            getRasterDataset: function(obj) {
                return obj.overlay.additionalattributes.raster_dataset;
            },
            getVectorDataset: function(obj) {
                return obj.boundaryName;
            },
            getUrl: function(parsedUrl) {
                return parsedUrl.baseURL;
            },
            getService: function(parsedUrl) {
                return parsedUrl.service;
            },
            getRequest: function(parsedUrl) {
                return parsedUrl.request;
            },
			getLat: function(obj) {
				var layerProjection = obj.boundary.srs;
				var mapProjection = obj.projection;
				var coords = obj.coords;
				coords = proj4(mapProjection, layerProjection, coords);				

				//sometimes coords is latlon, sometimes it is lonlat, depending on projection
				//see examples
				//https://igskmncnvs191.cr.usgs.gov:8443/geoserver/wcs?service=WCS&version=2.0.1&request=describecoverage&coverageid=qdvdemodis:qdvdemodis_qdhydrounits_1-sevenday-39-2018_mm_data
				//https://igskmncnvs191.cr.usgs.gov:8443/geoserver/wcs?service=WCS&version=2.0.1&request=describecoverage&coverageid=fewschirps:fewschirps_fewsafrica_1-pentad-48-2018_mm_data
				//look at GridFunction axisOrder
				//its flipped for 3857 and 4326 layers
				
				var which_coord = -1;
				
				if(layerProjection=="EPSG:3857")
				{
					which_coord = coords[0];
				}
				if(layerProjection=="EPSG:4326")
				{
					which_coord = coords[1];
				}
				if(which_coord == -1)
				{
					console.error("projection order not defined customize.js 286");
				}
				
				return which_coord;
			},
			getLon: function(obj) {
				var layerProjection = obj.boundary.srs;
				var mapProjection = obj.projection;
				var coords = obj.coords;
				coords = proj4(mapProjection, layerProjection, coords);				

				//sometimes coords is latlon, sometimes it is lonlat, depending on projection
				//see examples
				//https://igskmncnvs191.cr.usgs.gov:8443/geoserver/wcs?service=WCS&version=2.0.1&request=describecoverage&coverageid=qdvdemodis:qdvdemodis_qdhydrounits_1-sevenday-39-2018_mm_data
				//https://igskmncnvs191.cr.usgs.gov:8443/geoserver/wcs?service=WCS&version=2.0.1&request=describecoverage&coverageid=fewschirps:fewschirps_fewsafrica_1-pentad-48-2018_mm_data
				//look at GridFunction axisOrder
				//its flipped for 3857 and 4326 layers
				
				var which_coord = -1;
				
				if(layerProjection=="EPSG:3857")
				{
					which_coord = coords[1];
				}
				if(layerProjection=="EPSG:4326")
				{
					which_coord = coords[0];
				}
				if(which_coord == -1)
				{
					console.error("projection order not defined customize.js 286");
				}
				
				return which_coord;
			}
        },
        
		getChartItem : function (chartId) {
			for (mc in mapper.charts) {
				if (mapper.charts[mc].id == chartId) {
					return mapper.charts[mc];
				}
			}
		}
	},
	common : {
        getSeasonsList: function(layer, seasonStart) {
            var seasons = [];
            
            
            //not all timeseries segments have a month, like dekad
            //so we use periodicity wrapper to get the already converted month version of that periodicity
            //basically it makes available the timeVariables versions of that periodicity which are defined in
            //configs atm
            var aPeriodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(layer.id);
            var monthPeriod = aPeriodicityWrapper.periodicity.getChildPeriodByName("month");
            
            if (seasonStart > 1) 
            {
                for (var year = layer.timeseries.start.year; year <= layer.timeseries.end.year; year++) 
                {
                    if (year === layer.timeseries.start.year && monthPeriod.start >= seasonStart) continue;
                    if (year === layer.timeseries.end.year && monthPeriod.end < seasonStart) continue;
                    tempYear = year + 1;
                    finalYear = year + "-" + tempYear;
                    seasons.push(finalYear);
                }
            } 
            else 
            {
                for (var year = layer.timeseries.start.year; year <= layer.timeseries.end.year; year++) {
                    seasons.push(year);
                }
            }

            var otherYears = [];
            otherYears = layer.timeseries.others || [];
            if (otherYears.length > 0) {
                var oy = 0;
                while (oy < otherYears.length) {
                    seasons.push(otherYears[oy]);
                    oy = oy + 1;
                }
            }
            
            return seasons;
        },
	},
	periodicity : {
        
        getPeriodConfig: function(configs) {
            var type = configs.type;
            switch (type) {
                /*case '1-pentad':
                    return {};*/
                default:
                    //return {};
            }
        },
        
        periodsPerParent: {
            
        },
        outputFormatters: {
            /*pentadToDay: function() {
                switch(this.period.selectedPeriod) {
                    case 1:
                        return 1;
                    case 2:
                        return 5;
                    case 3:
                        return 10;
                    case 4:
                        return 15;
                    case 5: 
                        return 20;
                    case 6:
                        return 25;
                }
            }*/
        },
		getPeriodsPerYear: function(period, year) {
			switch (period) {
			case '1-day':
				return this.oneDay.getDaysInYear(year);
			case '7-day':
				return this.calculateItemsPerYear(period);
			case '14-day':
				return this.calculateItemsPerYear(period);
			case '1-dekad':
				return 36;
			case '1-pentad':
				return 72;
			case '1-month':
				return 12;
			case '2-month':
				return 12;
			case '3-month':
				return 12;
			}
		},
		getChartDayOfPeriod : function (period, periodValue, monthValue, yearValue) {
			var day;

			if ("1-day" == period.toLowerCase()) {
				day = this.oneDay.getDayOfMonth(periodValue, monthValue, yearValue);
			} else if ("1-pentad" == period.toLowerCase()) {
				day = this.pentad.getDayOfPentad(periodValue, monthValue, yearValue);
			} else if ("1-dekad" == period.toLowerCase()) {
				day = this.dekad.getDayOfDekad(periodValue, monthValue, yearValue);
			} else if ("7-day" == period.toLowerCase()) {
				day = this.sevenDay.getDayOfSevenDay(periodValue, monthValue, yearValue);
			} else if ("14-day" == period.toLowerCase()) {
				day = this.fourteenDay.getDayOfFourteenDay(periodValue, monthValue, yearValue);
			} else if ("1-month" == period.toLowerCase()) {
				day = 1;
			} else if ("2-month" == period.toLowerCase()) {
				day = 1;
			} else if ("3-month" == period.toLowerCase()) {
				day = 1;
			}
			day = day.toString();
			if (day.length == 1) {
				day = '0' + day;
			}

			return day;
		},
		getChartMonthOfPeriod : function (periodValue, period, year) {
			var month;

			if ("1-pentad" == period.toLowerCase()) {
				month = this.pentad.getMonthOfPentad(periodValue);
			} else if ("1-dekad" == period.toLowerCase()) {
				month = this.dekad.getMonthOfDekad(periodValue);
			} else if ("1-day" == period.toLowerCase()) {
				month = this.oneDay.getMonthOfDay(periodValue, year);
			} else if ("7-day" == period.toLowerCase()) {
				month = this.sevenDay.getMonthOfSevenDay(periodValue, monthValue, yearValue);
			} else if ("14-day" == period.toLowerCase()) {
				month = this.fourteenDay.getMonthOfFourteenDay(periodValue);
			} else if ("1-month" == period.toLowerCase()) {
				month = periodValue;
			} else if ("2-month" == period.toLowerCase()) {
				month = periodValue;
			} else if ("3-month" == period.toLowerCase()) {
				month = periodValue;
			}
			month = month.toString();
			if (month.length == 1) {
				month = '0' + month;
			}

			return month;
		},
		getPeriodsPerMonth : function (period) {
			switch (period.toLowerCase()) {
			case '1-dekad':
				return 3;
			case '1-pentad':
				return 6;
			default:
				return 1;
			}
		},
		calculateItemsPerYear : function (period) {
			var itemsPerYear = 0;

			if ("7-day" == period) {
				itemsPerYear = this.sevenDay.getNumberOfSevenDaysPerYear(mapper.layers.timeseries.selected.year);
			} else if ("14-day" == period) {
				itemsPerYear = this.fourteenDay.getNumberOfFourteenDaysPerYear();
			}

			return itemsPerYear;
		},
        getPeriodLabel : function(period, value) {
            var label = '';
            var periodConfigs = mapper.periodsConfig[period];
            
            switch (period.toLowerCase()) {
                case '1-dekad':
                    var month = custom.periodicity.dekad.getMonthOfDekad(value)
                    label = periodConfigs.months[month - 1] + '-' + custom.periodicity.dekad.getMonthlyPeriodOfDekad(value);
                    break;
                case '1-pentad':
                    var month = custom.periodicity.pentad.getMonthOfPentad(value);
                    label = periodConfigs.months[month - 1] + '-' + custom.periodicity.pentad.getMonthlyPeriodOfPentad(value);
                    break;
                case '1-month':
                    label = periodConfigs.months[value - 1];
                    break;
                case '2-month':
                    label = periodConfigs.months[value - 1];
                    break;
                case '3-month':
                    label = periodConfigs.months[value - 1];
                    break;
                case '1-day':
                    label = value.toString();
                    break;
                case '7-day':
                    label = value.toString();
                    break;
                case '14-day':
                    label = value.toString();
                    break;
                default:
                    label = value.toString();
                    break;
            }
            
            return label;
        },
        getChartCursorLabel : function(graphDataItem, period, startMonth) {
            var months = mapper.amcharts.common.getMonth(mapper.periodsConfig[period].months, startMonth);
            var multiplier = '1';
            for (var i = 0, len = mapper.amcharts.configZ.decimalDigits; i < len; i+=1) {
                multiplier += '0';
            }
            multiplier = parseInt(multiplier);
            var prefix = months[graphDataItem.category.getMonth()];
			var season = mapper.amcharts.getSeasonDisplayName(graphDataItem.graph.valueField);
            var suffix = season + " : " + (Math.round(graphDataItem.values.value * multiplier) / multiplier);
            if (period !== '1-month' && period !== '2-month' && period !== '3-month') {
                if (period === '1-dekad') {
                    var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                    if (graphDataItem.category.getDate() > 20) {
                        if (startMonth > 1) {
                            days = days.slice(startMonth-1).concat(days.slice(0, startMonth-1));
                        }
                        prefix += ' ' + days[graphDataItem.category.getMonth()] + ',';
                    } else {
                        prefix += ' ' + graphDataItem.category.getDate() + ',';
                    }
                } else if (period === '1-pentad') {
                    var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                    if (graphDataItem.category.getDate() > 25) {
                        if (startMonth > 1) {
                            days = days.slice(startMonth-1).concat(days.slice(0, startMonth-1));
                        }
                        prefix += ' ' + days[graphDataItem.category.getMonth()] + ',';
                    } else {
                        prefix += ' ' + graphDataItem.category.getDate() + ',';
                    }
                } else {
                    var date = mapper.amcharts.common.convertCrossYearDate(graphDataItem.category, startMonth);
                    prefix = mapper.periodsConfig[period].months[date.getMonth()] + ' ' +  date.getDate() + ',';
                }
            }
            return prefix + ' ' + suffix;
        },
        getPeriodOfYearFromMonth : function(period, month, year) {
            if (!isNaN(parseInt(year))) {
                year = parseInt(year);
            } else {
                // For data like mean, sum, etc. Any year that is not a leap year would work.
                year = 1971;
            }
            if (period === '1-day') {
                return this.oneDay.getDayOfYearFromMonth(month, year);
            } else if (period === '7-day') {
                return this.sevenDay.getSevenDayOfYearFromMonth(month, year);
            } else if (period === '1-dekad') {
                return (month-1) * 3;
            } else if (period === '1-pentad') {
                return (month-1) * 6;
            } else {
                return month-1;
            }
        },
        oneDay: {
            getMonthOfDay: function(endDay, year) {
                return new Date(year, 0, endDay).getMonth()+1;
            },
            getDayOfMonth: function(endDay, month, year) {
                return new Date(year, 0, endDay).getDate();
            },
            getDayOfYearFromMonth: function(month, year) {
                var dayCount = 0;
                var monthCount = 1;
                while (monthCount < month) {
                    var date = new Date(1971, monthCount, 0);
                    var daysInMonth = date.getDate();
                    dayCount += daysInMonth;
                    monthCount += 1;
                }
                return dayCount;
            },
            getDaysInYear: function(year) {
                return 365;
                year = 2001;
                if (isNaN(parseInt(year))) {
                    return 365;
                }
                var dayCount = 0;
                var monthCount = 1;
                while (monthCount <= 12) {
                    dayCount += new Date(year, monthCount, 0).getDate();
                    monthCount += 1;
                }
                return dayCount;
            }
        },
		dekad : {
			getMonthOfDekad : function (dekad) {
				var month;
				
				if (dekad > 0) {
					month = Math.ceil(dekad / 3);
				}

				return month;
			},
			
			getDayOfDekad : function (periodValue, month, year) {

				if ((periodValue % 3) == 0) {
					var d = new Date(year, month, 0);
					var day = parseInt(d.getDate());
				} else {
					tempmonth = (month - 1) * 3;
					var day = (periodValue - tempmonth) * 10;
				}

				return day;
			},
			getMonthlyPeriodOfDekad : function (value) {
				while (value > 3) {
                    value -= 3;
                }
                return value;
			}
		},
		pentad : {
			getMonthOfPentad : function (pentad) {
				var month;

				if (pentad > 0) {
					month = Math.ceil(pentad / 6);
				}
				return month;
			},
			getDayOfPentad : function (periodValue, month, year) {

				if ((periodValue % 6) == 0) {
					var d = new Date(year, month, 0);
					var day = parseInt(d.getDate());
				} else {
					tempmonth = (month - 1) * 6;
					var day = (periodValue - tempmonth) * 5;
				}
				return day;
			},
            getMonthlyPeriodOfPentad : function(value) {
                while (value > 6) {
                    value -= 6;
                }
                return value;
            }
		},
		sevenDay : {
			getDayOfSevenDay : function (periodValue, yearValue) {
				var day;

				var days = 0;

				var startDate = this.getDateForFirstOccurenceOfDay(this.getFirstOccurenceDay(), 1, yearValue);

				var noOfDaysUpToDay = ((periodValue - 1) * 7) + startDate;

				for (var m = 1; m <= 12; m++) {
					var noOfDays = mapper.common.getNumberOfDaysPerMonth(m, yearValue);
					days += noOfDays;
					if (noOfDaysUpToDay <= days) {
						day = noOfDaysUpToDay - (days - noOfDays);
						break;
					}
				}

				return day;
			},
			getMonthOfSevenDay : function (sevenDay, monthValue, yearValue) {
				var month;

				var startDate = this.getDateForFirstOccurenceOfDay(this.getFirstOccurenceDay(), monthValue, yearValue);
				var sevenDayOfYear = startDate + (7 * (sevenDay - 1));

				var days = 0;
				for (var m = 1; m <= 12; m++) {
					days += mapper.common.getNumberOfDaysPerMonth(m, yearValue);
					if (days > sevenDayOfYear) {
						month = m;
						break;
					}
				}

				return month;
			},
			getNumberOfSevenDaysPerYear : function (year) {
				var startDate = this.getDateForFirstOccurenceOfDay(this.getFirstOccurenceDay(), 1, year);

				var numberOfSevenDaysPerYear = 0;
				for (var d = startDate - 1; d <= mapper.common.getNumberOfDaysPerYear(year); d = d + 7) {
					numberOfSevenDaysPerYear++;
				}

				return numberOfSevenDaysPerYear;
			},
            getSevenDayOfYearFromMonth: function(month, year) {
                month -= 1; // Convert month to 0 based like javascript dates.
                var day = this.getDateForFirstOccurenceOfDay(this.getFirstOccurenceDay(), 1, year);
                var weekCount = 0;
                var date = new Date(year, 0, day);
                while (date.getMonth() < month) {
                    date.setDate(date.getDate() + 7);
                    weekCount += 1;
                }
                return weekCount+1;
            },
            getFirstOccurenceDay: function() {
                return mapper.periodsConfig['7-day'].firstOccurence.day.toLowerCase();
            },
            getDateForFirstOccurenceOfDay: function(dayOfWeek, month, year) {
                var date = new Date(year, 0, 1);
                var dayMapping = {
                    'sunday': 0,
                    'monday': 1,
                    'tuesday': 2,
                    'wednesday': 3,
                    'thursday': 4,
                    'friday': 5,
                    'saturday': 6
                };
                if (!dayMapping.hasOwnProperty(dayOfWeek)) {
                    mapper.error("invalid value for firstOccurence.day");
                    return;
                }
                dayOfWeek = dayMapping[dayOfWeek];
                while (date.getDay() !== dayOfWeek) {
                    date.setDate(date.getDate()+1);
                }
                return date.getDate();
            }
		},
		fourteenDay : {
			getNumberOfFourteenDaysPerMonth : function (year, month) {
				var numberOfDays = new Date(year, month, 0).getDate();
				return numberOfDays;
			}
		},
	},
	amcharts : {
		chartBuilders : {
            
		}, // End chartBuilders

		chartTypes : {

		}, // End chartTypes

		exporters : {
			PNG : {
				
			},
			CSV : {

			},
		}, // End exporters

		common : {
			
		}, // End common
        
        data : {
			/**
			 * The x values in the timeseries data has to be processed into a timestamp to be
			 * parsed by AmCharts. How it's parsed varies depending on the periodicity so 
			 * add the appropriate method to the data handler so we don't need to check 
			 * the periodicity everywhere it's called.
			 */
            setDataHandlerMethods : function(dataHandler, options) {
                var period = options.period;
                if (period === '7-day') {
                    dataHandler.processData = mapper.amcharts.common.processSevenDayData;
                } else if (period === '1-day') {
                    dataHandler.processData = mapper.amcharts.common.processDailyData;
                } else {
                    dataHandler.processData = mapper.amcharts.common.processData;
                }
            },
            postProcessData : function(data, period) {
                if (period === '7-day'/* || period === '1-day'*/) {  // Insert first and last date of the year so the chart always shows the full year.
                    data.unshift({x: new Date(1970, 0, 1).getTime()});
                    data.push({x: new Date(1970, 12, 0).getTime()});
                }
                
                return data;
            }
        }  // End data
	},

	tools : {}
}
