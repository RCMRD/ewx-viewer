var cTransparency = {
    options: {
        requiredBlocks: ['cDefaultToc', 'cLayersToc']
    },
    setNewLayerSelection: function(callbackObj, postingObj, eventObj) {
        var extendedTool = callbackObj;
        var layerId = eventObj;
        var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
        var layers = mapper.layers.query(
            layersConfig,
            {
                type: 'layer',
                id: layerId,
                transparency: true
            },
            ['overlays', 'boundaries']
        );
        
        if (layers.length > 0) {
            var layer = layers[0];
            if (!layer.hasOwnProperty('opacity')) {
                layer.opacity = 100;
            }
            extendedTool.layerId = layerId;
            extendedTool.component.setValue(layer.opacity * 100);
            extendedTool.component.setDisabled(false);
        } else {
            extendedTool.layerId = null;
            extendedTool.component.setValue(100);
            extendedTool.component.setDisabled(true);
        }
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            layerId: null
        };
        
        var defaultTocBlock = owningBlock.getReferencedBlock('cDefaultToc');
        if (defaultTocBlock !== null) {
            defaultTocBlock.on('recordselected', owningBlock.itemDefinition.setNewLayerSelection, extendedTool);
        }
        
        var layersTocBlock = owningBlock.getReferencedBlock('cLayersToc');
        if (layersTocBlock !== null) {
            layersTocBlock.on('recordselected', owningBlock.itemDefinition.setNewLayerSelection, extendedTool);
        }
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var slider = Ext.create('Ext.slider.Single', {
            extendedTool: extendedTool,
            height : block.height,
            style : {
                marginLeft : '10px',
                marginRight : '10px',
                marginBottom : '10px'
            },
            disabled : true,
            value : 100,
            width : block.width,
            increment : 5,
            minValue : 0,
            maxValue : 100,
            labelAlign : 'top',
            fieldLabel : (typeof(block.fieldLabel) !== 'undefined') ? block.fieldLabel : 'Layer Transparency(Highlight Layer):',
            listeners : {
                changecomplete : function (slider, newValue, thumb, eOpts) {
                    mapper.layers.setLayerOpacity(this.extendedTool.layerId, newValue / 100);
                },
                change : function (slider, newValue, thumb, eOpts) {
                    mapper.layers.setLayerOpacity(this.extendedTool.layerId, newValue / 100);
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        });

        return slider;
    }
};

export var toolName = "cTransparency";
export var tool = cTransparency;