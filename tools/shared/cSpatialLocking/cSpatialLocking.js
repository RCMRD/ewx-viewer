var cSpatialLocking = {
    updateNames : function (eventObject, callbackObject, postingObject) {
        var aMapWindow = postingObject;
        var checkboxID = aMapWindow.component.getId() + "checkbox";
        var extCheckBox = Ext.getCmp(checkboxID);
        var extMapWindow = Ext.getCmp(aMapWindow.component.getId());
        extCheckBox.setBoxLabel(extMapWindow.title);
    },
    removeWindowFromExtList : function (eventObject, callbackObject, postingObject) {
        var aMapWindow = postingObject;
        var extendedTool = callbackObject;
        var spatialLockingExtTool = extendedTool.component;
        var count = spatialLockingExtTool.items.getCount();

        for (var i = 0; i < count; i++) {
            var extCheckBox = spatialLockingExtTool.items.items[i];
            var mapWindowIDForCheckBox = extCheckBox.id;

            if (mapWindowIDForCheckBox == (aMapWindow.component.getId() + "checkbox")) {
                i = count;
                spatialLockingExtTool.remove(extCheckBox);
            }
        }
    },
    addWindowToExtList : function (eventObject, aCallbackObject, postingObject) {
        var aMapWindow = postingObject,
        extendedTool = aCallbackObject,
        mapWindowTitle = aMapWindow.component.title;
        //mapWindowTitle = aMapWindow.mapWindowExtWindowTitle;
        if (mapWindowTitle.length > 34) {
            mapWindowTitle = mapWindowTitle.substr(0, 31) + '...';
        }

        var newCheckbox = new Ext.form.Checkbox({
            extendedTool: extendedTool,
            id : aMapWindow.component.getId() + "checkbox",
            fieldlabel : "aLabel",
            boxLabel : mapWindowTitle,
            grow : true,
            listeners : {
                change : function (field, newValue, oldValue, options) {
                    skin.cSpatialLocking.unlockMaps();
                    skin.cSpatialLocking.lockMaps(this.extendedTool);
                }
            }
        });

        Ext.getCmp('spatialLockingToolExtPanel').add(newCheckbox);
    },
    lockMaps : function (extendedTool) {

        var totalWindows = skin.blocks.getBlocksByName('cMapWindow');

        var extCheckBoxes = Ext.getCmp('spatialLockingToolExtPanel').items.items;
        var checkedMapWindows = new Array();
        //-------

        //get checked mapWindows
        //start at 1 to skip first checkbox
        var x;
        var len;
        for (x = 0, len = extCheckBoxes.length; x < len; x += 1) {
            if (extCheckBoxes[x].checked == true)
                checkedMapWindows.push(totalWindows[x]);
        }

        if (totalWindows.length > 1) {
            var center, resolution;
            for (x = 0, len = checkedMapWindows.length; x < len; x += 1) {
                var mapPanelBlock = checkedMapWindows[x].getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                var view = map.getView();
                if (x === 0) {
                    center = view.getCenter();
                    resolution = view.getResolution();
                } else {
                    view.setCenter(center);
                    view.setResolution(resolution);
                }
                view.set('map', map);
                view.set('extendedTool', extendedTool);
                view.set('uniqueId', mapper.common.getRandomString(32, 36));
                
                view.on('change:center', function(event) {
                    this.get('extendedTool').handleCenter(this);
                });
                
                view.on('change:resolution', function(event) {
                    this.get('extendedTool').handleZoom(this);
                });
            }
        }
    },
    unlockMaps : function () {
        var totalWindows = skin.blocks.getBlocksByName('cMapWindow'); //code executed with checkbox is checked, locking map windows code

        for (var x = 0, len = totalWindows.length; x < len; x += 1) {
            var mapWindow = totalWindows[x];
            var mapPanelBlock = mapWindow.getReferencedBlock('cMapPanel');
            var map = mapPanelBlock.component.map;

            var currentView = map.getView();
            var currentZoom = currentView.getZoom();
            var currentCenter = currentView.getCenter();

            //ol3 doesnt store these when we create the view in defineOpenLayers
            //so we cant retrieve them

            var minZoom = 1;
            var zoomFactor = 1.2;

            map.setView(
                new ol.View({
                    center : currentCenter,
                    zoom : currentZoom,
                    zoomFactor : zoomFactor,
                    minZoom : minZoom
                }));
        }
    },
    createExtendedTool: function(owningBlock) {
        return {
            owningBlock: owningBlock,
            preventBacklash: false,
            handleCenter: function(view) {
                if (this.preventBacklash === false) {
                    this.preventBacklash = true;
                    var totalWindows = skin.blocks.getBlocksByName('cMapWindow');
                    var extCheckBoxes = Ext.getCmp('spatialLockingToolExtPanel').items.items;
                    var checkedMapWindows = [];
                    var x;
                    for (x = 0, len = extCheckBoxes.length; x < len; x += 1) {
                        if (extCheckBoxes[x].checked == true)
                            checkedMapWindows.push(totalWindows[x]);
                    }
                    for (var i = 0, len = checkedMapWindows.length; i < len; i+=1) {
                        var mapPanelBlock = checkedMapWindows[i].getReferencedBlock('cMapPanel');
                        var map = mapPanelBlock.component.map;
                        if (map.getView().get('uniqueId') !== view.get('uniqueId')) {
                            map.getView().setCenter(view.getCenter());
                        }
                    }
                    this.preventBacklash = false;
                }
            },
            handleZoom: function(view) {
                if (this.preventBacklash === false) {
                    this.preventBacklash = true;
                    var totalWindows = skin.blocks.getBlocksByName('cMapWindow');
                    var extCheckBoxes = Ext.getCmp('spatialLockingToolExtPanel').items.items;
                    var checkedMapWindows = [];
                    var x;
                    for (x = 0, len = extCheckBoxes.length; x < len; x += 1) {
                        if (extCheckBoxes[x].checked == true)
                            checkedMapWindows.push(totalWindows[x]);
                    }
                    for (var i = 0, len = checkedMapWindows.length; i < len; i+=1) {
                        var mapPanelBlock = checkedMapWindows[i].getReferencedBlock('cMapPanel');
                        var map = mapPanelBlock.component.map;
                        if (map.getView().get('uniqueId') !== view.get('uniqueId')) {
                            map.getView().setResolution(view.getResolution());
                        }
                    }
                    this.preventBacklash = false;
                }
            }
        };
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var position = block.block;
        var title = block.title;
        var height = block.height;
            
        var panel = Ext.create('Ext.Panel', {
            extendedTool: extendedTool,
            title : title,
            width : "auto",
            height: height,
            collapsible : (typeof(block.collapsible) !== 'undefined') ? block.collapsible : false,
            collapsed : (typeof(block.collapsed) !== 'undefined') ? block.collapsed : false,
            closable : false,
            componentCls : 'panel-border',
            id : 'spatialLockingToolExtPanel',
            autoScroll : true,
            border: 1,
            bodyCls: 'roundCorners',
            cls: 'padPanel',
            listeners: {
                afterrender: function() {
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        });
        
        var mapWindows = skin.blocks.getBlocksByName('cMapWindow');
        for (var i = 0, len = mapWindows.length; i < len; i+=1) {
            var mapWindow = mapWindows[i];
            skin.cSpatialLocking.addWindowToExtList(null, extendedTool, mapWindow.extendedTool);
        }

        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent
        (
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_CREATED,
            extendedTool.owningBlock.itemDefinition.addWindowToExtList,
            extendedTool);

        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent
        (
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_DESTROYED,
            extendedTool.owningBlock.itemDefinition.removeWindowFromExtList,
            extendedTool);

        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent
        (
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_LAYER_CONFIGURATION_UPDATED,
            extendedTool.owningBlock.itemDefinition.updateNames,
            extendedTool
        );

        return panel;
    }
};

export var toolName = "cSpatialLocking";
export var tool = cSpatialLocking;