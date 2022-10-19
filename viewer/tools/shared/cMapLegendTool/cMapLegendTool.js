var cMapLegendTool = {
    options: {
        requiredBlocks: ['cMapPanel', 'cMapLegend', 'cMapWindow']
    },
    init: function(blueprint) {
        var mapLegendBlueprint = blueprint.getReferencedBlueprint('cMapLegend');
        
        if (mapLegendBlueprint) {
            if (!mapLegendBlueprint.itemDefinition.options) {
                mapLegendBlueprint.itemDefinition.options = {};
            }
            
            mapLegendBlueprint.itemDefinition.options.autoShow = blueprint.blockConfigs.pressed;
        }
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var button = {
            extendedTool : extendedTool,
            cls : 'x-btn-left legend-glyph',
            iconCls: 'fa fa-list-ul',
            tooltip : block.tooltip,
            enableToggle : true,
            pressed : block.pressed,
            listeners : {
                toggle : function () {
                    var mapLegendBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapLegend');
                    var legendPanel = mapLegendBlock.component;
                    if (this.pressed == true) {
                        legendPanel.show();
                        legendPanel.active = true;
                        legendPanel.updateLocation();
                    } else {
                        legendPanel.hide();
                        legendPanel.active = false;
                    }
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        return button;
    }
};

export var toolName = "cMapLegendTool";
export var tool = cMapLegendTool;