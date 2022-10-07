/** cMapPanel.js
 * The map panel tool contains the open layers map object I
 * 
 * Required Tools:
 *      cMapWindow
 * 
 * Block Parameters:
 *      Required:
 *          name: "cMapPanel" - The name of the tool.
 *          import: The location of the tools javascript code
 *              Ex: import": "tools.shared.cMapPanel.cMapPanel"
 *          add: Boolean - Indicates whether to load this tool or not 
 * 
 *      Optional:
 *          block: EWX, QuickDri, GLC use this - but I don't see where its being used - should it be removed from their config file?
 *          interactions - defines the interactions allowed on the map.  Options are pan and zoom.
 *          addScaleLine: Boolean - Indicates whether to add the Open Layers ScaleLine to the map
 *          zoomInTip: Zoom in Tip - if not defined then "Zoom in" is used
 *          zoomOutTip: Zoom out tool tip - if not defined then "Zoom out" is used
 * 
 */

var cMapPanel = {
    options: {
        events: ['rendercomponent', 'click'],
        requiredBlocks: ['cMapWindow']
    },
    createExtendedTool: function(owningBlock) {
        if (Ext.ComponentQuery.query('OpenlayersPanel').length == 0) {
            skin.OpenLayers.defineOpenLayers();
        }
        
        var uniqueId = 'openlayers-panel-' + mapper.common.getRandomString(32, 36);
        
        return {
            owningBlock: owningBlock,
            uniqueId: uniqueId,
            getReady: function(mapPanel) {
                var mapWindowBlock = mapPanel.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                if (mapWindowBlock.rendered === true) {
                    var mapperWindow = mapWindowBlock.extendedTool;
                    var layersConfig = mapper.layers.getLayersConfigById(mapperWindow.layersConfigId);
                    
                    mapper.OpenLayers.updateMapLayerOpacitiesAndDisplayedLayersFromLayersConfig(layersConfig, mapPanel.map);
                    mapPanel.map.on('singleclick', function(evt) {
                        mapperWindow.owningBlock.fire('click', mapperWindow, evt);
                    });
                } else {
                    mapWindowBlock.on('rendercomponent', function(callbackObj, postingObj, eventObj) {
                        var mapperWindow = postingObj;
                        var mapPanel = callbackObj;
                        var layersConfig = mapper.layers.getLayersConfigById(mapperWindow.layersConfigId);
                        
                        mapper.OpenLayers.updateMapLayerOpacitiesAndDisplayedLayersFromLayersConfig(layersConfig, mapPanel.map);
                        mapPanel.map.on('singleclick', function(evt) {
                            mapPanel.extendedTool.owningBlock.fire('click', mapPanel.extendedTool, evt);
                            mapperWindow.owningBlock.fire('click', mapperWindow, evt);
                        });
                    }, mapPanel);
                }
            },
            mask: null,
            isMasked: false,
            maskComponent: function() {
                var block = owningBlock.blockConfigs;
                if (this.isMasked === true) return;
                this.isMasked = true;
                if (this.mask === null) {
                    this.mask = new Ext.LoadMask(this.component, {
                        msg : (typeof(block.progressMessage) !== 'undefined') ? block.progressMessage : "Loading Layers ..."
                    });
                }
                this.mask.show();
                
            },
            unMaskComponent: function() {
                
                if (this.isMasked === false) return;
                this.mask.hide();
                this.isMasked = false;
                
            }
        };
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var width = block.width;
        var height = block.height;
        //If addScaleLine is not defined in the block, default to false
        var addScaleLine = (typeof(block.addScaleLine) !== 'undefined') ? block.addScaleLine : false;

        var mapPanelConfig = {
            extendedTool: extendedTool,
            id: extendedTool.uniqueId, 
            items: items,
            flex: 4,
            width: width,
            height: height
        };
        
        mapPanelConfig = skin.blocks.addToolBarItems(block, mapPanelConfig, toolbar);
        
        mapPanelConfig = skin.ExtJSPosition(mapPanelConfig, block);

        var mapPanel = Ext.create('OpenlayersPanel', mapPanelConfig);
        var map = mapPanel.map;
        
        //Add openLayers scale line if requested
        if (addScaleLine === true) {
            mapper.OpenLayers.addScaleLine(map);
        }

        var zoomInTip = (typeof(block.zoomInTip) !== 'undefined') ? block.zoomInTip : "Zoom in";
        var zoomOutTip = (typeof(block.zoomOutTip) !== 'undefined') ? block.zoomOutTip : "Zoom out";
        mapper.OpenLayers.customizeZoomTips(map, zoomInTip, zoomOutTip);
        //extendedTool.getReady(mapPanel);
        
        return mapPanel;
    }
};

export var toolName = "cMapPanel";
export var tool = cMapPanel;