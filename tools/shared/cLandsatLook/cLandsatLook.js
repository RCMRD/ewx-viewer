/** cLandsatLook.js
 * The LandsatLook tool opens up LandsatLook using the maps current extent.
 * 
 * Required Tools:
 *      cMapWindow, cMapPanel
 * 
 * Block Parameters:
 *      Required:
 *          name: "cLandsatLook" - The name of the tool.
 *          import: The location of the tools javascript code
 *              Ex: import": "tools.shared.cLandsatLook.cLandsatLook"
 *          add: Boolean - Indicates whether to load this tool or not 
 * 
 *      Optional:
 *          title:
 *          cssClass: 
 *          tooltip: Tip to show when tool is hovered over
 * 
 */

var cLandsatLook = {
    options: {
        events: ['aoiSelected'],
        requiredBlocks: ['cMapWindow', 'cMapPanel']
    },
    createExtendedTool : function(owningBlock) {
        var owningMapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var owningMapWindow = owningMapWindowBlock.extendedTool;
        
        var toggleGroupId = null;
        if (owningMapWindow !== null) {
            toggleGroupId = owningMapWindow.toggleGroupId;
        }
        
        var extendedTool = {
            owningBlock: owningBlock,
            toggleGroupId: toggleGroupId,
            toolUniqueID: mapper.common.getRandomString(32, 36),
            vector: new ol.layer.Vector({
                source: new ol.source.Vector()
            }),
            vectorAdded: false
        };
     
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var zoomInPopupTitle = block.popupTitle;
        var zoomInPopupMessage = block.popupMessage;
        var extBBOXTool = {
            extendedTool: extendedTool,
            cls : 'x-btn-left',
            iconCls: 'fa fa-landsat-look',
            xtype: 'button',
            tooltip : block.tooltip,
            id : extendedTool.toolUniqueID,
            listeners : {
                click : function () {
                    var me = this;
                    var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    var units = map.getView().getProjection().getUnits();
                    var zoom = map.getView().getZoom();
                    //Get the projection of the map view
                    var mapProjection = map.getView().getProjection().getCode();
                    //Get the extent of the map window
                    var extent = mapper.OpenLayers.getCurrentMapWindowExtent(map);
                    //Transform extent from map's projection to the LandsatLook projection of 4326
                    extent = ol.proj.transformExtent(extent, mapProjection, 'EPSG:4326');
                    //Create the LandsatLook URL using the new extent
                    var landsatLookURL = "https://landsatlook.usgs.gov/viewer.html?extent=" + extent;
                    
                    //Open up a new window with the Landsat Look URL
                    window.open(landsatLookURL, '_blank');
                },
            }
        };
        
        return extBBOXTool;
    }
};

export var toolName = "cLandsatLook";
export var tool = cLandsatLook;