/** cTocLegendTab.js
 * TOC legend tab tool 
 * 
 * Required Tools:
 *      N/A
 * 
 * Block Parameters:
 *      Required:
 *          name: "cTocLegendTab" - The name of the tool.
 *          import: The location of the tools javascript code
 *              Ex: import": "tools.shared.cTocLegendTab.cTocLegendTab"
 *          add: Boolean - Indicates whether to load this tool or not
 * 
 *      Optional:
 *          title: String - title text used to display in the panel header. (???)
 *          width: Integer -  width of this component in pixels.
 *          autoScroll: Boolean - set configuration option to show a scroll bar on the legend container, it is set to false.
 *          progressMessage: String - progress message to display when loading legend to the viewer, if not defined "Loading Legend ..." is used.
 * 
 */

var cTocLegendTab = {
    countLegendItemsLoaded : 0, 
    getWindowJsonLayers : function(shouldShowBoundaries) {
        var newLayerConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
        var windowJsonLayers;
        if (typeof(shouldShowBoundaries) !== 'undefined')
        {
            if(shouldShowBoundaries === true)
            {
                windowJsonLayers = mapper.layers.query(
                    newLayerConfig,
                    {
                        type: 'layer',
                        display: true,
                        mask: false
                    },
                    ['overlays', 'boundaries','additional']
                );

            }
        }
        else
        {
            windowJsonLayers = mapper.layers.query(
                    newLayerConfig,
                    {
                        type: 'layer',
                        display: true,
                        mask: false
                    },
                    ['overlays','additional']
                );

        }
        return windowJsonLayers;
    },
    sizeLegend : function(img, shouldShowBoundaries) {
        var legendContainer = Ext.getCmp('legendContainer');
        legendContainer.doLayout();
        this.countLegendItemsLoaded += 1;

        var totalCheckedJsonLayers = this.getWindowJsonLayers(shouldShowBoundaries);

        //Need some boundaries to show in legendtab
        //need some not to show
        //so the ones you do not want to show in legend tab
        //just dont define a legend node in the layer node of the layers.json
        //here we check to make sure we aren't waiting for a legend to load 
        //that is not supposed to load
        //so that the legendMask can deactivate
        var checkAmount = 0;
        for(i=0;i<totalCheckedJsonLayers.length;i++)
        {
            var someJsonLayer = totalCheckedJsonLayers[i];
            if (typeof(someJsonLayer.legend) === 'undefined')
            {

            }
            else
            {
                checkAmount++;
            }
        }
        if (this.countLegendItemsLoaded === checkAmount) 
        {
            cTocLegendTab.legendMask.hide();
            this.countLegendItemsLoaded = 0;
        }
    },
    layerConfigChangedEventHandler : function (newLayerConfig, callbackObject, postingObject) {
        var layerConfigToUse = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());

        newLayerConfig = layerConfigToUse;
        var extendedTool = callbackObject;

        var block = extendedTool.owningBlock.blockConfigs;
        
        //remove and add collapsable panel
        //make wms request for each
        //---------------------------------------------------------

        var legendContainer = extendedTool.component;
        if (typeof(legendContainer) === 'undefined') return;
        
        legendContainer.removeAll();
        
        if (typeof(cTocLegendTab.legendMask) === 'undefined') {
            cTocLegendTab.legendMask = new Ext.LoadMask(legendContainer, {
                    msg : (typeof(block.progressMessage) !== 'undefined') ? block.progressMessage : "Loading Legend ..."
                });
        }
        if(legendContainer.isVisible())
        {
            cTocLegendTab.legendMask.show();
        }
        
        var windowJsonLayers = cTocLegendTab.getWindowJsonLayers(block.showBoundaries);
            
        windowJsonLayers.sort(mapper.OpenLayers.zIndexSortAscending);

        for (var layerIndex = 0, len = windowJsonLayers.length; layerIndex < len; layerIndex+=1) {
            
            cTocLegendTab.legendMask.show();
            
            var layer = windowJsonLayers[windowJsonLayers.length - 1 - layerIndex];

            var legendURL = mapper.legend.getLegendURL(layer);

            if (legendURL != null) {
                var getLegendGraphicURL = legendURL;

                var shouldCollapse = false;
                if (layerIndex > 0)
                    shouldCollapse = true;
                
                var shouldShowBoundaries = block.showBoundaries;
                var legendHTML = '<div class="legend-title">' + layer.legend.title + '</div>'
                     + "<div style=\"margin-left:10px;\">"
                     + "<img onload='skin.cTocLegendTab.sizeLegend(this, " + shouldShowBoundaries + ")' src=\""
                     + getLegendGraphicURL
                     + "\"/>"
                     + "</div>";

                if (layer.legend.customImageURL != null) {
                    legendHTML = "<img onload='skin.cTocLegendTab.sizeLegend(this, " + shouldShowBoundaries + ")' src=\"" 
                    + layer.legend.customImageURL + "\"/>";
                }

                var titleToUse = layer.title;

                if (typeof(layer.legend.title) !== 'undefined') 
                {
                    titleToUse = layer.legend.title;
                }

                //This is used for Phenology viewer, This viewer includes two titles for the legend
                if(typeof(layer.legend.mainTitle) !== 'undefined')
                {
                    titleToUse = layer.legend.mainTitle;
                }

                var anItem = {
                    title : titleToUse,
                    //collapsed : shouldCollapse,
                    collapsible : true,
                    height : 'auto',                    
                    autoScroll : (typeof(block.autoScroll) !== 'undefined') ? block.autoScroll : false,
                    width: block.width,
                    html : legendHTML
                };

                legendContainer.add(anItem);
            }                        
        }

        legendContainer.doLayout();

    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var position = block.block;
        var width = block.width;
        var height = block.height;
        
        var contentsTab = {
            extendedTool: extendedTool,
            id: 'legendContainer',
            tabConfig : {
                title : block.title,
                tooltip : block.tooltip
            },
            autoScroll : (typeof(block.autoScroll) !== 'undefined') ? block.autoScroll : false,
            listeners : {
                afterrender: function() {
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    //manually trigger so it updates on startup
                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                    this.extendedTool.owningBlock.itemDefinition.layerConfigChangedEventHandler(layersConfig, extendedTool);
                }
            }
        };
        
        contentsTab = skin.blocks.addToolBarItems(block, contentsTab, toolbar);
        
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
            extendedTool.owningBlock.itemDefinition.layerConfigChangedEventHandler,
            extendedTool);

        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
            extendedTool.owningBlock.itemDefinition.layerConfigChangedEventHandler,
            extendedTool);

        
        return skin.ExtJSPosition(contentsTab, block);
    }
};

export var toolName = "cTocLegendTab";
export var tool = cTocLegendTab;