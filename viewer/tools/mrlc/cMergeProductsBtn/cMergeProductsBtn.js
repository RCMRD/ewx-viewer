var cMergeProductsBtn = {
    options: {
        requiredBlocks: ['cFeatureInfoTable', 'cSelectProductsList', 'cSelectResolutionRadios', 'cSelectBBOXTool', 'cSelectRegionTool', 'cRegionTool', 'cStateTool', 'cSubStateTool', 'cMapPanel']
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            selectedCoordinates: null,
            selectedProjection: null,
            getCoordsFromExtent: function(extent) {
                var minx = extent[0],
                miny = extent[1],
                maxx = extent[2],
                maxy = extent[3];
                return [[[[minx,miny], [minx,maxy], [maxx,maxy], [maxx,miny], [minx,miny]]]];
            },
            productSelected: false,
            projectSelected: false,
            setEnabled: function() {
                if (this.projectSelected === true && this.productSelected === true) {
                    this.component.enable();
                } else {
                    this.component.disable();
                }
            },
            startMerge: function() {
                var featureInfoTableBlock = this.owningBlock.getReferencedBlock('cFeatureInfoTable');
                var selectProductsListBlock = this.owningBlock.getReferencedBlock('cSelectProductsList');
                
                if (featureInfoTableBlock !== null && selectProductsListBlock !== null) {
                    var resolution = '10';
                    var selectResolutionRadiosBlock = this.owningBlock.getReferencedBlock('cSelectResolutionRadios');
                    if (selectResolutionRadiosBlock !== null) {
                        var values = selectResolutionRadiosBlock.component.getValue();
                        for (var prop in values) {
                            resolution = values[prop];
                            break;
                        }
                    }
                    
                    var projects = [];
                    var featureList = featureInfoTableBlock.extendedTool.featureList;
                    for (var i = 0, len = featureList.length; i < len; i+=1) {
                        if (featureList[i][1] === true) projects.push(featureList[i][0]);
                    }
                    var products = selectProductsListBlock.component.getValue().products;
                    if (Object.prototype.toString.call(products) === "[object String]") {
                        products = [products];
                    }
                    var coordinates = this.selectedCoordinates;
                    var projection = this.selectedProjection;
                    var email = mapper.userEmail;
                    var params = 'email='+email+'&projection='+projection+'&coordinates='+JSON.stringify(coordinates)+'&products='+products.join(',')+'&projects='+projects.join(',')+'&resolution='+resolution;
                    
                    mapper.common.asyncAjax({
                        type: 'POST',
                        url: '/cdiviewer/proxies/cdi/addQueue.php',
                        params: params,
                        callback: function(response) {
                            var responseJson = JSON.parse(response.responseText);
                            if (responseJson.success === true) {
                                Ext.MessageBox.alert("", "Successfully added job to the queue. An email will be sent to " + mapper.userEmail + " when the job is complete.");
                            } else {
                                Ext.MessageBox.alert("", responseJson.errorMessage);
                            }
                        }
                    });
                }
            }
        };
        
        var selectProductsListBlock = owningBlock.getReferencedBlock('cSelectProductsList');
        if (selectProductsListBlock !== null) {
            selectProductsListBlock.on('checkchange', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                var selectProductsList = postingObj;
                var products = eventObj;
                
                extendedTool.productSelected = false;
                for (var prop in products) {
                    extendedTool.productSelected = true;
                    break;
                }
                
                extendedTool.setEnabled();
            }, extendedTool);
        }
        
        var selectBboxTool = owningBlock.getReferencedBlock('cSelectBBOXTool');
        if (selectBboxTool !== null) {
            selectBboxTool.on('aoiSelected', function(callbackObj, postingObj) {
                var extendedTool = callbackObj,
                selectBboxTool = postingObj,
                extent = selectBboxTool.selectedExtent,
                coords = extendedTool.getCoordsFromExtent(extent);
                extendedTool.selectedCoordinates = coords;
                extendedTool.selectedProjection = selectBboxTool.selectedProjection;
            }, extendedTool);
        }
        
        var selectRegionBlock = owningBlock.getReferencedBlock('cSelectRegionTool');
        if (selectRegionBlock !== null) {
            selectRegionBlock.on('aoiSelected', function(callbackObj, postingObj) {
                var extendedTool = callbackObj,
                selectRegionTool = postingObj;
                extendedTool.selectedCoordinates = selectRegionTool.selectedCoords;
                extendedTool.selectedProjection = selectRegionTool.selectedProjection;
            }, extendedTool);
        }
        
        var selectStateBlock = owningBlock.getReferencedBlock('cStateTool');
        if (selectStateBlock !== null) {
            selectStateBlock.on('select', function(callbackObj, postingObj) {
                var extendedTool = callbackObj,
                selectStateTool = postingObj;
                extendedTool.selectedCoordinates = selectStateTool.selectedCoords;
                extendedTool.selectedProjection = selectStateTool.selectedProjection;
            }, extendedTool);
        }
        
        var selectSubStateBlock = owningBlock.getReferencedBlock('cSubStateTool');
        if (selectSubStateBlock !== null) {
            selectSubStateBlock.on('select', function(callbackObj, postingObj) {
                var extendedTool = callbackObj,
                selectSubStateTool = postingObj;
                extendedTool.selectedCoordinates = selectSubStateTool.selectedCoords;
                extendedTool.selectedProjection = selectSubStateTool.selectedProjection;
            }, extendedTool);
        }
        
        var featureInfoTableBlock = owningBlock.getReferencedBlock('cFeatureInfoTable');
        if (featureInfoTableBlock !== null) {
            featureInfoTableBlock.on('checkchange', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                var featureInfoTable = postingObj;
                var featureList = featureInfoTable.featureList;
                extendedTool.projectSelected = false;
                for (var i = 0, len = featureList.length; i < len; i+=1) {
                    if (featureList[i][1] === true) {
                        extendedTool.projectSelected = true;
                        break;
                    }
                }
                
                extendedTool.setEnabled();
            }, extendedTool);
            
            featureInfoTableBlock.on('tableUpdatedEvent', function(callbackObj, postingObj, eventObj) {
                var extendedTool = callbackObj;
                var featureInfoTable = postingObj;
                var featureList = featureInfoTable.featureList;
                extendedTool.projectSelected = false;
                for (var i = 0, len = featureList.length; i < len; i+=1) {
                    if (featureList[i][1] === true) {
                        extendedTool.projectSelected = true;
                        break;
                    }
                }
                
                extendedTool.setEnabled();
            }, extendedTool);
        }
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var component = {
            extendedTool: extendedTool,
            xtype: 'button',
            width: block.width,
            height: block.height,
            text: block.text,
            disabled: true,
            handler: function() {
                this.extendedTool.startMerge();
            },
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    var regionBlock = this.extendedTool.owningBlock.getReferencedBlock('cRegionTool');
                    if (regionBlock !== null) {
                        if (regionBlock.rendered === true) {
                            var extent = regionBlock.extendedTool.selectedCoords;
                            var coords = this.extendedTool.getCoordsFromExtent(extent);
                            this.extendedTool.selectedCoordinates = coords;
                            this.extendedTool.selectedProjection = regionBlock.extendedTool.selectedProjection;
                        }
                        
                        regionBlock.on('regionSelected', function(callbackObj, postingObj) {
                            var extendedTool = callbackObj,
                            regionTool = postingObj,
                            extent = regionTool.selectedCoords,
                            coords = extendedTool.getCoordsFromExtent(extent);
                            extendedTool.selectedCoordinates = coords;
                            extendedTool.selectedProjection = regionTool.selectedProjection;
                        }, this.extendedTool);
                    }
                }
            }
        };
        
        return component;
    }
};

export var toolName = "cMergeProductsBtn";
export var tool = cMergeProductsBtn;