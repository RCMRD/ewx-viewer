var cMapDownloadsMenuItemPNG = {
    options: {
        requiredBlocks: ['cMapWindow', 'cMapPanel']
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        var block = extendedTool.owningBlock.blockConfigs;
        
        var menuItem = {
            extendedTool: extendedTool,
            text : block.text,
            handler : function () {
                var mapWindowBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapWindow');
                var mapperWindow = mapWindowBlock.extendedTool;
                var mapPanelBlock = this.extendedTool.owningBlock.getReferencedBlock('cMapPanel');
                
                var blockConfigs = this.extendedTool.owningBlock.blockConfigs;
                var type = blockConfigs.type;
                var format = blockConfigs.format;
                var layersConfig = mapper.layers.getLayersConfigById(mapperWindow.layersConfigId);
                var openlayersMap = mapPanelBlock.component.map;

                var includeBoundaries = blockConfigs.includeBoundaries;
                var overrideExtentWithFullExtent = blockConfigs.overrideExtentWithFullExtent;

                var tempMask = new Ext.LoadMask(Ext.get(mapWindowBlock.component.id), {
                        msg : (typeof(block.progressMessage) !== 'undefined') ? block.progressMessage : "Generating download ..."
                    });
                tempMask.show();


                //so the whole thing here
                //is we need to get separate getMapRequests for each layer
                //the reason is because the layers are all on different servers
                //so we cannot make a request to one server with all of the layers
                //that we want
                //instead we have to make requests to each server
                //then composite the images by ourselves into one image for download

                var windowJsonLayers = mapper.layers.query(
                    layersConfig,
                    {
                        type: 'layer',
                        display: true,
                        mask: false,
                        loadOnly: false
                    },
                    ['overlays','boundaries']
                );


                var w = mapPanelBlock.component.getWidth();
                var h = mapPanelBlock.component.getHeight();
                var mime = "image/png";

                var title = mapper.layers.getTopLayerTitle(layersConfig.overlays).replace(/,/g, "").replace(/ /g, "_");
                var extension = 'png';
                var filenameToUse = title+"."+extension;

                var layerDownloadUrls = []
                for(var index in windowJsonLayers)
                {
                    var anotherURL = mapper.OpenLayers.getDownloadURLOfJSONLayerObject(windowJsonLayers[index],openlayersMap,"image/png",w,h);
                    layerDownloadUrls.push(anotherURL);
                }

                //http://stackoverflow.com/questions/31710768/how-can-i-fetch-an-array-of-urls-with-promise-all
                //ie doesnt support arrow syntax
                //so map fetch function to each url to create a array of fetch promises for each url

                var fetchURLPromises = layerDownloadUrls.map(function(aurl)
                {
                    return fetch(aurl).then(
                        function(response)
                        {
                            return response.blob();//the blob formatting is another promise
                        }
                        );
                });


                function compositeBlobsTogether(canvas,ctx,blobArray)
                {

                    var img = new Image();
                    var blobWeWant = blobArray.shift();//get first element and take it out
                    img.src = URL.createObjectURL(blobWeWant);

                    img.onload = function() 
                    {

                        ctx.drawImage(img,0,0 ,img.width, img.height);
                        //ctx.drawImage(img, 0, 0, w, h);

                        
                        //document.body.removeChild(link);
                        //document.body.removeChild(canvas);

                        if(blobArray.length > 0)
                        {
                            compositeBlobsTogether(canvas,ctx,blobArray);
                        }
                        else
                        {

                            var newURL = (mime === 'image/geotiff') ? canvas.toDataURL('image/png') : canvas.toDataURL(mime);
                            var blob = mapper.common.dataURItoBlob(newURL, mime);


                            if(/*@cc_on!@*/false || !!document.documentMode) 
                            {
                                //this if statement is to detect IE
                                //bc IE cannot open blob urls
                                //https://buddyreno.me/efficiently-detecting-ie-browsers-8744d13d558
                                window.navigator.msSaveOrOpenBlob(blob,filenameToUse);    
                            }
                            else
                            {
                                
                                var link = document.createElement('a');
                                link.setAttribute("download",filenameToUse);
                                link.setAttribute("href",window.URL.createObjectURL(blob));
                                document.body.appendChild(link);
                                link.click();
                            }
                            
                        }

                    
                    }
                }

                Promise.all(fetchURLPromises).then
                (
                    function(blobArray)
                    {
                        //mapper.log(imageDataArray);
                        //so now we have all of the rasters loaded from their urls

                        var canvas = document.createElement('canvas');
                        document.body.appendChild(canvas);
                        var ctx = canvas.getContext('2d');
                        canvas.setAttribute('width', w + 'px');
                        canvas.setAttribute('height', h + 'px');

                        compositeBlobsTogether(canvas,ctx,blobArray);
                        tempMask.hide();
                    }
                ).
                catch(function(err)
                {
                    mapper.log(err);
                }
                );


                //mapper.log(windowJsonLayers);
                //mapper.log(mapper.OpenLayers.getDownloadURLOfJSONLayerObject(windowJsonLayers[0],openlayersMap,"image/png",mapPanelBlock.component.getWidth(),mapPanelBlock.component.getHeight()));

                /*
                //--------------

                var windowJsonLayers = mapper.common.getAllLayersIncludeOverlayIncludeBoundaryRequireDisplay(layersConfig, true, false, true);

                if (windowJsonLayers.length == 0)
                    return null;

                windowJsonLayers.sort(mapper.OpenLayers.zIndexSortAscending);

                var layer = windowJsonLayers[windowJsonLayers.length - 1];

                var aURL = mapper.OpenLayers.getDownloadURLOfMapImage(
                        layersConfig,
                        openlayersMap,
                        "image/png",
                        mapPanelBlock.component.getWidth(),
                        mapPanelBlock.component.getHeight());

                var title = mapper.layers.getTopLayerTitle(layersConfig.overlays).replace(/,/g, "").replace(/ /g, "_");

                var legendURL = mapper.legend.getLegendURL(layer);

                mapper.common.startDownloadOfImageURL(aURL, 'image/png', title + ".png", function () {
                    tempMask.hide();
                });

                mapper.log(aURL);

               
                if (legendURL === null) {
                    mapper.common.startDownloadOfImageURL(aURL, 'image/png', title + ".png", function () {
                        tempMask.hide();
                    });
                } else {
                    mapper.common.startDownloadOfImageURLWithLegend(aURL, legendURL, 'image/png', title + ".png", function () {
                        tempMask.hide();
                    });
                }
                */
            

            }
        };
        
        return menuItem;
    }
}

export var toolName = "cMapDownloadsMenuItemPNG";
export var tool = cMapDownloadsMenuItemPNG;