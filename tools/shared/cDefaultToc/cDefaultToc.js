var cDefaultToc = {
    options: {
        events: ['recordselected']
    },
    mapWindowFocusedEventHandler : function (eventObject, callbackObject, postingObject) {
        var tocExtendedTool = callbackObject;
        
        tocExtendedTool.updateTocStore();
    },
    createExtendedTool: function(owningBlock) {
        return {
            owningBlock: owningBlock,
            TOCTreeMask: null,
            generateTOC : function () {
                /*var TOCTree = {};
                TOCTree["overlays"] = [];

                this.newLayersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());

                var TOCTree = this.parseLayers(this.newLayersConfig.overlays);
                var boundaries = this.parseLayers(this.newLayersConfig.boundaries);

                for (var b in boundaries) {
                    TOCTree[parseInt(b) + TOCTree.length] = boundaries[b];
                }

                var baselayers = this.parseLayers(this.newLayersConfig.baselayers);
                for (var l in baselayers) {
                    TOCTree[parseInt(l) + TOCTree.length] = baselayers[l];
                }*/
                
                var TOCTree = [];

                var newLayersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());

                var titleLength = owningBlock.blockConfigs.titleLength;
                
                //mapper.log("ddd");
                //mapper.log(titleLength);

                var overlays = this.parseLayers(newLayersConfig.overlays,undefined,undefined,titleLength);
                var boundaries = this.parseLayers(newLayersConfig.boundaries,undefined,undefined,titleLength);
                var baselayers = this.parseLayers(newLayersConfig.baselayers,undefined,undefined,titleLength);

                TOCTree = TOCTree.concat(overlays.reverse()).concat(boundaries).concat(baselayers);

                //mapper.log("test");
                //mapper.log(owningBlock.blockConfigs);

                return TOCTree;
            },
            parseLayers : function (folders, folderId, level,titleLength) {
                if (typeof(level) === 'undefined') level = 0;
                var TOCTree = [];
                var children;

                //var maxTitleLength = 16;
                //if (level === 2) maxTitleLength = 14;
                //else if (level === 3) maxTitleLength = 8;

                var maxTitleLength = titleLength;
                //mapper.log(maxTitleLength);

                for (var o in folders) {
                    children = [];
                    var fdr = folders[o];

                    if (fdr.type == "folder") {
                        children = this.parseLayers(fdr.folder, fdr.id, level+1,titleLength);
                    } else if (fdr.type == "layer") {
                        if (fdr.loadOnly == false && fdr.mask === false) {

                            var layerTitle = mapper.common.truncateString(fdr.title, 0, maxTitleLength);

                            if (fdr.timeseries != undefined) {
                                var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(fdr.id);

                                children = {
                                    "id" : fdr.id,
                                    "layerNodeTitle" : layerTitle,
                                    "timeSeriesSelected" : periodicityWrapper.buildDisplayLabel(periodicityWrapper.format),
                                    "period" : fdr.timeseries.type,
                                    "leaf" : true,
                                    "qtip" : fdr.title,
                                    "description" : fdr.description,
                                    "checked" : fdr.display,
                                    "belongsTo": folderId,
									type: fdr.type
                                };
                            } else {
                                children = {
                                    "id" : fdr.id,
                                    "layerNodeTitle" : layerTitle,
                                    "period" : "",
                                    "name" : fdr.name,
                                    "leaf" : true,
                                    "qtip" : fdr.title,
                                    "description" : fdr.description,
                                    "checked" : fdr.display,
                                    "belongsTo": folderId,
									type: fdr.type
                                };
                            }

                        }
                    } else if (fdr.type === "link") {
						var layerTitle = mapper.common.truncateString(fdr.title, 0, maxTitleLength);
						children = {
							id: fdr.id,
							layerNodeTitle: layerTitle,
							iconCls: 'external-link',
							cls: 'external-link',
							qtip: "Go to: "+fdr.url,
							type: fdr.type,
							belongsTo: folderId,
							leaf: true,
							url: fdr.url
						};
					}

                    var expanded = (fdr.expanded != undefined) ? fdr.expanded : false;

                    if (fdr.type == "folder" && children.length > 0) {
                        TOCTree.push({
                            "id" : fdr.id,
                            "layerNodeTitle" : mapper.common.truncateString(fdr.title, 0, maxTitleLength),
                            "expanded" : expanded,
                            "children" : children,
                            "qtip" : fdr.title,
                            "description" : fdr.description,
                            "belongsTo": (typeof(folderId) === 'undefined') ? '' : folderId,
							type: fdr.type
                        });
                    } else if (fdr.type === 'link' || (fdr.type == "layer" && fdr.loadOnly === false && fdr.mask === false)) {
                        TOCTree.push(children);
                    }
                }

                return TOCTree;
            },
            maskTOC : function () {
                var block = owningBlock.blockConfigs;
                if (this.TOCTreeMask == null) {
                    this.TOCTreeMask = new Ext.LoadMask(this.component, {
                        msg : (typeof(block.progressMessage) !== 'undefined') ? block.progressMessage : "Loading TOC ..."
                        });
                }

                this.TOCTreeMask.show();
            },
            unMaskTOC : function () {
                setTimeout(function (tocExtendedTool) {
                    tocExtendedTool.TOCTreeMask.hide();
                }, 
                500,
                this);
            },
            updateTocStore : function () {
                this.maskTOC();
                var tocExtendedTool = this;

                var TOCJSON = this.generateTOC();
                var store = Ext.create('Ext.data.TreeStore', {
                        model : 'layerTree',
                        root : {
                            expanded : true,
                            children : JSON.parse(JSON.stringify(TOCJSON))
                        },
                        listeners : {
                            datachanged : function (s, eOpts) {
                                tocExtendedTool.unMaskTOC();
                            }
                        }
                    });

                var TOCTreeCmp = this.component;
                TOCTreeCmp.reconfigure(store);
            }
        };
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var TOCJSON = extendedTool.generateTOC();

        if (Ext.ComponentQuery.query('periodic').length == 0)
            skin.datePicker.defineDatePicker();

        //we want to setup a model and store instead of using dataUrl
        Ext.define('layerTree', {
            extend : 'Ext.data.TreeModel',
            fields : [{
                    name : 'layerNodeTitle',
                    type : 'string'
                }, {
                    name : 'timeSeriesSelected',
                    type : 'string'
                }, {
                    name : 'description',
                    type : 'string'
                }, {
                    name : 'period',
                    type : 'string'
                }, {
                    name : 'id',
                    type : 'string'
                }, {
                    name : 'belongsTo',
                    type : 'string'
                }, {
					name: 'type',
					type: 'string'
				}, {
					name: 'url',
					type: 'string'
				}
            ]
        });

        var store = Ext.create('Ext.data.TreeStore', {
                model : 'layerTree',
                root : {
                    expanded : true,
                    children : JSON.parse(JSON.stringify(TOCJSON))
                },
            });

        var tree = {
                extendedTool: extendedTool,
                id: extendedTool.uniqueId,
                bodyStyle : {
                    borderLeft : '0px',
                    borderRight : '0px',
                    borderColor : '#ccc'
                },
                viewConfig: {
                    plugins: {
                        ptype: 'treeviewdragdrop',
                    },
                    listeners: {
                        nodedragover: function(targetNode, position, dragData) {
                            var data = dragData.records[0].data;
                            var targetData = targetNode.data;
                            if (position === 'append' && data.belongsTo !== targetData.id) return false;
                            if (data.belongsTo === '' && targetData.belongsTo === '' && position === 'append') return false;
                            if (data.belongsTo !== targetData.belongsTo) return false;
                        },
                        drop: function(targetNode, data, overModel, position) {
                            var targetId = overModel.data.id,
                            id = data.records[0].data.id,
                            layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                            
                            if (id !== '') {
                                mapper.layers.moveLayer(layersConfig, id, targetId, position);
                            }
                        }
                    }
                },
                width : block.width,
                //height : block.height,
                //minHeight : 100,
				
				layout:'absolute',
				//resizable:false,
				
				//cls:"disable-scroll",
				overflowY: "hidden",
				scrollable: false,
				
                //split : true,
                autoScroll : true,
                store : store,
                rootVisible : false,
                lines : true,
                hideHeaders : true,
                columns : [{
                        xtype : 'treecolumn', //this is so we know which column will show the tree
                        flex : 1.6,
                        //flex : 2.0,
                        sortable : true,
                        dataIndex : 'layerNodeTitle'
                    }, {
                        //flex : 1.2,
                        flex : 0.6,
                        xtype : 'datePickerColumn',
                        dataIndex : 'timeSeriesSelected',
                        menuDisabled : true,
                        hidden : (typeof(block.hideDatePicker) !== 'undefined') ? block.hideDatePicker : false
                    }, {
                    xtype: 'templatecolumn',
                    sortable: false,
                    menuDisabled: true,
                    dataIndex: 'description',
                    width: 33,
                    tpl: new Ext.XTemplate(
                        "<tpl if='description'><i id='{[ this.getBtnId() ]}' data-layer-id='{id}' class='fa fa-question-circle layer-info-btn'></i><tpl else><i class='noLayerInfoIcon'></tpl>",
                        {
                            getBtnId: function(description) {
                                var id = Ext.id();
                                Ext.TaskManager.start({
                                    scope: this,
                                    interval: 100,
                                    args: [id],
                                    run: function(id) {
                                        if (!Ext.fly(id)) return true;
                                        Ext.get(id).on('click', function(e) {
                                            var layerId = e.target.getAttribute('data-layer-id');
                                            var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                                            var layers = mapper.layers.query(
                                                layersConfig,
                                                {id: layerId},
                                                ['overlays', 'boundaries', 'baselayers']
                                            );
                                            
                                            if (layers.length > 0) {
                                                var layer = layers[0];
                                                if (layer.hasOwnProperty('description') && layer.description !== null && layer.description.trim() !== "") {
                                                    Ext.Msg.alert(layer.title, layer.description);
                                                }
                                            }
                                        });
                                        return false;
                                    }
                                });
                                return id;
                            }
                        }
                    )
                }, {
                        hidden : true,
                        sortable : true,
                        dataIndex : 'period'
                    }, {
                        hidden : true,
                        sortable : true,
                        dataIndex : 'id'
                    }
                ],
                listeners : {
                    'beforeselect' : function (tree, record, index, eOpts) {
						var type = record.data.type;
						if (type === 'layer' || type === 'folder') {
							this.extendedTool.owningBlock.fire('recordselected', this, record.data.id);
						}
                    },
                    'checkchange' : function (record, checked, eOpts) {
                        mapper.layers.setLayerDisplay(record.data.id, checked);
                    },
                    afterrender: function() {
                        this.extendedTool.component = this;
                        this.extendedTool.owningBlock.component = this;
                        this.extendedTool.owningBlock.rendered = true;
                    },
					cellclick: function(tree, el, index, record) {
						var type = record.data.type;
						if (type === 'link') {
							window.open(record.data.url, '_blank');
						}
					}
                }
            };
            
        tree = skin.ExtJSPosition(tree, block);
        tree = Ext.create('Ext.tree.TreePanel', tree);

        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
            extendedTool.owningBlock.itemDefinition.mapWindowFocusedEventHandler,
            extendedTool);

        return tree;
    }
};

export var toolName = "cDefaultToc";
export var tool = cDefaultToc;