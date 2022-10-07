/** cZoomToRegionTool.js
 * Zoom to region (full extent) tool to set the region (full) extent on cMapPanel
 * 
 * Required Tools:
 *      cMapPanel
 *      cMapWindow
 * 
 * Block Parameters:
 *      Required:
 *          name: "cZoomToRegionTool" - The name of the tool.
 *          import: The location of the tools javascript code
 *              Ex: import": "tools.shared.cZoomToRegionTool.cZoomToRegionTool"
 *          add: Boolean - Indicates whether to load this tool or not          
 * 
 *      Optional:
 *          title: 
 *          cssClass: 
 *          tooltip: Message display when the cursor is positioned over the icon tool, if not defined "Zoom To Region" is used.
 * 
 */
 
var cZoomToRegionTool = {
    options: {
        requiredBlocks: ['cMapPanel', 'cMapWindow']
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
		var block = extendedTool.owningBlock.blockConfigs;
        var zoomBtn = {
            extendedTool: extendedTool,
            cls : 'x-btn-left',
            iconCls: (block.iconClass) ? block.iconClass : 'fa fa-arrows-alt',
            tooltip : (typeof(block.tooltip) !== 'undefined') ? block.tooltip : 'Zoom to Region', 
            pressed : false,
            handler : function() {
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var regionFolder = mapper.layers.query(
                    layersConfig,
                    function(folder) {
                        if (folder.type === 'folder' && folder.hasOwnProperty('regionId')) {
                            var displayedLayer = mapper.layers.query(
                                folder.folder,
                                {
                                    type: 'layer',
                                    display: true,
                                    loadOnly: false,
                                    mask: false
                                }
                            );
                            
                            if (displayedLayer.length > 0) return true;
                        }
                        return false;
                    },
                    ['overlays', 'boundaries', 'baselayers']
                );
                
                if (regionFolder.length === 0) return;
                
                var regionId = regionFolder[0].regionId;
                var region = mapper.common.getRegionWithRegionID(regionId);
                var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                var map = mapPanelBlock.component.map;
                
                mapper.OpenLayers.setExtentForMap(map, region.bbox, region.srs);
                
                var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                mapWindowBlock.fire('activate', mapWindowBlock.extendedTool);
            }
        };
        
        return zoomBtn;
    }
};

export var toolName = "cZoomToRegionTool";
export var tool = cZoomToRegionTool;