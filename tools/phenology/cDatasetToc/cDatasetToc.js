var cDatasetToc = {
    mapWindowFocusedEventHandler : function (eventObject, callbackObject, postingObject) {
        var tocExtendedTool = callbackObject;
        var currentInstanceId = mapper.layers.getLayersConfigInstanceId();
        var layersConfig = mapper.layers.getLayersConfigById(currentInstanceId);
        
        tocExtendedTool.updateTocStore();
    },
    createExtendedTool: function(owningBlock) {
        return {
            owningBlock: owningBlock,
            uniqueId: 'toc-' + mapper.common.getRandomString(32, 36),
            TOCTreeMask: null,
            generateTOC: function() {
                var TOCTree = {};
                TOCTree["overlays"] = [];

                var newLayersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());

                var TOCTree = this.parseLayers(newLayersConfig.overlays);

                return TOCTree;
            },
            parseLayers: function (folders, counter, folderId) {
                if (typeof(counter) === 'undefined')
                    counter = 0;
                var TOCTree = [];
                var children;

                for (var o in folders) {
                    children = [];
                    var fdr = folders[o];
                    
                    if (fdr.type == "folder") {
                        var notLoadOnlyLayers = mapper.layers.query(
                            fdr,
                            function (layer) {
                                if (layer.type === 'layer' && layer.loadOnly === false && layer.mask === false) {
                                    return true;
                                }
                                return false;
                            }
                        );

                        if (notLoadOnlyLayers.length === 0) {
                            children = [];
                        } else {
                            children = this.parseLayers(fdr.folder, counter + 1, fdr.id);
                        }
                    } else if (fdr.type == "layer") {
                        if (fdr.loadOnly == false) {

                            var layerTitle = mapper.common.truncateString(fdr.title, 0, 15);

                            if (fdr.timeseries != undefined) {
                                var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(fdr.id);

                                var dateText = periodicityWrapper.buildLabel(periodicityWrapper.format);

                                children = {
                                    "id" : fdr.id,
                                    "layerNodeTitle" : layerTitle,
                                    "iconCls" : fdr.type + "Cls",
                                    "glyphCls" : 'glyphicon-pencil',
                                    "leaf" : true,
                                    "qtip" : fdr.title,
                                    "checked" : fdr.display,
                                    "description" : (!fdr.description) ? false : fdr.description,
                                    "belongsTo" : folderId
                                };
                            } else {
                                children = {
                                    "id" : fdr.id,
                                    "layerNodeTitle" : layerTitle,
                                    "name" : fdr.name,
                                    "leaf" : true,
                                    "qtip" : fdr.title,
                                    glpyh : 0xf1e0,
                                    "description" : (!fdr.description) ? false : fdr.description,
                                    "checked" : fdr.display,
                                    "belongsTo" : folderId
                                };
                            }
                        }
                    }

                    var expanded = (fdr.expanded != undefined) ? fdr.expanded : false;

                    var leaf = (counter == 1) ? true : false;

                    if (fdr.type == "folder" && notLoadOnlyLayers.length > 0) {
                        TOCTree.push({
                            "id" : fdr.id,
                            "layerNodeTitle" : fdr.title,
                            "iconCls" : fdr.type + "Cls",
                            "expanded" : expanded,
                            "leaf" : leaf,
                            "qtip" : fdr.title,
                            glpyh : 0xf1e0,
                            "description" : (!fdr.description) ? false : fdr.description,
                            "children" : children,
                            "belongsTo": (typeof(folderId) === 'undefined') ? '' : folderId
                        });
                    } else if (fdr.type == "layer") {
                        TOCTree.push(children);
                    }
                }
                return TOCTree;
            },
            maskTOC : function () {
                var block = owningBlock.blockConfigs;
                if (this.TOCTreeMask === null) {
                    this.TOCTreeMask = new Ext.LoadMask(Ext.getCmp(this.uniqueId), {
                        msg : (typeof(block.progressMessage) !== 'undefined') ? block.progressMessage : "Loading TOC ..."
                        });
                }

                this.TOCTreeMask.show();
                
            },
            unMaskTOC : function () {
                setTimeout(function (extendedTool) {
                    extendedTool.TOCTreeMask.hide();
                }, 
                750,
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

                var TOCTreeDatsetCmp = this.component;
                TOCTreeDatsetCmp.reconfigure(store);
            }
        };
    },
    getComponent: function (extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var TOCJSON = extendedTool.generateTOC();

        //we want to setup a model and store instead of using dataUrl
        Ext.define('layerTree', {
            extend : 'Ext.data.TreeModel',
            fields : [{
                    name : 'layerNodeTitle',
                    type : 'string'
                }, {
                    name : 'description',
                    type : 'string'
                }, {
                    name : 'id',
                    type : 'string'
                }, {
                    name : 'belongsTo',
                    type : 'string'
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

        //Ext.ux.tree.TreeGrid is no longer a Ux. You can simply use a tree.TreePanel
        var tree = {
            extendedTool : extendedTool,
            id : extendedTool.uniqueId,
            title: block.title,
            width : '100%',
            minHeight : 100,
            autoScroll : true,
            store : store,
            rootVisible : false,
            lines : true,
            hideHeaders : true,
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
                        
                        if (id !== '')
                            mapper.layers.moveLayer(layersConfig, id, targetId, position);
                    }
                }
            },
            columns : [{
                    xtype : 'treecolumn', //this is so we know which column will show the tree
                    flex : 1,
                    width : "40%",
                    sortable : true,
                    dataIndex : 'layerNodeTitle',
                }, {
                    xtype: 'templatecolumn',
                    sortable: false,
                    menuDisabled: true,
                    dataIndex: 'description',
                    width: "60%",
                    tpl: new Ext.XTemplate(
                        "<tpl if='this.hasDescription({id})'><i id='{[ this.getBtnId() ]}' data-layer-id='{id}' class='fa fa-question-circle layer-info-btn'></i><tpl else><i class='noLayerInfoIcon'></tpl>",
                        {
                            hasDescription: function(obj) {
                                var layerId = obj.id;
                                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                                var layers = mapper.layers.query(
                                    layersConfig,
                                    {id: layerId},
                                    ['overlays', 'boundaries', 'baselayers']
                                );
                                
                                if (layers.length > 0) {
                                    var layer = layers[0];
                                    if (layer.hasOwnProperty('description') && layer.description !== null && layer.description !== '') {
                                        return true;
                                    }
                                }
                                
                                return false;
                            },
                            getBtnId: function() {
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
                                                    //Ext.Msg.alert(layer.title, layer.description);
                                                    Ext.Msg.show({
                                                         title: layer.title,
                                                         msg: layer.description,
                                                         buttons: Ext.Msg.OK,
                                                         icon: Ext.Msg.QUESTION
                                                    });
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
                }, /*{
                    xtype : 'actioncolumn',
                    menuDisabled : true,
                    sortable : false,
                    width : 25,
                    dataIndex : 'info',
                    items : [{
                            getClass : function (v, meta, record) {
                                var description = mapper.layers.getLayerDescriptionByIdentifier(record.data.id);
                                if (description) {
                                    return 'x-fa fa-question-circle-o';
                                } else {
                                    return 'noLayerInfoIcon';
                                }
                            },
                            getTip : function (v, meta, record) {
                                var description = mapper.layers.getLayerDescriptionByIdentifier(record.data.id);
                                if (description) {
                                    return "<div class='layerInfo'><b>" + record.data.layerNodeTitle + "</b><br><br>" + description.replace(/\"/g, "&apos;") + "</div>";
                                }
                            },
                            handler : function (grid, rowIndex, colIndex) {
                                var record = grid.getStore().getAt(rowIndex);
                                var description = mapper.layers.getLayerDescriptionByIdentifier(record.data.id);
                                if (description) {
                                    Ext.Msg.alert(record.data.layerNodeTitle, mapper.layers.getLayerDescriptionByIdentifier(record.data.id));
                                }
                            }
                        }
                    ]
                }, */{
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
                'itemdblclick' : function (tree, record, item, index, e, eOpts) {
                    mapper.layers.createNewInstanceOfLayersConfig();
                    var folderId = record.get("id");
                    var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                    var folder = mapper.layers.query(
                        layersConfig.overlays,
                        {id: folderId}
                    );
                    
					var onLayers = mapper.layers.query(
						layersConfig.overlays,
						{display: true}
					);
					
					for (var i = 0, len = onLayers.length; i < len; i+=1) {
						onLayers[i].display = false;
					}
                    
                    var layers = mapper.layers.query(
                        folder[0].folder,
                        {
                            type: 'layer',
                            mask: false,
                            loadOnly: false
                        }
                    )
					layers[0].display = true;
					
                    /*var firstLayer = layers[0];
                    
                    mapper.common.turnOnOnlyLayerWithIDInOverlaysConfig(layersConfig.overlays, firstLayer.id);*/
                    
                    mapper.EventCenter.defaultEventCenter.postEvent(
                        mapper.EventCenter.EventChoices.EVENT_REQUESTING_NEW_MAP_WINDOW,
                        null,
                        null);
                },
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };

        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
            extendedTool.owningBlock.itemDefinition.mapWindowFocusedEventHandler,
            extendedTool);

        tree = skin.blocks.addToolBarItems(block, tree, toolbar);

        return Ext.create('Ext.tree.TreePanel', tree);
    }
};

export var toolName = "cDatasetToc";
export var tool = cDatasetToc;