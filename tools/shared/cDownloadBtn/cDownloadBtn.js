var cDownloadBtn = {
    options: {
        requiredBlocks: ['cFeatureInfoTable']
    },
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            startDownload: function() {
                var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var layers = mapper.layers.query(
                    layersConfig,
                    {
                        type: 'layer',
                        display: true,
                        loadOnly: false,
                        mask: false
                    },
                    ['overlays', 'boundaries']
                );
                
                var requestCount = 0;
                var totalCount = 0;
                var layerMapping = this.owningBlock.blockConfigs.layers;
                
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];
                    var mappedLayer = mapper.layers.toolMapping.getLayerConfigs(layer.id, layerMapping);
                    if (mappedLayer === null) continue;
                    
                    totalCount+=1;
                    
                    var mappedFeatureInfo = mappedLayer.featureInfo;
                    var cqlFilterParam = '';
                    var cqlFilter = [];
                    var idProperty = '';
                    var properties = [];
                    
                    if (layer.hasOwnProperty('cqlFilter')) {
                        for (var prop in layer.cqlFilter) {
                            if (layer.cqlFilter[prop] !== null) cqlFilter.push(layer.cqlFilter[prop]);
                        }
                    }
                    if (cqlFilter.length > 0) {
                        cqlFilterParam = '&CQL_FILTER='+cqlFilter.join(' AND ');
                    }
                    
                    for (var j = 0, length = mappedFeatureInfo.length; j < length; j+=1) {
                        if (mappedFeatureInfo[j].type === 'id') idProperty = mappedFeatureInfo[j].propertyName;
                        properties.push(mappedFeatureInfo[j].propertyName);
                    }
                    
                    var url = layer.source.wfs;
                    var params = 'service=WFS&request=GetFeature&version=1.1.0&srsName='+layer.srs+'&typeNames='+layer.name+'&outputFormat=application/json&propertyName='+properties.join(',')+cqlFilterParam;
                    mapper.common.asyncAjax({
                        type: 'POST',
                        params: params,
                        url: url,
                        callbackObj: {
                            requestCount: requestCount,
                            totalCount: totalCount,
                            extendedTool: this,
                            downloadPath: mappedLayer.downloadPath,
                            properties: properties,
                            idProperty: idProperty
                        },
                        callback: function(response, callbackObj) {
                            var featureInfo = JSON.parse(response.responseText);
                            var extendedTool = callbackObj.extendedTool;
                            var downloadPath = callbackObj.downloadPath;
                            var properties = callbackObj.properties;
                            var idProperty = callbackObj.idProperty;
                            var features = mapper.OpenLayers.combineFeaturesByProperties(featureInfo.features, [idProperty]);
                            
                            callbackObj.requestCount += 1;
                            if (callbackObj.totalCount === callbackObj.requestCount) {
                                var featureInfoTableBlock = extendedTool.owningBlock.getReferencedBlock('cFeatureInfoTable');
                                var tableRecords = featureInfoTableBlock.extendedTool.featureList;
                                var downloadRecords = [];
                                for (var i = 0, len = tableRecords.length; i < len; i+=1) {
                                    var tableRecord = tableRecords[i];
                                    if (tableRecord[1] === true) {
                                        var filePath = downloadPath;
                                        for (var j = 0, length = features.length; j < length; j+=1) {
                                            var feature = features[j];
                                            if (feature.properties[idProperty] === tableRecord[0]) {
                                                for (var k = 0, propertiesLength = properties.length; k < propertiesLength; k+=1) {
                                                    var property = properties[k];
                                                    var value = feature.properties[property];
                                                    if (typeof(value) === 'string') value = value.toLowerCase();
                                                    filePath = filePath.replace('{'+property+'}', value);
                                                }
                                            }
                                        }
                                        mapper.Analytics.reportActivity(filePath,"Downloads","Download");
                                        downloadRecords.push(filePath);
                                    }
                                }
                                
                                var form = document.createElement('form');
                                form.setAttribute('method', 'POST');
                                form.setAttribute('action', 'https://edcintl.cr.usgs.gov/mtbs_remote_zip_servlet/ZipServlet');
                                var input = document.createElement('input');
                                input.setAttribute('type', 'hidden');
                                input.setAttribute('name', 'file_paths');
                                input.setAttribute('value', downloadRecords.join(','));
                                form.appendChild(input);
                                document.body.appendChild(form);
                                form.submit();
                            }
                        }
                    });
                }
            }
        };
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var component = {
            extendedTool: extendedTool,
            xtype: 'button',
            width: block.width,
            height: block.height,
            text: block.text,
            handler: function() {
                this.extendedTool.startDownload();
            },
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                }
            }
        };
        
        var featureInfoTableBlock = extendedTool.owningBlock.getReferencedBlock('cFeatureInfoTable');
        if (featureInfoTableBlock !== null) {
            featureInfoTableBlock.on('tableUpdatedEvent', function(callbackObj, postingObj) {
                var extendedTool = callbackObj;
                var featureInfoTable = postingObj;
                
                var recordCount = featureInfoTable.featureList.length;
                
                var btnText = extendedTool.owningBlock.blockConfigs.text;
                extendedTool.component.setText(btnText.replace('{count}', recordCount.toLocaleString()));
            }, extendedTool);
            
            featureInfoTableBlock.on('checkchange', function(callbackObj, postingObj) {
                var extendedTool = callbackObj;
                var featureInfoTable = postingObj;
                
                var recordCount = 0;
                var featureList = featureInfoTable.featureList;
                for (var i = 0, len = featureList.length; i < len; i+=1) {
                    var feature = featureList[i];
                    if (feature[1] === true) {
                        recordCount += 1;
                    }
                }
                
                var btnText = extendedTool.owningBlock.blockConfigs.text;
                extendedTool.component.setText(btnText.replace('{count}', recordCount));
            }, extendedTool);
        }
        
        return component;
    }
};

export var toolName = "cDownloadBtn";
export var tool = cDownloadBtn;