var cBoundaryLegendPopup = {
    getComponent: function(extendedTool) {
        var block = extendedTool.owningBlock.blockConfigs;
        var component = {
            extendedTool: extendedTool,
            //iconCls: (block.iconClass) ? block.iconClass : 'fa fa-hand-paper-o',
            tooltip : block.tooltip,
            enableToggle : true,
            pressed : false,
            text: (block.text) ? block.text : "Legend",
            popupWindow: null,
            listeners : {
                toggle : function (button, pressed) {
                    if (pressed) {
                        var legendButton = this;
                        var block = this.extendedTool.owningBlock.blockConfigs;
                        this.popupWindow = Ext.create('Ext.Window', {
                            title: (block.title) ? block.title : 'Map Legend',
                            collapsible: true,
                            ghost: false,
                            constrain: true,
                            width: 250,
                            height: 200,
                            autoShow: true,
                            y: 100,
                            x: document.body.clientWidth - 255,
                            listeners: {
                                close: function() {
                                    legendButton.suspendEvents();
                                    legendButton.toggle();
                                    legendButton.resumeEvents();
                                },
                                afterrender: function() {
                                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                                    var boundaries = mapper.layers.query(
                                        layersConfig.boundaries,
                                        {
                                            type: 'layer', 
                                            loadOnly: false, 
                                            mask: false
                                        }
                                    );
                                    
                                    if (boundaries.length > 0) {
                                        var html = '';
                                        for (var i = 0, len = boundaries.length; i < len; i+=1) {
                                            var boundary = boundaries[i];
                                            var legendUrl = mapper.legend.getLegendURL(boundary, 50, 20);
                                            if (legendUrl !== null) {
                                                html += '<div><img src="'+legendUrl+'" /><span style="margin-left: 5px;">'+boundary.title+'</span></div>';
                                            }
                                        }
                                        this.update(html);
                                    }
                                }
                            }
                        });
                    } else {
                        this.popupWindow.suspendEvents();
                        this.popupWindow.close();
                    }
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        return component;
    }
};

export var toolName = "cBoundaryLegendPopup";
export var tool = cBoundaryLegendPopup;