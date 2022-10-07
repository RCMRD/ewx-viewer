var cFeatureInfoTable = {
    options: {
        requiredBlocks: ['cMapPanel'],
        events: ['tableUpdatedEvent', 'checkchange']
    },
    init: function(blueprint) {
        Ext.define('Ext.grid.header.ContainerCustomSort', {
            override: 'Ext.grid.header.Container',
            onSortAscClick: function() {
                var sortParam = this.getMenu().activeHeader.dataIndex;
                this.extendedTool.sortColumnName = sortParam;
                this.extendedTool.sortDirection = 'ASC';
                this.extendedTool.sortColumn();
            },
            onSortDescClick: function() {
                var sortParam = this.getMenu().activeHeader.dataIndex;
                this.extendedTool.sortColumnName = sortParam;
                this.extendedTool.sortDirection = 'DESC';
                this.extendedTool.sortColumn();
            }
        });

         skin.createGridPanelHeaderCheckbox();
    },
    layersConfigUpdated: function(layersConfig, callbackObject, postingObject) {
        var extendedTool = callbackObject;
        extendedTool.maskComponent();
        
        // Set default total pages and current page to 0.
        extendedTool.currentPage = 0;
        extendedTool.totalPages = 0;
        var mappedLayers = extendedTool.owningBlock.blockConfigs.layers;
        var mappedLayerIds = [];
        for (var i = 0, len = mappedLayers.length; i < len; i+=1) {
            mappedLayerIds.push(mappedLayers[i].id);
        }
        
        // Fetch displayed overlays.
        var displayedLayers = mapper.layers.query(
            layersConfig,
            function(layer) {
                if (mappedLayerIds.indexOf(layer.id) !== -1 && layer.type === 'layer' && layer.mask === false && (layer.display === true || layer.loadOnly === true)) {
                    return true;
                }
                return false;
            },
            ['overlays']
        );
        
        // Check to ensure at least one filter exists before loading features into table.
        var hasAnyCqlFilter = false;
        for (var i = 0, len = displayedLayers.length; i < len; i+=1) {
            var layer = displayedLayers[i];
            if (layer.hasOwnProperty('cqlFilter') && layer.cqlFilter !== null) {
                hasAnyCqlFilter = true;
                break;
            }
        }
        
        // If no cql filter exists, empty table and return.
        if (hasAnyCqlFilter === false) {
            extendedTool.component.getStore().removeAll();
            extendedTool.unMaskComponent();
            extendedTool.featureList = [];
            extendedTool.owningBlock.fire('tableUpdatedEvent', extendedTool);
            return;
        }
        
        for (var i = 0, len = displayedLayers.length; i < len; i+=1) {
            var layer = displayedLayers[i];
            var cqlFilterParam = '';
            var cqlFilter = [];
            var idProperty = '';
            
            if (layer.hasOwnProperty('cqlFilter')) {
                for (var prop in layer.cqlFilter) {
                    if (layer.cqlFilter[prop] !== null) cqlFilter.push(layer.cqlFilter[prop]);
                }
            }
            if (cqlFilter.length > 0) {
                cqlFilterParam = '&CQL_FILTER='+cqlFilter.join(' AND ');
            }
            
            var toolLayerConfig = mapper.layers.toolMapping.getLayerConfigs(layer.id, extendedTool.owningBlock.blockConfigs.layers);
            var propertyNameParam = [];
            if (toolLayerConfig !== null) {
                idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(toolLayerConfig.featureInfo, ['id'], 'propertyName')[0];
                propertyNameParam.push(idProperty);
            }
            
            if (extendedTool.sortColumnName !== null) {
                propertyNameParam.push(extendedTool.sortColumnName);
            }
            
            // Send wfs request to retrieve only the ids of all features to be loaded.
            var url = layer.source.wfs;
            var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+layer.srs+'&typeNames='+layer.name+'&outputFormat=application/json&propertyName='+propertyNameParam.join(',')+cqlFilterParam;
            mapper.common.asyncAjax({
                type: 'POST',
                url: url,
                params: params,
                callbackObj: {
                    layer: layer,
                    extendedTool: extendedTool
                },
                callback: function(response, callbackObj) {
                    var layer = callbackObj.layer;
                    var extendedTool = callbackObj.extendedTool;
                    var featureInfo = JSON.parse(response.responseText);
                    
                    // Get mappings in template.json for this layer.
                    var layerMapping = mapper.layers.toolMapping.getLayerConfigs(callbackObj.layer.id, extendedTool.owningBlock.blockConfigs.layers);
                    var idProperties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['id'], 'propertyName');
                    // Combine all polygons belonging to a multipolygon into a multipolygon.
                    var features = mapper.OpenLayers.combineFeaturesByProperties(featureInfo.features, idProperties);
                    // Set current page and total pages.
                    var featureCount = features.length;
                    if (featureCount > 0) {
                        extendedTool.currentPage = 1;
                        extendedTool.totalPages = Math.ceil(featureCount / extendedTool.recordsPerPage);
                    }
                    
                    // Retrieve paging toolbar.
                    var items = extendedTool.component.getDockedItems();
                    var toolbar;
                    for (var i = 0, len = items.length; i < len; i+=1) {
                        if (items[i].xtype === 'toolbar') {
                            toolbar = items[i];
                            break;
                        }
                    }
                    // Set total pages for paging form elements.
                    toolbar.child('#inputItem').setMaxValue(extendedTool.totalPages);
                    
                    var featureList = [];
                    for (var i = 0, len = features.length; i < len; i+=1) {
                        // featureList is a multidimentional array of feature ids and checked values. Not storing objects for performance reasons.
                        featureList.push([features[i].properties[idProperties[0]], true]);
                    }
                    
                    if (extendedTool.sortColumnName !== null) {
                        extendedTool.featureList = extendedTool.sortFeatureList(featureList, features, extendedTool.sortColumnName, idProperties[0], extendedTool.sortDirection);
                    } else {
                        extendedTool.featureList = featureList;
                    }
                    
                    /* Check to see if we're supposed to highlight a feature */
                    if (extendedTool.selectedFeatureId !== null) {
                        var currentPage = extendedTool.currentPage;
                        var recordIndex = null;
                        var recordPage = 1;
                        //Determine the recordIndex for the selectedFeature 
                        for (var i = 0, len = featureList.length; i < len; i+=1) {
                            var feature = featureList[i];
                            if (feature[0] === extendedTool.selectedFeatureId) {
                                recordIndex = i;
                                break;
                            }
                        }
                        
                        if (recordIndex !== null) {
                            //Determine the page and the new record index
                            while (recordIndex >= extendedTool.recordsPerPage) {
                                recordIndex -= extendedTool.recordsPerPage;
                                recordPage += 1;
                            }
                            
                            //Set the row and change the page
                            extendedTool.rowToSelect = recordIndex;
                            extendedTool.currentPage = recordPage;

                        } else {
                            // Highlighted record was not found so remove the table and map highlight 
                            extendedTool.rowToSelect = null;
                            extendedTool.unhighlightFeature(extendedTool.selectedFeatureId);
                        }
                    }
                    extendedTool.buildTableFromIdList();
                }
            });
        }
    },
    createExtendedTool: function(owningBlock) {
        var heightDiff = -1;
        var parentHeight = owningBlock.parent.blockConfigs.height;
        var height = owningBlock.blockConfigs.height;
        if (typeof(parentHeight) !== 'undefined' && typeof(parentHeight) === 'number' && typeof(height) !== 'undefined' && typeof(height) === 'number') {
            heightDiff = parentHeight - height;
        }
        
        var defaultSortColumn = null;
        var columnMetaData = [];
        var displayedLayers = mapper.layers.query(
            mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId()),
            {
                type: 'layer',
                display: true
            },
            ['overlays', 'boundaries']
        );
        
        // Finds the id property of a mapped displayed layer to set the default sort.
        for (var i = 0, len = displayedLayers.length; i < len; i+=1) {
            var layer = displayedLayers[i];
            var toolLayerConfig = mapper.layers.toolMapping.getLayerConfigs(layer.id, owningBlock.blockConfigs.layers);
            if (toolLayerConfig !== null) {
                defaultSortColumn = mapper.layers.toolMapping.getFeaturePropertiesByTypes(toolLayerConfig.featureInfo, ['id'], 'propertyName')[0];
                var properties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(toolLayerConfig.featureInfo, ['id', 'name', 'display']);
                for (var j = 0, length = properties.length; j < length; j+=1) {
                    var property = properties[j];
                    columnMetaData.push({
                        name: property.propertyName,
                        width: (property.hasOwnProperty('columnWidth')) ? property.columnWidth : 120,
                        hidden: false
                    });
                }
                break;
            }
        }
        
        var extendedTool = {
            owningBlock: owningBlock,
            heightDiff: heightDiff,
            mask: null,
            vector: new ol.layer.Vector({
                source: new ol.source.Vector()
            }),
            currentRequestId: null, // Store latest request id in case a previous request returns after sending latest request.
            mapClickEventKey: null, // Store the id of the registered map click event so we can remove it later.
            selectedFeatureId: null, // Store the selected feature to prevent highlighting over it.
            highlightedFeatureId: null, // Store the highlighted feature id to prevent highlighting it again.
            afterPageText : 'of {0}', // Text to appear after page text box. {0} will be replaced by total pages.
            rowCountText: 'Showing {0} - {1} of {2}',
            featureList: [], // Store a list of all feature ids and their checked status in the table.
            currentPage: 0,
            totalPages: 0,
            recordsPerPage: 50, // Changing this will alter how many records are displayed per page.
            columnMetaData: columnMetaData,  // Stores information about columns. (display order, hidden status, width)
            sortColumnName: defaultSortColumn, // Store the name of the column to be sorted by. Column name is the same as the feature info property to sort by.
            sortDirection: 'ASC', // Store the sort direction.
            rowToSelect: null, // When highlighting a row in the table, if the record is on another page, set this to the row index to be highlighted when changing pages.
            isMasked: false, // Prevent interactions while table is masked.
            
            // Custom sort functions to sort features based on one of their properties. Supports sorting strings in which some strings start with numbers.
            naturalSort: function(array, columnName){
                var sortColumn = columnName;
                var a, b, a1, b1, rx=/(\d+)|(\D+)/g, rd=/\d+/;
                return array.sort(function(as, bs){
                    a= String(as.properties[sortColumn]).toLowerCase().match(rx);
                    b= String(bs.properties[sortColumn]).toLowerCase().match(rx);
                    while(a.length && b.length){
                        a1= a.shift();
                        b1= b.shift();
                        if(rd.test(a1) || rd.test(b1)){
                            if(!rd.test(a1)) return 1;
                            if(!rd.test(b1)) return -1;
                            if(a1!= b1) return a1-b1;
                        }
                        else if(a1!= b1) return a1> b1? 1: -1;
                    }
                    return a.length- b.length;
                });
            },
            naturalSortDesc: function(array, columnName){
                var sortColumn = columnName;
                var a, b, a1, b1, rx=/(\d+)|(\D+)/g, rd=/\d+/;
                // Same as naturalSort but we switch variables 'as' and 'bs' around.
                return array.sort(function(bs, as){
                    a= String(as.properties[sortColumn]).toLowerCase().match(rx);
                    b= String(bs.properties[sortColumn]).toLowerCase().match(rx);
                    while(a.length && b.length){
                        a1= a.shift();
                        b1= b.shift();
                        if(rd.test(a1) || rd.test(b1)){
                            if(!rd.test(a1)) return 1;
                            if(!rd.test(b1)) return -1;
                            if(a1!= b1) return a1-b1;
                        }
                        else if(a1!= b1) return a1> b1? 1: -1;
                    }
                    return a.length- b.length;
                });
            },
            // Creates an instance of ol.Feature
            getOLFeature: function(featureInfo, style, layer) {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                var feature = featureInfo.features[0];
                var featureProjection = layer.srs;
                var coords = feature.geometry.coordinates;
                var type = feature.geometry.type;
                var mapProjection = map.getView().getProjection().getCode();
                var layerMapping = mapper.layers.toolMapping.getLayerConfigs(layer.id, this.owningBlock.blockConfigs.layers);
                var idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['id'], 'propertyName')[0];
                
                // Convert coordinate projection if needed.
                if (featureProjection !== mapProjection) {
                    coords = mapper.OpenLayers.convertCoordProj(coords, featureProjection, mapProjection);
                }
                
                var geometry;
                if (type === 'MultiPolygon') {
                    geometry = new ol.geom.MultiPolygon(coords);
                } else {
                    geometry = new ol.geom.Polygon(coords);
                }
                
                var olFeature = new ol.Feature(geometry);
                olFeature.setId(feature.properties[idProperty]);
                olFeature.setStyle(style);
                
                return olFeature;
            },
            // Creates and instance of ol.style.Style to be applied to a selected feature.
            getSelectedStyle: function() {
                return new ol.style.Style({
                    stroke : new ol.style.Stroke({
                        color : 'rgba(135,206,235,1)',
                        width : 4
                    }),
                    fill : new ol.style.Fill({
                        color : 'rgba(0,0,0,0)'
                    })
                });
            },
            // Creates and instance of ol.style.Style to be applied to a highlighted feature.
            getHighlightedStyle: function() {
                return new ol.style.Style({
                    stroke : new ol.style.Stroke({
                        color : 'rgba(255,154,0,.8)',
                        width : 1
                    }),
                    fill : new ol.style.Fill({
                        color : 'rgba(255,154,0,.5)'
                    })
                });
            },
            // Add a click event to the map to highlight a fire that is clicked on.
            addMapEvent: function() {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                
                this.mapClickEventKey = map.on('click', function(event) {
                    if (this.isMasked === true) return;
                    var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                    var displayedOverlays = mapper.layers.query(
                        layersConfig.overlays,
                        {
                            type: 'layer',
                            display: true,
                            loadOnly: false,
                            mask: false
                        }
                    );
                    
                    if (displayedOverlays.length > 0) {
                        for (var i = 0, len = displayedOverlays.length; i < len; i+=1) {
                            var overlay = displayedOverlays[i];
                            var toolLayerConfig = mapper.layers.toolMapping.getLayerConfigs(overlay.id, this.owningBlock.blockConfigs.layers);
                            if (toolLayerConfig !== null) {
                                var featureInfo = mapper.OpenLayers.getFeatureInfoForLayerWithXYCoordAndMap(overlay, event.coordinate, map);
                                this.selectFeature(featureInfo, overlay);
                                break;
                            }
                        }
                    }
                }, this);
            },
            // Removes the map click event.
            removeMapEvent: function(event) {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                
                map.removeLayer(this.vector);
                this.vector.getSource().clear();
                
                map.unByKey(this.mapClickEventKey);
            },
            // Gets the ids from the full list of feature ids that belong to the current page and rebuilds the table with those features.
            buildTableFromIdList: function() {
                // Retrieve the paging toolbar.
                var items = this.component.getDockedItems();
                var toolbar;
                for (var i = 0, len = items.length; i < len; i+=1) {
                    if (items[i].xtype === 'toolbar') {
                        toolbar = items[i];
                        break;
                    }
                }
                
                // Sets paging buttons enabled/disabled as needed.
                toolbar.child('#first').setDisabled((this.currentPage === 1));
                toolbar.child('#prev').setDisabled((this.currentPage === 1));
                toolbar.child('#next').setDisabled((this.currentPage === this.totalPages));
                toolbar.child('#last').setDisabled((this.currentPage === this.totalPages));
                toolbar.child('#inputItem').setValue(this.currentPage);
                toolbar.child('#afterTextItem').setText(Ext.String.format(this.afterPageText, this.totalPages));
                
                var firstRecordCount = (this.currentPage === 0) ? 0 : ((this.currentPage - 1) * this.recordsPerPage) + 1;
                var lastRecordCount = this.currentPage * this.recordsPerPage;
                var totalRecordCount = this.featureList.length;
                if (lastRecordCount > totalRecordCount) lastRecordCount = totalRecordCount;
                toolbar.child('#rowCount').setText(Ext.String.format(extendedTool.rowCountText, firstRecordCount.toLocaleString(), lastRecordCount.toLocaleString(), totalRecordCount.toLocaleString()));
                
                if (this.featureList.length === 0) {  // If no features are returned, empty the table.
                    this.component.getStore().removeAll();
                    this.unMaskComponent();
                    this.owningBlock.fire('tableUpdatedEvent', this);
                    return;
                }
                
                var mappedLayerIds = [];
                var mappedLayers = this.owningBlock.blockConfigs.layers;
                for (var i = 0, len = mappedLayers.length; i < len; i+=1) {
                    mappedLayerIds.push(mappedLayers[i].id);
                }
                
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layers = mapper.layers.query(
                    layersConfig,
                    function(layer) {
                        if (layer.type === 'layer' && mappedLayerIds.indexOf(layer.id) !== -1 && layer.mask === false && (layer.display === true || layer.loadOnly === true)) {
                            return true;
                        }
                        return false;
                    },
                    ['overlays']
                );
                
                var completeRequestCount = 0;
                
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];
                    var featureProperties = [];
                    var featureParam = '';
                    var idProperty = '';
                    var cqlFilterParam = '';
                    var idList = [];
                  
                    
                    // Create the 'propertyName' wfs parameter from the layer mapping in template.json.
                    var toolLayerConfig = mapper.layers.toolMapping.getLayerConfigs(layer.id, extendedTool.owningBlock.blockConfigs.layers);
                    if (toolLayerConfig !== null) {
                        idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(toolLayerConfig.featureInfo, ['id'], 'propertyName')[0];
                        var featureInfoConfigs = mapper.layers.toolMapping.getFeaturePropertiesByTypes(toolLayerConfig.featureInfo, ['id', 'name', 'display']);
                        for (var j = 0, length = featureInfoConfigs.length; j < length; j+=1) {
                            featureProperties.push(featureInfoConfigs[j].propertyName);
                        }
                    }
                    
                    if (featureProperties.length > 0) {
                        featureParam = '&propertyName='+featureProperties.join(',');
                    }
                    
                    // Retrieve the fire ids for the current page and create the cql filter.
                    var startIndex = (this.currentPage - 1) * this.recordsPerPage;
                    var endIndex = startIndex + this.recordsPerPage - 1;
                    if (endIndex >= this.featureList.length) endIndex = this.featureList.length - 1;
                    for (var i = startIndex; i <= endIndex; i+=1) {
                        idList.push(this.featureList[i][0]);
                    }
                    
                    if (idList.length > 0) {
                        cqlFilterParam = '&CQL_FILTER='+idProperty+" IN ('"+idList.join("','")+"')";
                    }
                    
                    var url = layer.source.wfs;
                    var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+layer.srs+'&typeNames='+layer.name+'&outputFormat=application/json'+featureParam+cqlFilterParam;
                    mapper.common.asyncAjax({
                        type: 'POST',
                        url: url,
                        params: params,
                        callbackObj: {
                            layer: layer,
                            extendedTool: extendedTool,
                            idList: idList,
                            numRequests: len
                        },
                        callback: function(response, callbackObj) {
                            var layer = callbackObj.layer;
                            var extendedTool = callbackObj.extendedTool;
                            var featureInfo = JSON.parse(response.responseText);
                            var layerMapping = mapper.layers.toolMapping.getLayerConfigs(layer.id, extendedTool.owningBlock.blockConfigs.layers);
                            var idProperties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['id'], 'propertyName');
                            var features = mapper.OpenLayers.combineFeaturesByProperties(featureInfo.features, idProperties);
                            var idList = callbackObj.idList;
                            var sortedFeatures = [];
                            
                            for (var i = 0, len = idList.length; i < len; i+=1) {
                                var id = idList[i];
                                for (var j = 0, length = features.length; j < length; j+=1) {
                                    var feature = features[j];
                                    if (feature.properties[idProperties[0]] === id) {
                                        sortedFeatures.push(feature);
                                    }
                                }
                            }
                            extendedTool.addFeaturesToTable(layer, sortedFeatures);
                            
                            completeRequestCount+=1;
                            // If multiple layers are being filtered, execute after all requests are returned.
                            if (completeRequestCount === callbackObj.numRequests) {
                                extendedTool.unMaskComponent();
                                extendedTool.component.updateLayout();
                                //Fire the tableUpdatedEvent so the label gets updated with the new count
                                extendedTool.owningBlock.fire('tableUpdatedEvent', extendedTool);
                            }
                        }
                    });
                }
            },
            // When checking or unchecking a record in the table, store the checked value along with the id of that record.
            storeCheckedValue: function(recordIndex, checked) {
                var record = this.component.getStore().getAt(recordIndex); // The record that was checked/unchecked.
                var mappedLayers = this.owningBlock.blockConfigs.layers;
                for (var i = 0, len = mappedLayers.length; i < len; i+=1) {
                    var mappedLayer = mappedLayers[i];
                    var idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(mappedLayer.featureInfo, ['id'], 'propertyName')[0];
                    var featureId = record.get(idProperty);
                    if (featureId) {
                        var featureList = this.featureList;
                        for (var j = 0, length = featureList.length; j < length; j+=1) {
                            var feature = featureList[j];
                            // Index 0 holds feature id. Index 1 holds checked status.
                            if (feature[0] === featureId) {
                                feature[1] = checked;
                                return;
                            }
                        }
                    }
                }
            },
            // Set all stored checked values to checked/unchecked.
            setAllChecked: function(allChecked) {
                var featureList = this.featureList;
                for (var i = 0, len = featureList.length; i < len; i+=1) {
                    featureList[i][1] = allChecked;
                }
            },
            // Build the columns and data store and add it to the table.
            addFeaturesToTable: function(layer, features) {
                var layerToolConfig = mapper.layers.toolMapping.getLayerConfigs(layer.id, this.owningBlock.blockConfigs.layers);
                if (layerToolConfig === null) return;
                
                var featureInfoConfig = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerToolConfig.featureInfo, ['id', 'name', 'display']);
                var featureIdProperty = mapper.layers.toolMapping.getFeatureIdProperty(layerToolConfig.featureInfo);
                
                // Create the checkbox column.
                var fields = ['download'];
                var data = [];
                var columns = [{
                    extendedTool: this,
                    xtype: 'checkcolumn',
                    columnHeaderCheckbox: true,
                    dataIndex: 'download',
                    sortable: false,
                    enableColumnHide: false,
                    hideable: false,
                    menuDisabled: true,
                    resizable: false,
                    width: 40,
                    listeners: {
                        checkchange: function(column, recordIndex, checked) {
                            this.extendedTool.storeCheckedValue(recordIndex, checked);
                            this.onStoreDataUpdate();
                            this.extendedTool.owningBlock.fire('checkchange', this.extendedTool);
                        },
                        checkallchange: function(column, allChecked) {
                            this.extendedTool.owningBlock.fire('checkchange', this.extendedTool);
                        },
                        beforecheckallchange: function(column, allChecked) {
                            this.extendedTool.setAllChecked(allChecked);
                        }
                    }
                }];
                
                // Build out fields and data from layer mapping in template.json.
                var columnMetaData = this.columnMetaData;
                for (var i = 0, len = columnMetaData.length; i < len; i+=1) {
                    var columnName = columnMetaData[i].name;
                    var config;
                    var hidden = columnMetaData[i].hidden;
                    for (var j = 0, length = featureInfoConfig.length; j < length; j+=1) {
                        if (featureInfoConfig[j].propertyName === columnName) {
                            config = featureInfoConfig[j];
                            break;
                        }
                    }
                    
                    fields.push(columnName);
                    
                    var className = null;
                    // If a column was sorted, add appropriate sort arrow.
                    if (this.sortColumnName === columnName) {
                        if (this.sortDirection === 'ASC') {
                            className = 'x-column-header-sort-ASC';
                        } else if (this.sortDirection === 'DESC') {
                            className = 'x-column-header-sort-DESC';
                        }
                    }
                    
                    columns.push({
                        text: config.displayName,
                        dataIndex: columnName,
                        extendedTool: this,
                        hidden: hidden,
                        width: columnMetaData[i].width,
                        cls: className,
                        listeners: {
                            // Add column to list of hidden columns.
                            hide: function() {
                                for (var i = 0, len = this.extendedTool.columnMetaData.length; i < len; i+=1) {
                                    if (this.extendedTool.columnMetaData[i].name === this.dataIndex) {
                                        this.extendedTool.columnMetaData[i].hidden = true;
                                        break;
                                    }
                                }
                            },
                            // Remove column from list of hidden columns.
                            show: function() {
                                for (var i = 0, len = this.extendedTool.columnMetaData.length; i < len; i+=1) {
                                    if (this.extendedTool.columnMetaData[i].name === this.dataIndex) {
                                        this.extendedTool.columnMetaData[i].hidden = false;
                                        break;
                                    }
                                }
                            },
                            // Change sort state on header click.
                            headerclick: function(ct, column) {
                                if (this.dataIndex !== this.extendedTool.sortColumnName) {
                                    this.extendedTool.sortDirection = 'ASC';
                                } else if (this.extendedTool.sortDirection === 'ASC') {
                                    this.extendedTool.sortDirection = 'DESC';
                                } else if (this.extendedTool.sortDirection === 'DESC') {
                                    this.extendedTool.sortDirection = 'ASC';
                                } else {
                                    this.extendedTool.sortDirection = 'ASC';
                                }
                                
                                this.extendedTool.sortColumnName = this.dataIndex;
                                this.extendedTool.sortColumn();
                            }
                        }
                    });
                }
                
                // Create data store for table.
                var featureList = this.featureList;
                for (var i = 0, len = features.length; i < len; i+=1) {
                    var feature = features[i];
                    var obj = this.buildFeatureInfoObj(featureInfoConfig, feature);
                    
                    var featureId = mapper.layers.toolMapping.getFeatureId(layerToolConfig.featureInfo, feature);
                    obj[featureIdProperty] = featureId;
                    obj.layerId = layer.id;
                    obj.download = true;
                    for (var j = 0, length = featureList.length; j < length; j+=1) {
                        var existingFeature = featureList[j];
                        if (existingFeature[0] === featureId) {
                            obj.download = existingFeature[1];
                        }
                    }
                    
                    data.push(obj);
                }
                
                var store = Ext.create('Ext.data.Store', {
                    fields: fields,
                    data: data
                });
                
                this.component.reconfigure(store, columns);
              
                //If we're supposed to select a row in the table, scroll and select it 
                if (this.rowToSelect !== null) {
                    var tableView = this.component.getView();
                    this.component.suspendEvents();
                    tableView.scrollRowIntoView(this.rowToSelect);
                    tableView.select(this.rowToSelect);
                    this.component.resumeEvents();
                }
            },
            // Recurse through feature info and builds an object of feature properties and their values.
            buildFeatureInfoObj: function(toolFeatureInfoConfig, featureInfo, obj) {
                if (typeof(obj) === 'undefined') {
                    obj = {};
                }
                
                for (var propertyName in featureInfo) {
                    if (Object.prototype.toString.call(featureInfo[propertyName]) === '[object Object]') {
                        obj = this.buildFeatureInfoObj(toolFeatureInfoConfig, featureInfo[propertyName], obj);
                    }
                }
                
                for (var i = 0, len = toolFeatureInfoConfig.length; i < len; i+=1) {
                    var propertyConfig = toolFeatureInfoConfig[i];
                    if (featureInfo.hasOwnProperty(propertyConfig.propertyName)) {
                        var value = featureInfo[propertyConfig.propertyName];
                        if (value !== null) {
                            if (!isNaN(value)) {
                                if (propertyConfig.dataType === 'integer') {
                                    value = Math.round(value);
                                } else if (propertyConfig.dataType === 'decimal' && propertyConfig.hasOwnProperty('decimalPlaces') && !isNaN(propertyConfig.decimalPlaces)) {
                                    var decimalPlaces = parseInt(propertyConfig.decimalPlaces);
                                    var multiplier = 1;
                                    var cnt = 0;
                                    while (cnt < decimalPlaces) {
                                        cnt+=1;
                                        multiplier *= 10;
                                    }
                                    value = Math.round(value * multiplier) / multiplier;
                                } 
                                if (propertyConfig.formatNumber === true) {
                                    value = value.toLocaleString(undefined, {maximumSignificantDigits: 21});
                                }
                            } else if (propertyConfig.dataType === 'date') {
                                //ISO format is mm-dd-yyyy which assumes UTC but javascript date uses local
                                //so before converting string to a date, replace - with / and remove the Z
                                value = value.replace(/-/g, '\/').replace('Z', '');
                                if (propertyConfig.hasOwnProperty('format')) {
                                    value = mapper.common.date.formatDate(new Date(value), propertyConfig.format);
                                } else {
                                    value = new Date(value).toDateString();
                                }
                            }
                        }
                        obj[propertyConfig.propertyName] = value;
                    }
                }
                
                return obj;
            },
            // Sends request to retrieve all feature ids along with the feature info property to sort by. After sorting the features by the column, rebuild the full list of feature ids in the new order.
            sortColumn: function() {
                this.maskComponent();
                var propertyNameParam = [];
                var columnName = this.sortColumnName;
                if (columnName !== null) propertyNameParam.push(columnName);
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var displayedLayers = mapper.layers.query(
                    layersConfig,
                    function(layer) {
                        if (layer.type === 'layer' && layer.mask === false && (layer.display === true || layer.loadOnly === true)) {
                            return true;
                        }
                        return false;
                    },
                    ['overlays']
                );
                
                // Create cql filter to get back all features from the list of features.
                var featureIds = [];
                for (var i = 0, len = this.featureList.length; i < len; i+=1) {
                    featureIds.push("'"+this.featureList[i][0]+"'");
                }
                
                for (var i = 0, len = displayedLayers.length; i < len; i+=1) {
                    var layer = displayedLayers[i];
                    var cqlFilter = [];
                    var cqlFilterParam = '';
                    var idProperty = '';
                    
                    var toolLayerConfig = mapper.layers.toolMapping.getLayerConfigs(layer.id, extendedTool.owningBlock.blockConfigs.layers);
                    if (toolLayerConfig !== null) {
                        idProperty = mapper.layers.toolMapping.getFeaturePropertiesByTypes(toolLayerConfig.featureInfo, ['id'], 'propertyName')[0];
                        propertyNameParam.push(idProperty);
                    }
                    
                    if (layer.hasOwnProperty('cqlFilter')) {
                        for (var prop in layer.cqlFilter) {
                            if (layer.cqlFilter[prop] !== null) cqlFilter.push(layer.cqlFilter[prop]);
                        }
                    }
                    if (cqlFilter.length > 0) {
                        cqlFilterParam = '&CQL_FILTER='+cqlFilter.join(' AND ');
                    }
                    
                    // Send request for feature ids along with feature property to sort by (column name).
                    var url = layer.source.wfs;
                    var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+layer.srs+'&typeNames='+layer.name+'&outputFormat=application/json&propertyName='+propertyNameParam.join(',')+cqlFilterParam;
                    mapper.common.asyncAjax({
                        type: 'POST',
                        url: url,
                        params: params,
                        callbackObj: {
                            layer: layer,
                            extendedTool: extendedTool
                        },
                        callback: function(response, callbackObj) {
                            var layer = callbackObj.layer;
                            var extendedTool = callbackObj.extendedTool;
                            var columnName = extendedTool.sortColumnName;
                            var direction = extendedTool.sortDirection;
                            var featureInfo = JSON.parse(response.responseText);
                            var layerMapping = mapper.layers.toolMapping.getLayerConfigs(callbackObj.layer.id, extendedTool.owningBlock.blockConfigs.layers);
                            var idProperties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['id'], 'propertyName');
                            var features = mapper.OpenLayers.combineFeaturesByProperties(featureInfo.features, idProperties);
                            
                            extendedTool.featureList = extendedTool.sortFeatureList(extendedTool.featureList, features, columnName, idProperties[0], direction);
                            extendedTool.buildTableFromIdList();
                        }
                    });
                }
            },
            // Sort list of features by feature info property, strip feature list to just ids, and set checked state to the stored check state.
            sortFeatureList: function(oldFeatureList, features, propertyName, idProperty, direction) {
                if (direction === 'ASC') {
                    features = extendedTool.naturalSort(features, propertyName);
                } else if (direction === 'DESC') {
                    features = extendedTool.naturalSortDesc(features, propertyName);
                }
                
                // Retrieve only the feature ids from the sorted list.
                var newFeatureList = [];
                for (var i = 0, len = features.length; i < len; i+=1) {
                    var feature = features[i];
                    newFeatureList.push([feature.properties[idProperty], true]);
                }
                for (var j = 0, length = oldFeatureList.length; j < length; j+=1) {
                    var existingFeature = oldFeatureList[j];
                    if (existingFeature[1] === false) {
                        for (var i = 0, len = newFeatureList.length; i < len; i+=1) {
                            var newFeature = newFeatureList[i];
                            if (existingFeature[0] === newFeature[0]) {
                                newFeature[1] = false;
                                break;
                            }
                        }
                    }
                }
                
                return newFeatureList;
            },
            // Highlight row when clicked or for a specific fire in the table that was clicked on in the map.
            highlightTableRecord: function(propertyName, id) {
                var currentPage = this.currentPage;
                var featureList = this.featureList;
                var recordIndex = null;
                var recordPage = 1;
                for (var i = 0, len = featureList.length; i < len; i+=1) {
                    var feature = featureList[i];
                    if (feature[0] === id) {
                        recordIndex = i;
                        break;
                    }
                }
                if (recordIndex === null) return;
                
                while (recordIndex >= this.recordsPerPage) {
                    recordIndex -= this.recordsPerPage;
                    recordPage += 1;
                }
                
                if (recordPage === currentPage) {
                    var record = this.component.getStore().getAt(recordIndex);
                    if (record !== null) {
                        var tableView = this.component.getView();
                        this.component.suspendEvents();
                        tableView.scrollRowIntoView(record.index);
                        tableView.select(record);
                        this.component.resumeEvents();
                    }
                } else {
                    this.rowToSelect = recordIndex;
                    this.setCurrentPage(recordPage);
                }
            },
            selectFeature: function(featureInfo, layer) {
                if (featureInfo.features.length > 0) {
                    var feature = featureInfo.features[0];
                    var layerToolConfigs = mapper.layers.toolMapping.getLayerConfigs(layer.id, this.owningBlock.blockConfigs.layers);
                    var featureId = mapper.layers.toolMapping.getFeatureId(layerToolConfigs.featureInfo, feature);
                    var featureIdProperty = mapper.layers.toolMapping.getFeatureIdProperty(layerToolConfigs.featureInfo);
                    
                    // Check to make sure we are not selecting the same feature twice.
                    if (this.selectedFeatureId !== featureId) {
                        
                        // If we have another feature selected, unselect it first.
                        if (this.selectedFeatureId !== null) {
                            var currentFeature = this.vector.getSource().getFeatureById(this.selectedFeatureId);
                            if (currentFeature !== null) {
                                this.vector.getSource().removeFeature(currentFeature);
                            }
                        }
                        
                        // If we are selecting the currently highlighted feature, first remove the highlight.
                        // Since requests are asyncronous, we can't garuntee the feature will be highlighted before the user clicks.
                        if (featureId === this.highlightedFeatureId) {
                            var highlightedFeature = this.vector.getSource().getFeatureById(this.highlightedFeatureId);
                            if (highlightedFeature !== null) {
                                this.vector.getSource().removeFeature(highlightedFeature);
                            }
                            this.highlightedFeatureId = null;
                        }
                        
                        this.selectedFeatureId = featureId;  // Set the currently selected feature id.
                        var olFeature = this.getOLFeature(featureInfo, this.getSelectedStyle(), layer); // Create OpenLayers feature.
                        this.vector.getSource().addFeature(olFeature);
                        
                        // Find fire record in table.
                        this.highlightTableRecord(featureIdProperty, olFeature.getId());
                    } else {
                        // in case the user scrolls after selecting a feature and clicks the feature again, re-scroll to feature.
                        this.highlightTableRecord(featureIdProperty, this.selectedFeatureId);
                    }
                } else {  // No features where user clicked.
                    // If a feature is selected, de-select it.
                    if (this.selectedFeatureId !== null) {
                        var currentFeature = this.vector.getSource().getFeatureById(this.selectedFeatureId);
                        if (currentFeature !== null) {
                            this.vector.getSource().removeFeature(currentFeature);
                        }
                        this.selectedFeatureId = null;
                    }
                }
            },
            highlightFeature: function(featureInfo, layer) {
                var mapPanelBlock = extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                if (featureInfo.features.length > 0) {
                    var feature = featureInfo.features[0];
                    var layerToolConfigs = mapper.layers.toolMapping.getLayerConfigs(layer.id, this.owningBlock.blockConfigs.layers);
                    var featureId = mapper.layers.toolMapping.getFeatureId(layerToolConfigs.featureInfo, feature);
                    
                    // Check to make sure we are not trying to highlight the same polygon twice.
                    if (extendedTool.highlightedFeatureId !== featureId) {
                        
                        // If we have a feature currently highlighted, first remove the highlight.
                        if (extendedTool.highlightedFeatureId !== null) {
                            var highlightedFeature = extendedTool.vector.getSource().getFeatureById(extendedTool.highlightedFeatureId);
                            if (highlightedFeature !== null) {
                                extendedTool.vector.getSource().removeFeature(highlightedFeature);
                            }
                        }
                        
                        // Check to make sure we are not trying to highlight the currently selected feature.
                        if (extendedTool.selectedFeatureId !== featureId) {
                            var olFeature = extendedTool.getOLFeature(featureInfo, this.getHighlightedStyle(), layer);
                            extendedTool.highlightedFeatureId = featureId;
                            extendedTool.vector.getSource().addFeature(olFeature);
                            
                            // Remove and add the layer again to ensure it's on the top of the map.
                            map.removeLayer(extendedTool.vector);
                            map.addLayer(extendedTool.vector);
                        } else {
                            extendedTool.highlightedFeatureId = null;
                        }
                    }
                }
            },
            // Queries the features by feature id and calls eith selectFeature or highlightFeature.
            queryFeatureInfo: function(featureQuery, layer, callbackName) {
                var wfsSource = layer.source.wfs;
                var params = "service=WFS&request=GetFeature&version=1.1.0&srsName="+layer.srs+"&typeNames="+layer.name+"&outputFormat=application/json&CQL_FILTER="+featureQuery;
                var request = mapper.common.asyncAjax({
                    url: wfsSource,
                    params: params, 
                    type: 'POST',
                    callbackObj: {
                        extendedTool: this,
                        layer: layer,
                        callbackName: callbackName
                    },
                    callback: function(response, callbackObj) {
                        var extendedTool = callbackObj.extendedTool;
                        var callbackName = callbackObj.callbackName;
                        
                        // If another request was sent before this request completed, cancel this callback.
                        if (extendedTool.currentRequestId !== response.id) return;
                        var featureInfo = JSON.parse(response.responseText);
                        var layerMapping = mapper.layers.toolMapping.getLayerConfigs(callbackObj.layer.id, extendedTool.owningBlock.blockConfigs.layers);
                        var idProperties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerMapping.featureInfo, ['id'], 'propertyName');
                        featureInfo.features = mapper.OpenLayers.combineFeaturesByProperties(featureInfo.features, idProperties);
                        extendedTool[callbackName](featureInfo, callbackObj.layer);
                    }
                });
                
                this.currentRequestId = request.id;
            },
            unhighlightFeature: function(featureId) {
                var olFeature = this.vector.getSource().getFeatureById(featureId);
                if (olFeature !== null) {
                    this.vector.getSource().removeFeature(olFeature);
                }
            },
            maskComponent: function() {
                if (this.isMasked === true) return;
                this.isMasked = true;
                if (this.mask === null) {
                    this.mask = new Ext.LoadMask(this.component, {
                        msg : "Loading Feature information ..."
                    });
                }
                this.mask.show();
            },
            unMaskComponent: function() {
                if (this.isMasked === false) return;
                this.mask.hide();
                this.isMasked = false;
            },
            setCurrentPage: function(pageNum) {
                if (this.isMasked === true) return;
                this.maskComponent();
                if (typeof(pageNum) === 'undefined' || isNaN(pageNum)) pageNum = 1;
                pageNum = parseInt(pageNum, 10);
                if (pageNum <= 0) pageNum = 1;
                if (pageNum > this.totalPages) pageNum = this.totalPages;
                this.currentPage = pageNum;
                this.buildTableFromIdList();
            }
        };
        
        var parentBlock = owningBlock.parent;
        if (parentBlock !== null) {
            parentBlock.on('resize', function(callbackObj, postingObj) {
                var extendedTool = callbackObj;
                var heightDiff = extendedTool.heightDiff;
                if (heightDiff === -1) return;
                
                var parent = extendedTool.owningBlock.parent.component;
                var newHeight = parent.getHeight() - heightDiff;
                extendedTool.component.setHeight(newHeight);
            }, extendedTool);
        }
        
        var mapPanelBlock = owningBlock.getReferencedBlock('cMapPanel');
        if (mapPanelBlock.rendered === true) {
            var map = mapPanelBlock.component.map;
            map.addLayer(extendedTool.vector);
        } else {
            mapPanelBlock.on('rendercomponent', function(callbackObj, postingObj) {
                var extendedTool = callbackObj;
                var mapPanelTool = postingObj;
                var map = mapPanelTool.component.map;
                map.addLayer(extendedTool.vector);
            }, extendedTool);
        }
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var width = block.width;
        var height = block.height;
        var store = Ext.create('Ext.data.Store', {
                fields: [],
                data: []
            });
        
        var pagingToolbar = [{
            xtype: 'button',
            itemId: 'first',
            extendedTool: extendedTool,
            tooltip: 'First Page',
            iconCls: Ext.baseCSSPrefix + 'tbar-page-first',
            style: 'padding: 3px; border-color: transparent;',
            disabled: true,
            handler: function() {
                this.extendedTool.rowToSelect = null;
                this.extendedTool.setCurrentPage(1);
            }
        }, {
            xtype: 'button',
            itemId: 'prev',
            extendedTool: extendedTool,
            tooltip: 'Previous Page',
            iconCls: Ext.baseCSSPrefix + 'tbar-page-prev',
            style: 'padding: 3px; border-color: transparent;',
            disabled: true,
            handler: function() {
                this.extendedTool.rowToSelect = null;
                this.extendedTool.setCurrentPage(this.extendedTool.currentPage - 1);
            }
        },
        '-',
        'Page', {
            xtype: 'numberfield',
            itemId: 'inputItem',
            extendedTool: extendedTool,
            cls: Ext.baseCSSPrefix + 'tbar-page-number',
            allowDecimals: false,
            minValue: 1,
            hideTrigger: true,
            enableKeyEvents: true,
            keyNavEnabled: false,
            selectOnFocus: true,
            submitValue: false,
            isFormField: false,
            width: 40,
            value: extendedTool.currentPage,
            margins: '-1 2 3 2',
            mouseWheelEnabled: false,
            listeners: {
                //scope: me,
                keydown: function(field, event) {
                    var key = event.getKey();
                    var increment = event.shiftKey ? 10 : 1;
                    var value = parseInt(this.getValue(), 10);
                    var currentPage = this.extendedTool.currentPage;
                    
                    if (key == event.RETURN) {
                        event.stopEvent();
                        if (value && !isNaN(value)) {
                            this.extendedTool.setCurrentPage(value);
                        } else {
                            this.setValue(currentPage);
                        }
                    } else if (key == event.HOME || key == event.END) {
                        event.stopEvent();
                        var pageNum = (key == event.HOME) ? 1 : this.extendedTool.totalPages;
                        this.setValue(pageNum);
                        this.extendedTool.setCurrentPage(pageNum);
                    } else if (key == event.UP || key == event.PAGE_UP) {
                        event.stopEvent();
                        this.extendedTool.setCurrentPage((currentPage + increment));
                    } else if (key == event.DOWN || key == event.PAGE_DOWN) {
                        event.stopEvent();
                        this.extendedTool.setCurrentPage((currentPage + (increment * -1)));
                    }
                },
                blur: function() {
                    this.setValue(this.extendedTool.currentPage);
                }
            }
        }, {
            xtype: 'tbtext',
            itemId: 'afterTextItem',
            text: Ext.String.format(extendedTool.afterPageText, extendedTool.totalPages)
        },
        '-', {
            xtype: 'button',
            itemId: 'next',
            extendedTool: extendedTool,
            tooltip: 'Next Page',
            iconCls: Ext.baseCSSPrefix + 'tbar-page-next',
            style: 'padding: 3px; border-color: transparent;',
            handler: function() {
                this.extendedTool.rowToSelect = null;
                this.extendedTool.setCurrentPage(this.extendedTool.currentPage + 1);
            }
        }, {
            xtype: 'button',
            itemId: 'last',
            extendedTool: extendedTool,
            tooltip: 'Last Page',
            iconCls: Ext.baseCSSPrefix + 'tbar-page-last',
            style: 'padding: 3px; border-color: transparent;',
            handler: function() {
                this.extendedTool.rowToSelect = null;
                this.extendedTool.setCurrentPage(this.extendedTool.totalPages);
            }
        }, {
            xtype: 'tbfill'
        }, {
            xtype: 'tbtext',
            text: 'Records Per Page:'
        }];
        
        var recordsPerPageOptions = extendedTool.owningBlock.blockConfigs.recordsPerPageOptions;
        if (recordsPerPageOptions && recordsPerPageOptions.length > 0) {
            var toggleGroup = mapper.common.getRandomString(32, 36);
            //var data = [];
            extendedTool.recordsPerPage = recordsPerPageOptions[0];
            for (var i = 0, len = recordsPerPageOptions.length; i < len; i+=1) {
                var option = recordsPerPageOptions[i];
                /*data.push({
                    text: option.toLocaleString(),
                    value: option
                });*/
                
                pagingToolbar.push({
                    xtype: 'button',
                    extendedTool: extendedTool,
                    enableToggle: true,
                    toggleGroup: toggleGroup,
                    pressed: (i === 0),
                    text: option.toLocaleString(),
                    recordsPerPage: option,
                    handler: function() {
                        this.extendedTool.maskComponent();
                        this.extendedTool.recordsPerPage = this.recordsPerPage;
                        this.extendedTool.totalPages = Math.ceil(this.extendedTool.featureList.length / this.extendedTool.recordsPerPage);
                        if (this.extendedTool.currentPage > this.extendedTool.totalPages) this.extendedTool.currentPage = this.extendedTool.totalPages;
                        this.extendedTool.buildTableFromIdList();
                    }
                });
            }
            
            /*pagingToolbar.push({
                xtype: 'combobox',
                extendedTool: extendedTool,
                width: 60,
                editable: false,
                store: Ext.create('Ext.data.Store', {
                    fields: ['text', 'value'],
                    data: data
                }),
                value: recordsPerPageOptions[0],
                displayField: 'text',
                valueField: 'value',
                listeners: {
                    select: function() {
                        this.extendedTool.maskComponent();
                        this.extendedTool.recordsPerPage = this.getValue();
                        this.extendedTool.totalPages = Math.ceil(this.extendedTool.featureList.length / this.extendedTool.recordsPerPage);
                        if (this.extendedTool.currentPage > this.extendedTool.totalPages) this.extendedTool.currentPage = this.extendedTool.totalPages;
                        this.extendedTool.buildTableFromIdList();
                    }
                }
            });*/
        }
        
        pagingToolbar.push({xtype: 'tbfill'});
        pagingToolbar.push({
            xtype: 'tbtext',
            itemId: 'rowCount',
            text: Ext.String.format(extendedTool.rowCountText, 1, extendedTool.recordsPerPage, extendedTool.totalPages)
        });
        
        var extTool = {
            extendedTool: extendedTool,
            xtype: 'grid',
            store: store,
            columns: [],
            scroll: true,
            flex: 1,
            border: 1,
            width : width,
            height : height,
            bbar: pagingToolbar,
            listeners : {
                afterrender : function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
                        mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                        this.extendedTool.owningBlock.itemDefinition.layersConfigUpdated,
                        this.extendedTool);
                    
                    this.extendedTool.addMapEvent();
                    this.columnManager.headerCt.extendedTool = this.extendedTool;
                    
                    // Call manually after first load.
                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                    this.extendedTool.owningBlock.itemDefinition.layersConfigUpdated(layersConfig, this.extendedTool);
                },
                itemmouseenter: function(view, record) {
                    //var layerId = record.get('layerId');
                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                    var layers = mapper.layers.query(
                        layersConfig,
                        {
                            //id: layerId,
                            display: true
                        },
                        ['overlays', 'boundaries']
                    );
                    
                    if (layers.length > 0) {
                        for (var i = 0, len = layers.length; i < len; i+=1) {
                            var layer = layers[i];
                            var layerToolConfigs = mapper.layers.toolMapping.getLayerConfigs(layer.id, this.extendedTool.owningBlock.blockConfigs.layers);
                            if (layerToolConfigs !== null) {
                                var idProperties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerToolConfigs.featureInfo, ['id']);
                                var idQuery = [];
                                for (var i = 0, len = idProperties.length; i < len; i+=1) {
                                    var property = idProperties[i].propertyName;
                                    var value = record.get(property);
                                    idQuery.push(property + " = '" + value + "'");
                                }
                                this.extendedTool.queryFeatureInfo(idQuery.join(' AND '), layer, 'highlightFeature');
                                break;
                            }
                        }
                    }
                },
                select: function(gridPanel, record) {
                    //var layerId = record.get('layerId');
                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                    var layers = mapper.layers.query(
                        layersConfig,
                        {
                            //id: layerId,
                            display: true
                        },
                        ['overlays', 'boundaries']
                    );
                    
                    if (layers.length > 0) {
                        for (var i = 0, len = layers.length; i < len; i+=1) {
                            var layer = layers[i];
                            var layerToolConfigs = mapper.layers.toolMapping.getLayerConfigs(layer.id, this.extendedTool.owningBlock.blockConfigs.layers);
                            if (layerToolConfigs !== null) {
                                var idProperties = mapper.layers.toolMapping.getFeaturePropertiesByTypes(layerToolConfigs.featureInfo, ['id']);
                                var idQuery = [];
                                for (var i = 0, len = idProperties.length; i < len; i+=1) {
                                    var property = idProperties[i].propertyName;
                                    var value = record.get(property);
                                    idQuery.push(property + " = '" + value + "'");
                                }
                                this.extendedTool.queryFeatureInfo(idQuery.join(' AND '), layer, 'selectFeature');
                                break;
                            }
                        }
                    }
                },
                columnmove: function(ct, column, fromIndex, toIndex) {
                    var columnMetaData = this.extendedTool.columnMetaData;
                    var columns = ct.getGridColumns();
                    var newColumnMetaData = [];
                    for (var j = 0, length = columns.length; j < length; j+=1) {
                        var column = columns[j];
                        for (var i = 0, len = columnMetaData.length;  i < len; i+=1) {
                            var metaData = columnMetaData[i];
                            if (column.dataIndex === metaData.name) {
                                newColumnMetaData.push(metaData);
                                break;
                            }
                        }
                    }
                    this.extendedTool.columnMetaData = newColumnMetaData;
                },
                columnresize: function(ct, column) {
                    for (var i = 0, len = this.extendedTool.columnMetaData.length; i < len; i+=1) {
                        if (this.extendedTool.columnMetaData[i].name === column.dataIndex) {
                            this.extendedTool.columnMetaData[i].width = column.width;
                            break;
                        }
                    }
                }
            }
        };
        extTool = skin.blocks.addToolBarItems(block, extTool, toolbar);
        return skin.ExtJSPosition(extTool, block);
    }
};

export var toolName = "cFeatureInfoTable";
export var tool = cFeatureInfoTable;