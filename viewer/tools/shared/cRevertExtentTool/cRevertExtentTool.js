var cRevertExtentTool = {
    options: {
        requiredBlocks: ['cMapWindow', 'cMapPanel']
    },
    createExtendedTool: function(owningBlock) {
        var toolUniqueID = mapper.common.getRandomString(32, 36);
        
        var owningMapWindowBlock = owningBlock.getReferencedBlock('cMapWindow');
        var owningMapWindow = owningMapWindowBlock.extendedTool;
        
        var extendedTool = {
            owningBlock: owningBlock,
            extToolID: toolUniqueID,
            lastStoredExtentArray: new Array(),
            currentIndex:0,
            updateOverflowMenu: function() {
                var toolbar = this.owningToolbar;
                var extendedTool = this;
                var component = this.component;
                if (toolbar) {
                    var toolType = this.component.toolType;
                    var menuItems = toolbar.layout.overflowHandler.menu.items.items;
                    for (var i = 0, len = menuItems.length; i < len; i+=1) {
                        var menuItem = menuItems[i];
                        if (menuItem.toolType === toolType) {
                            if (extendedTool.currentIndex > 1) {
                                menuItem.setDisabled(false);
                            } else {
                                menuItem.setDisabled(true);
                            }
                            break;
                        }
                    }
                }
            },
            getReady: function () {
                var mapPanelBlock = this.owningBlock.getReferencedBlock('cMapPanel');
                
                mapPanelBlock.on('rendercomponent', function(callbackObj, postingObj) {
                    var extendedRevertExtentTool = callbackObj;
                    var mapPanel = postingObj;
                    
                    var map = mapPanel.owningBlock.component.map;
                    map.on('moveend', checknewextent);
                    function checknewextent(evt)
                    {
                        var d = mapper.OpenLayers.getCurrentMapWindowExtent(map);
                        
                        extendedRevertExtentTool.lastStoredExtentArray.push(d);
                        
                        extendedRevertExtentTool.currentIndex++;
                        extendedRevertExtentTool.updateOverflowMenu();
                        
                        if(extendedRevertExtentTool.currentIndex > 1)
                        {
                            Ext.getCmp(extendedRevertExtentTool.extToolID).setDisabled(false);
                        }
                    }
                }, this);
            }
        };
        
        owningMapWindowBlock.on('overflowmenushow', function(extendedTool) {
            extendedTool.updateOverflowMenu();
        }, extendedTool);
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var extRevertExtentTool = {
            extendedTool: extendedTool,
            xtype : 'button',
            cls : 'x-btn-left',
            iconCls : (block.iconClass) ? block.iconClass : 'previous-extent-button-icon',
            tooltip : block.tooltip,
            toolType : 'revertExtent',
            enableToggle : false,
            id : extendedTool.extToolID,
            disabled:true,
            pressed : false,
            handler : function() {
                var extendedTool = this.extendedTool;
                if(extendedTool.currentIndex > 1)
                {
                    var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                    extendedTool.currentIndex = extendedTool.currentIndex - 2;
                    mapper.OpenLayers.setCurrentMapWindowExtentFromExtentThatIsAlreadyInCorrectProjection(extendedTool.lastStoredExtentArray[extendedTool.currentIndex],mapPanelBlock.component.map);
                    extendedTool.lastStoredExtentArray.pop();
                    extendedTool.lastStoredExtentArray.pop();
                    extendedTool.updateOverflowMenu();
                }
                
                if(!(extendedTool.currentIndex > 1))
                {
                    this.setDisabled(true);
                }
                
                var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                mapWindowBlock.fire('activate', mapWindowBlock.extendedTool);
            },
            listeners: {
                afterrender: function() {
                    this.extendedTool.getReady();
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        return extRevertExtentTool;
    }
};

export var toolName = "cRevertExtentTool";
export var tool = cRevertExtentTool;