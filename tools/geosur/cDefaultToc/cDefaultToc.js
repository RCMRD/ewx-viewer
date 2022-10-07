/** cDefaultToc.js
 * Tool to display TOC using the folder and layer structure defined on the data*.json.
 * This tool is based on the cDefaultToc shared tool but modified to make it work for the GEOSUR viewer.
 * The current shared tool does not work for the GEOSUR viewer because it resets
 * the TOC back to the data*.json config info when a change is applied.
 * 
 * Required Tools:
 *      N/A
 *      
 * Block Parameters:
 *      Required:
 *          name: "cDefaultToc" - The name of the tool.
 *          import: The location of the tools javascript code
 *              Ex: import": "tools.geosur.cDefaultToc.cDefaultToc"
 *          add: Boolean - Indicates whether to load this tool or not
 *          width: tool width
 *          height: tool height
 *          titleLength: title length          
 * 
 *      Optional:
 *          block: EWX, QuickDri, GLC use this - but I don't see where its being used - should it be removed from their config file?
 *          hideDatePicker: Boolean: Boolean - Indicates whether to hide or show the date picker
 *          progressMessage: progress message when applying changes on the TOC.
 * 
 */
 
var cDefaultToc = {
    options: {
        events: ['recordselected']
    },
    mapWindowFocusedEventHandler : function (eventObject, callbackObject, postingObject) {
        var tocExtendedTool = callbackObject;
        var currentInstanceId = mapper.layers.getLayersConfigInstanceId();
        var layersConfig = mapper.layers.getLayersConfigById(currentInstanceId);
        
        tocExtendedTool.updateTocStore();
    },
    createExtendedTool: function(owningBlock) {
        return {
            owningBlock: owningBlock,
            TOCTreeMask: null,
            generateTOC : function () {
                
                var TOCTree = [];

                var newLayersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());

                var titleLength = owningBlock.blockConfigs.titleLength;                               

                var overlays = this.parseLayers(newLayersConfig.overlays,undefined,undefined,titleLength);
                var boundaries = this.parseLayers(newLayersConfig.boundaries,undefined,undefined,titleLength);
                var baselayers = this.parseLayers(newLayersConfig.baselayers,undefined,undefined,titleLength);

                TOCTree = TOCTree.concat(overlays.reverse()).concat(boundaries).concat(baselayers);

                return TOCTree;
            },
            parseLayers : function (folders, folderId, level,titleLength) {
                if (typeof(level) === 'undefined') level = 0;
                var TOCTree = [];
                var children;

                var maxTitleLength = titleLength;

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
                                    "iconCls" : fdr.type + "Cls",
                                    "glyphCls" : 'glyphicon-pencil',
                                    "leaf" : true,
                                    "qtip" : fdr.title,
                                    "description" : fdr.description,
                                    "checked" : fdr.display,
                                    "belongsTo": folderId
                                };
                            } else {
                                children = {
                                    "id" : fdr.id,
                                    "layerNodeTitle" : layerTitle,
                                    "period" : "",
                                    "name" : fdr.name,
                                    "leaf" : true,
                                    "qtip" : fdr.title,
                                    glpyh : 0xf1e0,
                                    "description" : fdr.description,
                                    "checked" : fdr.display,
                                    "belongsTo": folderId
                                };
                            }

                        }
                    }

                    var expanded = (fdr.expanded != undefined) ? fdr.expanded : false;

                    if (fdr.type == "folder" && children.length > 0) {
                        TOCTree.push({
                            "id" : fdr.id,
                            "layerNodeTitle" : mapper.common.truncateString(fdr.title, 0, maxTitleLength),
                            "iconCls" : fdr.type + "Cls",
                            "expanded" : expanded,
                            "children" : children,
                            "qtip" : fdr.title,
                            "description" : fdr.description,
                            "belongsTo": (typeof(folderId) === 'undefined') ? '' : folderId
                        });
                    } else if (fdr.type == "layer" && fdr.loadOnly === false && fdr.mask === false) {
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
                            },
                            beforeexpand : function (aNode, eOpts) {
                                var layerNodeTitle = aNode.raw.layerNodeTitle;
                                var currentInstanceId = mapper.layers.getLayersConfigInstanceId();
                                var layersConfig = mapper.layers.getLayersConfigById(currentInstanceId);
                                var expandFolderIndex = -1;
                                for (var i = 0, len = layersConfig.overlays[0].folder.length; i < len; i+=1) {
                                    if (layersConfig.overlays[0].folder[i].title === layerNodeTitle) {
                                        expandFolderIndex = i;
                                        break;
                                    }
                                }
                                if (expandFolderIndex != -1) {
                                    layersConfig.overlays[0].folder[expandFolderIndex].expanded = true;
                                }
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
                }
            ]
        });

        var store = Ext.create('Ext.data.TreeStore', {
                model : 'layerTree',
                root : {
                    expanded : true,
                    children : JSON.parse(JSON.stringify(TOCJSON))
                },
                listeners : {
                    'beforeexpand' : function (aNode, eOpts) {
                        var layerNodeTitle = aNode.raw.layerNodeTitle;
                        var currentInstanceId = mapper.layers.getLayersConfigInstanceId();
                        var layersConfig = mapper.layers.getLayersConfigById(currentInstanceId);
                        var expandFolderIndex = -1;
                        for (var i = 0, len = layersConfig.overlays[0].folder.length; i < len; i+=1) {
                            if (layersConfig.overlays[0].folder[i].title === layerNodeTitle) {
                                expandFolderIndex = i;
                                break;
                            }
                        }
                        if (expandFolderIndex != -1) {
                            layersConfig.overlays[0].folder[expandFolderIndex].expanded = true;
                        }
                    }
                }
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
                height : block.height,
                minHeight : 100,
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
                        this.extendedTool.owningBlock.fire('recordselected', this, record.data.id);
                    },
                    'checkchange' : function (record, checked, eOpts) {
                        mapper.layers.setLayerDisplay(record.data.id, checked);
                    },
                    afterrender: function() {
                        this.extendedTool.component = this;
                        this.extendedTool.owningBlock.component = this;
                        this.extendedTool.owningBlock.rendered = true;
                    }
                }
            };
            
        tree = skin.ExtJSPosition(tree, block);
        tree = Ext.create('Ext.tree.TreePanel', tree);

        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_MAPWINDOW_FOCUSED,
            extendedTool.owningBlock.itemDefinition.mapWindowFocusedEventHandler,
            extendedTool);
            
        mapper.EventCenter.defaultEventCenter.registerCallbackForEvent(
            mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
            extendedTool.owningBlock.itemDefinition.mapWindowFocusedEventHandler,
            extendedTool);

        return tree;
    }
};

export var toolName = "cDefaultToc";
export var tool = cDefaultToc;