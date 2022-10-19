var cPanTool = {
    options: {
        requiredBlocks: ['cMapWindow', 'cMapPanel']
    },
    createExtendedTool: function(owningBlock) {
        var toolUniqueID = mapper.common.getRandomString(32, 36);
        
        var owningMapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var owningMapWindow = owningMapWindowBlock.extendedTool;
        
        var extendedPanTool = {
            owningBlock: owningBlock,
            toggleGroupId: owningMapWindow.toggleGroupId,
            mapInteraction: new ol.interaction.DragPan({
                condition: ol.events.condition.always
            }),
            //after this gets given away to the toolbar it is copied
            //and can no longer be referenced from this object
            //directly
            //you have to use Ext.getCmp(this.extIdentifyToolID);
            //to access it
            //dont forget that

            extToolID : toolUniqueID,

        };
        return extendedPanTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var extPanTool = {
            extendedTool: extendedTool,
            cls : 'x-btn-left',
            iconCls: (block.iconClass) ? block.iconClass : 'fa fa-hand-paper-o',
            tooltip : block.tooltip,
            enableToggle : true,
            toggleGroup: extendedTool.toggleGroupId,
            id : extendedTool.extToolID,
            pressed : block.pressed,
            listeners : {
                toggle : function (button, pressed) {
                    var me = this;
                    var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    var map = mapPanelBlock.component.map;
                    /*if (!(me.pressed || Ext.ButtonToggleManager.getPressed(me.toggleGroup))) {
                        me.toggle(true, true);
                    }*/
                    
                    if(me.pressed)
                    {
                        map.addInteraction(me.extendedTool.mapInteraction);
                        /*map.getInteractions().clear();
                        var d = new ol.interaction.defaults();
                        var darr = d.getArray();
                        map.getInteractions().extend(darr);*/
                    } else {
                        map.removeInteraction(me.extendedTool.mapInteraction);
                    }
                    
                    var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                    mapWindowBlock.fire('activate', mapWindowBlock.extendedTool);
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    if (this.pressed === true) {
                        var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                        if (mapPanelBlock.rendered === false) {
                            mapPanelBlock.on('rendercomponent', function(callbackObj, postingObj) {
                                var mapPanel = postingObj;
                                var panExtendedTool = callbackObj;
                                var map = mapPanel.owningBlock.component.map;
                                map.addInteraction(panExtendedTool.mapInteraction);
                            }, this.extendedTool);
                        } else {
                            var map = mapPanelBlock.component.map;
                            map.addInteraction(me.extendedTool.mapInteraction);
                        }
                    }
                }
            }
        }
        
        return extPanTool;
    }
};

export var toolName = "cPanTool";
export var tool = cPanTool;