var cClipNShip = {
	mapWindowFocused: function(postingObj, callbackObj, eventObj) {
		var mapWindow = postingObj;
		var extendedTool = callbackObj;
		var activeMapWindow = extendedTool.activeMapWindow;
		
		// enables form items if it was previously disabled by
		// all map windows being closed.
		extendedTool.enableForm();
		
		if (activeMapWindow !== null && activeMapWindow.extendedTool !== null) {
			// In case the focused event triggers twice on same map window.
			if (activeMapWindow.extendedTool.layersConfigId === mapWindow.layersConfigId) return;
			// Remove the vector from the current map window.
			extendedTool.removeVector();
		}
		
		// Checks if the interaction was added to the last map window
		// and if so, remove it and add it to the newly selected map window.
		if (extendedTool.interactionAdded === true) {
			if (activeMapWindow !== null) extendedTool.removeMapInteraction();
			extendedTool.activeMapWindow = mapWindow.owningBlock;
			extendedTool.addMapInteraction();
		} else {
			extendedTool.activeMapWindow = mapWindow.owningBlock;
		}
		extendedTool.addVector();
	},
	mapWindowDestroyed: function(postingObj, callbackObj, eventObj) {
		var extendedTool = callbackObj;
		var mapWindows = skin.blocks.getBlocksByName('cMapWindow');
		if (mapWindows.length === 1) {
			// If there is only one map window when this event is called
			// then that means the map window is about to be destroyed so
			// there WILL be no map windows after this callback executes.
			extendedTool.disableForm();
			extendedTool.activeMapWindow = null;
		}
	},
    createExtendedTool: function(owningBlock) {
		var mapWindow = null;
		// Get the default focused map window on app load.
		var mapWindows = skin.blocks.getBlocksByName('cMapWindow');
        for (var i = 0, len = mapWindows.length; i < len; i+=1) {
            mapWindow = mapWindows[i];
            break;
        }
		
        var extendedTool = {
            owningBlock: owningBlock,
			activeMapWindow: mapWindow,
			interactionAdded: false,
			lat: {
				min: null,
				max: null
			},
			lon: {
				min: null,
				max: null
			},
			// Shows the selected extent in the map after the user drags
			// a box or adds coordinates manually.
			vector: new ol.layer.Vector({
                source: new ol.source.Vector()
            }),
			addMapInteraction: function() {
				var mapWindow = this.activeMapWindow;
				this.interactionAdded = true;
				var mapPanelBlock = mapWindow.getReferencedBlock('cMapPanel');
				var map = mapPanelBlock.component.map;
				map.addInteraction(this.mapInteraction);
			},
			removeMapInteraction: function() {
				var mapWindow = this.activeMapWindow;
				this.interactionAdded = false;
				var mapPanelBlock = mapWindow.getReferencedBlock('cMapPanel');
				var map = mapPanelBlock.component.map;
				map.removeInteraction(this.mapInteraction);
			},
			disableDownloadBtn: function() {
				var downloadBtn = this.component.query('#wcsDownloadBtn')[0];
				downloadBtn.disable();
			},
			enableDownloadBtn: function() {
				var downloadBtn = this.component.query('#wcsDownloadBtn')[0];
				downloadBtn.enable();
			},
			// disables and enables entire form except for the
			// download button since that is handled separately.
			disableForm: function() {
				this.clearForm();
				var selectExtentBtn = Ext.getCmp('clipNShipToggle');
				var clearBtn = Ext.getCmp('wcsDownloadClear');
				var component = this.component;
				var minLatTxtBox = component.query('[name=minLat]')[0];
				var maxLatTxtBox = component.query('[name=maxLat]')[0];
				var minLonTxtBox = component.query('[name=minLon]')[0];
				var maxLonTxtBox = component.query('[name=maxLon]')[0];
				selectExtentBtn.disable();
				clearBtn.disable();
				minLatTxtBox.disable();
				maxLatTxtBox.disable();
				minLonTxtBox.disable();
				maxLonTxtBox.disable();
			},
			enableForm: function() {
				var selectExtentBtn = Ext.getCmp('clipNShipToggle');
				var clearBtn = Ext.getCmp('wcsDownloadClear');
				var component = this.component;
				var minLatTxtBox = component.query('[name=minLat]')[0];
				var maxLatTxtBox = component.query('[name=maxLat]')[0];
				var minLonTxtBox = component.query('[name=minLon]')[0];
				var maxLonTxtBox = component.query('[name=maxLon]')[0];
				selectExtentBtn.enable();
				clearBtn.enable();
				minLatTxtBox.enable();
				maxLatTxtBox.enable();
				minLonTxtBox.enable();
				maxLonTxtBox.enable();
			},
			clearForm: function() {
				var component = this.component;
				var minLatTxtBox = component.query('[name=minLat]')[0];
				var maxLatTxtBox = component.query('[name=maxLat]')[0];
				var minLonTxtBox = component.query('[name=minLon]')[0];
				var maxLonTxtBox = component.query('[name=maxLon]')[0];
				minLatTxtBox.reset();
				maxLatTxtBox.reset();
				minLonTxtBox.reset();
				maxLonTxtBox.reset();
			},
			removeVector: function() {
				var mapPanelBlock = this.activeMapWindow.getReferencedBlock('cMapPanel');
				var map = mapPanelBlock.component.map;
				map.removeLayer(this.vector);
			},
			addVector: function() {
				var mapPanelBlock = this.activeMapWindow.getReferencedBlock('cMapPanel');
				var map = mapPanelBlock.component.map;
				map.addLayer(this.vector);
			},
			// Will clear the blue extent box but does 
			// not remove the layer from the map.
			clearFeatures: function() {
				this.vector.getSource().clear();
			},
			setFeature: function(extent, projection) {
				var mapPanel = this.activeMapWindow.getReferencedBlock('cMapPanel');
				var map = mapPanel.component.map;
				var mapProjection = map.getView().getProjection().getCode();
				var newExtent;
				
				// Convert the extent projection if needed.
				if (projection !== mapProjection) {
					var minxy = [extent[0], extent[1]];
					var maxxy = [extent[2], extent[3]];
					minxy = proj4(projection, mapProjection, minxy);
					maxxy = proj4(projection, mapProjection, maxxy);
					newExtent = [minxy[0], minxy[1], maxxy[0], maxxy[1]];
				} else {
					newExtent = extent;
				}
				
				var olFeature = new ol.Feature({geometry: ol.geom.Polygon.fromExtent(newExtent)});
				olFeature.setStyle(new ol.style.Style({
					stroke : new ol.style.Stroke({
						color : 'rgba(0,0,255,1)',
						width : 4
					}),
					fill : new ol.style.Fill({
						color : 'rgba(0,0,0,0)'
					})
				}));
				this.vector.getSource().addFeature(olFeature);
			},
			handleTextboxChange: function() {
				this.clearFeatures();
				var extent = [this.lon.min, this.lat.min, this.lon.max, this.lat.max];
				var projection = 'EPSG:4326'; // Hard coded to lat/lon. Will be converted to map projection.
				this.setFeature(extent, projection);
				this.validateSelection();
			},
			validateSelection: function() {
				var isValid = true;
				var validationMessage = Ext.getCmp('latLonValidationMessage');
				var maxArea = this.owningBlock.blockConfigs.max_extent_area_degrees;
				
				var mapPanelBlock = this.activeMapWindow.getReferencedBlock('cMapPanel');
				var map = mapPanelBlock.component.map;
				var geom = this.mapInteraction.getGeometry();
				var extent = geom.getExtent();
				var mapProjection = map.getView().getProjection().getCode();
				
				if (mapProjection !== 'EPSG:4326') {
					geom = geom.clone().transform(mapProjection, 'EPSG:4326');
				}
				var area = geom.getArea();
				
				var miny = parseFloat(this.lat.min);
				var maxy = parseFloat(this.lat.max);
				var minx = parseFloat(this.lon.min);
				var maxx = parseFloat(this.lon.max);
				
				if (area > maxArea) {
					isValid = false;
					validationMessage.setText('Exceeded maximum area of '+maxArea+' degrees.');
					validationMessage.setHeight(20);
					this.disableDownloadBtn();
				} else if (isNaN(minx) || isNaN(miny) || isNaN(maxx) || isNaN(maxy)) {
					isValid = false;
					this.disableDownloadBtn();
				} else if (minx > maxx) {
					isValid = false;
					validationMessage.setText('Longitude minimum cannot be greater than maximum. You may have crossed the antimeridian');
					validationMessage.setHeight(60);
					this.disableDownloadBtn();
				} else if (miny > maxy) {
					isValid = false;
					validationMessage.setText('Latitude minimum cannot be greater than maximum.');
					validationMessage.setHeight(40);
					this.disableDownloadBtn();
				} else {
					this.enableDownloadBtn();
					validationMessage.setText('');
					validationMessage.setHeight(0);
				}
				
				return isValid;
			},
			openAndEnable: function() {
				var parent = this.owningBlock.parent.component;
				if (parent.collapsed) {
					parent.expand();
				}
				
				if (this.owningBlock.rendered === true) {
					if (this.component.collapsed) {
						this.component.expand();
					}
					
					var clipNShipBtn = Ext.getCmp('clipNShipToggle');
					if (clipNShipBtn.pressed === false) {
						clipNShipBtn.toggle(true);
					}
				} else {
					setTimeout(function(extendedTool) {
						if (extendedTool.component.collapsed) {
							extendedTool.component.expand();
						}
					
						var clipNShipBtn = Ext.getCmp('clipNShipToggle');
						if (clipNShipBtn.pressed === false) {
							clipNShipBtn.toggle(true);
						}
					}, 200, this);
				}
			}
        };
        
        var fill = new ol.style.Fill({
            color : 'rgba(255,154,0,0.5)'
        });

        var style = new ol.style.Style({
            stroke : new ol.style.Stroke({
                color : [255, 154, 0, 1],
                width : 2,

            }),
            fill : fill
        });
        
        var mapInteraction = new ol.interaction.DragBox({
            condition : ol.events.condition.always,
            style : style
        });
		
		mapInteraction.on('boxstart', function(event) {
            this.clearFeatures();
        }, extendedTool);
		
        mapInteraction.on('boxend', function(event) {
            var mapPanelBlock = this.activeMapWindow.getReferencedBlock('cMapPanel');
            var map = mapPanelBlock.component.map;
			var geom = this.mapInteraction.getGeometry();
            var extent = geom.getExtent();
            var mapProjection = map.getView().getProjection().getCode();
			this.setFeature(geom.getExtent(), mapProjection);
			
			if (mapProjection !== 'EPSG:4326') {
				geom = geom.clone().transform(mapProjection, 'EPSG:4326');
			}
			var extent = geom.getExtent();
			
			var minx = extent[0];
			var miny = extent[1];
			var maxx = extent[2];
			var maxy = extent[3];
			
			// Update lat/long text boxes while preventing
			// their changed events from fireing.
			var component = this.component;
			var minLatTxtBox = component.query('[name=minLat]')[0];
			var maxLatTxtBox = component.query('[name=maxLat]')[0];
			var minLonTxtBox = component.query('[name=minLon]')[0];
			var maxLonTxtBox = component.query('[name=maxLon]')[0];
			minLatTxtBox.suspendEvents();
			minLatTxtBox.setValue(miny);
			minLatTxtBox.resumeEvents();
			maxLatTxtBox.suspendEvents();
			maxLatTxtBox.setValue(maxy);
			maxLatTxtBox.resumeEvents();
			minLonTxtBox.suspendEvents();
			minLonTxtBox.setValue(minx);
			minLonTxtBox.resumeEvents();
			maxLonTxtBox.suspendEvents();
			maxLonTxtBox.setValue(maxx);
			maxLonTxtBox.resumeEvents();
			
			this.lat.min = miny;
			this.lat.max = maxy;
			this.lon.min = minx;
			this.lon.max = maxx;
			
			var isValid = this.validateSelection();
			if (isValid) {
				var selectExtentBtn = Ext.getCmp('clipNShipToggle');
				selectExtentBtn.toggle(false);
			}
        }, extendedTool);
        
        extendedTool.mapInteraction = mapInteraction;
		
		// No need to subscribe to map window created event 
		// since the focused event is fired when created.
		mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
            owningBlock.itemDefinition.mapWindowFocused,
            extendedTool);
        
		mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_DESTROYED,
            owningBlock.itemDefinition.mapWindowDestroyed,
            extendedTool);
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
		
		var component = {
			extendedTool: extendedTool,
			title: 'Clip and Ship',
			collapsible: (block.hasOwnProperty('collapsible')) ? block.collapsible : true,
			collapsed: (block.hasOwnProperty('collapsed')) ? block.collapsed : true,
            componentCls : 'panel-border',
            grow:true,
            autoSize:true,
            border: 1,
            bodyCls: 'roundCorners',
            cls: 'padPanel',
            layout : 'vbox',
			items: [{
				xtype: 'button',
				text: 'Select Extent on Map',
				enableToggle : true,
				extendedTool: extendedTool,
				id: 'clipNShipToggle',
				listeners: {
					toggle: function() {
						if (this.pressed) {
							this.extendedTool.addMapInteraction();
						} else {
							this.extendedTool.removeMapInteraction();
						}
					}
				}
			}, {
				xtype : 'tbtext',
				text : 'Latitude (dd):',
				style : {marginTop : '7px', marginBottom : '5px', marginLeft : '10px'}
			}, {
				layout: {
					type: 'table',
					columns: 2
				},
				width: '100%',
				columnWidth: '50%',
				items: [{
					extendedTool: extendedTool,
					xtype: 'textfield',
					name: 'minLat',
					emptyText: 'min',
					style: {
						marginRight: '3px'
					},
					listeners: {
						change: function(textbox, value) {
							this.extendedTool.lat.min = value;
							this.extendedTool.handleTextboxChange();
						}
					}
				}, {
					extendedTool: extendedTool,
					xtype: 'textfield',
					name: 'maxLat',
					emptyText: 'max',
					listeners: {
						change: function(textbox, value) {
							this.extendedTool.lat.max = value;
							this.extendedTool.handleTextboxChange();
						}
					}
				}]
			}, {
				xtype : 'tbtext',
				text : 'Longitude (dd):',
				style : {marginTop : '7px', marginBottom : '5px', marginLeft : '10px'}
			}, {
				layout: {
					type: 'table',
					columns: 2
				},
				width: '100%',
				columnWidth: '50%',
				items: [{
					extendedTool: extendedTool,
					xtype: 'textfield',
					name: 'minLon',
					emptyText: 'min',
					style: {
						marginRight: '3px'
					},
					listeners: {
						change: function(textbox, value) {
							this.extendedTool.lon.min = value;
							this.extendedTool.handleTextboxChange();
						}
					}
				}, {
					extendedTool: extendedTool,
					xtype: 'textfield',
					name: 'maxLon',
					emptyText: 'max',
					listeners: {
						change: function(textbox, value) {
							this.extendedTool.lon.max = value;
							this.extendedTool.handleTextboxChange();
						}
					}
				}]
			}, {
				xtype: 'tbtext',
				text: '',
				id: 'latLonValidationMessage',
				width: '100%',
				height: 0,
				style: {color: 'red', width: '100%', whiteSpace: 'normal'}
			}, {
				layout: 'column',
				width: '100%',
				columnWidth: '50%',
				items: [{
					extendedTool: extendedTool,
					xtype: 'button',
					text: 'Clear',
					id: 'wcsDownloadClear',
					columnWidth: 0.5,
					style: {
						marginRight: '40px'
					},
					handler: function() {
						this.extendedTool.clearForm();
					}
				}, {
					extendedTool: extendedTool,
					xtype: 'button',
					text: 'Download',
					id: 'wcsDownloadBtn',
					columnWidth: 0.5,
					disabled: true,
					style: {
						marginLeft: '15px'
					},
					handler: function() {
						var layersConfigId = mapper.layers.getLayersConfigInstanceId();
						var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);
						var layers = mapper.layers.query(
							layersConfig.overlays,
							{
								type: 'layer',
								display: true,
								mask: false,
								loadOnly: false
							}
						);
						
						if (layers.length === 0) return;
						var layer = null;
						for (var i = 0, len = layers.length; i < len; i+=1) {
							if (layers[i].source.wcs) {
								layer = layers[i];
								break;
							}
						}
						
						if (layer === null) return;
						
						var latMin = this.extendedTool.lat.min;
						var latMax = this.extendedTool.lat.max;
						var lonMin = this.extendedTool.lon.min;
						var lonMax = this.extendedTool.lon.max;
						
						var url = layer.source.wcs + '?service=WCS&request=GetCoverage&version=2.0.1&coverageId='+layer.name+'&format=image/tiff&subset=Lat('+latMin+','+latMax+')&subset=Long('+lonMin+','+lonMax+')';
						var link = document.createElement('a');
						link.href = url;
						link.download = '';
						link.type = 'image/tiff';
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					}
				}]
			}],
			listeners: {
				afterrender: function() {
					this.extendedTool.component = this;
					this.extendedTool.owningBlock.component = this;
					this.extendedTool.owningBlock.rendered = true;
					
					if (this.extendedTool.activeMapWindow !== null) {
						this.extendedTool.addVector();
					}
				}
			}
		};
		
		return component;
    }
};

export var toolName = "cClipNShip";
export var tool = cClipNShip;