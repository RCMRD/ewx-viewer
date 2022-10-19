class Node {
	/* Set the initial values for the node */
	constructor(data, radio = false, dc = false, id = null) {
		this.id = id;
		this.data = data;
		this.radio = radio;
		this.defaultChecked = dc;
		this.selected = dc;
		this.prevSelected = dc;
		this.enabled = false;
		this.parent = null;
		this.children = [];
		this.purpose = null;
	}
	
	addParent(parent) {
		this.parent = parent;
		parent.children.push(this);
	}
	
	addChild(child) {
		if(Array.isArray(child)) {
			this.children = this.children.concat(child);
			for(i in child) {
				child[i].parent = this;
			}
		} else {
			this.children.push(child);
			child.parent = this;
		}
	}
	
	/* Add node and the node's children to the specified component
		Disable all  nodes that are children of another node
	*/
	addToCmp(cmp) {
		var node;
		var q = this.children.concat(); // concat forces to set q by value and not reference
		while(Array.isArray(q) && q.length) {
			node = q.pop();
			q = q.concat(node.children);
			
			if(node.parent === this) {
				node.id = cmp.add(node.data).getId();
				node.enabled = true;
			} else {
				node.id = cmp.add(node.data).disable().getId();
				node.enabled = false;
			}
			
			// make checkbox look like a radio button if node.radio is true
			if(node.radio) {
				Ext.getCmp(node.id).addCls('checkbox-overwrite');
			}
			
		}
	}
	
	getChildren() {
		var node;
		var nodes = [];
		var q = this.children.concat(); // concat forces to set q by value and not reference
		while(Array.isArray(q) && q.length) {
			node = q.pop();
			q = q.concat(node.children);
			nodes.push(node);
		}
		
		return nodes;
	}
	
	getSelectedChildren() {
		var node;
		var nodes = [];
		var q = this.children.concat(); // concat forces to set q by value and not reference
		while(Array.isArray(q) && q.length) {
			node = q.pop();
			if(node.selected) {
				nodes.push(node);
			}
		}
		
		return nodes;
	}
	
	disableChildren() {
		var node, cb;
		var nodes = [];
		var q = this.children.concat(); // concat forces to set q by value and not reference
		while(Array.isArray(q) && q.length) {
			node = q.pop();
			q = q.concat(node.children);

			cb = Ext.getCmp(node.id);
			cb.setValue(false);
			cb.disable();
			node.selected = false;
			node.enabled = false;
			nodes.push(node);
		}
		
		return nodes;
	}
	
	enableChildren() {
		var node, cb;
		var nodes = [];
		var q = this.children.concat(); // concat forces to set q by value and not reference
		while(Array.isArray(q) && q.length) {
			node = q.pop();
			q = q.concat(node.children);

			cb = Ext.getCmp(node.id);
			cb.enable();
			node.enabled = true;
			if(node.defaultChecked) {
				cb.setValue(true);
				node.selected = true;
				nodes.push(node);
			}
		}
		return nodes;
	}
	
	removeChildren() {
		var node;
		var q = this.children;
		while(Array.isArray(q) && q.length) {
			node = q.pop();
			for(var i=0; i < node.children.length; i++) {
				q.push(node.children[i]);
			}
			node = null;
		}
	}
	
 	getSiblings() {
		if(this.parent != null) {
			 // concat forces to set children by value and not reference
			var children = this.parent.children.concat();
			for(var i in children) {
				// don't count node as a sibling of itself; remove it
				if(children[i] == this) {
					children.splice(i, 1);
				}
			}
			return children;
		}
		return [];
	}
	
	/* Forces the siblings of the node to act like radio buttons
		EXTjs is not touched here, instead we only set the
		value of this node and its siblings based upon the value
		it held before as well as the value of the sibling nodes.
	*/
	radioBehavior() {
		// only perform this function if it is enabled and is to act like a radio button
		if(this.radio && this.enabled) {
			var sibs = this.getSiblings();
			if(this.selected === true) {
				for(var k in sibs) {
					sibs[k].selected = false;
				}
				return sibs;
			} else {
				var keep = null;
				var count = 0;
				for(var k in sibs) {
					if(sibs[k].selected === false) {
						count++;
					}
					if(sibs[k].prevSelected === true || sibs[k].defaultChecked === true) {
						keep = sibs[k];
					}
				}
				if(count === sibs.length) {
					if(keep == null) {
						if(this.prevSelected === true || this.defaultChecked === true) {
							keep = this;
							keep.selected = true;
						}
					} else {
						keep.selected = true;
					}
					return [keep];
				}
			}
		}
		return [];
	}
	
	getNodeByDataName(name) {
		var node;
		var q = this.children.concat(); // concat forces to set q by value and not reference
		while(Array.isArray(q) && q.length) {
			node = q.pop();
			if(node.data.name == name) {
				return node;
			}
		}
		return false;
	}
}

