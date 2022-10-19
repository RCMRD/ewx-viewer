/** cMapDownloadsTool.js
 * Group tool for map download tools based on cMapPanel
 * 
 * Required Tools:
 *      cMapPanel
 *      cMapWindow
 * 
 * Block Parameters:
 *      Required:
 *          name: "cMapDownloadsTool" - The name of the tool.
 *          import: The location of the tools javascript code
 *              Ex: import": "tools.shared.cMapDownloadsTool.cMapDownloadsTool"
 *          add: Boolean - Indicates whether to load this tool or not          
 * 
 *      Optional:
 *          title: 
 *          cssClass: 
 *          tooltip: Message display when the cursor is positioned over the icon tool, if not defined "Save" is used.
 * 
 */
 
var cMapDownloadsTool = {
    options: {
        requiredBlocks: ['cMapPanel', 'cMapWindow']
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var downloadMapImageBtn = {
            extendedTool: extendedTool,
            text : "",
            iconCls: 'fa fa-cog',
            tooltip : (typeof(block.tooltip) !== 'undefined') ? block.tooltip : 'Save',
            //id : mapper.common.getRandomString(32, 36),
            cls : 'x-btn-text',
            menu : Ext.create('Ext.menu.Menu', {
                extendedTool: extendedTool,
                items: menu,
                listeners : {
                    hide : function () {
                        //refocus the mapwindow
                        var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                        var mapperWindow = mapWindowBlock.extendedTool;
                        
                        mapper.EventCenter.defaultEventCenter.postEvent(
                            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
                            mapperWindow,
                            mapperWindow);
                    },
                    show : function () {
                        var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                        var mapperWindow = mapWindowBlock.extendedTool;
                        
                        var layersConfig = mapper.layers.getLayersConfigById(mapperWindow.layersConfigId);
                        var topLayer = mapper.layers.getTopLayer(layersConfig.overlays);
                        if (topLayer === false) {
                            this.items.eachKey(function (key, item) {
                                item.disable();
                            });
                        } else {
                            this.items.eachKey(function (key, item) {
                                item.enable();
                            });
                        }
                        
                        var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                        mapWindowBlock.fire('activate', mapWindowBlock.extendedTool);
                    }
                }
            })
        };

        return downloadMapImageBtn;
    }
};

export var toolName = "cMapDownloadsTool";
export var tool = cMapDownloadsTool;