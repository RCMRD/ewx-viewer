var cQueryParamsDisplay = {
    // Other tools can change these defaults before rendering this tool.
    defaultFilters: {
        region: null,
        state: null,
        subState: null,
        year: null,
        bbox: null,
        firetype: null
    },
    layersConfigUpdated: function(eventObj, callbackObj, postingObj) {
        var layersConfig = eventObj;
        var extendedTool = callbackObj;
        
        var html = '<div style="overflow-y: auto;">';
        var filters = extendedTool.queryFilters;
        
        for (var i = 0, len = filters.length; i < len; i+=1) {
            if (filters[i].text !== null) html += '<p style="margin: 1px 0;">'+filters[i].text+'</p>';
        }
        
        html += '</div>';
        
        extendedTool.component.update(html);
    },
    createExtendedTool: function(owningBlock) {
        var defaultFilters = owningBlock.itemDefinition.defaultFilters;
        
        var extendedTool = {
            owningBlock: owningBlock,
            queryFilters: [{
                type: 'region',
                text: defaultFilters.region
            }, {
                type: 'state',
                text: defaultFilters.state
            }, {
                type: 'subState',
                text: defaultFilters.subState
            }, {
                type: 'year',
                text: defaultFilters.year
            }, {
                type: 'bbox',
                text: defaultFilters.bbox
            }, {
                type: 'firetype',
                text: defaultFilters.firetype
            }],
            setFilter: function(type, text) {
                for (var i = 0, len = this.queryFilters.length; i < len; i+=1) {
                    var queryFilter = this.queryFilters[i];
                    if (queryFilter.type === type) {
                        queryFilter.text = text;
                        break;
                    }
                }
            }
        };
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var component = {
            xtype: 'panel',
            extendedTool: extendedTool,
            height: block.height,
            maxHeight: block.height,
            width: block.width,
            overflowY: 'auto',
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                    this.extendedTool.owningBlock.itemDefinition.layersConfigUpdated(layersConfig, this.extendedTool);
                    
                    mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
                        mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CQL_FILTER_UPDATED,
                        this.extendedTool.owningBlock.itemDefinition.layersConfigUpdated,
                        this.extendedTool);
                }
            }
        };
        
        return component;
    }
}

export var toolName = "cQueryParamsDisplay";
export var tool = cQueryParamsDisplay;