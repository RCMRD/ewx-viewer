var cLayersToc = {
    mapWindowFocusedEventHandler : function (eventObject, callbackObject, postingObject) {
        var tocExtendedTool = callbackObject;
        
        tocExtendedTool.updateTocStore();
    },
    datePickerUpdatedEventHandler : function (eventObject, callbackObject, postingObject) {
        var tocExtendedTool = callbackObject;
        if( tocExtendedTool.shouldIgnoreNextLayerConfigUpdate)
        {}
        else
        {
            tocExtendedTool.updateTocOverLaysTitle();     
        }
       
    },
    createExtendedTool: function(owningBlock) {
        return {
            shouldIgnoreNextLayerConfigUpdate:false,
            owningBlock: owningBlock,
            uniqueId: 'toc-' + mapper.common.getRandomString(32, 36),
            TOCTreeMask: null,
            generateTOC : function () {
                var TOCTree = [];
                var children = [];

                var newLayersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                
                var overlays = mapper.layers.query(
                    newLayersConfig.overlays,
                    {
                        type: 'layer',
                        display: true,
                        mask: false,
                        loadOnly: false
                    }
                );
                
                for (var i = 0, len = overlays.length; i < len; i+=1) {
                    var overlay = overlays[i];
                    var overlayName = '';
                    if (overlay.isAdded === true) {
                        overlayName = (overlay.title) ? overlay.title : overlay.name;
                    } else {
                        overlayName = mapper.layers.getLayerTitleById(newLayersConfig, overlay.id);
                    }

                    children.push({
                        "id" : overlay.id,
                        "layerNodeTitle" : mapper.common.truncateString(overlayName, 0, 40),//overlayName.substr(0, 45) + " ...",
                        "qtip" : overlayName,
                        "name" : overlayName,
                        "leaf" : true,
                        "glpyh" : 0xf1e0,
                        "checked" : true,
                        "draggable" : false,
                        "belongsTo" : "overlays"
                    });
                }

                TOCTree.push({
                    "layerNodeTitle" : "Overlays",
                    "iconCls" : "folderCls",
                    "expanded" : true,
                    "children" : children,
                    "belongsTo" : ''
                });
                
                var boundaries = this.parseLayers(newLayersConfig.boundaries);

                for (var b in boundaries) {
                    TOCTree[parseInt(b) + TOCTree.length] = boundaries[b];
                }

                var baselayers = this.parseLayers(newLayersConfig.baselayers);
                for (var l in baselayers) {
                    TOCTree[parseInt(l) + TOCTree.length] = baselayers[l];
                }
                return TOCTree;
            },
            parseLayers : function (folders, folderId) {
                var TOCTree = [];
                var children;

                for (var o in folders) {
                    children = [];
                    var fdr = folders[o];

                    if (fdr.type == "folder") {
                        children = this.parseLayers(fdr.folder, fdr.id);
                    } else if (fdr.type == "layer") {
                        if (fdr.loadOnly == false) {

                            var layerTitle = mapper.common.truncateString(fdr.title, 0, 40);

                            if (fdr.timeseries != undefined) {
                                mapper.periodicity.setPeriodType(fdr.timeseries.type);

                                var dateText = mapper.periodicity.getTimeSeriesText(fdr.timeseries);

                                children = {
                                    "id" : fdr.id,
                                    "layerNodeTitle" : layerTitle,
                                    "info" : fdr.title,
                                    "iconCls" : fdr.type + "Cls",
                                    "glyphCls" : 'glyphicon-pencil',
                                    "leaf" : true,
                                    "qtip" : fdr.title,
                                    "checked" : fdr.display,
                                    "belongsTo" : folderId
                                };
                            } else {
                                children = {
                                    "id" : fdr.id,
                                    "layerNodeTitle" : layerTitle,
                                    "name" : fdr.name,
                                    "leaf" : true,
                                    "qtip" : fdr.title,
                                    "glpyh" : 0xf1e0,
                                    "checked" : fdr.display,
                                    "belongsTo" : folderId
                                };
                            }
                        }
                    }


                    var expanded = (fdr.expanded != undefined) ? fdr.expanded : false;

                    if (fdr.type == "folder") {
                        TOCTree.push({
                            "id" : fdr.id,
                            "layerNodeTitle" : fdr.title,
                            "iconCls" : fdr.type + "Cls",
                            "expanded" : expanded,
                            "info" : fdr.title,
                            "children" : children,
                            "belongsTo" : (typeof(folderId) === 'undefined') ? '' : folderId
                        });
                    } else if (fdr.type == "layer" && fdr.loadOnly === false) {
                        TOCTree.push(children);
                    }
                }

                return TOCTree;
            },
            maskTOC : function () {
                var block = owningBlock.blockConfigs;
                if (this.TOCTreeMask == null) {
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
                var extendedTool = this;
                
                var TOCJSON = this.generateTOC();

                var store = Ext.create('Ext.data.TreeStore', {
                        model : 'layerTree',
                        root : {
                            expanded : true,
                            children : JSON.parse(JSON.stringify(TOCJSON))
                        },
                        listeners : {
                            datachanged : function (s, eOpts) {
                                extendedTool.unMaskTOC();
                            }
                        }
                    });

                var TOCTreeLayersCmp = this.component;
                TOCTreeLayersCmp.reconfigure(store);
            },
            updateTocOverLaysTitle : function () {
                var TOCJSON = this.generateTOC();

                var store = Ext.create('Ext.data.TreeStore', {
                        model : 'layerTree',
                        root : {
                            expanded : true,
                            children : JSON.parse(JSON.stringify(TOCJSON))
                        },
                    });

                var TOCTreeLayersCmp = this.component;
                TOCTreeLayersCmp.reconfigure(store);

            }
        };
    },
    getComponent: function (extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
        var TOCJSON = extendedTool.generateTOC();

        //we want to setup a model and store instead of using dataUrl
        Ext.define('layerTree', {
            extend : 'Ext.data.TreeModel',
            fields : [{
                name : 'layerNodeTitle',
                type : 'string'
            }, {
                name : 'info',
                type : 'string'
            }, {
                name : 'id',
                type : 'string'
            }, {
                name : 'belongsTo',
                type : 'string'
            }, {
                name : 'draggable',
                type : 'auto'
            }, {
                name : 'leaf',
                type : 'boolean'
            }]
        });

        var store = Ext.create('Ext.data.TreeStore', {
            model : 'layerTree',
            root : {
                expanded : true,
                children : JSON.parse(JSON.stringify(TOCJSON))
            },
        });

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
                        if (data.belongsTo === '' || targetData.belongsTo === '') return false;
                        if (data.belongsTo !== targetData.belongsTo) return false;
                    },
                    drop: function(targetNode, data, overModel, position) {
                        var targetId = overModel.data.id,
                        id = data.records[0].data.id,
                        layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                        
                        if (id !== '' && overModel.data.belongsTo !== '' && data.records[0].data.belongsTo !== '') {
                            mapper.layers.moveLayer(layersConfig, id, targetId, position);
                        }
                    }
                }
            },
            columns : [{
                    xtype : 'treecolumn', //this is so we know which column will show the tree
                    flex : 1,
                    sortable : true,
                    dataIndex : 'layerNodeTitle'
                }, {
                    xtype: 'templatecolumn',
                    sortable: false,
                    menuDisabled: true,
                    dataIndex: 'description',
                    width: 33,
                    tpl: new Ext.XTemplate(
                        "<tpl if='this.hasDescription({id:id})'><i id='{[ this.getBtnId() ]}' data-layer-id='{id}' class='fa fa-question-circle layer-info-btn'></i><tpl else><i class='noLayerInfoIcon'></tpl>",
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
                }, /*{
                    xtype : 'actioncolumn',
                    menuDisabled : true,
                    sortable : false,
                    width : 25,
                    dataIndex : 'info',
                    items : [{
                            getClass : function (v, meta, record) {
                                var description = mapper.layers.getLayerDescriptionByIdentifier(record.data.id);
                                if (record.data.leaf === true && (description)) {
                                    return 'layerInfoIcon';
                                } else {
                                    return 'noLayerInfoIcon';
                                }
                            },
                            getTip : function (v, meta, record) {
                                var description = mapper.layers.getLayerDescriptionByIdentifier(record.data.id);
                                if (record.data.leaf === true && description) {
                                    return "<div class='layerInfo'><b>" + record.data.qtip + "</b><br><br>" + description + "</div>";
                                }
                            },
                            handler : function (grid, rowIndex, colIndex) {
                                var record = grid.getStore().getAt(rowIndex);
                                var description = mapper.layers.getLayerDescriptionByIdentifier(record.data.id);
                                if (record.data.leaf === true && description) {
                                    Ext.Msg.alert(record.data.layerNodeTitle, mapper.layers.getLayerDescriptionByIdentifier(record.data.id));
                                }

                            }
                        }
                    ]
                }, */{
                    hidden : true,
                    sortable : true,
                    dataIndex : 'id'
                }
            ],
            listeners : {
                checkchange : function (record, checked, eOpts) {
                    this.extendedTool.shouldIgnoreNextLayerConfigUpdate = true;
                    mapper.layers.setLayerDisplay(record.data.id, checked);
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

        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
            extendedTool.owningBlock.itemDefinition.datePickerUpdatedEventHandler,
            extendedTool);

        tree = skin.blocks.addToolBarItems(block, tree, toolbar);

        return Ext.create('Ext.tree.TreePanel', tree);
    }
};

export var toolName = "cLayersToc";
export var tool = cLayersToc;