var cDataDownload = {
	mapWindowCreated: function(postingObj, callbackObj, eventObj) {
		var mapWindow = postingObj;
		var extendedTool = callbackObj;
		var activeMapWindow = extendedTool.activeMapWindow;
		
		// enables form items if it was previously disabled by
		// all map windows being closed.
		extendedTool.enableForm();
		
		extendedTool.activeMapWindow = mapWindow.owningBlock;
		// Checks if the interaction was added to the last map window
		// and if so, add it to the newly selected map window.
		if (extendedTool.interactionAdded === true) {
			extendedTool.addMapInteraction();
		}
		
		var mapWindows = skin.blocks.getBlocksByName('cMapWindow');
		if (mapWindows.length === 1) {
			/* If this is the only map window then there were previously
			 * no windows. We should make sure the form is up to date with
			 * the box on the map.
			 */
			var lssource = extendedTool.vector.getSource();
			var lsextent = lssource.getExtent();
			extendedTool.updateTextBoxCoords();
		}
		
		extendedTool.addVector();
	},
	mapWindowFocused: function(postingObj, callbackObj, eventObj) {
		var mapWindow = postingObj;
		var extendedTool = callbackObj;
		var activeMapWindow = extendedTool.activeMapWindow;
		extendedTool.activeMapWindow = mapWindow.owningBlock;
	},
	mapWindowDestroyed: function(postingObj, callbackObj, eventObj) {
		var extendedTool = callbackObj;
		var mapWindows = skin.blocks.getBlocksByName('cMapWindow');
		var winlen = mapWindows.length;
		if (winlen === 1) {
			// If there is only one map window when this event is called
			// then that means the map window is about to be destroyed so
			// there WILL be no map windows after this callback executes.
			extendedTool.disableForm();
			extendedTool.activeMapWindow = null;
		} else if(eventObj.owningBlock.id != mapWindows[0].id) {
			extendedTool.activeMapWindow = mapWindows[0];
		} else if(eventObj.owningBlock.id != mapWindows[winlen-1].id){
			extendedTool.activeMapWindow = mapWindows[winlen-1];
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
			qsource: null,
			rsource: null,
            owningBlock: owningBlock,
			activeMapWindow: mapWindow,
			interactionAdded: false,
			xmlRequestComplete: true,
			categories: [],
			selectedCategories: [],
			precision: 10,
			email: '',
			lat: {
				min: null,
				max: null
			},
			lon: {
				min: null,
				max: null
			},
			hyp: null,
			a1: null,
			a2: null,
			lew: 183, //landsat scene size east to west in km
			lns: 170, // landsat scene size north to south in km
			R: 6371, // average radius of the Earth in km
			// variables based upon the variables above
			createDefaultVars: function() {
				// we are calculating from center of landsat scene size therefore divide by 2
				this.hyp = Math.acos(Math.cos(this.lew/this.R) * Math.cos(this.lns/this.R))*this.R/2; // spherical law of cosines
				this.a1 = Math.atan(this.lew/this.lns);
				this.a2 = Math.atan(this.lns/this.lew);
				this.rootNode = new Node('root');
				
				// polyfill for IE 11 on Windows 7
				// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes#Polyfill
				if (!Array.prototype.includes) {
				  Object.defineProperty(Array.prototype, 'includes', {
					value: function(valueToFind, fromIndex) {
					  if (this == null) { throw new TypeError('"this" is null or not defined'); }
					  var o = Object(this);
					  var len = o.length >>> 0;
					  if (len === 0) { return false; }
					  var n = fromIndex | 0;
					  var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
					  function sameValueZero(x, y) {
						return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
					  }
					  while (k < len) {
						if (sameValueZero(o[k], valueToFind)) { return true; } 
						k++;
					  }
					  return false;
					}
				  });
				}
				// end of polyfill
				
			},
			getCurrentMap: function() {
				var mapPanelBlock = this.activeMapWindow.getReferencedBlock('cMapPanel');
				var map = mapPanelBlock.component.map;
				
				return map;
			},
			// Shows the selected extent in the map after the user drags
			// a box or adds coordinates manually.
			vector: new ol.layer.Vector({
                source: new ol.source.Vector(),
				style: [
					new ol.style.Style({
					stroke : new ol.style.Stroke({
						color : 'rgba(0,0,255,1)',
						width : 2
					}),
					fill : new ol.style.Fill({
						color : 'rgba(0,0,0,0.3)'
					})
				})
			  ]
            }),
			extentIsValid: function(extent = null) {
				if(extent === null) {
					var source = this.vector.getSource();
					extent = source.getExtent();
				}
				if (Number.isFinite === undefined) Number.isFinite = function(value) {
					return typeof value === 'number' && isFinite(value);
				}
				
				if(extent[0] === extent[2] || extent[1] === extent[3]) {
					return false;
				} else {
					for(var i=0; i < extent.length; i++) {
						if(!Number.isFinite(parseFloat(extent[i]))) {
							return false;
						}
					}
				}
				
				return true;
			},
			disableDownloadBtn: function() {
				var downloadBtn = this.component.query('#wcsDownloadBtn')[0];
				downloadBtn.disable();
			},
			enableDownloadBtn: function() {
				var downloadBtn = this.component.query('#wcsDownloadBtn')[0];
				//make sure the text 
				//only enable the donwload button if we have selected categories and an email
				// and if the extent is valid
				if(this.email != '' && this.email != null && this.categoriesAreSelected && this.extentIsValid()) {
					downloadBtn.enable();
				}
			},
			// disables and enables entire form except for the
			// download button since that is handled separately.
			disableForm: function() {
				this.clearForm();
				var clearBtn = Ext.getCmp('wcsDownloadClear');
				var component = this.component;
				var minLatTxtBox = component.query('[name=minLat]')[0];
				var maxLatTxtBox = component.query('[name=maxLat]')[0];
				var minLonTxtBox = component.query('[name=minLon]')[0];
				var maxLonTxtBox = component.query('[name=maxLon]')[0];
				clearBtn.disable();
				minLatTxtBox.disable();
				maxLatTxtBox.disable();
				minLonTxtBox.disable();
				maxLonTxtBox.disable();
			},
			enableForm: function() {
				var clearBtn = Ext.getCmp('wcsDownloadClear');
				var component = this.component;
				var minLatTxtBox = component.query('[name=minLat]')[0];
				var maxLatTxtBox = component.query('[name=maxLat]')[0];
				var minLonTxtBox = component.query('[name=minLon]')[0];
				var maxLonTxtBox = component.query('[name=maxLon]')[0];
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
			// add and remove vector functions
			// if nothing provided; will add this.vector
			removeVector: function(vector = null) {
				var oldVector;
				if(vector !== null) {
					oldVector = vector;
				} else {
					oldVector = this.vector;
				}
				var map = this.getCurrentMap();
				map.removeLayer(oldVector);
			},
			addVector: function(vector = null) {
				var newVector;
				if(vector !== null) {
					newVector = vector;
				} else {
					newVector = this.vector;
				}
				var map = this.getCurrentMap();
				map.addLayer(newVector);
			},
			addMapInteraction: function() {
				var mapPanelBlock, map;
				var totalWindows = skin.blocks.getBlocksByName('cMapWindow');
				for(var i=0; i < totalWindows.length; i++) {
					mapPanelBlock = totalWindows[i].getReferencedBlock('cMapPanel');
					map = mapPanelBlock.component.map;
					map.addInteraction(this.mapInteraction);
				}
				this.interactionAdded = true;
			},
			removeMapInteraction: function() {
				var mapPanelBlock, map;
				var totalWindows = skin.blocks.getBlocksByName('cMapWindow');
				for(var i=0; i < totalWindows.length; i++) {
					mapPanelBlock = totalWindows[i].getReferencedBlock('cMapPanel');
					map = mapPanelBlock.component.map;
					map.removeInteraction(this.mapInteraction);
				}
				this.interactionAdded = false;
			},
			createTranslate: function() {
				this.mapInteraction = new ol.interaction.Translate({
					features: new ol.Collection([this.feature])
				});
				// this method is changing the coordinates as the polygon is being translated
				// extended periods of dragging or dragging at highly zoomed in levels leads to the mouse seperating from the polygon
				this.mapInteraction.on('translating', function(event) {
					var lssource = this.vector.getSource();
					var lsextent = lssource.getExtent();
					var lsfeatur = lssource.getFeatures();
					var lsgeom = lsfeatur[0].getGeometry();
					var lscenter = ol.extent.getCenter(lsextent);
					
					var points = this.getWrappedBoxCoordinates('center', lscenter);
					
					// by getting the bounding extent we can create a rectangle instead of a trapezoid
					var newext = ol.extent.boundingExtent([points[0], points[1], points[2], points[3]]);
					var np1 = [newext[2], newext[3]];
					var np2 = [newext[2], newext[1]];
					var np3 = [newext[0], newext[1]];
					var np4 = [newext[0], newext[3]];
					lsgeom.setCoordinates([[np1, np2, np3, np4]]);
					
					this.updateTextBoxCoords(false);
					
				}, extendedTool);
				// when we are done dragging we want to update the available categories for download
				this.mapInteraction.on('translateend', function(event) {
					this.updateBBoxCategories();
				}, extendedTool);
				
				this.addMapInteraction();
			},
			// Will clear the blue extent box but does
			// not remove the layer from the map.
			clearFeatures: function() {
				this.vector.getSource().clear();
			},
			
			/*
			 * Inputs:
			 *		start: a point specified by a pair of coordinates (degrees)
			 *		start_proj: specifies which projection the start point is in and should be returned in
			 *		distance: a value in km that specifies how far away the destination point is
			 *		bearing: the direction in which we should find our destination point in radians
			 * 
			 * Methodology/Assumptions:
			 *		This is based upon the halversine formula which assumes the Earth is a perfect sphere.
			 *		Depending on chosen points the accuracy is generally 0.3% (within 3m per km) but
			 *			the error may be as high as 0.5%
			 *		In practice the longitude does not seem to be maintained precicely, but seems to be close enough
			 *			I am not 100% sure of the reason as of yet. Rounding? General inaccuracy of formula?
			 *
			 */
			destinationLatLong: function(start, start_proj, distance, bearing) {
				//make sure we are working with lat/long values
				var lonlat = ol.proj.toLonLat(start, start_proj);
				
				// convert to radians
				var lon = lonlat[0] * Math.PI / 180;
				var lat = lonlat[1] * Math.PI / 180;
				
				// shorten number of decimals
				var destLat = Number.parseFloat(lat).toFixed(this.precision);
				var destLon = Number.parseFloat(lon).toFixed(this.precision);
								
				// Math Magic
				destLat = Math.asin( Math.sin(lat)*Math.cos(distance/this.R) + 
							Math.cos(lat)*Math.sin(distance/this.R)*Math.cos(bearing) );
				destLon = lon + Math.atan2( Math.sin(bearing)*Math.sin(distance/this.R)*Math.cos(lat),
								Math.cos(distance/this.R)-Math.sin(lat)*Math.sin(destLat));
				
				// convert to degrees
				destLat = destLat * 180 / Math.PI;
				destLon = destLon * 180 / Math.PI;
				
				// shorten number of decimals
				destLat = Number.parseFloat(destLat).toFixed(this.precision);
				destLon = Number.parseFloat(destLon).toFixed(this.precision);
				
				// convert the point back to the projection we started with
				var destLonLat = ol.proj.fromLonLat([parseFloat(destLon), parseFloat(destLat)], start_proj);
				
				return destLonLat;
			},

			getWrappedBoxCoordinates: function(calcfrom = "center", center = null) {
					var map = this.getCurrentMap();
					var mapProjection = map.getView().getProjection().getCode();
					var points = [];
					if(this.hyp === null || this.a1 === null || this.a2 === null) {
						this.createDefaultVars();
					}
				
					/* Note: 4 Different Longitude Values Returned; 2 Different Latitude Values Returned.
					 * Assuming Longitude value equals the longitude value on at least one other point gives an error of aprox 2km
					 * You may notice a very slight discrepency/issue if you try to give the southeast or northwest corners a precise value
					 *    the formula used in destinationLatLong cannot guarantee correctness better than 0.5%
					 * the specified cases will return a box that looks skewed from the default as they are caculated from a point and not the center
					 * call
					 */	
					switch(calcfrom.toString()) {
						
						case "maxLat":
						case "maxLon":
						case "0":
							points[0] = ol.proj.fromLonLat([parseFloat(this.lon.max), parseFloat(this.lat.max)]);
							points[1] = this.destinationLatLong(points[0], mapProjection, this.lns, Math.PI);
							points[3] = this.destinationLatLong(points[0], mapProjection, this.lew, (3*Math.PI)/2 );
							points[2] = this.destinationLatLong(points[0], mapProjection, this.hyp*2, (3*this.a1)+(2*this.a2));
							break;
							
						case "1":
							points[1] = ol.proj.fromLonLat([parseFloat(this.lon.max), parseFloat(this.lat.min)]);
							points[2] = this.destinationLatLong(points[1], mapProjection, this.lew, (3*Math.PI)/2 );
							points[0] = this.destinationLatLong(points[1], mapProjection, this.lns, 0);
							points[3] = this.destinationLatLong(points[1], mapProjection, this.hyp*2, (3*this.a1)+(4*this.a2));
							break;
						
						case "minLat":
						case "minLon":
						case "2":
							points[2] = ol.proj.fromLonLat([parseFloat(this.lon.min), parseFloat(this.lat.min)]);
							points[1] = this.destinationLatLong(points[2], mapProjection, this.lew, Math.PI/2 );
							points[0] = this.destinationLatLong(points[2], mapProjection, this.hyp*2, this.a1);
							points[3] = this.destinationLatLong(points[2], mapProjection, this.lns, 0);
							break;
						
						case "3":
							points[3] = ol.proj.fromLonLat([parseFloat(this.lon.min), parseFloat(this.lat.max)]);
							points[1] = this.destinationLatLong(points[3], mapProjection, this.lns, this.a1+(2*this.a2) );
							points[0] = this.destinationLatLong(points[3], mapProjection, this.lew, Math.PI/2 );
							points[2] = this.destinationLatLong(points[3], mapProjection, this.hyp*2, Math.PI );
							break;
						
						// includes case center
						default:
							if(center === null) {
								center = map.getView().getCenter();
							}
							
							points[0] = this.destinationLatLong(center, mapProjection, this.hyp, this.a1);
							points[1] = this.destinationLatLong(center, mapProjection, this.hyp, this.a1+(2*this.a2));
							points[2] = this.destinationLatLong(center, mapProjection, this.hyp, (3*this.a1)+(2*this.a2));
							points[3] = this.destinationLatLong(center, mapProjection, this.hyp, (3*this.a1)+(4*this.a2));
							break;
					}
					for(var i=0; i < points.length; i++) {
						points[i] = ol.proj.toLonLat(points[i]);
					}
					if((points[0][0] < -180 && points[1][0] < -180 && points[2][0] < -180 && points[3][0] < -180) || 
						(points[0][0] > 180 && points[1][0] > 180 && points[2][0] > 180 && points[3][0] > 180)) {
						for(var i=0; i < points.length; i++) {
							/* modulo is not well defined for negative numbers
							 * under a different programming language or situation you may need the following formula instead:
							 * points[i][0] = ((points[i][0] + 180) % 360) - 180;
							*/
							points[i][0] = ((((points[i][0] + 180) % 360)+360)%360)-180;
						}
					}
					for(var i=0; i < points.length; i++) {
						points[i] = ol.proj.fromLonLat(points[i]);
					}
				
				return points;
				
			},
			
			/*
			 * Inputs:
			 *		tbname: optional value of textbox (min or max lat; min or max long) that has been changed. 
							Allows for calculating polygon from corner point based upon a max or min value
							
					Function only adds feature if one does not currently exist
			 */
			setFeature: function(tbname = "center") {
			
				var lssource = this.vector.getSource();
				var lsfeatur = lssource.getFeatures();
				
				if(!lsfeatur[0]) {
					var points = this.getWrappedBoxCoordinates(tbname);
					
					// getting bounding extent keeps the polygon rectangular instead of trapezoidal
					var bext = ol.extent.boundingExtent([points[0], points[1], points[2], points[3]]);
					this.feature = new ol.Feature({
					  geometry: new ol.geom.Polygon.fromExtent(bext)
					});
					
					lssource.addFeature(this.feature);
					this.createTranslate();

					this.updateTextBoxCoords();
				}
			},
			
			/*
			 * Updates the textboxes to make them match the polygon's current location
			 * Make call to update the bounding box categories as they may have changed since the
			 * 	the textbox coordinates have changed. However, we need to allow for circumstances
			 *	where the user may still be interacting with the box. This may cause bad values to
			 * 	be used in the updateBBoxCategories() function.
			 */
			updateTextBoxCoords: function(updateCategories = true) {
				var map = this.getCurrentMap();
				var mapProj = map.getView().getProjection().getCode();
				var lssource = this.vector.getSource();
				var extent = lssource.getExtent();
				
				// get the min and max values in latitude and longitude
				var p1 = ol.proj.toLonLat([extent[2], extent[3]]);
				var p3 = ol.proj.toLonLat([extent[0], extent[1]]);

				
				var minx = p3[0].toFixed(this.precision); // min longitude
				var miny = p3[1].toFixed(this.precision); // min latitude
				var maxx = p1[0].toFixed(this.precision); // max longitude
				var maxy = p1[1].toFixed(this.precision); // max latitude
				
				// no need to update anything if the box doesn't exist
				if(isFinite(minx) && isFinite(maxx)) {
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
					
					if(updateCategories) {
						this.updateBBoxCategories();
					}
				}
			},
			
			/*
			 * Inputs:
			 *		tbname: the name of the textbox being changed.
			 *
			 *		If one of the values in extent is empty, then it is likely that the textboxes are being programatically
			 *			or manually cleared. Calling this.setFeature early may prematurely recaculate values which is undesireable
			 *			if we are trying to remove the polygon and hence the text box values.
			 *			Also, we can't recaculate from an empty value so we should wait until a valid value is provided.
			 */
			handleTextboxChange: function(tbname) {
				this.clearFeatures();
				var extent = [this.lon.min, this.lat.min, this.lon.max, this.lat.max];
				var extValid = this.extentIsValid(extent);
				
				if(extValid) {
					this.setFeature(tbname);
					this.enableDownloadBtn();
				} else {
					this.disableDownloadBtn();
				}
				
			},
			openAndEnable: function() {
				this.createDefaultVars();
				this.setFeature();
				
				var parent = this.owningBlock.parent.component;
				if (parent.collapsed) {
					parent.expand();
				}

				if (this.owningBlock.rendered === true) {
					if (this.component.collapsed) {
						this.component.expand();
					}
				} else {
					setTimeout(function(extendedTool) {
						if (extendedTool.component.collapsed) {
							extendedTool.component.expand();
						}
					}, 200, this);
				}
				
				this.updateBBoxCategories();
			},
			
			/*
			 * Returns all layers in the layers.json file that are loadOnly and display false (aka the download layers)
			 */
			getDownloadLayers: function() {
				var layersConfigId = mapper.layers.getLayersConfigInstanceId();
				var layersConfig = mapper.layers.getLayersConfigById(layersConfigId);
				var layers = mapper.layers.query(
					layersConfig.overlays,
					{
						type: 'layer',
						display: false,
						mask: false,
						loadOnly: true
					}
				);
				return layers;
			},
			
			/* Creates and initiates the xml request 
			 * Calls parseXMLforCategories to actually go through the data
			 */
			getXML: function(extendedTool, url) {
				if(url !== null && this.xmlRequestComplete) {
					var xhttp = new XMLHttpRequest();
					xhttp.onreadystatechange = function() {
						// don't parse data unless we have data to parse
						if (this.readyState == 4 && this.status == 200) {
							extendedTool.parseXMLforCategories(xhttp);
							extendedTool.xmlRequestComplete = true;
						}
					};
					xhttp.open("GET", url, true);
					xhttp.send();
					this.xmlRequestComplete = false;
				}
			},
			
			/*
			 *	Inputs:
			 *		request: the XMLHttpRequest object. Needed to retrieve the xml 
			 *
			 *	Goes through all categories and layers provided.
			 *	If the category is not already an object property, we add it as one
			 *		We will then also add it as a checkbox
			 *		Canopy analytical and cartographic are saved and added at the end to maintain the
			 *			appearance of a hierarchical order.
			 * 	The layers are pushed onto a numerical array corresponding to the appropriate object property
			 *	
			 *	Example end object structure:
			 *		this.categories {
						"landcover": 0 => "layer_name1";
						"canopy_cartographic": 0 => "layer_name2", 1 => "layername3";
					}
			 *
			 */
			parseXMLforCategories: function(request) {
				var categoryCheckboxes = Ext.getCmp('cbCategories');
				var loadingCategories = Ext.getCmp('loadingText');
				var noCategories = Ext.getCmp('emptyText');
				
				var xmlDoc = request.responseXML;
				var categoryTags = xmlDoc.getElementsByTagName("mrlc_display:category");
				var datasets = xmlDoc.getElementsByTagName("mrlc_display:dataset");
				var filenames = xmlDoc.getElementsByTagName("mrlc_display:fileName");
				var mcat, cmcat, cat, dat, i;
				var pdata, pnode, c0data, c1data, c0node, c1node;
				var node, data, c0BoxLabel, c1BoxLabel, c0Name, c1Name, c0IV;
				var canode = null;
				var ccnode = null;
				// mcat is the category name with no spaces and all lower case ("machine" name category)
				// cat is the category 
				// dat is a layer
				
				loadingCategories.show();
				noCategories.hide();

				for(i=0; i < categoryTags.length; i++) {
					mcat = categoryTags[i].childNodes[0].nodeValue;
					cat = mcat.replace('_', ' ').replace(/\b\w/g, function(txt) {
							return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
						});
					cmcat = cat.replace(' ', '_');
					dat = [datasets[i].childNodes[0].nodeValue, filenames[i].childNodes[0].nodeValue];
					// check if we already have found layers under this category
					if(!this.categories[mcat]) {						
						this.categories[mcat] = [];
						this.categories[mcat][0] = dat;
						/* configure individual checkboxes and put them into nodes configured in the correct heirarchy. 
							This allows for easier printing later.
							For simplicity when managing the radio buttons, keep the inputValue and name the same.
						*/
						switch(mcat) {
							case 'canopy_analytical':
								data = { style: 'margin-left: 33px', boxLabel: 'Include '+cat, name: mcat, inputValue: mcat };
								canode = new Node(data);
								canode.purpose = 'add';
								break;
								
							case 'canopy_cartographic':
								data = { boxLabel: cat, name: mcat, inputValue: mcat };
								ccnode = new Node(data);
								ccnode.addParent(this.rootNode);
								break;
								
							case 'landcover':
								data = {boxLabel: cat, name: mcat, inputValue: mcat};
								node = new Node(data);
								node.addParent(this.rootNode);
								break;
								
							case 'impervious':
								data = { boxLabel: cat, name: mcat, inputValue: mcat };
								node = new Node(data);
								node.addParent(this.rootNode);
								break;
								
							default:
								var data = { boxLabel: cat, name: mcat, inputValue: mcat };
								var node = new Node(data);
								node.addParent(this.rootNode);
						}
					} else {
						dat = [datasets[i].childNodes[0].nodeValue, filenames[i].childNodes[0].nodeValue];
						// don't add layer if it already exists
						if(!this.categories[mcat].includes(dat)) {
							this.categories[mcat].push(dat);
						}
					}
					if(dat[0].indexOf('NLCD_2016_') !== -1) {
						pnode = this.rootNode.getNodeByDataName(mcat);
						
						// don't add the chidlren twice
						if(!Array.isArray(pnode.children) || !pnode.children.length) {
							c0BoxLabel = '2016 ' + cat + ' ONLY';
							c1BoxLabel = 'All ' + cat + ' Years';
							c0Name = mcat + '2016';
							c1Name = mcat + 'All';
							if(mcat = 'land_cover') {
								c0IV = '(NLCD_2016_' + cmcat + ')|(NLCD_Land_Cover_Change_Index_L48)';
							} else {
								c0IV = 'NLCD_2016_' + cmcat;
							}
							
							c0data = {style: 'margin-left: 33px', boxLabel: c0BoxLabel, name: c0Name, inputValue: c0IV};
							c1data = { style: 'margin-left: 33px', boxLabel: c1BoxLabel, name: c1Name, inputValue: 'all' };
							
							c0node = new Node(c0data, true);
							c1node = new Node(c1data, true, true);
							
							c0node.purpose = 'filter';
							c1node.purpose = 'filter';
							
							pnode.addChild([c0node, c1node]);
						}
					}
				}
				
				if(ccnode != null && canode != null) {
					canode.addParent(ccnode);
				}
				
				this.rootNode.addToCmp(categoryCheckboxes);
				
				// show the newly added textboxes and hide the loading text
				categoryCheckboxes.show();
				loadingCategories.hide();
				// if there is nothing here to download, let the user know
				if(Object.keys(this.categories).length === 0 && this.categories.constructor === Object) {
					noCategories.show();
				}
			},
			
			/*
			 * Prepares for the request to get laters and corresponding categories for the area that the polygon is in
			 * Calls this.getXML to actually send the prepared request
			 */
			updateBBoxCategories: function() {
				var map = this.getCurrentMap();
				var mapProj = map.getView().getProjection().getCode();
				var lssource = this.vector.getSource();
				var extent = lssource.getExtent();
				var layers = this.getDownloadLayers();
				var categoryCheckboxes = Ext.getCmp('cbCategories');
				var loadingCategories = Ext.getCmp('loadingText');
				var noCategories = Ext.getCmp('emptyText');				
				var url = null;
				var baseurl = layers[0].source.wfs +"request=GetFeature&version=1.1.0&typeName=mrlc_display:mrlc_viewer_layer_extent_map_v2016_wShrub&BBOX=";				

				url = baseurl + extent[0] + ',' + extent[1] + ',' + extent[2] + ',' + extent[3];
				
				loadingCategories.show();
				noCategories.hide();
				categoryCheckboxes.setValue({});
				categoryCheckboxes.removeAll();
				if(this.rootNode) {
					this.rootNode.removeChildren();
				}
				this.categories = {};
				this.categoriesAreSelected = false;
				this.disableDownloadBtn();
				this.getXML(this, url);
			}
        };

		mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_CREATED,
            owningBlock.itemDefinition.mapWindowCreated,
            extendedTool);
			
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
			title: 'Data Download',
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
				xtype : 'tbtext',
				id: 'clickHereText',
				text : 'Click <a href="/data" target="_blank">here</a> for full data sets',
				style : {fontSize: '14px',marginTop : '7px', marginBottom : '5px', marginLeft : '10px'}
            },{
				xtype : 'tbtext',
				id: 'selectCategoriesText',
				text : 'Select Categories:',
				style : {fontSize: '14px',
                         fontWeight: 'bold',
                         marginTop : '7px',
                         marginBottom : '5px',
                         marginLeft : '10px'}
			},{
				extendedTool: extendedTool,
                xtype: 'checkboxgroup',
				id: 'cbCategories',
                columns: 1,
                vertical: true,
                items: [],
				hidden: true,
				listeners: {
					change: function(checkbox, values) {
						var obj = {};
						var updatedRadios, updatedNodes;
						var node, oNode;
						var inputs = this.extendedTool.rootNode.getChildren();
						
						/* go through all nodes; we have to go through all nodes to make sure
							they are set correctly. If a value is not set it will default to false.
							Once we have gone through all the nodes we then set the values
						*/
						for(var i in inputs) {
							node = inputs[i];
							// if we already have the value we don't need to go through this process again
							// going through the process again may break radio button functionality
							if(!obj.hasOwnProperty(node.data.name)) {
								// see if this has been passed in as a selected value
								if(values.hasOwnProperty(node.data.name)) {
									node.selected = true;
									this.extendedTool.categoriesAreSelected = true;
									/* if this is newly selected then we neeed to enable the node's
										children and set default values. If it is not then these have
										already been set and will be gone through in the parent loop */
									if(node.selected != node.prevSelected) {
										updatedNodes = node.enableChildren();
										updatedRadios = node.radioBehavior();
										updatedNodes = updatedNodes.concat(updatedRadios);
										for(var j in updatedNodes) {
											oNode = updatedNodes[j];
											// store values of children
											obj[oNode.data.name] =  oNode.selected;
										}
									}
								} else {
									node.selected = false;
									/* if this is newly unselected then we neeed to disable the node's
										children */
									if(node.selected != node.prevSelected) {
										updatedNodes = node.disableChildren();
										updatedRadios = node.radioBehavior();
										updatedNodes = updatedNodes.concat(updatedRadios);
										for(var j in updatedNodes) {
											oNode = updatedNodes[j];
											// store values of children
											obj[oNode.data.name] =  oNode.selected;
										}
									}
								}
								// store new values
								obj[node.data.name] = node.selected;
								node.prevSelected = node.selected;
							}
						}
						
						// set all values we have calculated
						this.setValue(obj);
						
						// if no checkboxes are selected, disable the download button. Otherwise enable it
						if(Object.keys(values).length === 0 && values.constructor === Object) {
							this.extendedTool.disableDownloadBtn();
						} else {
							this.extendedTool.enableDownloadBtn(); 
							// note: this function checks EMAIL as well as categories before enabling the button
						}
					}
				}
            }, {
				xtype : 'tbtext',
				id: 'loadingText',
				text : 'Loading Available Categories',
				style : {fontSize: '14px',marginTop : '7px', marginBottom : '5px', marginLeft : '10px'}
            },{
				xtype : 'tbtext',
				id: 'emptyText',
				text : 'No Categories Available',
				style : {fontSize: '14px',marginTop : '7px', marginBottom : '5px', marginLeft : '10px'},
				hidden: true
            },{
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
						},
						blur: function(textbox, value) {
							this.extendedTool.handleTextboxChange(textbox.name);
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
						},
						blur: function(textbox, value) {
							this.extendedTool.handleTextboxChange(textbox.name);
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
						},
						blur: function(textbox, value) {
							this.extendedTool.handleTextboxChange(textbox.name);
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
						},
						blur: function(textbox, value) {
							this.extendedTool.handleTextboxChange(textbox.name);
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
				extendedTool: extendedTool,
				xtype: 'textfield',
				name: 'Email',
				emptyText: 'Email',
				listeners: {
					change: function(textbox, value) {
						// basic email validation
						// enable or disable button based upon passing of validation
						if(/[^@]+@[^@]+\.[^@]+/.test(value)) {
							this.extendedTool.email = value;
							this.extendedTool.enableDownloadBtn();
							// note: this function checks CATEGORIES as well as email before enabling the button 
						} else {
							this.extendedTool.email = '';
							this.extendedTool.disableDownloadBtn();
						}
					}
				}
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
					listeners : {
						click: function(button, event) {
							var btntxt = button.getText();
							if(btntxt === 'Clear') {
								var lssource = extendedTool.vector.getSource();
								lssource.clear();
								this.extendedTool.clearForm();
								button.setText('Place');
								this.extendedTool.updateBBoxCategories();
								this.extendedTool.disableDownloadBtn();
							} else {								
								extendedTool.setFeature();
								button.setText('Clear');
								this.extendedTool.updateBBoxCategories();
								this.extendedTool.enableDownloadBtn();
							}
						}
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
					listeners : {
						click: function(button, event) {
							
							// object used to store layers and turn into JSON for server processing
							function requestDataObj(name, file, proj, bbox1) {
								this.name = name;
								this.file = file;
								this.proj = proj;
								this.bbox = bbox1;
							}
							
							var downloadLayers = this.extendedTool.getDownloadLayers(); // the download layers in the layers.json file
							
							// availableLayerName: the layers that are available for download (downloadLayers with ':' and before removed)
							// categoryData: An individual category name from this.extendedTool.selectedCategories
							// selectedLayerName: A layer underneath one of the categories in this.extendedTool.selectedCategories
							var availableLayerName, categoryData, selectedLayerName, selectedLayerFileName;
							
							// an array of all categories the user has selected from
							var categoryArray = [];
							var srs; // projection code of layer
							// object that contains all the download layers
							var layersSRS = {}; // layer name will be the property and the srs the value
							var requestData = []; // an array of requestDataObj
							var transExtent; // transformed extent
							
							var filter = null;
							var categoryChildren;
							
							var map = this.extendedTool.getCurrentMap();
							var mapProj = map.getView().getProjection().getCode();
							var lssource = this.extendedTool.vector.getSource();
							var extent = lssource.getExtent();
							
							// go through all the download layers and add them to the layersSRS array in the proper format
							for(var i=0; i < downloadLayers.length; i++) {
								if(downloadLayers[i].name.split(':')[1]) {
									availableLayerName = downloadLayers[i].name.split(':')[1];
								} else {
									availableLayerName = downloadLayers[i].name;
								}
								layersSRS[availableLayerName] = downloadLayers[i].srs;
							}

							// for each node checked (or selected) add the corresponding layers to the requestData array
							var node;
							var sc = this.extendedTool.rootNode.getSelectedChildren(); // the categories that the user checked (selected)
							for(var j=0; j < sc.length; j++) {
								node = sc[j];
								categoryData = node.data.inputValue;
								categoryArray.push(categoryData);
								
								if(this.extendedTool.categories[categoryData]) {
									
									// get the children of the category in order to decide  to add or subtract layers from the download
									filter = null;
									categoryChildren = node.getSelectedChildren();
									for(var k in categoryChildren) {
										if(categoryChildren[k].purpose == 'add') {
											sc.push(categoryChildren[k]);
										} else if(categoryChildren[k].purpose == 'filter' && categoryChildren[k].data.inputValue != 'all') {
											filter = new RegExp(categoryChildren[k].data.inputValue);
										}
									}
									// download tracking: record categories that are being downloaded
									mapper.Analytics.reportActivity(categoryData,"Downloads","Download");
									
									// for each layer under this category
									for(var k=0; k < this.extendedTool.categories[categoryData].length; k++) {
										selectedLayerName = this.extendedTool.categories[categoryData][k][0];
										selectedLayerFileName = this.extendedTool.categories[categoryData][k][1];
										if(filter === null || filter.test(selectedLayerName)) {
											if(layersSRS[selectedLayerName]) {
												srs = layersSRS[selectedLayerName];
												transExtent = ol.proj.transformExtent(extent, mapProj, srs);
												if(!this.extendedTool.extentIsValid(transExtent)) {
													alert("The bounding box of your download request is NOT VALID!");
													break;
												}
												requestData.push(new requestDataObj(selectedLayerName, selectedLayerFileName, srs.replace('EPSG:', ''), transExtent));
											}											
										}

									}
									
								}
							}

							var catstr = categoryArray.join();
 							var jsonstr = JSON.stringify(requestData);
							
							if(jsonstr && jsonstr != '[]' && jsonstr != '{}' && catstr && this.extendedTool.email) {
								var url = encodeURI("/viewer/rest/mrlc/addQueue.php");
								
								var request = new XMLHttpRequest();
								request.open("POST", url, true);
								request.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
								request.send('layers='+jsonstr+'&email='+this.extendedTool.email+'&categories='+catstr);
								
								request.onreadystatechange = function() {
									if (this.readyState == 4 && this.status == 200) {
										var response = JSON.parse(request.response);
										if(response.success == true) {
											alert("Your download request has successfully been sent and will be processed for you within 24 hours.  You will receive an e-mail with instructions on retrieving your data.  Thank you.");
										} else {
											alert("ERROR: " + response.errorMessage);
										}
									}
								};
							} else {
								alert("Due to required values being missing or incorrect we did not attempt to send the request.");
							}
						}
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

export var toolName = "cDataDownload";
export var tool = cDataDownload;
