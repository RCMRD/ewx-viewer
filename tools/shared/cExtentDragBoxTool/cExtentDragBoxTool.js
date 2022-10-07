var cExtentDragBoxTool = {
    options: {
        requiredBlocks: ['cMapWindow', 'cMapPanel']
    },
    createExtendedTool: function(owningBlock) {
        var extToolUniqueID = mapper.common.getRandomString(32, 36);
        
        var owningMapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var owningMapWindow = owningMapWindowBlock.extendedTool;
        
        var extendedExtentDragBoxTool = {
            owningBlock: owningBlock,
            toggleGroupId: owningMapWindow.toggleGroupId,
            extTool : null,

            //after this gets given away to the toolbar it is copied
            //and can no longer be referenced from this object
            //directly
            //you have to use Ext.getCmp(this.extIdentifyToolID);
            //to access it
            //dont forget that

            extToolID : extToolUniqueID,
            dragBoxInteraction : null,
            dragBoxMouseDownCoords : null,
            dragBoxMouseUpCoords : null,

            /*handleToggle : function () {
                var mapPanelBlock = owningBlock.getReferencedBlock('cMapPanel');
                
                var isPressed = Ext.getCmp(this.extTool.id).pressed;
                var map = mapPanelBlock.component.map;

                if (isPressed) {
                    if (this.dragBoxInteraction == null) {

                        var fill = new ol.style.Fill({
                                color : 'rgba(255,154,0,0.5)'
                            });

                        var theStyle = new ol.style.Style({
                                stroke : new ol.style.Stroke({
                                    color : [255, 154, 0, 1],
                                    width : 2,

                                }),
                                fill : fill

                            });

                        this.dragBoxInteraction = new ol.interaction.DragBox({
                                condition : ol.events.condition.always,
                                style : theStyle
                            });

                        this.dragBoxInteraction.on('boxend', function (anOlDragBoxEvent) {
                            //this is the dragBoxInteractionItem itself

                            var extentToUse = this.dragBoxInteraction.getGeometry().getExtent();
                            var mapProjectionEPSGCode = map.getView().getProjection().getCode();
                            mapper.OpenLayers.setExtentForMap(map, extentToUse, mapProjectionEPSGCode);

                        }, this);

                    }

                    map.addInteraction(this.dragBoxInteraction);

                } else {
                    map.removeInteraction(this.dragBoxInteraction);
                }

            },
            getReady : function (aMapWindow) {}*/
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
        
        mapInteraction.on('boxend', function(event) {
            var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
            var map = mapPanelBlock.component.map;
            var extentToUse = this.mapInteraction.getGeometry().getExtent();
            mapper.log(extentToUse.join(','));
            var mapProjectionEPSGCode = map.getView().getProjection().getCode();
            mapper.OpenLayers.setExtentForMap(map, extentToUse, mapProjectionEPSGCode);
        }, extendedExtentDragBoxTool);
        
        extendedExtentDragBoxTool.mapInteraction = mapInteraction;
        
        return extendedExtentDragBoxTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var extExtentDragBoxTool = {
            extendedTool : extendedTool,
            iconCls: (block.iconClass) ? block.iconClass : 'fa fa-search-plus',
            cls : 'x-btn-left',
            tooltip : block.tooltip,
            enableToggle : true,
            toggleGroup: extendedTool.toggleGroupId,
            id : extendedTool.extToolID,
            pressed : block.pressed,
            listeners : {
                toggle : function () {
                    var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    
                    if (this.pressed === true) {
                        map.addInteraction(this.extendedTool.mapInteraction);
                    } else {
                        map.removeInteraction(this.extendedTool.mapInteraction);
                    }
                    
                    var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                    mapWindowBlock.fire('activate', mapWindowBlock.extendedTool);
                },
                afterrender: function() {
                    this.extendedTool.extTool = this;
                    this.extendedTool.owningBlock.rendered = true;
                    this.extendedTool.owningBlock.component = this;
                    
                    if (this.pressed === true) {
                        var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                        if (mapPanelBlock.rendered === false) {
                            mapPanelBlock.on('rendercomponent', function(callbackObj, postingObj) {
                                var mapPanel = postingObj;
                                var zoomExtendedTool = callbackObj;
                                var map = mapPanel.owningBlock.component.map;
                                map.addInteraction(zoomExtendedTool.mapInteraction);
                            }, this.extendedTool);
                        } else {
                            var map = mapPanelBlock.component.map;
                            map.addInteraction(me.extendedTool.mapInteraction);
                        }
                    }
                }
            }
        };
        
        return extExtentDragBoxTool;
    }
};

export var toolName = "cExtentDragBoxTool";
export var tool = cExtentDragBoxTool;