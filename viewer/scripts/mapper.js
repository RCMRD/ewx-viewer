var mapper = [];
var skin = [];

/*var configurations = (!configurations) ? [{
		"id" : "componentConfig",
		"source" : "configs/template.json",
		"type" : "json",
		"description" : "Template Configuration: Configuration for blocks",
		"requires" : "none",
		"dependant" : "none"
	}, {
		"id" : "layerConfig",
		"source" : "configs/data.json",
		"type" : "json",
		"description" : "Data Configuration: This is the main config that defines layers to display in the map among other things",
		"requires" : "remoteResource",
		"dependant" : "none"
	}
] : configurations;*/

mapper = {
    urlParameters: {},
    // Default to true in case config type is not set in settings.json
    configReady: {
        layers: true,
        regions: true,
        charts: true,
        periods: true,
        projections: true,
        template: true
    },
    debug:false,
    log: function(args){
        if(this.debug) console.log(args);
    },
    warn: function (args) {
        if(this.debug) console.warn(args);
    },
    info: function (args) {
        if(this.debug) console.info(args);
    },
    error: function (args) {
        if(this.debug) console.error(args);
    },
    userEmail : null,
	init : function (skinFinishFunc) {
		
		
        if (location.search !== '') {
            var parameters = location.search.slice(1).split('&');
            var kvps = {};
            for (var i = 0, len = parameters.length; i < len; i+=1) {
                var parameter = parameters[i];
                if (parameter.indexOf('=') === -1) continue;
                var kvp = parameter.split('=');
                if (kvp[0] === '' || kvp[1] === '') continue;
                kvps[kvp[0]] = kvp[1];
            }
            mapper.urlParameters = kvps;
        }

        mapper.common.asyncAjax({
            type: 'GET',
            url: 'configs/settings.json',
            callback: function(configRequest) {
                if (configRequest.readyState == 4 && configRequest.status == 200 && configRequest.responseText != "") {
                    if (mapper.common.isJSONValid(configRequest.responseText,configRequest)) {
                        var settings = JSON.parse(configRequest.responseText);
                        if (settings.hasOwnProperty('authentication_url') && settings.authentication_url !== "" && settings.authentication_url !== null) {
                            var authenticationUrl = settings.authentication_url;
                            var loadingMask = document.getElementById('initial-loading-message');
                            loadingMask.style.display = "none";

                            var loginFormWrapper = document.createElement('div');
                            loginFormWrapper.id = "login-form-wrapper";
                            loginFormWrapper.style.border = "3px solid black";
                            loginFormWrapper.style['border-radius'] = "3px";
                            loginFormWrapper.style.display = "flex";
                            loginFormWrapper.style['flex-direction'] = "column";
                            loginFormWrapper.style['justify-content'] = "center";
                            loginFormWrapper.style['align-items'] = "center";

                            var loginFormHeader = document.createElement('p');
                            loginFormHeader.style['font-size'] = "16px";
                            loginFormHeader.style['font-weight'] = "bold";
                            loginFormHeader.style['margin-bottom'] = "0";
                            loginFormHeader.innerHTML = "Authentication Required.";
                            loginFormWrapper.appendChild(loginFormHeader);

                            var loginForm = document.createElement('form');
                            loginForm.method = 'POST';
                            loginForm.action = authenticationUrl;
                            loginForm.id = "login-form";
                            loginForm.style.width = "200px";
                            loginForm.style.height = "125px";
                            loginForm.style.padding = "10px";

                            var emailField = document.createElement('div');
                            emailField.style.margin = "10px";
                            var emailLabel = document.createElement('label');
                            emailLabel.for = 'email';
                            emailLabel.innerHTML = "Email:";
                            emailField.appendChild(emailLabel);
                            var emailTextbox = document.createElement('input');
                            emailTextbox.type = "text";
                            emailTextbox.id = "email";
                            emailTextbox.name = "email";
                            emailField.appendChild(emailTextbox);
                            loginForm.appendChild(emailField);

                            var passwordField = document.createElement('div');
                            passwordField.style.margin = "10px";
                            var passwordLabel = document.createElement('label');
                            passwordLabel.for = "password";
                            passwordLabel.innerHTML = "Password:";
                            passwordField.appendChild(passwordLabel);
                            var passwordTextbox = document.createElement('input');
                            passwordTextbox.type = "password";
                            passwordTextbox.id = "password";
                            passwordTextbox.name = "password";
                            passwordField.appendChild(passwordTextbox);
                            loginForm.appendChild(passwordField);

                            var submitField = document.createElement('div');
                            submitField.style.margin = "10px";
                            submitField.style['text-align'] = "right";
                            var submitButton = document.createElement('button');
                            submitButton.type = 'submit';
                            submitButton.id = "login-submit";
                            submitButton.innerHTML = "Login";
                            submitField.appendChild(submitButton);
                            loginForm.appendChild(submitField);

                            loginForm.onsubmit = function(e) {
                                e.preventDefault();
                                submitButton.innerHTML = "<img src='images/loading.gif'>";
                                var emailTextbox = document.getElementById('email');
                                var passwordTextbox = document.getElementById('password');
                                var email = emailTextbox.value;
                                var password = passwordTextbox.value;
                                mapper.common.asyncAjax({
                                    url: this.action,
                                    type: this.method,
                                    params: 'email='+email+'&password='+password,
                                    callback: function(request) {
                                        var responseJson = JSON.parse(request.responseText);
                                        if (responseJson.success === true) {
                                            mapper.userEmail = email;
                                            var loadingMask = document.getElementById('initial-loading-message');
                                            loadingMask.style.display = "flex";
                                            document.getElementById('initial-loading-mask').removeChild(document.getElementById('login-form-wrapper'));
                                            mapper.getConfigurations(settings);
                                        } else {
                                            var passwordTextbox = document.getElementById('password');
                                            passwordTextbox.value = "";
                                            var loginForm = document.getElementById('login-form');
                                            var errorMessage = document.getElementById("login-error-message");
                                            if (errorMessage === null) {
                                                errorMessage = document.createElement('p');
                                                errorMessage.style.color = "red";
                                                errorMessage.id = "login-error-message";
                                                errorMessage.innerHTML = responseJson.errorMessage;
                                                loginForm.appendChild(errorMessage);
                                                loginForm.style.height = "170px";
                                            } else {
                                                errorMessage.innerHTML = responseJson.errorMessage;
                                            }
                                            submitButton.innerHTML = "Login";
                                        }
                                    }
                                });
                            }

                            loginFormWrapper.appendChild(loginForm);
                            document.getElementById('initial-loading-mask').appendChild(loginFormWrapper);
                        } else {
                            mapper.getConfigurations(settings,skinFinishFunc);
                        }
                    }
                }
            },
            errorCallback: function(configRequest) {
                if (configRequest.status === 404) {
                    document.getElementById('initial-loading-message').innerHTML = "<p style='color: red; padding: 0 10px;'>No settings.json file found in configs folder. This file is required to load the application.</p>";
                } else {
                    document.getElementById('initial-loading-message').innerHTML = "<p style='color: red; padding: 0 10px;'>An unknown error occured trying to load settings.json. Status code: "+configRequest.status+"</p>";
                }
            }
        });

        mapper.requestCounter = 0; // Used to create unique callback names when multiple json requests are being performed asynchronously.

	},

    getConfigurations : function(settings,skinFinishFunc) {
		
        this.debug= settings.debugMode;
		
		/*
		if (typeof(settings.service_check) != 'undefined')
		{
			var service_check_url = settings.service_check.source;
			fetch(settings.service_check.source).then
			(
				function(response)
				{
					return response.json()//this is another promise
				}
			).then(
				function(some_json)
				{
					//do stuff here
				}
			);
			
		}*/

		
        var configFiles = settings.configurationFiles;
        for (var node in configFiles) {
            if (node === 'analytics' || node === 'cssoverride') continue;
            mapper.configReady[node] = false; // Set config ready to false for nodes that exist in settings.json
            configFiles[node].id = node;
            if (configFiles[node].type === 'jsonp') {
                this.loadJSONPConfiguration(configFiles[node]);//deprecated I think
            } else {
                this.loadConfiguration(configFiles[node],skinFinishFunc);
            }
        }

        /*configFiles.data.id = 'data';
        configFiles.template.id = 'template';

        if (configFiles.data.type === 'jsonp') {
            this.loadJSONPConfiguration(configFiles.data);
        } else {
            this.loadConfiguration(configFiles.data);
        }

        configFiles.template.source = (window.outerWidth < 600 || window.outerHeight < 400) ?  configFiles.template.source.replace(".json", "") + "_mobile.json" : configFiles.template.source;
        if (configFiles.template.type === 'jsonp') {
            this.loadJSONPConfiguration(configFiles.template);
        } else {
            this.loadConfiguration(configFiles.template);
        }*/

        //analytics doesnt need to be loaded, just linked
        if (typeof(configFiles.analytics) != 'undefined')
        {
            var source = configFiles.analytics.source;
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.src = source;
            script.type = 'text/javascript';
            head.appendChild(script);
        }


        if (typeof(configFiles.cssoverride) != 'undefined')
        {
            //mapper.Analytics.addGoogAnalytics(configFiles.cssoverride.source, configFiles.cssoverride.type, 'link');
            var source = configFiles.cssoverride.source;
            var type = configFiles.cssoverride.type;
            var element = 'link';

            if(typeof(type)==='undefined')
            {
                type = 'text/javascript';
            }

            if(typeof(element)==='script')
            {
                element = 'text/javascript';
            }

            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement(element);
            script.type = type;
            if (element == 'link'){
                script.href = source;
                script.rel = 'stylesheet';
            } else {
                script.src = source;
            }

            head.appendChild(script);

        }

    },
	loadConfiguration : function (item,skinFinishFunc) {

        //mapper.log(item);
        item.loaded = true;

        mapper.common.asyncAjax({
            type: 'GET',
            url: item.source,
            callback: function (configRequest) {
                if (configRequest.readyState == 4 && configRequest.status == 200) {
                    if (configRequest.responseText != "") {
                        if (mapper.common.isJSONValid(configRequest.responseText,configRequest)) {
                            var configs = JSON.parse(configRequest.responseText);

                            if (item.id == "template") {
								mapper.blocks = configs.blocks;
                                mapper.configReady.template = true;
                                skinFinishFunc();
                            } else if (item.id === "regions") {
                                mapper.regions = configs.regions;
                                mapper.configReady.regions = true;
                                skinFinishFunc();
                            } else if (item.id === "charts") {
                                var chartConfigs = configs.charts;
                                // Each index in the overlays array in the chart configs can either be a layer id as a
                                // string or a configuration object. For code simplicity, convert strings to config objects.
                                for (var i = 0, len = chartConfigs.length; i < len; i+=1) {
                                    var overlayConfigs = chartConfigs[i].overlays;
                                    for (var j = 0, length = overlayConfigs.length; j < length; j+=1) {
                                        var overlayConfig = overlayConfigs[j];
                                        if (typeof(overlayConfig) === 'string') {
                                            chartConfigs[i].overlays[j] = {
                                                type: "single",
                                                for_layer_id: overlayConfig,
                                                timeseries_source_layer_ids: [overlayConfig]
                                            };
                                        }
                                    }
                                }
                                mapper.charts = chartConfigs;
                                mapper.configReady.charts = true;
                                skinFinishFunc();
                            } else if (item.id === "projections") {
                                var projections = configs.projections;
                                for (var projection in projections) {
                                    proj4.defs(projection, projections[projection]);
                                }
                                mapper.configReady.projections = true;
                                skinFinishFunc();
                            } else if (item.id === "periods") {
                                mapper.periodsConfig = configs.periods;
                                mapper.configReady.periods = true;
                                if (mapper.layers.hasOwnProperty('layersConfig')) {
                                    mapper.layers.loadLayerConfiguration(skinFinishFunc);
                                }
                            } else if (item.id == "layers") {
                                mapper.layers.layersConfig = configs.layers;
                                if (mapper.configReady.periods === true) {
                                    mapper.layers.loadLayerConfiguration(skinFinishFunc);
                                }
                            }
                        }
                    }
                }
            },
            errorCallback: function(configRequest) {
                if (configRequest.status === 404) {
                    document.getElementById('initial-loading-message').innerHTML = "<p style='color: red; padding: 0 10px;'>The file "+item.id+".json could not be found. Please check the path in the settings.json file and try again.</p>";
                } else {
                    document.getElementById('initial-loading-message').innerHTML = "<p style='color: red; padding: 0 10px;'>An unknown error occured trying to load "+item.id+".json. Status code: "+configRequest.status+"</p>";
                }
            }
        });
	},
	loadJSONPConfiguration : function (item) {
		item.loaded = true;
		var scriptPath = item.source;
		var scriptElement = document.createElement("script");
		scriptElement.type = "text/javascript";
		scriptElement.src = scriptPath;

		document.getElementsByTagName("head")[0].appendChild(scriptElement);
	},
	common : {
        extend: function(object, objectsToExtend) {
            for (var i = 0, len = objectsToExtend.length; i < len; i+=1) {
                var objectToExtend = objectsToExtend[i];
                var extendedPrototype = Object.create(objectToExtend.prototype);
                for (var prop in extendedPrototype) {
                    if (!object.prototype.hasOwnProperty(prop)) {
                        object.prototype[prop] = extendedPrototype[prop];
                    }
                }
            }
            object.prototype.constuctor = object;
        },
        date: {
            dateDefinitionMapping: {
                'yyyy': 'getFullYear',
                'yy': function(date) {
                    return date.getFullYear().toString().slice(2);
                },
                'm': function(date) {
                    return date.getMonth() + 1;
                },
                'mm': function(date) {
                    var month = date.getMonth() + 1;
                    if (month < 10) {
                        return '0' + month;
                    }
                    return month;
                },
                'MM': function(date) {
                    return mapper.common.date.threeLetterMonths[date.getMonth()];
                },
                'MMM': function(date) {
                    return mapper.common.date.fullMonths[date.getMonth()];
                },
                'd': 'getDate',
                'dd': function(date) {
                    var day = date.getDate();
                    if (day < 10) {
                        return '0'+day;
                    }
                    return day;
                }
            },
            threeLetterMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            fullMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            formatDate: function(date, format) {
                var dateFormatDefinitions = this.dateDefinitionMapping;
                for (var dateFormat in dateFormatDefinitions) {
                    var dateFormatDefinition = dateFormatDefinitions[dateFormat];
                    if (format.indexOf('{'+dateFormat+'}') !== -1) {
                        if (typeof(dateFormatDefinition) === 'string') {
                            format = format.replace('{'+dateFormat+'}', date[dateFormatDefinition]());
                        } else if (typeof(dateFormatDefinition) === 'function') {
                            format = format.replace('{'+dateFormat+'}', dateFormatDefinition(date));
                        }
                    }
                }
                return format;
            }
        },
        asyncAjax: function (options) {
            var request = new XMLHttpRequest();

            request.id = mapper.common.getRandomString(32, 36);
            request.open(options.type, options.url, true);
            if (options.hasOwnProperty('timeout')) request.timeout = options.timeout;
            if (options.type != undefined && options.type.toUpperCase() === 'POST') {
                request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                request.send(options.params);
            } else {
                request.send();
            }

            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    if (request.status == 200 || !options.hasOwnProperty('errorCallback')) {
                        options.callback(request, options.callbackObj);
                    } else {
                        options.errorCallback(request, options.callbackObj);
                    }
                }
            }

            return request;
        },
        ajax: function (options) {
            var request = new XMLHttpRequest();

            request.open(options.type, options.url, false);
            if (options.type != undefined && options.type.toUpperCase() === 'POST') {
                request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                request.send(options.params);
            } else {
                request.send();
            }
            
            request.onerror = function() {
                return 'Request failed to load.';
            }
            return request;
        },



        /**
         *  Replaces all variable parameters in a url.
         *
         *  This function will take each variable in a url such as '{{fewsId}}',
         *  converts the variable name to a function name like 'getFewsId', calls the
         *  function by name (defined in custom.remoteResource.urlParamGetters) passing
         *  in the boundary and layer, then replaces the variable '{{fewsId}}' with the return value of getFewsId.
         */
        buildUrlParams: function(url, obj1, obj2) {
            var urlParamGetters = custom.remoteResource.urlParamGetters,
            originalUrl = url;

            while(url.indexOf('{{') !== -1) {
                var param = url.substring(url.indexOf('{{')+2, url.indexOf('}}'));
                url = url.substring(0, url.indexOf('{{')) + url.substring(url.indexOf('}}')+2);

                var functionName = 'get' + param.slice(0, 1).toUpperCase() + param.slice(1);
                while(functionName.indexOf('_') !== -1) {
                    var index = functionName.indexOf('_');
                    functionName = functionName.substring(0, index) + functionName.substr(index + 1, 1).toUpperCase() + functionName.substring(index+2);
                }

                if (typeof(custom.remoteResource.urlParamGetters[functionName]) === 'undefined') {
                    mapper.error('URL parameter getter ' + functionName + ' does not exist.');
                    originalUrl = originalUrl.replace('{{'+param+'}}', 'undefined')
                    continue;
                }
                originalUrl = originalUrl.replace('{{'+param+'}}', custom.remoteResource.urlParamGetters[functionName](obj1, obj2));
            }

            return originalUrl;
        },
        convertPathToObjReference : function (obj, strPath) {
			if (typeof(strPath) == "string") {
				strPath = strPath.split('.');
				var arrayPattern = /(.+)\[(\d+)\]/;
				for (var i = 0; i < strPath.length; i++) {
					var match = arrayPattern.exec(strPath[i]);

					if (match) {
						obj = obj[match[1]][parseInt(match[2])];
					} else {
						obj = obj[strPath[i]];
					}
				}
			} else {
				return strPath;
			}

			return obj;
		},
        // Read in the JS file and convert to an object
        convertJSFileObjReference : function (obj, name, strPath) {
            var obj = {};
            //var url = location.href + strPath;
            var url = strPath;

            var someJsonRawText = mapper.common.ajax({
                            type: 'GET',
                            url: url,
                            cache:true
            });
            obj = eval(someJsonRawText.responseText);

            return obj;
		},
        // Parses a url with GET parameters into a user friendly object so you can access the parameter values.
        parseGETURL: function(url) {
            var obj = {};

            obj.baseURL = (url.indexOf('?') === -1) ? url : url.slice(0, url.indexOf('?'));
            var params = url.slice(url.indexOf('?') + 1);
            var paramArray = params.split('&');

            for (var i = 0; i < paramArray.length; i++) {
                var keyValuePair = paramArray[i].split('=');
                if (keyValuePair.length !== 2) continue;

                obj[keyValuePair[0].toLowerCase()] = keyValuePair[1];
            }

            return obj;
        },
        parseXML: function(xml) {
            if (window.DOMParser) {
                return new window.DOMParser().parseFromString(xml, 'text/xml');
            } else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
                var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = "false";
                xmlDoc.loadXML(xmlStr);
                return xmlDoc;
            }

            return null;
        },
        xmlToJson: function(xml) {
            if (typeof(xml) === 'string') {
                xml = this.parseXML(xml);
            }
            var obj = {};

            if (xml.nodeType == 1) { // element
                // do attributes
                if (xml.attributes.length > 0) {
                obj["@attributes"] = {};
                    for (var j = 0; j < xml.attributes.length; j++) {
                        var attribute = xml.attributes.item(j);
                        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                    }
                }
            } else if (xml.nodeType == 3) { // text
                obj = xml.nodeValue;
                if (obj.replace(/\s/g, "") === "") return "";
            }

            // do children
            if (xml.hasChildNodes()) {
                for(var i = 0; i < xml.childNodes.length; i++) {
                    var item = xml.childNodes.item(i);
                    var nodeName = item.nodeName;
                    if (typeof(obj[nodeName]) == "undefined") {
                        var temp = this.xmlToJson(item);
                        if (temp !== "") obj[nodeName] = temp;
                    } else {
                        var temp = this.xmlToJson(item);
                        if (temp !== "") {
                            if (typeof(obj[nodeName].push) == "undefined") {
                                var old = obj[nodeName];
                                obj[nodeName] = [];
                                obj[nodeName].push(old);
                            }
                            obj[nodeName].push(temp);
                        }
                    }
                }
            }
            return obj;
        },
        getJsonLayerListWithGeoserverCapabilitiesURL: function (json)
		{
            var array = [];
            for (var prop in json) json = json[prop];

            var parseLayers = function(layer, parsedLayers) {
                if (typeof(parsedLayers) === 'undefined') parsedLayers = [];

                if (layer['@attributes'] && layer['@attributes'].queryable === "1") {
                    var meta = {};
                    var boundingBoxName = "";

                    if (layer.Name) meta.name = layer.Name['#text'];
                    if (layer.Title) meta.title = layer.Title['#text'];

                    if (layer.BoundingBox) {
                        boundingBoxName = "BoundingBox";
                    } else if (layer.LatLonBoundingBox) {
                        boundingBoxName = "LatLonBoundingBox";
                    }

                    if (boundingBoxName !== "") {
                        var boundingBox = [];
                        if (layer[boundingBoxName].constructor === Array) {
                            for (var i = 0; i < layer[boundingBoxName].length; i++) {
                                var attributes = layer[boundingBoxName][i]['@attributes'];
                                boundingBox.push(attributes);
                            }
                        } else {
                            boundingBox.push(layer[boundingBoxName]['@attributes']);
                        }

                        meta.boundingBox = boundingBox;
                    }

                    if (layer.Style) {
                        meta.style = {};
                        if (layer.Style.Name) meta.style.name = layer.Style.Name['#text'];
                        if (layer.Style.LegendURL) {
                            meta.style.legendURL = {};
                            if (layer.Style.LegendURL.Format) meta.style.legendURL.format = layer.Style.LegendURL.Format['#text'];
                            if (layer.Style.LegendURL.OnlineResource) meta.style.legendURL.onlineResource = layer.Style.LegendURL.OnlineResource['@attributes']['xlink:href'];
                        }
                    }
                    parsedLayers.push(meta);
                }

                if (layer.Layer) {
                    if (layer.Layer.constructor === Array) {
                        for (var i = 0; i < layer.Layer.length; i++) {
                            parsedLayers = parseLayers(layer.Layer[i], parsedLayers);
                        }
                    } else {
                        parsedLayers = parseLayers(layer.Layer, parsedLayers);
                    }
                }

                return parsedLayers;
            }

            array = parseLayers(json.Capability.Layer);
            return array;
		},
	    isEmptyObject : function (obj) {
            if (obj instanceof Object)
            {
                for (var prop in obj)
                {
                    if (obj.hasOwnProperty(prop))
                    {
                        return false;
                    }
                }
            }
            else if (obj instanceof Array)
            {
                for (var i = 0; i < obj; i++)
                {
                    return false;
                }
            }

            return true;
	    },
		isJSONValid : function (cJSON,optionalDiagnosticInfo) {
			try {
				JSON.parse(cJSON);
			} catch (e) {

                if (typeof(optionalDiagnosticInfo) !== 'undefined')
                {
                    mapper.error(optionalDiagnosticInfo);
                }
				mapper.error("String is not a valid JSON.");


                return false;
			}

			return true;
		},
		sleep : function (milliseconds)
		{
		  var start = new Date().getTime();
		  for (var i = 0; i < 1e7; i++) {
			if ((new Date().getTime() - start) > milliseconds){
			  break;
			}
		  }
		},
		hashCode : function (string) {
			var hash = 0;
			if (string.length == 0) {
				return hash;
			}

			for (i = 0; i < string.length; i++) {
				char = string.charCodeAt(i);
				hash = ((hash << 5) - hash) + char;
				hash = hash & hash; // Convert to 32bit integer
			}

			return hash;
		},
		formatNumber : function (num, size) {
			var number = num.toString();
			while (number.toString().length < size) {
				number = "0" + number.toString();
			}

			return number;
		},
		truncateString : function (string, start, length) {
			var truncatedString = string;

			if (string.length > length) {
				var truncatedString = string.substring(start, length - 3) + "...";
			}

			return truncatedString;
		},
		roundValue : function (value, significantDigits) {
			if (value != undefined && significantDigits != undefined) {
				if (!isNaN(value) && value.toString().indexOf('.') != -1) {
					return Math.round(value * Math.pow(10, significantDigits)) / Math.pow(10, significantDigits);
				}
				else
				{
					return value;
				}
			} else {
				return value;
			}
		},
        dataURItoBlob: function(dataURI, mime) {
            // convert base64/URLEncoded data component to raw binary data held in a string
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);

            // write the bytes of the string to a typed array
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            return new Blob([ia], {type:mime});
        },
        startDownloadOfImageURLWithLegend: function(mapURL, legendURL, mime, filenameToUse, callback) {
            var canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
            var ctx = canvas.getContext('2d');
            var mapImage = new Image();
            mapImage.setAttribute('crossOrigin', 'anonymous');
            mapImage.src = mapURL;
            document.body.appendChild(mapImage);
            mapImage.onload = function() {
                var mapWidth = mapImage.width;
                mapHeight = mapImage.height;
                var legendImage = new Image();
                legendImage.setAttribute('crossOrigin', 'anonymous');
                legendImage.src = legendURL;
                document.body.appendChild(legendImage);
                legendImage.onload = function() {
                    var legendWidth = legendImage.width;
                    var legendHeight = legendImage.height;
                    var x = mapWidth;
                    var y = mapHeight - legendHeight;
                    canvas.setAttribute('width', mapWidth + legendWidth + 'px');
                    canvas.setAttribute('height', mapHeight + 'px');
                    ctx.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
                    ctx.drawImage(legendImage, x, y, legendWidth, legendHeight);
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
                            document.body.removeChild(link);
                            delete link;
                    }

                    document.body.removeChild(legendImage);
                    delete legendImage;
                    document.body.removeChild(mapImage);
                    delete mapImage;
                    document.body.removeChild(canvas);
                    delete canvas;
                    callback();
                }
            }
        },
		startDownloadOfImageURL: function(url,mime,filenameToUse,callback)
		{
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("GET", url, true);
			//http://stackoverflow.com/questions/9855127/setting-xmlhttprequest-responsetype-forbidden-all-of-a-sudden
			xmlhttp.responseType="blob";
			xmlhttp.onload = function(e)
			{
				if(this.status==200)
				{
					var blob = new Blob([this.response],{type:mime});


                    if (navigator.appVersion.toString().indexOf('.NET') > 0)
                    {
                        //IE has problems with downloading blobs
                        //http://stackoverflow.com/questions/20310688/blob-download-not-working-in-ie
                        window.navigator.msSaveBlob(blob, filenameToUse);
                    }
                    else
                    {
                        var link = document.createElement("a");
                        link.setAttribute("download",filenameToUse);
                        link.setAttribute("href",window.URL.createObjectURL(blob));
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        delete link;
                    }
				}
                callback();
			};
			xmlhttp.send();
		},
		hasAnyLayerDisplayAttributesChangedBetweenTheseTwoConfigs : function (oldConfig, newConfig) {

			var didADisplayAttributeChange = false;

			var oldLayers = mapper.layers.query(
				oldConfig,
				{type: 'layer'},
				['overlays', 'boundaries']
			);
			var newLayers = mapper.layers.query(
				newConfig,
				{type: 'layer'},
				['overlays', 'boundaries']
			);

			var length = newLayers.length; //it can be either they are same size
			var xx;
			for (xx = 0; xx < length; xx++) {
				var oldLayer = oldLayers[xx];
				var newLayer = newLayers[xx];

				if (!oldLayer || !newLayer || oldLayer.display != newLayer.display) {
					didADisplayAttributeChange = true;
				}
			}

			return didADisplayAttributeChange;
		},
		getRegionWithRegionID : function (regionID)
		{

			var foundRegion = null;
			for (var regionIndex in mapper.regions) {
				var region = mapper.regions[regionIndex];

				if (region.id == regionID) {
					foundRegion = region;
				}

			}

			return foundRegion;
		},
		getRegionIndexWithRegionID : function (regionID) {

			var foundRegionIndex = null;
			for (var regionIndex in mapper.regions) {
				var region = mapper.regions[regionIndex];

				if (region.id == regionID) {
					foundRegionIndex = regionIndex;
				}
			}

			return foundRegionIndex;
		},
		getRandomString : function (len, bits) {
			//http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
			bits = bits || 36;
			var outStr = "",
			newStr;
			while (outStr.length < len) {
				newStr = Math.random().toString(bits).slice(2);
				outStr += newStr.slice(0, Math.min(newStr.length, (len - outStr.length)));
			}
			return outStr.toUpperCase();
		},

	},
	legend : {
		getLegendURL: function(layer, width, height)
		{
            if (typeof(width) === 'undefined') width = 20;
            if (typeof(height) === 'undefined') height = 17;
			var getLegendGraphicURL = null;
			if(layer.hasOwnProperty("legend"))
			{
				var wmsURL = layer.source.wms;
				var layerName = layer.name;
				var styleToUse = layer.legend.style;

				//getLegendGraphicURL = wmsURL + "REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=17&LAYER=" + layerName + "&STYLE="+styleToUse+"&LEGEND_OPTIONS=forceRule:True;dx:0.2;dy:0.2;mx:0.2;my:0.2;fontStyle:normal;borderColor:0000ff;border:true;fontColor:000000;fontSize:13&height=13";
                getLegendGraphicURL = wmsURL + "REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH="+width+"&HEIGHT="+height+"&LAYER=" + layerName + "&STYLE="+styleToUse+"&LEGEND_OPTIONS=dx:10.0;dy:0.2;mx:0.2;my:0.2;fontStyle:normal;fontColor:000000;absoluteMargins:true;labelMargin:5;fontSize:13&height=13";
			}
			return getLegendGraphicURL;
		}
	},
	layers : {
		layerIdentifiers : [],
		instancesOfLayersConfig : [],
		loadLayerConfiguration : function (skinFinishedFunc) {
			
			var layerNodes = mapper.layers.layersConfig;
            for (var lNode in layerNodes) {
                this.setLayerIds(layerNodes[lNode]);
            }

            var sources = this.getTimeseriesSourceList(mapper.layers.layersConfig.overlays);
            mapper.layers.timeseriesRequestsCompleted = 0;
            mapper.layers.totalTimeseriesCount = sources.length;
            mapper.layers.remoteResource = {};

            if (sources.length === 0) {
                mapper.configReady.layers = true;
                skinFinishedFunc();
                return;
            }

            for (var i = 0; i < sources.length; i++) {
                mapper.common.asyncAjax({
                    type: 'GET',
                    url: sources[i].source,
                    callbackObj: sources[i].layerIds,
                    callback: function (data, layerIds) {
                        var regex = /({.+})+/ig;
                        data = regex.exec(data.response)[0];
                        data = JSON.parse(data);
                        for (var i = 0, len = layerIds.length; i < len; i+=1) {
                            mapper.layers.remoteResource[layerIds[i]] = data;
                        }

                        mapper.layers.timeseriesRequestsCompleted++;
                        if (mapper.layers.timeseriesRequestsCompleted === mapper.layers.totalTimeseriesCount) {
                            custom.remoteResource.updateLayersConfig();
                            for (var lNode in mapper.layers.layersConfig) {
                                mapper.layers.updateLayerConfiguration(mapper.layers.layersConfig[lNode]); // update config here
                            }

                            mapper.configReady.layers = true;
							skinFinishedFunc();
							//skin.initModeNormal();
                        }
                    },
                    errorCallback: function(layerIds) {
                        for (var lNode in mapper.layers.layersConfig) {
                            for (var i = 0, len = layerIds.length; i < len; i+=1) {
                                var layerId = layerIds[i];
                                var layer = mapper.layers.query(
                                    mapper.layers.layersConfig[lNode],
                                    {
                                        type: 'layer',
                                        id: layerId
                                    }
                                );
                                if (layer.length > 0) layer = layer[0];
                                else continue;

                                //var title = layer.title;
                                if (!mapper.layers.hasOwnProperty('failedLayerIds')) {
                                    mapper.layers.failedLayerIds = [];
                                    mapper.layers.initialLayersConfig = JSON.parse(JSON.stringify(mapper.layers.layersConfig));
                                }
                                mapper.layers.failedLayerIds.push(layer.id);
                                var title = mapper.layers.getLayerTitleById(mapper.layers.layersConfig[lNode], layerIds[i]);
                                var wasRemoved = mapper.layers.removeLayerById(mapper.layers.layersConfig[lNode], layerId);

                                mapper.error('Layer ' + title + ' failed to load and is being removed.');
                            }
                        }

                        mapper.layers.timeseriesRequestsCompleted++;

                        if (mapper.layers.timeseriesRequestsCompleted === mapper.layers.totalTimeseriesCount) {
                            custom.remoteResource.updateLayersConfig();
                            for (var lNode in mapper.layers.layersConfig) {
                                mapper.layers.updateLayerConfiguration(mapper.layers.layersConfig[lNode]); // update config here
                            }

                            mapper.configReady.layers = true;
                            skinFinishFunc();
							
                        }
                    }
                });
            }
		},
        getLayerFolderStructure: function(layersConfig, layerIds) {
            var layers = [];
            if (Object.prototype.toString.call(layersConfig) == '[object Object]') {
                layers = {};
                for (var prop in layersConfig) {
                    var folder = mapper.layers.getLayerFolderStructure(layersConfig[prop], layerIds);
                    if (folder.length > 0) layers[prop] = folder;
                }
            } else if (Object.prototype.toString.call(layersConfig) == '[object Array]') {
                for (var i = 0, len = layersConfig.length; i < len; i+=1) {
                    var layerConfig = layersConfig[i];
                    if (layerConfig.type === 'folder') {
                        if (layerIds.indexOf(layerConfig.id) !== -1) {
                            layers.push({
                                type: layerConfig.type,
                                id: layerConfig.id,
                                title: layerConfig.title,
                                folder: layerConfig.folder
                            });
                        } else {
                            var folder = mapper.layers.getLayerFolderStructure(layerConfig.folder, layerIds);
                            if (folder.length > 0) {
                                layers.push({
                                    type: layerConfig.type,
                                    id: layerConfig.id,
                                    title: layerConfig.title,
                                    folder: folder
                                });
                            }
                        }
                    } else if (layerIds.indexOf(layerConfig.id) !== -1) {
                        layers.push({
                            type: layerConfig.type,
                            id: layerConfig.id,
                            title: layerConfig.title
                        });
                    }
                }
            }

            return layers;
        },
        getLayerFolderStructure2: function(layersConfig, layerId) {
            if (Object.prototype.toString.call(layersConfig) == '[object Object]') {
                for (var prop in layersConfig) {
                    var folder = mapper.layers.getLayerFolderStructure(layersConfig[prop], layerId);
                    if (folder !== false) return folder;
                }
            } else if (Object.prototype.toString.call(layersConfig) == '[object Array]') {
                for (var i = 0, len = layersConfig.length; i < len; i+=1) {
                    var layerConfig = layersConfig[i];
                    if (layerConfig.type === 'folder') {
                        if (layerConfig.id === layerId) {
                            return {
                                type: layerConfig.type,
                                id: layerConfig.id,
                                title: layerConfig.title,
                                children: layerConfig.children
                            };
                        } else {
                            var folder = mapper.layers.getLayerFolderStructure(layerConfig.folder, layerId);
                            if (folder !== false) {
                                return {
                                    type: layerConfig.type,
                                    id: layerConfig.id,
                                    title: layerConfig.title,
                                    children: folder
                                };
                            }
                        }
                    } else if (layerConfig.id === layerId) {
                        return {
                            type: layerConfig.type,
                            id: layerConfig.id,
                            title: layerConfig.title
                        };
                    }
                }
            }

            return false;
        },
        removeLayerById: function(layers, id) {
            for (var o = 0, len = layers.length; o < len; o+=1) {
                var layer = layers[o];

                if (layer.type === 'folder') {
                    var removeIndex = this.removeLayerById(layer.folder, id);
                    if (removeIndex !== false) {
                        layer.folder.splice(removeIndex, 1);
                    }
                    if (layer.folder.length === 0) {
                        return o;
                    }
                } else if (layer.type === 'layer') {
                    if (layer.id === id) {
                        return o;
                    }
                }
            }

            return false;
        },
        setLayerIds: function(layers) {
            for (var o = 0, len = layers.length; o < len; o+=1) {
				var layer = layers[o];
				if (layer.type == "folder") {
                    if (!layer.hasOwnProperty('id') || layer.id === null || layer.id === '') {
                        layer.id = "layer-" + Math.abs(mapper.common.hashCode(layer.title + parseInt(Math.random() * 10000) + Math.floor((Math.random() * Math.pow(10, 5) + 1))));
                    }

                    this.storeLayerIdentifiers(layer);
                    this.setLayerIds(layer.folder);
				} else if (layer.type == "layer") {
                    if (typeof(layer.timeseries) === 'undefined') layer.loaded = true;
					if (!layer.hasOwnProperty('id') || layer.id === null || layer.id === '') {
						layer.id = "layer-" + Math.abs(mapper.common.hashCode(layer.name + parseInt(Math.random() * 10000) + Math.floor((Math.random() * Math.pow(10, 5) + 1))));
					}

                    this.storeLayerIdentifiers(layer);
				}
			}
        },
		updateLayerConfiguration : function (layers) {
			for (var o in layers) {
				var layer = layers[o];
				if (layer.type == "folder") {
					layer = this.updateLayerConfiguration(layer.folder);
				} else if (layer.type == "layer") {
                    if (layer.transparency != undefined) {
                        if (layer.transparency == true) {
                            layer.opacity = 1;
                        }
                    }
				}
			}

			return layers;
		},
        createPeriodicityWrappers: function(layers) {
            for (var o in layers) {
				var layer = layers[o];
				if (layer.type == "folder") {
					layer = this.createPeriodicityWrappers(layer.folder);
				} else if (layer.type == "layer") {
                    if (layer.timeseries != undefined) {
                        var periodConfig = JSON.parse(JSON.stringify(mapper.periodsConfig[layer.timeseries.type]));
                        periodConfig.type = layer.timeseries.type;
                        periodConfig.start = JSON.parse(JSON.stringify(layer.timeseries.start));
                        periodConfig.end = JSON.parse(JSON.stringify(layer.timeseries.end));
                        mapper.periodicity.createPeriodicityWrapper(periodConfig, layer.id);
                        this.updateLayerName(layer);
                    }
				}
			}
        },
        getTimeseriesSourceList: function(layers, sources) {
            if (typeof(sources) === 'undefined') sources = [];

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                if (layer.type === 'folder') {
                    this.getTimeseriesSourceList(layer.folder, sources);
                } else if (layer.type === 'layer') {
                    if (typeof(layer.timeseries) !== 'undefined') {
                        var currentSource = false;
                        for (var j = 0; j < sources.length; j++) {
                            if (sources[j].source === layer.timeseries.source) {
                                currentSource = sources[j];
                                break;
                            }
                        }
                        if (currentSource === false) {
                            sources.push({
                                source: layer.timeseries.source,
                                layerIds: [layer.id]
                            });
                        } else {
                            currentSource.layerIds.push(layer.id);
                        }
                    }
                }
            }

            return sources;
        },
		storeLayerIdentifiers : function (layer) {

			if (typeof(layer.name) == "string" || typeof(layer.title) == "string") {
				if (typeof(layer.id) == "string" && layer.id != "") {
					var itemName = (layer.name != undefined) ? layer.name : layer.title;
					var itemDescription = (layer.description != undefined) ? unescape(layer.description) : "";

					this.layerIdentifiers.push({
						"type" : layer.type,
						"id" : layer.id,
						"name" : itemName,
						"description" : itemDescription
					});
				} else {
					mapper.error("Layer id is not of a 'number' type: " + layer.id);
				}
			} else {
				mapper.error("Layer name is not of a 'String' type : " + layer.id);
			}
		},
		getLayerNameByIdentifier : function (id) {
			var layerName = "";
			for (var l in this.layerIdentifiers) {
				var item = this.layerIdentifiers[l];
				if (item.id == id) {
					layerName = item.name;
					break;
				}
			}

			return layerName;
		},
        copyLayersConfig : function (layers) {
            var newLayers;

            if (Object.prototype.toString.call(layers) === '[object Object]') {
                newLayers = {};
                for (var prop in layers) {
                    var layer = layers[prop];

                    if (prop !== 'additional') {
                        if (prop === 'isAdded' && layer.isAdded === true) return false;
                        newLayers[prop] = this.copyLayersConfig(layer);
                    }
                }
            } else if (Object.prototype.toString.call(layers) === '[object Array]') {
                newLayers = [];
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];
                    var layerCopy = this.copyLayersConfig(layer);
                    if (layerCopy !== false) newLayers.push(layerCopy);
                }
            } else {
                return layers;
            }

            return newLayers;
        },
		createNewInstanceOfLayersConfig : function () {
			var newInstanceOfLayersConfig = {};
            var newLayersConfig;
            var currentInstanceId = mapper.layers.getLayersConfigInstanceId();

            if (typeof(currentInstanceId) !== 'undefined'
			//CONFIGTRANSITION
			//&&  mapper.mapWindowConfig.configuration.saveLayerSelection === true
			) {
                oldLayersConfig = mapper.layers.getLayersConfigById(currentInstanceId);
                newLayersConfig = this.copyLayersConfig(oldLayersConfig);
            } else {
                newLayersConfig = JSON.parse(JSON.stringify(mapper.layers.layersConfig));
            }

			var layersConfigInstanceId = mapper.common.getRandomString(32, 36);
			mapper.layers.setLayersConfigInstanceId(layersConfigInstanceId);

			newInstanceOfLayersConfig[layersConfigInstanceId] = newLayersConfig;
			mapper.layers.instancesOfLayersConfig.push(newInstanceOfLayersConfig);

            for (var prop in newLayersConfig) {
                mapper.layers.createPeriodicityWrappers(newLayersConfig[prop], layersConfigInstanceId);
            }

            mapper.EventCenter.defaultEventCenter.postEvent(
                mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_CREATED,
                layersConfigInstanceId,
                newLayersConfig);

			return newInstanceOfLayersConfig;
		},
		getLayersConfigById : function (currentInstanceId) {
			for (id in mapper.layers.instancesOfLayersConfig) {
				var layersConfig = mapper.layers.instancesOfLayersConfig[id];
				var instanceId = Object.keys(layersConfig)[0];

				if (instanceId == currentInstanceId) {
					return layersConfig[currentInstanceId];
				}
			}

			return null;
		},
		setLayersConfigById : function(id,layersConfig)
		{
			for(index in mapper.layers.instancesOfLayersConfig)
			{
				//see createNewInstanceOfLayersConfig() idk why it was done this way
				//(wrapping the layers config inside an array, then pushing that into another
				// array) ask meron
				var wrappedInAssocArrayLayersConfig = mapper.layers.instancesOfLayersConfig[index];
				var instanceId = Object.keys(wrappedInAssocArrayLayersConfig)[0];

				if(instanceId == id)
				{
					var newWrappedInAssocArrayLayersConfig = [];
					newWrappedInAssocArrayLayersConfig[id]=layersConfig;
					 mapper.layers.instancesOfLayersConfig[index] = newWrappedInAssocArrayLayersConfig;
				}
			}
		},
		getLayersConfigInstanceId : function () {
			return mapper.layers.layersConfigInstanceId;
		},
		setLayersConfigInstanceId : function (currentInstanceId) {
			mapper.layers.layersConfigInstanceId = currentInstanceId;
		},
		getLayerDescriptionByIdentifier : function (id) {
			var layerDescription = "";
			for (var l in this.layerIdentifiers) {
				var item = this.layerIdentifiers[l];
				if (item.id == id) {
					if (item.description != undefined) {
						layerDescription = unescape(item.description);
					}

					break;
				}
			}

			return layerDescription;
		},
		updateLayerName : function (layer) {
            var wrapper = mapper.periodicity.getPeriodicityWrapperById(layer.id);
			layer.name = this.getLayerNameByIdentifier(layer.id);
            layer.name = (wrapper === null) ? layer.name : wrapper.buildLabel(layer.name);
		},
        updateLayerAttributes : function (layerId) {
			var layer;
			var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
			for (var lNode in layersConfig) {
				if (layer = this.getLayerByID(layersConfig[lNode], layerId)) {
					break;
				}
			}

            this.updateLayerName(layer);

			mapper.EventCenter.defaultEventCenter.postEvent(
				mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
				layersConfig,
				this);
		},
		getLayerAttributes : function () {
			var layer;
			var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
			for (var lNode in layersConfig) {
				if (layer = this.getLayerByID(layersConfig[lNode], mapper.layers.id)) {

					return layer;
				}
			}
		},
		getLayerByID : function (layers, id) {
			var layer = "";

			var eachLayer;
			for (var o in layers) {
				eachLayer = layers[o];
				if (eachLayer.type == "folder") {
					if (eachLayer = this.getLayerByID(eachLayer.folder, id)) {
						if (eachLayer.id === id) {
							layer = eachLayer;
							break;
						}
					}
				} else if (eachLayer.type == "layer") {
					//if (eachLayer.loadOnly == false) {
						if (eachLayer.id === id) {
							layer = eachLayer;
							return layer;
						}
					//}
				}
			}

			return layer;
		},
		isLayerTransparent : function (id) {
			var layer;
			var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());

			for (var lNode in layersConfig) {
				if (layer = this.getLayerByID(layersConfig[lNode], id)) {
					break;
				}
			}

			if (layer.transparency != undefined) {
				if (layer.transparency == true) {
					return true;
				}
			}

			return false;
		},
		setFolderToggle : function (id, expanded) {
			var layer;
			var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());

			for (var lNode in layersConfig) {
				if (layer = this.getLayerByID(layersConfig[lNode], id)) {
					break;
				}
			}

			layer.expanded = expanded;
		},
		setLayerDisplay : function (id, checked) {
			var layer;
			var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());

			for (var lNode in layersConfig) {
				if (layer = this.getLayerByID(layersConfig[lNode], id)) {
					break;
				}
			}

			layer.display = checked;

			mapper.EventCenter.defaultEventCenter.postEvent(
				mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
				layersConfig,
				this);
		},
		setLayerOpacity : function (id, newValue) {
			var layer;
			var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
			for (var lNode in layersConfig) {
				if (layer = this.getLayerByID(layersConfig[lNode], id)) {
					break;
				}
			}

			layer.opacity = newValue;

			mapper.EventCenter.defaultEventCenter.postEvent(
				mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
				layersConfig,
				this);
		},
		getLayerOpacity : function (id) {
			var opacity;
			var layer;
			var layersConfig = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
			for (var lNode in layersConfig) {
				if (layer = this.getLayerByID(layersConfig[lNode], id)) {
					opacity = layer.opacity;
					break;
				}
			}

			return opacity;
		},
        anyLayerHasFeatureInfo : function(layers) {
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];

                if (layer.type === 'folder') {
                    if (this.anyLayerHasFeatureInfo(layer.folder)) return true;
                } else if (layer.type === 'layer') {
					if (layer.display === true && layer.hasOwnProperty("featureInfo")) return true;
                }
            }

            return false;
        },
        anyLayerHasTimeSeries : function(layers) {
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];

                if (layer.type === 'folder') {
                    if (this.anyLayerHasTimeSeries(layer.folder)) return true;
                } else if (layer.type === 'layer') {
					if (layer.display === true && layer.hasOwnProperty("timeseries")) return true;
                }
            }

            return false;
        },
        getLayerTitleById : function(layers, layerId) {
            var getTitle = function(layers, layerId, depth) {
                for (var i = 0; i < layers.length; i++) {
                    var layer = layers[i];

                    if (layer.type === 'folder') {
                        var childLayer = getTitle(layer.folder, layerId, depth+1);
                        if (childLayer !== false) {
                            if (depth > 0) {
                                return layer.title + ' ' + childLayer;
                            } else {
                                return childLayer;
                            }
                        }
                    } else if (layer.type === 'layer') {
                        if (layer.id === layerId) {
                            var unit = (typeof(layer.unit) !== 'undefined' && layer.unit !== "") ? " (" + layer.unit + ")" : "";
                            if (typeof(layer.timeseries) !== 'undefined') {
                                var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(layer.id);
                                return layer.title + " " + periodicityWrapper.buildDisplayLabel(periodicityWrapper.format) + unit;
                            } else {
                                return layer.title + unit;
                            }
                        }
                    }
                }

                return false;
            }

            var title = "No Layers Selected";

            for (var prop in layers) {
                var layerTitle = getTitle(layers[prop], layerId, 0);
                if (layerTitle !== false) {
                    title = layerTitle;
                    break;
                }
            }
            return title;
        },
        getTopLayerTitle : function(layers) {
            var getTitle = function(layers) {
                for (var i = 0; i < layers.length; i++) {
                    var layer = layers[i];

                    if (layer.type === 'folder') {
                        var childLayer = getTitle(layer.folder);
                        if (childLayer !== false) {
                            if (layer.title !== "Dataset") {
                                return layer.title + ' ' + childLayer;
                            } else {
                                return childLayer;
                            }
                        }
                    } else if (layer.type === 'layer') {
                        if (layer.display === true && layer.mask !== true && layer.loadOnly !== true) {
                            var unit = (typeof(layer.unit) !== 'undefined' && layer.unit !== "") ? " (" + layer.unit + ")" : "";
                            if (typeof(layer.timeseries) !== 'undefined') {
                                var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(layer.id);
                                return layer.title + " " + periodicityWrapper.buildDisplayLabel(periodicityWrapper.format) + unit;
                            } else {
                                return layer.title + unit;
                            }
                        }
                    }
                }

                return false;
            }

            var title = getTitle(layers);
            if (title === false) return "No Layers Selected";
            return title;
        },
        getTopLayer : function(layers) {
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                if (layer.type === 'folder') {
                    var childLayer = this.getTopLayer(layer.folder);
                    if (childLayer !== false) return childLayer;
                } else if (layer.type === 'layer') {
                    if (layer.display === true && layer.mask === false && layer.loadOnly !== true) {
                        return layer;
                    }
                }
            }
            return false;
        },

		getDisplayNameForLayer:function(layerWeWant,layers)
		{
            var getTitle = function(layerWeWant,layers)
			{
                for (var i = 0; i < layers.length; i++)
				{
                    var layer = layers[i];

                    if (layer.type === 'folder')
					{
                        var childLayer = getTitle(layerWeWant,layer.folder);

                        if (childLayer !== false)
						{
                            if (layer.title !== "Dataset")
							{
                                return layer.title + ' ' + childLayer;
                            }
							else
							{
                                return childLayer;
                            }
                        }
                    }
					else if (layer.type === 'layer')
					{
                        if ((layer.display === true || layer.loadOnly === true) && layer.mask !== true && layer.id == layerWeWant.id)
						{
                            var unit = (typeof(layer.unit) !== 'undefined' && layer.unit !== "") ? " (" + layer.unit + ")" : "";
                            if (typeof(layer.timeseries) !== 'undefined')
							{
                                var periodicityWrapper = mapper.periodicity.getPeriodicityWrapperById(layer.id);
                                return layer.title + " " + periodicityWrapper.buildDisplayLabel(periodicityWrapper.format) + unit;
                            }
							else
							{
                                return layer.title + unit;
                            }
                        }
                    }
                }

                return false;
            }

            var title = getTitle(layerWeWant,layers);
            if (title === false) return "No Layers Selected";
            return title;
        },

        query: function(layersConfig, queryParams, keys) {
            var queryFunc = function(layers, queryParams, isFunction, layersReturn) {
                if (typeof(layersReturn) === 'undefined') layersReturn = [];

                var checkParams = function(layer, queryParams) {
                    for (var prop in queryParams) {
                        if (typeof(queryParams[prop]) === 'function') {
                            if (queryParams[prop](layer) === false) {
                                return false;
                            }
                        } else if (!layer.hasOwnProperty(prop)) {  // Property doesn't exist
                            if (queryParams[prop] !== '!*') return false;
                        } else if (typeof(queryParams[prop]) === 'string') {
                            // If value is an asterisk, that means to only check if property exists.
                            // If value is preceded by !, that means not equal to.
                            if (queryParams[prop] !== '*' && ((queryParams[prop].substr(0,1) === '!' && layer[prop] === queryParams[prop].substr(1)) || layer[prop] !== queryParams[prop])) {
                                return false;
                            }
                        } else if (typeof(queryParams[prop]) === 'boolean' || typeof(queryParams[prop]) === 'number') {  // Check for values that don't match
                            if (layer[prop] !== queryParams[prop]) {
                                return false;
                            }
                        } else {
                            if (checkParams(layer[prop], queryParams[prop]) === false) {
                                return false;
                            }
                        }
                    }
                    return true;
                }

                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var layer = layers[i];

					if (isFunction) {
						if (queryParams(layer) === true) {
							layersReturn.push(layer);
						} else if (layer.type === 'folder') {
							queryFunc(layer.folder, queryParams, isFunction, layersReturn);
						}
					} else {
						if (checkParams(layer, queryParams) === true) {
							layersReturn.push(layer);
						} else if (layer.type === 'folder') {
							queryFunc(layer.folder, queryParams, isFunction, layersReturn);
						}
					}
                }

                return layersReturn;
            }

            var layersReturn = [];
            if (typeof(layersConfig) !== 'undefined') {
                var isFunction = (queryParams instanceof Function);
                if (typeof(keys) === 'undefined') {
                    if (Object.prototype.toString.call(layersConfig) === '[object Array]') {  // Passed an array of folder or layers
                        layersReturn = queryFunc(layersConfig, queryParams, isFunction);
                    } else if (layersConfig.type === 'folder') {  // Passed a folder
                        layersReturn = queryFunc(layersConfig.folder, queryParams, isFunction);
                    }
                } else {
                    for (var i = 0, len = keys.length; i < len; i+=1) {  // Passed the full layers config
                        if (layersConfig.hasOwnProperty(keys[i]) === true) {
                            layersReturn = layersReturn.concat(queryFunc(layersConfig[keys[i]], queryParams, isFunction));
                        }
                    }
                }
            }

            return layersReturn;
        },
        moveLayer: function(layersConfig, layerId, targetId, position) {
            var findLayerPosition = function(layersConfig, layerId) {
                var getPosition = function(layers, layerId, parentId, obj) {
                    if (typeof(obj) === 'undefined') {
                        obj = {
                            index: false,
                            parentId: null
                        };
                    }

                    for (var i = 0, len = layers.length; i < len; i+=1) {
                        var layer = layers[i];

                        if (layer.id === layerId) {
                            obj.index = i;
                        } else if (layer.type === 'folder') {
                            obj = getPosition(layer.folder, layerId, layer.id, obj);
                        }

                        if (obj.index !== false) {
                            if (obj.parentId === null) obj.parentId = parentId;
                            return obj;
                        }
                    }

                    return obj;
                }

                var layerPosition;

                if (Object.prototype.toString.call(layersConfig) === '[object Array]') {
                    layerPosition = getPosition(layersConfig, layerId, layersConfig.id);
                } else if (Object.prototype.toString.call(layersConfig) === '[object Object]') {
                    for (var prop in layersConfig) {
                        layerPosition = getPosition(layersConfig[prop], layerId, layersConfig[prop].id);
                        if (layerPosition.parentId !== null) break;
                    }
                }

                return layerPosition;
            }

            var layerPosition = findLayerPosition(layersConfig, layerId);
            var layerParent = this.query(
                layersConfig,
                {id: layerPosition.parentId},
                ['overlays', 'additional', 'boundaries', 'baselayers']
            )[0];

            var layer = layerParent.folder.splice(layerPosition.index, 1)[0];
            var targetPosition = findLayerPosition(layersConfig, targetId),
            index = targetPosition.index;

            if (position === 'append') {
                var targetFolder = this.query(
                    layersConfig,
                    {id: targetPosition.id},
                    ['overlays', 'additional', 'boundaries', 'baselayers']
                )[0];
                targetFolder.folder.push(layer);
            } else {
                if (position === 'after') index += 1;
                var targetParent = this.query(
                    layersConfig,
                    {id: targetPosition.parentId},
                    ['overlays', 'additional', 'boundaries', 'baselayers']
                )[0];
                targetParent.folder.splice(index, 0, layer);
            }

            mapper.EventCenter.defaultEventCenter.postEvent(
				mapper.EventCenter.EventChoices.EVENT_TOC_LAYER_CONFIGURATION_UPDATED,
				layersConfig,
				this);
        },

        clearFeatureInfo : function(layersConfig) {
            var layers = mapper.layers.query(
                layersConfig,
                {
                    type: 'layer',
                    featureInfo: '*'
                },
                ['overlays', 'boundaries']
            );

            for (var i = 0, len = layers.length; i < len; i+=1) {
                var layer = layers[i];
                var featureInfo = layer.featureInfo;
                for (var prop in featureInfo) {
                    featureInfo[prop].value = null;
                    featureInfo[prop].displayValue = null;
                }
            }

            mapper.EventCenter.defaultEventCenter.postEvent(
                mapper.EventCenter.EventChoices.EVENT_LAYER_CONFIGURATION_FEATUREINFO_UPDATED,
                null,
                null);
        },

        toolMapping : {
            getLayerConfigs : function(layerId, toolConfigs) {
                for (var i = 0, len = toolConfigs.length; i < len; i+=1) {
                    var toolConfig = toolConfigs[i];
                    if (toolConfig.id === layerId) {
                        return toolConfig;
                    }
                }
                return null;
            },
            getFeaturePropertiesByTypes : function(featureInfoConfigs, types, propertyName) {
                var returnConfigs = [];
                for (var i = 0, len = featureInfoConfigs.length; i < len; i+=1) {
                    var config = featureInfoConfigs[i];
                    if (types.indexOf(config.type) !== -1) {
                        if (typeof(propertyName) !== 'undefined') {
                            returnConfigs.push(config[propertyName]);
                        } else {
                            returnConfigs.push(config);
                        }
                    }
                }
                return returnConfigs;
            },
            filterByTypes : function(configs, types, propertyName) {
                var returnConfigs = [];
                for (var i = 0, len = configs.length; i < len; i+=1) {
                    var config = configs[i];
                    if (types.indexOf(config.type) !== -1) {
                        if (typeof(propertyName) !== 'undefined') {
                            returnConfigs.push(config[propertyName]);
                        } else {
                            returnConfigs.push(config);
                        }
                    }
                }
                return returnConfigs;
            },
            getFeatureId : function(featureInfoConfigs, featureInfo) {
                var featureIdConfigs = this.getFeaturePropertiesByTypes(featureInfoConfigs, ['id']);
                return this.getFeatureInfoValue(featureInfo, featureIdConfigs[0].propertyName);
                /*var featureId = '';
                for (var i = 0, len = featureIdConfigs.length; i < len; i+=1) {
                    var config = featureIdConfigs[i];
                    var value = this.getFeatureInfoValue(featureInfo, config.propertyName);
                    if (value !== null) featureId += value;
                }
                return featureId;*/
            },
            getFeatureIdProperty : function(featureInfoConfigs) {
                var idProperty = '';
                for (var i = 0, len = featureInfoConfigs.length; i < len; i+=1) {
                    var config = featureInfoConfigs[i];
                    if (config.type === 'id') {
                        return config.propertyName;
                        //idProperty += config.propertyName;
                    }
                }
                //return idProperty;
                return null;
            },
            getCqlFilterIdQuery : function(featureInfoConfigs, featureInfo) {
                var featureIdConfigs = this.getFeaturePropertiesByTypes(featureInfoConfigs, ['id']);
                var featureIdQuery = [];
                for (var i = 0, len = featureIdConfigs.length; i < len; i+=1) {
                    var config = featureIdConfigs[i];
                    var value = this.getFeatureInfoValue(featureInfo, config.propertyName);
                    if (value !== null) featureIdQuery.push(config.propertyName + " = '" + value + "'");
                }
                return featureIdQuery.join(' AND ');
            },
            getFeatureInfoValue : function(featureInfo, propertyName) {
                if (featureInfo.hasOwnProperty(propertyName)) {
                    return featureInfo[propertyName];
                }
                for (var prop in featureInfo) {
                    if (Object.prototype.toString.call(featureInfo[prop]) === '[object Object]') {
                        var value = this.getFeatureInfoValue(featureInfo[prop], propertyName);
                        if (value !== null) return value;
                    }
                }
                return null;
            }
        }
	},
	periodicity : {
        periodicityWrappers: {},
        activeWrapper: null,

        setActiveWrapper: function(layerId) {
            this.activeWrapper = this.getPeriodicityWrapperById(layerId);
        },

        getActiveWrapper: function() {
            return this.activeWrapper;
        },

        createPeriodicityWrapper: function(periodConfigs, layerId) {
            // Each layer with timeseries has it's own instance of PeriodicityWrapper
            // so we store each instance by the id of the layer AND the id if the layers config instance the layer belongs to.
            var layersConfigInstanceId = mapper.layers.getLayersConfigInstanceId();
            if (!this.periodicityWrappers.hasOwnProperty(layersConfigInstanceId)) {
                this.periodicityWrappers[layersConfigInstanceId] = [];
            }
            this.periodicityWrappers[layersConfigInstanceId].push(new this.PeriodicityWrapper(periodConfigs, layerId));
        },

        getPeriodicityWrapperById: function(layerId) {
            var layersConfigInstanceId = mapper.layers.getLayersConfigInstanceId();
            if (!this.periodicityWrappers.hasOwnProperty(layersConfigInstanceId)) return null;
            var periodicityWrappers = this.periodicityWrappers[layersConfigInstanceId];
            for (var i = 0; i < periodicityWrappers.length; i++) {
                var wrapper = periodicityWrappers[i];
                if (wrapper.id === layerId) return wrapper;
            }
            return null;
        },

        getPeriodConfigs : function(configs) {
            var periodConfigs = [];
            var timeVariables = configs.timeVariables;
            var type = configs.type;

            for (var i = timeVariables.length - 1; i >= 0; i-=1) {
                var timeVariable = timeVariables[i];
                var start = configs.start[timeVariable.type];
                var end = configs.end[timeVariable.type];
                if (start.toString().trim() === '') start = null;
                if (end.toString().trim() === '') end = null;
                var startSeason = null;
                var endSeason = null;
                if (configs.hasOwnProperty('seasonStart') && configs.seasonStart.hasOwnProperty(timeVariable)) {
                    startSeason = configs.seasonStart[timeVariable];
                    endSeason = configs.seasonEnd[timeVariable];
                }

                var periodConfig;
                switch (timeVariable.type) {
                    case 'year':
                        if (start < 50) {
                            start += 2000;
                        } else if (start < 100) {
                            start += 1900;
                        }

                        if (end < 50) {
                            end += 2000;
                        } else if (end < 100) {
                            end += 1900;
                        }

                        var displayFormatter = YearDisplayFormatter;
                        if (startSeason !== null && endSeason !== null) {
                            if (parseInt(startSeason) > parseInt(endSeason)) {
                                displayFormatter = CrossYearDisplayFormatter;
                            }
                        }

                        var offset = start - 1;
                        periodConfig = {
                            title: 'Year',
                            start: 1,
                            end: end - offset,
                            offset: offset,
                            periodsPerParent: TopPeriodsPerParent,
                            dateFormatter: YearDateFormatter,
                            labelFormatter: YearLabelFormatter,
                            displayFormatter: displayFormatter,
                            type: type
                        };
                        break;
                    case 'month':
                        periodConfig = {
                            title: 'Month',
                            digitCount: timeVariable.digitCount,
                            start: start,
                            end: end,
                            periodsPerParent: 12,
                            displayFormatter: MonthDisplayFormatter,
                            dateFormatter: MonthDateFormatter,
                            type: type
                        };

                        if (startSeason !== null) {
                            periodConfig.startSeason = parseInt(startSeason);
                        }

                        if (endSeason !== null) {
                            periodConfig.endSeason = parseInt(endSeason);
                        }
                        break;
                    case 'period':
                        periodConfig = {
                            title: configs.fullName,
                            start: start,
                            end: end,
                            dateFormatter: PeriodPerMonthDateFormatter,
                            type: type
                        };

						if (configs.hasOwnProperty('firstOccurence')) {
							periodConfig.firstDay = configs.firstOccurence;
							if (isNaN(parseInt(configs.firstOccurence))) {
								periodConfig.getFirstDay = FirstWeekday;
							} else {
								periodConfig.getFirstDay = FirstDayOfYear;
							}
						}

                        if (timeVariable.hasOwnProperty('itemsPerMonth')) {
                            periodConfig.periodsPerParent = timeVariable.itemsPerMonth;
                        } else if (timeVariable.hasOwnProperty('daysPerPeriod')) {
                            periodConfig.daysPerPeriod = timeVariable.daysPerPeriod;
                            periodConfig.periodsPerParent = DaysPerMonth;
                        }

                        if (timeVariable.hasOwnProperty('digitCount')) {
                            periodConfig.digitCount = timeVariable.digitCount;
                        }

                        if (startSeason !== null && endSeason !== null) {
                            periodConfig.startSeason = parseInt(startSeason);
                            periodConfig.endSeason = parseInt(endSeason);
                        }

						if(type=="7-day")
						{

							periodConfig.displayFormatter = SevenDayDisplayFormatter;

						}


                        break;
                    default:
                        periodConfig = custom.periodicity.getPeriodConfig(configs);
                        break;
                }

                if (!periodConfig.name) {
                    periodConfig.name = timeVariable.type;
                }
                if (!periodConfig.labelVariable) {
                    periodConfig.labelVariable = timeVariable.type;
                }
                periodConfigs.push(periodConfig);
            }

            return periodConfigs;
        },

        PeriodicityWrapper : function(configs, id) {

            this.init = function(configs, id) {
                this.id = id;
                this.initialConfigs = configs;
                this.type = configs.type;
                this.periodicity = new Periodicity(mapper.periodicity.getPeriodConfigs(configs), null);
                this.format = configs.label;
            }

            this.buildLabel = function(label) {
                return this.periodicity.buildLabel(label);
            }

            this.syncSelection = function(periodicityWrapper) {
                this.periodicity.syncSelection(periodicityWrapper.periodicity);
            }

            this.buildDisplayLabel = function(label) {
                return this.periodicity.buildDisplayLabel(label);
            }

            this.init(configs, id);
        },
        OutputFormatter: function(period, formatConfig) {
            console.log('here');
            this.period = period;
            this.config = formatConfig;
            this.numberFormatter;
            this.labelFormatter;

            if (this.config.digitCount) {
                this.numberFormatter = function(selectedPeriod) {
                    selectedPeriod = selectedPeriod.toString();
                    var cnt = 0;
                    while (selectedPeriod.length < this.config.digitCount) {
                        cnt++;
                        selectedPeriod = '0' + selectedPeriod;
                        if (cnt > 20) {
                            mapper.error('Error assigning static digits to output formatter. Loop executed over 20 times');
                            break;
                        }
                    }
                    return selectedPeriod;
                }
            } else {
                this.numberFormatter = function(selectedPeriod) {
                    return selectedPeriod.toString();
                }
            }

            if (this.config.type === 'custom') {
                this.labelFormatter = this.config.labelFormatter;
            } else if (this.config.type === 'absoluteValue') {
                if (this.period.title === 'year') {
                    this.labelFormatter = function() {
                        var selection = this.period.selectedPeriod;
                        var startYear = this.period.start;
                        var year = startYear;

                        for (var i = 1; i < selection; i++) {
                            year++;
                        }
                        return year;
                    }
                } else if (this.period.title === 'month') {
                    this.labelFormatter = function() {
                        return this.period.selectedPeriod;
                    }
                } else {
                    this.labelFormatter = function() {
                        return this.period.type + this.period.selectedPeriod;
                    }
                }
            } else if (this.config.type === 'year') {
                this.labelFormatter = function() {
                    var selection = this.period.selectedPeriod;
                    var startYear = this.period.start;
                    var year = startYear;

                    for (var i = 1; i < selection; i++) {
                        year++;
                    }
                    return this.numberFormatter(year);
                }
            } else if (this.config.type === 'text') {
                if (typeof(this.config.labels) !== 'undefined') {
                    this.labelFormatter = function() {
                        selectedPeriod = this.period.selectedPeriod;
                        return this.config.labels[selectedPeriod - 1];
                    }
                }
            } else if (this.config.type === 'value') {
                if (this.config.formatBy) {
                    this.labelFormatter = function() {
                        var topPeriod = this.period.getParentPeriodByTitle(this.config.formatBy);
                        var formattedPeriod = topPeriod.getSelectedPeriodByPeriod(this.period.title, topPeriod.title);
                        return this.numberFormatter(formattedPeriod);
                    }
                } else {
                    this.labelFormatter = function() {
                        return this.numberFormatter(this.period.selectedPeriod);
                    }
                }
            } else if (this.config.type === 'day') {
                this.labelFormatter = function() {
                    var days = {
                        'sunday': 0,
                        'monday': 1,
                        'tuesday': 2,
                        'wednesday': 3,
                        'thursday': 4,
                        'friday': 5,
                        'saturday': 6,
                    };
                    var startDay = days[this.period.firstOccurence.toLowerCase()];
                    var year = this.period.parentPeriod.parentPeriod.formatSelection('label');
                    var month = this.period.parentPeriod.selectedPeriod;
                    var day = this.period.selectedPeriod;
                    var date = new Date(year, 0, 1);
                    var firstDay = 1;

                    while (date.getDay() !== startDay) {
                        date.setDate(firstDay+=1);
                    }
                    firstDay = date.getDate();

                    for (var i = 0; i < month-1; i+=1) {
                        var daysInMonth = new Date(year, i+1, 0).getDate();
                        var currentMonth = date.getMonth();
                        while (date.getMonth() === currentMonth) {
                            firstDay += this.period.daysPerPeriod;
                            date.setDate(firstDay);
                            if (firstDay > daysInMonth) {
                                firstDay -= daysInMonth;
                            }
                        }
                    }

                    return this.numberFormatter(date.getDate() + (this.period.daysPerPeriod * (day - 1)));
                }
            } else {
                this.labelFormatter = function() {
                    return "";
                }
            }
        },
        setDefaultPeriodicityConfigs: function(configs) {
            var periodsPerParent = {};
            var timeVariables = configs.timeVariables;
            for (var i = 0, len = timeVariables.length; i < len; i+=1) {
                var timeVariable = timeVariables[i];
                if (timeVariable === 'year') {
                    periodsPerParent.year = this.periodsPerParent.topPeriodsPerParent;
                } else if (timeVariable === 'month') {
                    periodsPerParent.month = function() {return 12;}
                } else {
                    if (typeof(configs.itemsPerMonth) !== 'undefined' && configs.itemsPerMonth !== '') {
                        periodsPerParent[timeVariable] = function() {return configs.itemsPerMonth;}
                    } else if (typeof(configs.daysPerPeriod) !== 'undefined' && configs.daysPerPeriod !== '') {
                        if (configs.daysPerPeriod === 1) {
                            periodsPerParent[timeVariable] = this.periodsPerParent.daysPerMonth;
                        } else {
                            periodsPerParent[timeVariable] = this.periodsPerParent.dailyPeriod;
                        }
                    }
                }
            }

            configs.periodsPerParent = periodsPerParent;
        },
        getPeriodsPerYear : function (period) {
            var periodsPerYear = custom.periodicity.getPeriodsPerYear(period);
            var periods = [];
            for (var i = periodsPerYear; i > 0; i-=1) periods.push(i);
            return periods;
        },
        periodsPerParent: {
            topPeriodsPerParent: function () {
                var count = 0;
                for (var i = this.start; i <= this.end; i++) count++;
                return count;
            },
            dailyPeriod: function() {
                var days = {
                    'sunday': 0,
                    'monday': 1,
                    'tuesday': 2,
                    'wednesday': 3,
                    'thursday': 4,
                    'friday': 5,
                    'saturday': 6,
                };
                var startDay = days[this.firstOccurence.toLowerCase()];
                var year = this.parentPeriod.parentPeriod.formatSelection('label');
                var month = this.parentPeriod.selectedPeriod;
                var selectedPeriod = this.selectedPeriod;
                var date = new Date(year, 0, 1);
                var dayCount = 0;
                var firstDay = 1;

                while (date.getDay() !== startDay) {
                    date.setDate(firstDay++);
                }
                firstDay = date.getDate();

                for (var i = 0; i < month; i+=1) {
                    var daysInMonth = new Date(year, i+1, 0).getDate();
                    var currentMonth = date.getMonth();
                    while (date.getMonth() === currentMonth) {
                        if (i === month-1) {
                            dayCount+=1;
                        }
                        firstDay += this.daysPerPeriod;
                        date.setDate(firstDay);
                        if (firstDay > daysInMonth) {
                            firstDay -= daysInMonth;
                        }
                    }
                }

                return dayCount;
            },
            daysPerMonth: function() {
                var year = this.parentPeriod.parentPeriod.formatSelection('label');
                var month = this.parentPeriod.selectedPeriod;
                var days = new Date(year, month, 0).getDate();
                return days;
            },
        }
	},

	EventCenter : {
		createEventCenter : function () {
			mapper.EventCenter.EventChoices =
			{
				//all events must be listed here!!

                EVENT_TOC_LAYER_CONFIGURATION_CREATED : "EVENT_TOC_LAYER_CONFIGURATION_CREATED",
				EVENT_TOC_LAYER_CONFIGURATION_UPDATED : "EVENT_TOC_LAYER_CONFIGURATION_UPDATED",
				EVENT_TOC_LAYER_CQL_FILTER_UPDATED : "EVENT_TOC_LAYER_CQL_FILTER_UPDATED",
				EVENT_MAPWINDOW_LAYER_CONFIGURATION_UPDATED : "EVENT_MAPWINDOW_LAYER_CONFIGURATION_UPDATED",
				EVENT_MAPWINDOW_MAP_CLICKED : "EVENT_MAPWINDOW_MAP_CLICKED",
				EVENT_LAYER_CONFIGURATION_FEATUREINFO_FETCHING : "EVENT_LAYER_CONFIGURATION_FEATUREINFO_FETCHING",
				EVENT_LAYER_CONFIGURATION_FEATUREINFO_UPDATED : "EVENT_LAYER_CONFIGURATION_FEATUREINFO_UPDATED",
				EVENT_MAPWINDOW_FOCUSED : "EVENT_MAPWINDOW_FOCUSED",
				EVENT_MAPWINDOW_RESIZED : "EVENT_MAPWINDOW_RESIZED",
				EVENT_MAPWINDOW_CREATED : "EVENT_MAPWINDOW_CREATED",
				EVENT_MAPWINDOW_DESTROYED : "EVENT_MAPWINDOW_DESTROYED",
				EVENT_REGIONTOOL_TRIGGERED : "EVENT_REGIONTOOL_TRIGGERED",
				EVENT_REQUEST_TOOLS_DRAWER_OPEN : "EVENT_REQUEST_TOOLS_DRAWER_OPEN",
				EVENT_REGION_CHANGED: "EVENT_REGION_CHANGED"
			};

			mapper.EventCenter.defaultEventCenter = {
				callbacksForEventDictionary : [],
				callbackObjectsForEventDictionary : [],

				postEvent : function (eventName, eventObject, postingObject) {

					//check if dictionary has the key
					if (this.callbacksForEventDictionary.hasOwnProperty(eventName)) {
                        // In case more events of this type are registered during this events execution,
                        // take a copy of only the events that exists at the time of execution.
                        var callbacksForEventNameCopy = [];
                        var callbackObjectsForEventNameCopy = []
						var callbacksForEventName = this.callbacksForEventDictionary[eventName];
						var callbackObjectsForEventName = this.callbackObjectsForEventDictionary[eventName];
                        for (var i = 0, len = callbacksForEventName.length; i < len; i+=1) {
                            callbacksForEventNameCopy.push(callbacksForEventName[i]);
                            callbackObjectsForEventNameCopy.push(callbackObjectsForEventName[i]);
                        }
						var xx;
						for (xx = 0; xx < callbacksForEventNameCopy.length; xx++)
						{
							var aCallback = callbacksForEventNameCopy[xx];
							var aCallbackObject = callbackObjectsForEventNameCopy[xx];
							aCallback(eventObject, aCallbackObject, postingObject);
						}
					}
				},
				registerCallbackForEvent : function (eventName, callback, callbackObject) {
					if (this.callbacksForEventDictionary.hasOwnProperty(eventName)) {
						this.callbacksForEventDictionary[eventName].push(callback);
						this.callbackObjectsForEventDictionary[eventName].push(callbackObject);
					} else {
						this.callbacksForEventDictionary[eventName] = new Array();
						this.callbacksForEventDictionary[eventName].push(callback);

						this.callbackObjectsForEventDictionary[eventName] = new Array();
						this.callbackObjectsForEventDictionary[eventName].push(callbackObject);
					}
				},
				removeAllCallbacksForObject : function(callbackObjectToRemove)
				{
					for(var aKey in this.callbacksForEventDictionary)
					{
						if(this.callbacksForEventDictionary.hasOwnProperty(aKey))
						{
							//get the array for the key and check if callbackObject is in it
							var callbacksForEventArray = this.callbacksForEventDictionary[aKey];
							var callbackObjectsForEventArray = this.callbackObjectsForEventDictionary[aKey];

							var indexToRemove = -1;

							var xx;
							for(xx=0;xx<callbackObjectsForEventArray.length;xx++)
							{
								var aCallbackObject = callbackObjectsForEventArray[xx];

								if(aCallbackObject == callbackObjectToRemove)
								{
									indexToRemove = xx;
								}
							}

							if(indexToRemove > -1)
							{
								this.callbackObjectsForEventDictionary[aKey].splice(indexToRemove,1);
								this.callbacksForEventDictionary[aKey].splice(indexToRemove,1);
							}
						}
					}
				}
			}
		}

	},
  Analytics : {
    reportActivity : function (file, eventCategory, eventAction){
      /* This function is called from within the cDownloadBtn tool */
      if (typeof gtag === "function"){
        //GOOGLE
        gtag('event', eventAction, {
          'event_category': eventCategory,
          'event_label': file
        });
      }

      if (typeof _paq === "object"){
        //PIWIK
        _paq.push(['trackEvent', eventCategory, eventAction, file]);
      }
    }
  },
	OpenLayers : {

        /**
		 * Extends Open Layers (OL) functionality to work with tile WMS and base map layers
		 */
        extendOpenLayers: function() {
            mapper.OpenLayers.Map = function(options) {
                ol.Map.call(this, options);
            }
            ol.inherits(mapper.OpenLayers.Map, ol.Map);

            mapper.OpenLayers.Map.prototype.tileLoadInitCallback = function() {
                // Overwrite this method in a tool to execute code when layer loading starts.
            }

            mapper.OpenLayers.Map.prototype.tileLoadCompleteCallback = function() {
                // Overwrite this method in a tool to execute code when all layers are loaded.
            }

            mapper.OpenLayers.Map.prototype.checkLayerLoadingComplete = function() {
                var loadingComplete = true;
                var layers = this.getLayers().getArray();
                for (var i = 0, len = layers.length; i < len; i+=1) {
                    var source = layers[i].getSource();
                    if (source.loading !== source.loaded) {
                        loadingComplete = false;
                        break;
                    }
                }

                if (loadingComplete === true) {
                    this.tileLoadCompleteCallback();
                }
            }

            mapper.OpenLayers.source = {
                TileWMS: function(options) {
                    ol.source.TileWMS.call(this, options);
                    this.resetTileLoadCount();
                },
                //  Bing maps - base layers
                BingMaps: function(options) {
                    ol.source.BingMaps.call(this, options);
                    this.resetTileLoadCount();
                },
                // OSM - base layers
                OSM: function(options) {
                    ol.source.OSM.call(this, options);
                    this.resetTileLoadCount();
                },
                Stamen: function(options) {
                    ol.source.Stamen.call(this, options);
                    this.resetTileLoadCount();
                }
            };

            ol.inherits(mapper.OpenLayers.source.TileWMS, ol.source.TileWMS);
            ol.inherits(mapper.OpenLayers.source.BingMaps, ol.source.BingMaps);
            ol.inherits(mapper.OpenLayers.source.OSM, ol.source.OSM);
            ol.inherits(mapper.OpenLayers.source.Stamen, ol.source.Stamen);

            mapper.OpenLayers.source.TileWMS.prototype.resetTileLoadCount =
             mapper.OpenLayers.source.BingMaps.prototype.resetTileLoadCount =
             mapper.OpenLayers.source.OSM.prototype.resetTileLoadCount =
             mapper.OpenLayers.source.Stamen.prototype.resetTileLoadCount = function() {
                this.loading = 0;
                this.loaded = 0;
            }

            mapper.OpenLayers.source.TileWMS.prototype.tileLoadStartCallback =
             mapper.OpenLayers.source.BingMaps.prototype.tileLoadStartCallback =
             mapper.OpenLayers.source.OSM.prototype.tileLoadStartCallback =
             mapper.OpenLayers.source.Stamen.prototype.tileLoadStartCallback = function(event) {
                if (this.loading === 0) {
                    this.get('map').tileLoadInitCallback();
                }
                this.loading += 1;
            }

            mapper.OpenLayers.source.TileWMS.prototype.tileLoadEndCallback =
             mapper.OpenLayers.source.TileWMS.prototype.tileLoadErrorCallback =
             mapper.OpenLayers.source.BingMaps.prototype.tileLoadEndCallback =
             mapper.OpenLayers.source.BingMaps.prototype.tileLoadErrorCallback =
             mapper.OpenLayers.source.OSM.prototype.tileLoadEndCallback =
             mapper.OpenLayers.source.OSM.prototype.tileLoadErrorCallback =
             mapper.OpenLayers.source.Stamen.prototype.tileLoadEndCallback =
             mapper.OpenLayers.source.Stamen.prototype.tileLoadErrorCallback = function(event) {
                if (this.get('tileLoadCanceled') === true) return;
                setTimeout(function(source) {
                    source.loaded += 1;
                    if (source.loaded === source.loading) {
                        source.get('map').checkLayerLoadingComplete();
                    }
                }, 100, this);
            }
        },

		overrideOpenLayersZoomCode:function()
		{
			/*
			big long explanation

			openlayers by default when setting an extent
			snaps to the nearest zoom level
			so if you want to fit africa in a window with a certain extent
			but your zoom levels are too coarse, then it will zoom out
			automatically, and africa will be centered, but shrunk in the same
			map window.

			To get around this, we made the zoom levels finer, but that increased
			the amount of zoom steps, so when a person would try to zoom in
			they would have to click the zoom button many times or scroll their mouse
			a lot to get to the desired zoom level.

			To get around that, we increased the amount of zoom steps that are done
			when a person zooms, so we can use a higher number of zoom levels so the
			extent can be set right, and so that a person can zoom in quickly

			to do this, we had to override the zoom funcs to zoom in more,
			we do that here.

			These are in ol-debug.js, and ol-debug.js is compiled from the separate
			js files into one big ol-debug.js
			the file names that are compiled into ol-debug.js arre something like

			zoomslider.js and ol.interaction.zoom

			here i increased the zoom multiplier to 5

			*/


			ol.control.Zoom.prototype.zoomByDelta_ = function(delta)
			{
			 var map = this.getMap();
			  var view = map.getView();
			  if (goog.isNull(view)) {
				// the map does not have a view, so we can't act
				// upon it
				return;
			  }
			  var currentResolution = view.getResolution();
			  if (goog.isDef(currentResolution)) {
				if (this.duration_ > 0) {
				  map.beforeRender(ol.animation.zoom({
					resolution: currentResolution,
					duration: this.duration_,
					easing: ol.easing.easeOut
				  }));
				}
				var newResolution = view.constrainResolution(currentResolution, delta*5);
				view.setResolution(newResolution);
			  }
			};

			ol.interaction.Interaction.zoomByDelta =
			function(map, view, delta, opt_anchor, opt_duration) {
			  var currentResolution = view.getResolution();
			  var resolution = view.constrainResolution(currentResolution, delta*5, 0);

			  ol.interaction.Interaction.zoomWithoutConstraints(
				  map, view, resolution, opt_anchor, opt_duration);
			};
		}
		,
		zIndexSortAscending:function(a,b)
		{
			var keyA = a.zIndex;
			var keyB = b.zIndex;
			if(keyA<keyB) return -1;
			if(keyA>keyB) return 1;
			return 0;
		},
        getOpenLayersLayerIndex : function(layerId, openLayersMapObject) {
            var olLayers = openLayersMapObject.getLayers().getArray();
            for (var i = 0, len = olLayers.length; i < len; i+=1) {
                var layer = olLayers[i];
                if (layer.get('mapperLayerIdentifier') === layerId) return i;
            }
            return false;
        },
        /**
		 * Get OL layers from JSON layer object
         *
         * @param jsonLayer - JSON layer object
         * @param openLayersMapObject - OL map object
		 */
		getOpenLayersLayerFromJsonLayer : function (jsonLayer,openLayersMapObject)
		{
            var propExists = function(property) {
                if (typeof(property) !== 'undefined' && property !== "" && property !== null) return true;
                return false;
            }

			//adding the tiled:true makes the requests use geoserver's gwc
			//see https://github.com/openlayers/ol3/issues/2143
			/*
			if you need the server to send in a
			specific projection, you can do this
			*/

			var layerBrand = (jsonLayer.brand) ? jsonLayer.brand : null;

            // new source definition
			if(layerBrand != null)
			{
                // Bing maps - base layer
				if (layerBrand == "bing")
                {

					var key = jsonLayer.key;
					var imagerySet = jsonLayer.imagerySet;
					newSource = new mapper.OpenLayers.source.BingMaps
						({
							key : key,
							imagerySet : imagerySet,
							mapperLayerIdentifier : jsonLayer.id
							//use maxZoom 19 to see stretched tiles
							//instead of the BingMaps
							//"no photos at this zoom level" tiles
							//maxZoom: 19
						});



					//var bingMapsLayer = new ol.layer.Tile({
					//		preload : Infinity,
					//		source : bingMapsSource
					//	});

					//bingMapsLayer.setVisible(isVisible);

				}
                // OSM maps - base layer
                // if url is undefined, the base layer will be the standard OSM,
                // else the base layer will a OSM contributing map (e.g. Thunderforest Maps)
                if (layerBrand == "osm")
                {
					newSource = new mapper.OpenLayers.source.OSM
						({
							mapperLayerIdentifier : jsonLayer.id,
                            url : jsonLayer.source.url,
							attributions: [
								ol.source.OSM.ATTRIBUTION
							]
						});
				}
        if (layerBrand == "stamen")
                {

					var key = jsonLayer.key;
					var layer = jsonLayer.layer;
					newSource = new mapper.OpenLayers.source.Stamen
						({
							key : key,
							layer : layer,
							mapperLayerIdentifier : jsonLayer.id,
              attributions: [
								ol.source.Stamen.ATTRIBUTION
							]
						});

				}
			}
			else
			{
                var displayTitle = jsonLayer.title,
                sourceWMSURL = jsonLayer.source.wms,
                sourceGWCURL = jsonLayer.source.gwc,
                isVisible = jsonLayer.display,
                cqlFilter = jsonLayer.cqlFilter;

                var params = this.getWMSParams(jsonLayer, openLayersMapObject);
                var options = {
                    url: (propExists(sourceGWCURL)) ? sourceGWCURL : sourceWMSURL,
                    params: params,
                    tileLoadFunction: mapper.OpenLayers.imagePostFunction
                };

                newSource = new mapper.OpenLayers.source.TileWMS(options);
			}

            mapper.OpenLayers.addEventsToLayerSource(newSource, openLayersMapObject);
			var newLayer = new ol.layer.Tile({
                source : newSource
            });

			newLayer.set("mapperLayerIdentifier",jsonLayer.id);
			newLayer.set("name",jsonLayer.name);

			if(jsonLayer.loadOnly==true)
			{
				newLayer.setVisible(false);
			}

			return newLayer;
		},

        imagePostFunction: function(image, src) {
            var img = image.getImage();
            var url = src.substr(0, src.indexOf('?'));
            var params = src.substring(src.indexOf('?')+1);

            if (params.indexOf('jsonLayerId') !== -1) {
                var paramsObj = {};
                var paramsArr = params.split('&');
                for (var i = 0, len = paramsArr.length; i < len; i+=1) {
                    var param = paramsArr[i].split('=');
                    if (param.length === 2) {
                        paramsObj[param[0]] = param[1];
                    }
                }
                var layerConfigs = mapper.layers.getLayersConfigById(mapper.layers.getLayersConfigInstanceId());
                var jsonLayer = mapper.layers.query(
                    layerConfigs,
                    {
                        type: 'layer',
                        id: paramsObj.jsonLayerId
                    },
                    ['overlays', 'boundaries', 'baselayers']
                );
                //console.log(jsonLayer);
                //console.log(paramsObj.jsonLayerId);
                jsonLayer = jsonLayer[0];

                if (jsonLayer.hasOwnProperty('cqlFilter')) {
                    var cql = [];
                    for (var prop in jsonLayer.cqlFilter) {
                        if (jsonLayer.cqlFilter[prop] !== null) cql.push(jsonLayer.cqlFilter[prop]);
                    }
                    params += '&CQL_FILTER='+cql.join(' AND ');
                }
            }

            if (params.length > 2000 && typeof window.btoa === 'function') {
                var xhr = new XMLHttpRequest();
                xhr.addEventListener('abort', function(event) {
                    mapper.log(event);
                });
                xhr.addEventListener('error', function(event) {
                    mapper.log(event);
                });
                xhr.open('POST', url, true);

                xhr.responseType = 'arraybuffer';
                xhr.onload = function(e) {
                    if (this.status === 200) {
                        var uInt8Array = new Uint8Array(this.response);
                        var i = uInt8Array.length;
                        var binaryString = new Array(i);
                        while (i--) {
                            binaryString[i] = String.fromCharCode(uInt8Array[i]);
                        }
                        var data = binaryString.join('');
                        var type = this.getResponseHeader('content-type');
                        if (type.indexOf('image') === 0) {
                            img.src = 'data:' + type + ';base64,' + window.btoa(data);
                        }
                        uInt8Array = null;
                    }
                };
                //SET THE PROPER HEADERS AND FINALLY SEND THE PARAMETERS
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhr.send(params);
            } else {
                img.src = url + '?' + params;
            }
        },

        forceLayerUpdateById: function(id, map) {
            var olIndex = mapper.OpenLayers.getOpenLayersLayerIndex(id, map);
            if (olIndex) {
                var source = map.getLayers().item(olIndex).getSource();
                var params = source.getParams();
                params.t = new Date().getMilliseconds();
                source.updateParams(params);
            }
        },

        getWMSParams : function (jsonLayer, openLayersMapObject, projection) {
            // If a projection parameter was not provided, default to the map projection.
            if (typeof(projection) === 'undefined') projection = openLayersMapObject.getView().getProjection().getCode();
            var propExists = function(property) {
                if (typeof(property) !== 'undefined' && property !== "" && property !== null) return true;
                return false;
            }

            var srs = jsonLayer.srs,
            sourceName = jsonLayer.name,
            bbox = jsonLayer.bbox,
            hasTransparency = jsonLayer.transparency,
            layerStyle = jsonLayer.style,
            version = jsonLayer.version,
            sourceWMSURL = jsonLayer.source.wms,
            params = {
                'LAYERS' : sourceName,
                'TILED' : true,
                "mapperWMSURL" : sourceWMSURL,
                'SRS' : projection,
                'jsonLayerId' : jsonLayer.id
            };

            if (propExists(bbox) && propExists(srs)) {
                if (srs === projection) {
                    params.BBOX = (typeof(bbox) === 'string') ? bbox : bbox.join(',');
                } else {
                    var sourceBBOX = (typeof(bbox) === 'string') ? bbox.split(',') : bbox,
                    minx = sourceBBOX[0],
                    miny = sourceBBOX[1],
                    maxx = sourceBBOX[2],
                    maxy = sourceBBOX[3],

                    minxy = [minx, miny],
                    maxxy = [maxx, maxy],

                    coordMinXY = ol.proj.transform(minxy, projection, srs),
                    coordMaxXY = ol.proj.transform(maxxy, projection, srs),

                    reprojectedBBOX = [coordMinXY[0], coordMinXY[1], coordMaxXY[0], coordMaxXY[1]];
                    params.BBOX = reprojectedBBOX.join(',');
                }
            }

            if (propExists(layerStyle)) params.STYLES = layerStyle;
            if (propExists(version)) params.VERSION = version;

            return params;
        },

        updateMapLayerOpacitiesAndDisplayedLayersFromLayersConfig : function (layersConfig, map) {
            var turnedOnOverlays = mapper.layers.query(
                layersConfig,
                function (layer) {
                    if (layer.type === 'layer' && (layer.display === true || layer.mask === true)) {
                        return true;
                    }
                    return false;
                },
                ['overlays', 'additional']
            );

            var turnedOnBaseLayers = mapper.layers.query(
                layersConfig,
                function (layer) {
                    if (layer.type === 'layer' && (layer.display === true || layer.mask === true)) {
                        return true;
                    }
                    return false;
                },
                ['baselayers']
            );

            var turnedOnBoundaries = mapper.layers.query(
                layersConfig,
                function (layer) {
                    if (layer.type === 'layer' && (layer.display === true || layer.mask === true)) {
                        return true;
                    }
                    return false;
                },
                ['boundaries']
            );

            var turnedOnLayers = turnedOnBaseLayers.concat(turnedOnOverlays.reverse()).concat(turnedOnBoundaries.reverse());

            var turnedOffLayers = mapper.layers.query(
                layersConfig,
                function(layer) {
                    if (layer.type === 'layer' && layer.loadOnly === false && layer.display === false && layer.mask === false) {
                        return true;
                    }
                    return false;
                },
                /*{
                    type: 'layer',
                    display: false
                },*/
                ['overlays', 'boundaries', 'baselayers']
            );

            var idsToRemove = [];
            map.getLayers().forEach(function(layer, index) {
                var layerId = layer.get('mapperLayerIdentifier');
                for (var i = 0, len = turnedOffLayers.length; i < len; i+=1) {
                    var turnedOffLayer = turnedOffLayers[i];
                    if (turnedOffLayer.id === layerId) {
                        idsToRemove.push(layerId);
                        break;
                    }
                }
            });

            for (var i = 0, len = idsToRemove.length; i < len; i+=1) {
                var layerId = idsToRemove[i];
                var olIndex = this.getOpenLayersLayerIndex(layerId, map);
                if (olIndex !== false) {
                    map.getLayers().removeAt(olIndex);
                }
            }

            for (var i = 0, len = turnedOnLayers.length; i < len; i+=1) {
                var layer = turnedOnLayers[i];
                var olLayers = map.getLayers().getArray();
                var olLayerIndex = this.getOpenLayersLayerIndex(layer.id, map);

                if (olLayerIndex === false) {  // Layer is currently not in the map.
                    var newLayer = this.getOpenLayersLayerFromJsonLayer(layer, map);
                    if (i >= olLayers.length) {  // Add layer to top of the stack.
                        map.addLayer(newLayer);
                    } else {  // Insert layer at specific position.
                        map.getLayers().insertAt(i, newLayer);
                    }
                } else {  // Layer exists in the map.
                    var olLayer = olLayers[i];
                    if (olLayerIndex !== i) {  // The layer order has changed.
                        mapper.OpenLayers.removeEventsFromLayerSource(map.getLayers().item(olLayerIndex).getSource());
                        map.getLayers().removeAt(olLayerIndex);
                        map.getLayers().insertAt(i, this.getOpenLayersLayerFromJsonLayer(layer, map));
                    } else if (typeof(olLayer.getSource().getParams) === 'function' && olLayer.getSource().getParams()) {  // Last check to see if the layer parameters have been updated.
                        var paramsHaveChanged = false;
                        var oldParams = olLayer.getSource().getParams();
                        var params = this.getWMSParams(layer, map);

                        for (var prop in oldParams) {
                            if (!params.hasOwnProperty(prop) || params[prop] !== oldParams[prop]) {
                                paramsHaveChanged = true;
                                break;
                            }
                        }

                        if (paramsHaveChanged === false) {  // In case the new params have a property the old params does not.
                            for (var prop in params) {
                                if (!oldParams.hasOwnProperty(prop)) {
                                    paramsHaveChanged = true;
                                    break;
                                }
                            }
                        }

                        if (paramsHaveChanged === true) {
                            olLayer.getSource().set('tileLoadCanceled', true);
                            mapper.OpenLayers.removeEventsFromLayerSource(olLayer.getSource());
                            map.getLayers().removeAt(olLayerIndex);
                            map.getLayers().insertAt(olLayerIndex, this.getOpenLayersLayerFromJsonLayer(layer, map));
                        }
                    }
                }

                if (layer.transparency === true) {
                    map.getLayers().item(i).setOpacity(layer.opacity);
                }
            }

            // Remove any layers that were removed from the layers json.
            map.getLayers().forEach(function(layer) {
                var layerId = layer.get('mapperLayerIdentifier');

                var layerJson = mapper.layers.query(
                    layersConfig,
                    {
                        id: layerId
                    },
                    ['overlays', 'boundaries', 'baselayers']
                );
                if (layerJson.length === 0) {
                    this.remove(layer);
                }
            }, map.getLayers());
        },

        removeEventsFromLayerSource: function(source) {
            var tileLoadStartEventKey = source.get('tileLoadStartEventKey');
            var tileLoadEndEventKey = source.get('tileLoadEndEventKey');
            var tileLoadErrorEventKey = source.get('tileLoadErrorEventKey');

            if (tileLoadStartEventKey) {
                ol.Observable.unByKey(tileLoadStartEventKey);
            }
            if (tileLoadEndEventKey) {
                ol.Observable.unByKey(tileLoadEndEventKey);
            }
            if (tileLoadErrorEventKey) {
                ol.Observable.unByKey(tileLoadErrorEventKey);
            }

            var map = source.get('map');
            if (map) {
                source.unset('map');
            }
        },

        addEventsToLayerSource: function(source, map) {
            source.set('tileLoadStartEventKey', source.on('tileloadstart', source.tileLoadStartCallback, source));
            source.set('tileLoadEndEventKey', source.on('tileloadend', source.tileLoadEndCallback, source));
            source.set('tileLoadErrorEventKey', source.on('tileloaderror', source.tileLoadErrorCallback, source));
            source.set('map', map);
        },

		setExtentForMap : function (openLayersMapObject, sourceBBOX, sourceEPSGCode)
		{
			var mapProjectionEPSGCode = openLayersMapObject.getView().getProjection().getCode();

			//load the bbox
			//do a transform to correct srs aka srs that the map uses
			//then set

			var minx = sourceBBOX[0];
			var miny = sourceBBOX[1];
			var maxx = sourceBBOX[2];
			var maxy = sourceBBOX[3];

			var minxy = [minx, miny];
			var maxxy = [maxx, maxy];

			var coordMinXY = ol.proj.transform(minxy, mapProjectionEPSGCode, sourceEPSGCode);
			var coordMaxXY = ol.proj.transform(maxxy, mapProjectionEPSGCode, sourceEPSGCode);

			var reprojectedBBOX = [coordMinXY[0], coordMinXY[1], coordMaxXY[0], coordMaxXY[1]];

			//http://stackoverflow.com/questions/23682286/zoomtoextent-openlayers-3
			openLayersMapObject.getView().fit(reprojectedBBOX, openLayersMapObject.getSize());

		},
		getCurrentMapWindowExtent : function (openlayersMap) {
			var currentExtent = openlayersMap.getView().calculateExtent(openlayersMap.getSize());

			return currentExtent;
		},
		setCurrentMapWindowExtentFromExtentThatIsAlreadyInCorrectProjection : function(extent,openlayersMap)
		{
			var mapProjectionEPSGCode = openlayersMap.getView().getProjection().getCode();
			mapper.OpenLayers.setExtentForMap(openlayersMap,extent,mapProjectionEPSGCode);
		},
		/**
		 * Summary: Adds an Open Layers Scale Line to the Map Panel
		 *
		 * @param openLayersMapObject - Open Layers Map Object
		 */
		addScaleLine : function (openLayersMapObject) {
			var scaleline = new ol.control.ScaleLine();
			openLayersMapObject.addControl(scaleline);
		},
        customizeZoomTips : function (openLayersMapObject, zoomIn, zoomOut) {
            var zoomControl = new ol.control.Zoom({
                zoomInTipLabel: zoomIn,
                zoomOutTipLabel: zoomOut
            });
            openLayersMapObject.addControl(zoomControl);
        },
		setExtentEncompassingSpecifiedRegionsForMap : function (openLayersMapObject, regionsToUse) {
			var mapProjectionEPSGCode = openLayersMapObject.getView().getProjection().getCode();

			//load the bbox
			//do a transform to correct srs aka srs that the map uses
			//then set

			var realMinX = Number.POSITIVE_INFINITY;
			var realMinY = Number.POSITIVE_INFINITY;
			var realMaxX = Number.NEGATIVE_INFINITY;
			var realMaxY = Number.NEGATIVE_INFINITY;

			for (var regionIndex in regionsToUse) {
				var aRegion = regionsToUse[regionIndex];
				var sourceBBOX = aRegion.bbox;
				var sourceEPSGCode = aRegion.srs;

				var minx = sourceBBOX[0];
				var miny = sourceBBOX[1];
				var maxx = sourceBBOX[2];
				var maxy = sourceBBOX[3];

				var minxy = [minx, miny];
				var maxxy = [maxx, maxy];

				var coordMinXY = ol.proj.transform(minxy, mapProjectionEPSGCode, sourceEPSGCode);
				var coordMaxXY = ol.proj.transform(maxxy, mapProjectionEPSGCode, sourceEPSGCode);

				var reprojectedBBOX = [coordMinXY[0], coordMinXY[1], coordMaxXY[0], coordMaxXY[1]];

				if (coordMinXY[0] < realMinX)
					realMinX = coordMinXY[0];
				if (coordMinXY[1] < realMinY)
					realMinY = coordMinXY[1];
				if (coordMaxXY[0] > realMaxX)
					realMaxX = coordMaxXY[0];
				if (coordMaxXY[1] > realMaxY)
					realMaxY = coordMaxXY[1];

			}

			var encompassingBBOX = [realMinX, realMinY, realMaxX, realMaxY];

			//http://stackoverflow.com/questions/23682286/zoomtoextent-openlayers-3
			openLayersMapObject.getView().fit(encompassingBBOX, openLayersMapObject.getSize());

			return encompassingBBOX;
		},
		getExtentToUseForLayerConfig : function (layersConfig, openLayersMapObject) {
			var windowJsonLayers = mapper.layers.query(
				layersConfig,
				{
					type: 'layer',
					display: true
				},
				['overlays', 'boundaries']
			);

			var regionsToUse = new Array();

			for (var overlayIndex in windowJsonLayers) {
				var aJsonLayer = windowJsonLayers[overlayIndex];
				var firstRegionID = aJsonLayer.regionIds[0];
				var firstRegion = mapper.common.getRegionWithRegionID(firstRegionID, mapper.regions);
				regionsToUse.push(firstRegion);
			}

			var mapProjectionEPSGCode = openLayersMapObject.getView().getProjection().getCode();

			//load the bbox
			//do a transform to correct srs aka srs that the map uses
			//then set

			var realMinX = Number.POSITIVE_INFINITY;
			var realMinY = Number.POSITIVE_INFINITY;
			var realMaxX = Number.NEGATIVE_INFINITY;
			var realMaxY = Number.NEGATIVE_INFINITY;

			for (var regionIndex in regionsToUse) {
				var aRegion = regionsToUse[regionIndex];
				var sourceBBOX = aRegion.bbox;
				var sourceEPSGCode = aRegion.srs;

				var minx = sourceBBOX[0];
				var miny = sourceBBOX[1];
				var maxx = sourceBBOX[2];
				var maxy = sourceBBOX[3];

				var minxy = [minx, miny];
				var maxxy = [maxx, maxy];

				var coordMinXY = ol.proj.transform(minxy, mapProjectionEPSGCode, sourceEPSGCode);
				var coordMaxXY = ol.proj.transform(maxxy, mapProjectionEPSGCode, sourceEPSGCode);

				var reprojectedBBOX = [coordMinXY[0], coordMinXY[1], coordMaxXY[0], coordMaxXY[1]];

				if (coordMinXY[0] < realMinX)
					realMinX = coordMinXY[0];
				if (coordMinXY[1] < realMinY)
					realMinY = coordMinXY[1];
				if (coordMaxXY[0] > realMaxX)
					realMaxX = coordMaxXY[0];
				if (coordMaxXY[1] > realMaxY)
					realMaxY = coordMaxXY[1];

			}

			var encompassingBBOX = [realMinX, realMinY, realMaxX, realMaxY];
			return encompassingBBOX;
		},
        getDownloadURLofTopOverlay: function(layersConfig, openLayersMapObject, imageMime, width, height, style) {
            if (typeof(style) === 'undefined') style = "";
			var layerConfig = layersConfig;
			var openlayersMap = openLayersMapObject;

            var topLayer = mapper.layers.getTopLayer(layerConfig.overlays);

			var wmsURL = topLayer.source.wms;

			var layersParam = topLayer.name;

            bboxParam = openlayersMap.getView().calculateExtent(openlayersMap.getSize()).join(',');

			var mapProjectionEPSGCode = openlayersMap.getView().getProjection().getCode();

			var layersEncoded = encodeURIComponent(layersParam);
			var srsEncoded = encodeURIComponent(mapProjectionEPSGCode);
			var widthEncoded = encodeURIComponent(width);
			var heightEncoded = encodeURIComponent(height);
			var crsEncoded = encodeURIComponent(mapProjectionEPSGCode);
			var bboxEncoded = encodeURIComponent(bboxParam);

			var getMapRequest = wmsURL + "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=" + imageMime + "&TRANSPARENT=true&LAYERS=" + layersEncoded + "&TILED=true&SRS=" + srsEncoded + "&WIDTH=" + widthEncoded + "&HEIGHT=" + heightEncoded + "&CRS=" + crsEncoded + "&STYLES=" + style + "&BBOX=" + bboxEncoded;

			return getMapRequest;
        },
		getDownloadURLOfMapImage : function (layersConfig, openLayersMapObject, imageMime, width, height, style) {
            if (typeof(style) === 'undefined') style = "";
			var layerConfig = layersConfig;
			var openlayersMap = openLayersMapObject;

			var windowJsonBoundaries = mapper.layers.query(
				layerConfig.boundaries,
				{
					type: 'layer',
					display: true
				}
			);
			var windowJsonOverlays = mapper.layers.query(
				layerConfig.overlays,
				{
					type: 'layer',
					display: true
				}
			);

			var wmsURL = windowJsonOverlays[0].source.wms;

			var layersParam = "";
			var stylesParam = "";

            if (windowJsonOverlays.length > 0) {
                layersParam += windowJsonOverlays[windowJsonOverlays.length - 1].name + ',';
				stylesParam += windowJsonOverlays[windowJsonOverlays.length - 1].style + ',';
            }

			for (var layerIndex = 0; layerIndex < windowJsonBoundaries.length; layerIndex++) {
				var layerName = windowJsonBoundaries[layerIndex].name;
				layersParam += layerName + ',';
				var stylesName = windowJsonBoundaries[layerIndex].style;
				stylesParam += stylesName + ',';
			}

            layersParam = layersParam.substring(0, layersParam.length - 1);
			stylesParam = stylesParam.substring(0, stylesParam.length - 1);


            bboxParam = openlayersMap.getView().calculateExtent(openlayersMap.getSize()).join(',');

			var mapProjectionEPSGCode = openlayersMap.getView().getProjection().getCode();

			var layersEncoded = encodeURIComponent(layersParam);
			var srsEncoded = encodeURIComponent(mapProjectionEPSGCode);
			var widthEncoded = encodeURIComponent(width);
			var heightEncoded = encodeURIComponent(height);
			var crsEncoded = encodeURIComponent(mapProjectionEPSGCode);
			var bboxEncoded = encodeURIComponent(bboxParam);


			var getMapRequest = wmsURL + "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=" + imageMime + "&TRANSPARENT=true&LAYERS=" + layersEncoded + "&TILED=true&SRS=" + srsEncoded + "&mapperWMSURL=" + wmsURL + "&WIDTH=" + widthEncoded + "&HEIGHT=" + heightEncoded + "&CRS=" + crsEncoded + "&STYLES=" + stylesParam + "&BBOX=" + bboxEncoded;

			return getMapRequest;
		},

        getDownloadURLOfJSONLayerObject : function (jsonLayerObject,openLayersMapObject,imageMime,width, height)
        {

            var openlayersMap = openLayersMapObject;
            var wmsURL = jsonLayerObject.source.wms;

            var layersParam = jsonLayerObject.name;
            var stylesParam = jsonLayerObject.style;

            var bboxParam = openLayersMapObject.getView().calculateExtent(openLayersMapObject.getSize()).join(',');

            var mapProjectionEPSGCode = openlayersMap.getView().getProjection().getCode();

            var layersEncoded = encodeURIComponent(layersParam);
            var srsEncoded = encodeURIComponent(mapProjectionEPSGCode);
            var widthEncoded = encodeURIComponent(width);
            var heightEncoded = encodeURIComponent(height);
            var crsEncoded = encodeURIComponent(mapProjectionEPSGCode);
            var bboxEncoded = encodeURIComponent(bboxParam);

            var getMapRequest = wmsURL + "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=" + imageMime + "&TRANSPARENT=true&LAYERS=" + layersEncoded + "&TILED=true&SRS=" + srsEncoded + "&mapperWMSURL=" + wmsURL + "&WIDTH=" + widthEncoded + "&HEIGHT=" + heightEncoded + "&CRS=" + crsEncoded + "&STYLES=" + stylesParam + "&BBOX=" + bboxEncoded;

            return getMapRequest;
        },

		setExtentForMapFromDragBoxMouseDownAndMouseUpCoordinates : function (mouseUpCoords, mouseDownCoords, openlayersMapObject) {

			var x1 = mouseUpCoords[0];
			var y1 = mouseUpCoords[1];

			var x2 = mouseDownCoords[0];
			var y2 = mouseDownCoords[1];

			var minX = Number.POSITIVE_INFINITY;
			var minY = Number.POSITIVE_INFINITY;
			var maxX = Number.NEGATIVE_INFINITY;
			var maxY = Number.NEGATIVE_INFINITY;

			//they could have dragged the box 4 different ways
			//so find the minx,y and the max,y to make a bbox to set extent to

			if (x1 < minX)
				minX = x1;
			if (x2 < minX)
				minX = x2;
			if (y1 < minY)
				minY = y1;
			if (y2 < minY)
				minY = y2;

			if (x1 > maxX)
				maxX = x1;
			if (x2 > maxX)
				maxX = x2;
			if (y1 > maxY)
				maxY = y1;
			if (y2 > maxY)
				maxY = y2;

			var BBOX = [minX, minY, maxX, maxY];

			//http://stackoverflow.com/questions/23682286/zoomtoextent-openlayers-3
			openLayersMapObject.getView().fit(BBOX, openLayersMapObject.getSize());
		},

        getGetFeatureInfoUrl : function(coordinate, map, jsonLayer) {
            var mapProjectionEPSGCode = map.getView().getProjection().getCode();
            var correspondingLayerEPSGCode = jsonLayer.srs;

            // Geoserver layers feature info requests can be configured to accept coordinates
            // in a different projection than the layers default projection. But to ensure compatibility
            // with all projections, we convert the coordinates into the layers default projection.
            var viewResolution;
            if (mapProjectionEPSGCode !== correspondingLayerEPSGCode) {
                coordinate = proj4(mapProjectionEPSGCode, correspondingLayerEPSGCode, coordinate);
                viewResolution = mapper.OpenLayers.getMapResolutionInProjection(map, correspondingLayerEPSGCode);
            } else {
                viewResolution = map.getView().getResolution();
            }

            //---------------------------------------------------------------------

            //so getfeatureinfo does not work through the gwc
            //we need to use the wms url for that
            //so we make a copy of the source that is set to use gwc
            //change its url to wms
            //then use that

            var newParams = this.getWMSParams(jsonLayer, map, correspondingLayerEPSGCode);

            var wmsTempSource = new ol.source.TileWMS({
                url : jsonLayer.source.wms,
                params : newParams,
                tileLoadFunction: mapper.OpenLayers.imagePostFunction
            });

            var info_format = null;
            if (jsonLayer.hasOwnProperty('info_format')) {
                info_format = jsonLayer.info_format;
            } else {
                info_format = 'application/json';
                mapper.warn("INFO_FORMAT not defined for layer " + jsonLayer.name + " defaulting to application/json");
            }
            var featureInfoParams = {
                'INFO_FORMAT' : info_format
            };

            if (jsonLayer.hasOwnProperty('cqlFilter')) {
                var cqlFilter = [];
                for (var prop in jsonLayer.cqlFilter) {
                    if (jsonLayer.cqlFilter[prop] !== null && jsonLayer.cqlFilter[prop].length < 500) {
                        cqlFilter.push(jsonLayer.cqlFilter[prop]);
                    }
                }
                if (cqlFilter.length > 0) {
                    featureInfoParams['CQL_FILTER'] = cqlFilter.join(' AND ');
                }
            }

            var layerFeatureInfoURL = wmsTempSource.getGetFeatureInfoUrl(coordinate, viewResolution, correspondingLayerEPSGCode, featureInfoParams);
            return layerFeatureInfoURL;
        },

		getLayersFeatureInfo : function(coord, map, layersConfig, callbackInstance, callbackMethod) {
            var returnedCount = 0;
            var totalRequests = 0;

			//we dont have ol layer groups, so this will always be one real layer per ol layer
			var jsonLayer = null;

			var layers = mapper.layers.query(
				layersConfig,
				function(layer) {
					if (layer.type === 'layer'&& layer.mask === false && (layer.display === true || layer.loadOnly === true)) {
						return true;
					}
					return false;
				},
				['overlays', 'boundaries']
			);

			for (var i = 0, len = layers.length; i < len; i+=1) {
				const layer = layers[i];
				totalRequests += 1;

				var layerFeatureInfoURL = this.getGetFeatureInfoUrl(coord, map, layer);

				mapper.common.asyncAjax({
					type: 'GET',
					url: layerFeatureInfoURL,
					callbackObj: {
						jsonLayer: layer,
						totalRequests: totalRequests,
						returnedCount: returnedCount,
						callbackInstance: callbackInstance,
						callbackMethod: callbackMethod
					},
					callback: function(response, callbackObj) {
						var jsonLayer = callbackObj.jsonLayer;
						returnedCount += 1;
						var someJsonRawText = response.responseText;
						if (someJsonRawText.indexOf("LayerNotQueryable") == -1) {
							var featureInfoObj = JSON.parse(someJsonRawText);
							if (featureInfoObj.features.length > 0) {
								var feature = featureInfoObj.features[0];

								for (var featureKey in jsonLayer.featureInfo) {
									if (feature.properties.hasOwnProperty(featureKey)) {
										jsonLayer.featureInfo[featureKey].value = feature.properties[featureKey];
										var mapValues = jsonLayer.featureInfo[featureKey].mapValues;
										if (mapValues && mapValues.length > 0) {
											for (var i = 0, len = mapValues.length; i < len; i+=1) {
												if (mapValues[i].hasOwnProperty(feature.properties[featureKey])) {
													jsonLayer.featureInfo[featureKey].displayValue = mapValues[i][feature.properties[featureKey]];
												}
											}
										} else {
											jsonLayer.featureInfo[featureKey].displayValue = feature.properties[featureKey];
										}
									}
								}
							} else {
								for (var featureKey in jsonLayer.featureInfo) {
									jsonLayer.featureInfo[featureKey].value = null;
									jsonLayer.featureInfo[featureKey].displayValue = null;
								}
							}
						}

						if (returnedCount == totalRequests) {
							mapper.EventCenter.defaultEventCenter.postEvent(
								mapper.EventCenter.EventChoices.EVENT_LAYER_CONFIGURATION_FEATUREINFO_UPDATED,
								null,
								null);

							if (typeof(callbackMethod) === 'string') {
								callbackObj.callbackInstance[callbackObj.callbackMethod]();
							} else {
								callbackObj.callbackInstance();
							}
						}
					}
				});
			}
		},

		updateLayerConfigWithFeatureInfoForCoord : function (coord, openLayersMapObject, useLayerConfig) {
			//update owning mapwindow layerconfig
			//with getFeatureInfo
			//return it to mapwindow
			//mapwindow posts event with updated layerconfig

			var featureInfoDictByLayerID = mapper.OpenLayers.getAllLayerFeatureInfoForXYCoordWithMap(
					coord,
					openLayersMapObject,
					useLayerConfig);

			var jsonOverlays = useLayerConfig.overlays;
			var jsonBoundaries = useLayerConfig.boundaries;

			var newJsonOverlays = mapper.OpenLayers.applyFeatureInfoToFolderAndLayerArray(jsonOverlays, featureInfoDictByLayerID);

			var newJsonBoundaries = mapper.OpenLayers.applyFeatureInfoToFolderAndLayerArray(jsonBoundaries, featureInfoDictByLayerID);

			var updatedLayersConfig = useLayerConfig;

			updatedLayersConfig.boundaries = newJsonBoundaries;
			updatedLayersConfig.overlays = newJsonOverlays;

			return updatedLayersConfig;
		},
		getAllLayerFeatureInfoForXYCoordWithMap : function (coord, openLayersMapObject, useLayerConfig) {

			//-------------------------------------------------------------------

			var JSONLayersConfigObject = JSON.parse(JSON.stringify(useLayerConfig));

			var jsonOverlays = JSONLayersConfigObject.overlays;
			var jsonOverlayLayers = mapper.layers.query(jsonOverlays, {type: 'layer'});

			var jsonBoundaries = JSONLayersConfigObject.boundaries;
			var jsonBoundaryLayers = mapper.layers.query(jsonBoundaries, {type: 'layer'});

			var jsonLayersToGetFeatureInfoFor = new Array();

			for (var jsonLayerIndex in jsonOverlayLayers) {

				//meron said:
				//Raster
				//Display:true YesInfo
				//Display:false NoInfo
				//LoadOnly:true noDisplay/YesInfo
				//LoadOnly:false yesInfo
				//Vector
				//Display:true yesInfo
				//Display:false YesInfo
				//loadOnly:true noDisplay/YesInfo
				//loadOnly:false yesInfo
				//So  for raster:
				// loadOnly && display = throw exception
				// !loadOnly && display = show+!info
				// !loadOnly && !display = !show+!info
				// loadOnly && !display = !show+info
				//then for vector info always show info
				//then later on 9/29 he said:
				//Meron:  can you make sure that the list contain only the displayed once
				//ones
				//ignore loadonly

				var jsonLayer = jsonOverlayLayers[jsonLayerIndex];

				if (jsonLayer.hasOwnProperty("featureInfo") && (jsonLayer.display === true || jsonLayer.loadOnly === true)) {
					jsonLayersToGetFeatureInfoFor.push(jsonLayer);
				}

				if (jsonLayer.loadOnly && jsonLayer.display) {
					mapper.error("loadOnly and display are both true for a layer");
				}
			}

			for (jsonLayerIndex in jsonBoundaryLayers) {

				var jsonLayer = jsonBoundaryLayers[jsonLayerIndex];
				if (jsonLayer.hasOwnProperty("featureInfo") && (jsonLayer.display === true || jsonLayer.loadOnly === true))
				{

					jsonLayersToGetFeatureInfoFor.push(jsonLayer);
				}
			}

			var featureInfoDictByLayerID = new Array();

			for (index in jsonLayersToGetFeatureInfoFor) {
				var jsonLayer = jsonLayersToGetFeatureInfoFor[index];
				var jsonLayerIdentifier = jsonLayer.id;

				var featureInfoForLayer = mapper.OpenLayers.getFeatureInfoForLayerWithXYCoordAndMap(jsonLayer, coord, openLayersMapObject);

				if (featureInfoForLayer != null
				//&& featureInfoForLayer.emptyFeatures!=true
				) {
					featureInfoDictByLayerID[jsonLayerIdentifier] = featureInfoForLayer;
				}
			}

			return featureInfoDictByLayerID;
		},

		getFeatureInfoForLayerWithXYCoordAndMap : function (jsonLayer, coord, openLayersMapObject)
		{
			var featureInfo = null;

			var x;
			openLayersMapObject.getLayers().getArray().forEach(function (layer, i, arr)
			{
				var source = layer.getSource();


				if (typeof source.getParams === 'function')
				{
					//we dont have ol layer groups, so this will always be one real layer per ol layer
					var params = source.getParams();
					var layerName = params.LAYERS;

					if (layerName == jsonLayer.name)
					{
                        var layerFeatureInfoURL = this.getGetFeatureInfoUrl(coord, openLayersMapObject, jsonLayer)

						var someJsonRawText = mapper.common.ajax({
                            type: 'GET',
                            url: layerFeatureInfoURL
                        }).responseText;

						if (someJsonRawText.indexOf("LayerNotQueryable") == -1) {
							jsonFeatureObject = JSON.parse(someJsonRawText);
							jsonFeatureObject.name = layerName;
							jsonFeatureObject.title = jsonLayer.title;
							if (jsonLayer.hasOwnProperty('timeseries')) {
								jsonFeatureObject['timeseries'] = jsonLayer.timeseries;
							} else {
								jsonFeatureObject['timeseries'] = false;
							}

							if (jsonFeatureObject['features'].length == 0) {
								jsonFeatureObject['emptyFeatures'] = true;
							} else {
								jsonFeatureObject['emptyFeatures'] = false;
							}
							featureInfo = jsonFeatureObject;
						}
					}
				}
			}, this);

			return featureInfo;
		},
        getFeatureInfoForLayerWithXYCoordAndMapUsingPromises : function (jsonLayer, coord, openLayersMapObject, callbackFunction)
		{
			var featureInfo = null;

			var x;
			openLayersMapObject.getLayers().getArray().forEach(function (layer, i, arr)
			{
				var source = layer.getSource();


				if (typeof source.getParams === 'function')
				{
					//we dont have ol layer groups, so this will always be one real layer per ol layer
					var params = source.getParams();
					var layerName = params.LAYERS;

					if (layerName == jsonLayer.name)
					{
                        var layerFeatureInfoURL = this.getGetFeatureInfoUrl(coord, openLayersMapObject, jsonLayer)

                        var request = new Request(layerFeatureInfoURL, {
                            type: 'GET'
                        });
                        fetch(request).then(function(response) {
                            return response.json();
                        }).then(function(json) {
                            var someJsonRawText = JSON.stringify(json);
                            if (someJsonRawText.indexOf("LayerNotQueryable") == -1) {
                                //need to use the name as the key
                                //then add the id in the json
                                //going to add name here
                                //add it right after the opening brace
                                var jsonNameAddedText = someJsonRawText.slice(0, 1) + "\"name\":" + "\"" + layerName + "\"" + "," + someJsonRawText.slice(1);

                                var jsonTitleAddedText = jsonNameAddedText.slice(0, 1) + "\"title\":" + "\"" + jsonLayer.title + "\"" + "," + jsonNameAddedText.slice(1);

                                var jsonFeatureObject = JSON.parse(jsonTitleAddedText);

                                if (jsonLayer.hasOwnProperty('timeseries')) {
                                    jsonFeatureObject['timeseries'] = jsonLayer.timeseries;
                                } else {
                                    jsonFeatureObject['timeseries'] = false;
                                }

                                if (jsonFeatureObject['features'].length == 0) {
                                    jsonFeatureObject['emptyFeatures'] = true;
                                } else {
                                    jsonFeatureObject['emptyFeatures'] = false;
                                }

                                featureInfo = jsonFeatureObject;
                                callbackFunction(featureInfo);
                            }

                        });
                    }
                }

			}, this);
		},

		applyFeatureInfoToFolderAndLayerArray: function(jsonArray, featureInfoDictByLayerID) {
			//so you have to traverse the layersConfig.....
			//so use recursion here, make a function
			//applyFeatureInfoToFolderAndLayerArray
			//
			//if layer
			//return replacement with feature info applied
			//if folder
			//return replacement with feature info applied to layers

			var replacementArray = jsonArray;

			for (var index in jsonArray) {
				var layerOrFolder = jsonArray[index];

				if (layerOrFolder.type == "folder")
				{
					var replacementFolder = layerOrFolder;

					var replacementFolderContents = mapper.OpenLayers.applyFeatureInfoToFolderAndLayerArray(
							replacementFolder.folder, featureInfoDictByLayerID);

					replacementFolder.folder = replacementFolderContents;

					jsonArray[index] = replacementFolder;
				}
				else
				{

					var replacementLayer = layerOrFolder;

					//------------------

					//this is the part where you

					//0. check if the layer has featureInfo
					//1. see if layerID exists in featureInfo keys
					//2. parse the desired keys for layer
					//3. get values for desired keys
					//4. set layer feature info values for desired keys

					if (replacementLayer.hasOwnProperty("featureInfo")) {

						var presentLayerIDs = [];
						var layerIsPresentInFeatureInfoArray = false;
						var featuresForLayerIdentifier = null;

						for (var aLayerID in featureInfoDictByLayerID) {
							if (aLayerID == replacementLayer.id) {
								layerIsPresentInFeatureInfoArray = true;
								featuresForLayerIdentifier = featureInfoDictByLayerID[aLayerID];
							}
						}

						if (layerIsPresentInFeatureInfoArray)
						{
							for (var featureKey in replacementLayer.featureInfo)
							{

								if (featuresForLayerIdentifier.features.length > 0)
								{

									var replacementValue = featuresForLayerIdentifier.features[0].properties[featureKey];

									if (replacementValue == null) {
										var choosableKeys = "";

										for (var choosableKey in featuresForLayerIdentifier.features[0].properties)
										{
											choosableKeys += choosableKey + " ";
										}
									}


									//-------------------------------

									var replacementMappedValue = null;

									for (var mappingIndex in replacementLayer.featureInfo[featureKey].mapValues)
									{
										var mapValueObject = replacementLayer.featureInfo[featureKey].mapValues[mappingIndex];

										var keyName = Object.keys(mapValueObject)[0];//theres only one key per item

										var keyValue = mapValueObject[keyName];

										//cast to strings, because the mapping key+values are specified using strings
										if (keyName === (""+replacementValue))
										{
											replacementMappedValue = keyValue;
										}

									}

									if (replacementLayer.featureInfo[featureKey].mapValues.length == 0)
									{
										replacementMappedValue = replacementValue;
									}

									//-------------------------------

									replacementLayer.featureInfo[featureKey].value = replacementValue;
									replacementLayer.featureInfo[featureKey].displayValue = replacementMappedValue;
									replacementLayer.areFeaturesEmpty = false;

								}
								else
								{

									replacementLayer.featureInfo[featureKey].value = null;
									replacementLayer.featureInfo[featureKey].displayValue = null;
									replacementLayer.areFeaturesEmpty = true;

								}
							}
						}
					}
					jsonArray[index] = replacementLayer;
				}
			}

			return replacementArray;
		},
		drawCrossHair : function (coordinate) {
			var iconFeature = new ol.Feature({
			  geometry: new ol.geom.Point([coordinate[0], coordinate[1]]),
			  name: 'CroosHair',
			  population: 4000,
			  rainfall: 500
			});

			var iconStyle = new ol.style.Style({
			  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
				anchor: [0.5, 24],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				opacity: 1,
				src: 'images/crosshair.png'
			  }))
			});

			iconFeature.setStyle(iconStyle);

			var vectorSource = new ol.source.Vector({
			  features: [iconFeature]
			});

			var vectorLayer = new ol.layer.Vector({
			  source: vectorSource
			});

			vectorLayer.set("CustomLayerName", "CroosHair");

			return vectorLayer;
		},
		getCrosshairLayer : function (openLayersMapObject) {
			var layer = false;
			var allLayers = openLayersMapObject.getLayers().getArray();

			for (var l in allLayers) {
				var LayerName = allLayers[l].get("CustomLayerName");
				if (LayerName != undefined) {
					layer = allLayers[l];
					break;
				}

			}

			return layer;
		},
        getCqlFilterString: function(layer) {
            if (layer.hasOwnProperty('cqlFilter')) {
                var cql = [];
                var cqlFilterObj = layer.cqlFilter;
                for (var prop in cqlFilterObj) {
                    if (cqlFilterObj[prop] !== null) cql.push(cqlFilterObj[prop]);
                }
                if (cql.length > 0) {
                    return cql.join(' AND ');
                }
            }
            return null;
        },
        convertCoordProj: function(coords, startProj, endProj) {
            if (typeof(coords[0]) === 'number') {
                return proj4(startProj, endProj, coords);
            } else {
                var newCoords = [];
                for (var i = 0, len = coords.length; i < len; i+=1) {
                    newCoords.push(this.convertCoordProj(coords[i], startProj, endProj));
                }
                return newCoords;
            }
        },
		
		/**
		 * Since we can't reproject a resolution, we instead take the map's center coordinate 
		 * and extent, reproject them, then create a new ol.View from them to get the resolution.
		 */
        getMapResolutionInProjection: function(map, newProjection) {
            var view = map.getView();
            var mapProjection = view.getProjection().getCode();
            var center = view.getCenter();
            var zoom = view.getZoom();
            var extent = view.calculateExtent(map.getSize());
            var minxy = proj4(mapProjection, newProjection, [extent[0], extent[1]]);
            var maxxy = proj4(mapProjection, newProjection, [extent[2], extent[3]]);
            var newExtent = [minxy[0], minxy[1], maxxy[0], maxxy[1]];
            var tempView = new ol.View({
                center: proj4(mapProjection, newProjection, center),
                extent: newExtent,
                zoom: zoom,
                projection: newProjection
            });
            return tempView.getResolution();
        },
        /**
         * Takes a multidimensional array of coordinates and returns a string to use in a cql filter. Will convert coordinate projection if needed.
         *
         * @param coords - A multidimensional array of coordinates.
         * @param coordProj - The projection of the coordinates.
         * @param layerProj - The projection to convert to.
         */
        getCqlGeometry: function(coords, coordProj, layerProj) {
            var geomString = '';
            if (typeof(coords[0]) === 'number') {
                if (coordProj !== layerProj) {
                    var newCoords = proj4(coordProj, layerProj, coords);
                    geomString = newCoords[0] + ' ' + newCoords[1];
                } else {
                    geomString = coords[0] + ' ' + coords[1];
                }
            } else {
                var geomString = '(';
                var subGeoms = [];
                for (var i = 0, len = coords.length; i < len; i+=1) {
                    var coord = coords[i];
                    subGeoms.push(this.getCqlGeometry(coord, coordProj, layerProj));
                }
                geomString += subGeoms.join(',') + ')';
            }
            return geomString;
        },
        /**
         * Rounds a multidimensional array of coordinates.
         *
         * @param coords - a multidimensional array of coordinates.
         * @param decimalPlaces - The number of decimal places to round each coordinate.
         */
        roundCoordinates: function(coords, decimalPlaces) {
            if (typeof(coords) === 'number') {  // If a number was passed during recursion, round and return it.
                // Create a multiplier to use in the rounding. e.g. 3 decimal places equals 1000 for multiplier.
                var multiplier = 1;
                for (var i = 0; i < decimalPlaces; i+=1) {
                    multiplier *= 10;
                }
                return (Math.round(coords * multiplier) / multiplier);
            } else {  // Not a number then assumed to be array. Keep recursing.
                for (var i = 0, len = coords.length; i < len; i+=1) {
                    coords[i] = this.roundCoordinates(coords[i], decimalPlaces);
                }
                return coords;
            }
        },

        combineFeaturesByProperties: function(features, properties) {
            var newFeatures = [];
            var newFeaturesLookup = {};
            for (var i = 0, len = features.length; i < len; i+=1) {
                var feature = features[i];
                var combinedProperty = '';
                for (var j = 0, length = properties.length; j < length; j+=1) {
                    var property = properties[j];
                    if (feature.properties.hasOwnProperty(property)) {
                        combinedProperty += feature.properties[property];
                    }
                }

                if (!newFeaturesLookup.hasOwnProperty(combinedProperty)) {
                    newFeaturesLookup[combinedProperty] = [];
                }
                newFeaturesLookup[combinedProperty].push(feature);
            }

            for (var prop in newFeaturesLookup) {
                var obj = {};
                for (var i = 0, len = newFeaturesLookup[prop].length; i < len; i+=1) {
                    var newFeature = newFeaturesLookup[prop][i];
                    if (i === 0) {
                        obj = newFeature;
                    } else {
                        if (newFeature.geometry !== null && obj.geometry !== null) {
                            obj.geometry.coordinates = obj.geometry.coordinates.concat(newFeature.geometry.coordinates);
                        }
                        if (arguments.length > 2) {
                            for (var j = 2, length = arguments.length; j < length; j+=1) {
                                var argument = arguments[j];
                                if (obj.properties.hasOwnProperty(argument) && newFeature.properties.hasOwnProperty(argument)
                                    && typeof(obj.properties[argument]) === 'number' && typeof(newFeature.properties[argument]) === 'number') {
                                    obj.properties[argument] += newFeature.properties[argument];
                                }
                            }
                        }
                    }
                }
                newFeatures.push(obj);
            }
            return newFeatures;
        }
	},
	amcharts : {

		//-------------------------------------------------JOSHM
		//factor this out to somewhere appropriate
		configZ :
		{
			showByDefault: {
				amountSelected: 2,
				startSelectionAt: "latest",
				others: ["stm"]
			},
			savePeriodSelection: true,
			saveGraphSelection: true,
			colors: ["#9E413E", "#40699C", "#7F9A48", "#664E83", "#5AC7D2", "#CC7B38", "#9984B6", "#BE4B48", "#99BA55", "#DAB0AF", "#B6C4DB", "#F79646", "#40699C","#406900", "#000000"],
			standardDeviation: "false",
			graphBullets: "true",
			decimalDigits: 2,
			gradient : false,
			legend: "false",
			fillChart: "false",
			startInWindow: false
		},
		//-------------------------------------------------
		
		/**
		 * When boundaries are separated into different sub folders, Mike wants the 
		 * boundaries in the lowest folder in the TOC to be the ones we show charts for.
		 */
		getEnabledBoundaryFolder: function(layersConfig) {
			var hasFolder = false;
			for (var i =  layersConfig.length - 1; i >= 0; i-=1) {
				if (layersConfig[i].type === 'folder') {
					var isEnabled = this.getEnabledBoundaryFolder(layersConfig[i].folder);
					if (typeof(isEnabled) === 'string') return isEnabled;
					if (isEnabled) return layersConfig[i].id;
					if (typeof(isEnabled) === 'string') return isEnabled;
				}
			}
			
			for (var i =  layersConfig.length - 1; i >= 0; i-=1) {
				if (layersConfig[i].type === 'layer' && (layersConfig[i].display === true || layersConfig[i].loadOnly === true)) {
					return true;
				}
			}
			return false;
		},

		/**
		 * Gets an object that maps chart configs to overlays and boundaries that are currently displayed in the map.
		 */
        getChartMapping : function(layersConfig, coords, projection) {
            var chartConfigs = mapper.charts;
            var chartMapping = {};

            var overlays = mapper.layers.query(
                layersConfig.overlays,
                function(layer) {
                    if (layer.type === 'layer' && layer.mask === false && layer.hasOwnProperty('timeseries') && (layer.display === true || layer.loadOnly === true)) {
                        return true;
                    }
                    return false;
                }
            );

			var boundariesFolderId = this.getEnabledBoundaryFolder(layersConfig.boundaries);
			
            var boundaries = [];
			var boundariesFolder = mapper.layers.query(
				layersConfig.boundaries,
				{
					type: 'folder',
					id: boundariesFolderId
				}
			);
			if (boundariesFolder.length > 0) {
				items = boundariesFolder[0].folder;
				for (var i = 0, len = items.length; i < len; i+=1) {
					var item = items[i];
					if (item.type === 'layer' && item.mask === false && (item.display === true || item.loadOnly === true)) boundaries.push(item);
				}
			}

            for (var i = 0, len = overlays.length; i < len; i+=1) {
                var overlay = overlays[i];
                for (var j = boundaries.length - 1; j >= 0; j-=1) {
                    var boundary = boundaries[j];
                    for (var k = 0, chartConfigLength = chartConfigs.length; k < chartConfigLength; k+=1) {
                        var chartConfig = chartConfigs[k];
                        var overlayIndex = -1;

                        // Check overlays in chart config to find any with matching overlay id.
                        for (var ii = 0, overlayConfigLength = chartConfig.overlays.length; ii < overlayConfigLength; ii+=1) {
                            var configuredOverlay = chartConfig.overlays[ii];
                            if (overlay.id === configuredOverlay.for_layer_id) {
                                overlayIndex = ii;
                                break;
                            }
                        }

                        var boundaryIndex = chartConfig.boundaries.indexOf(boundary.id);
                        if (overlayIndex !== -1 && boundaryIndex !== -1) {
                            if (!chartMapping.hasOwnProperty(overlay.id)) {
                                chartMapping[overlay.id] = [];
                            }
                            var boundaryTitle = boundary.title;
                            var boundaryName = boundary.name;
                            var startMonth = null;
							var dataSources = [];
							var timeseriesSourceLayerIds = chartConfig.overlays[overlayIndex].timeseries_source_layer_ids;
                            if (chartConfig.hasOwnProperty('start_month')) startMonth = chartConfig.start_month;
                            // Use the boundary_labels property for the boundary title if present.
                            if (chartConfig.hasOwnProperty('boundary_labels') && chartConfig.boundary_labels.length > boundaryIndex) {
                                boundaryTitle = chartConfig.boundary_labels[boundaryIndex];
                            }
                            if (chartConfig.hasOwnProperty('geoengine_boundary_names') && chartConfig.geoengine_boundary_names.length > boundaryIndex) {
                                boundaryName = chartConfig.geoengine_boundary_names[boundaryIndex];
                            }

							for (var ii = 0, sourceLayersLength = timeseriesSourceLayerIds.length; ii < sourceLayersLength; ii+=1) {
								var id = timeseriesSourceLayerIds[ii];
								var layers = mapper.layers.query(
									layersConfig.overlays,
									{id: id}
								);
								if (layers.length > 0) {
									var layer = layers[0];
									dataSources.push({
										url: mapper.common.buildUrlParams(chartConfig.source.url, {
											boundary: boundary,
											overlay: layer,
											boundaryName: boundaryName,
											coords: coords,
											projection: projection
										}),
										callbackType: chartConfig.source.type,
										overlayId: layer.id
									});
								}
							}

                            chartMapping[overlay.id].push({
                                overlay: chartConfig.overlays[overlayIndex],
								timeseriesSourceLayerIds: timeseriesSourceLayerIds,
                                overlayId: overlay.id,
                                overlayTitle: overlay.title,
                                boundaryId: boundary.id,
                                boundaryTitle: boundaryTitle,
								dataSources: dataSources,
                                chart_types: JSON.parse(JSON.stringify(chartConfig.chart_types)),
                                boundaryName: boundaryName,
                                startMonth: startMonth,
                                unit: overlay.unit,
                                yAxisLabel: overlay.additionalattributes.chart_yaxis_label,
                                chartTitle: (overlay.additionalattributes.hasOwnProperty('chart_title')) ? overlay.additionalattributes.chart_title : overlay.additionalattributes.chart_yaxis_label,
                                period: overlay.timeseries.type,
								staticSeasonNames: chartConfig.source.static_season_names,
                                id: mapper.common.getRandomString(32, 36)
                            });
                        }
                    }
                }
            }

            return chartMapping;
        },

        getChartAttributes : function(chartItem, overlay, boundary, coords) {
			mapper.amcharts.setCurrentDate();
            return custom.remoteResource.getChartAttributes(chartItem, overlay, boundary, coords);
        },

		getLayerConfiguration : function (layers, results, title, status) {

			if(typeof status === 'undefined'){
				status = false;
			};

            if (typeof(results) === 'undefined') results = [];

			for (var o in layers) {
				var layer = layers[o];
				if (layer.type == "folder") {

					if(status != false) {
                        newTitle = title + " " + layer.title;
					} else {
						var newTitle = "";
						status = true;
					}

					layer = this.getLayerConfiguration(layer.folder, results, newTitle, status);
				} else if (layer.type == "layer") {

					if (layer.display == true || layer.loadOnly === true) {
						var finalTitle = title + " " + layer.title;
                        results.push({
                            layer: layer,
                            title: finalTitle.trim()
                        });
					}
				}
				status = true;
			}

            return results;
		},

		getBoundaryConfiguration : function (boundaries, results) {
            if (typeof(results) === 'undefined') results = [];

			for (var o = 0, len = boundaries.length; o < len; o+=1) {
				var layer = boundaries[o];
				if (layer.type == "folder") {
					this.getBoundaryConfiguration(layer.folder, results);
				} else if (layer.type == "layer") {
                    results.push(layer);
				}
			}

            return results;
		},

		setCurrentDate : function () {
			mapper.amcharts.currentDate = new Date();
			mapper.amcharts.currentYear = mapper.amcharts.currentDate.getFullYear();
		},

		/**
		 * Get the seasons to display by default in the chart. 
		 * the default season can be overridden in the template.json except for means which are always shown.
		 */
		getDefaultSelectedYears : function(startMonth, years, staticSeasonNames, configOverride) {
            var defaultConfig = mapper.amcharts.configZ.showByDefault;
			var amountSelected = defaultConfig.amountSelected;
			var others = defaultConfig.others;
			var startSelectionAt = defaultConfig.startSelectionAt;

			if (typeof(configOverride) !== 'undefined') {
				if (configOverride.hasOwnProperty('amountSelected')) {
					amountSelected = configOverride.amountSelected;
				}
				if (configOverride.hasOwnProperty('others')) {
					others = configOverride.others;
				}
				if (configOverride.hasOwnProperty('startSelectionAt')) {
					startSelectionAt = configOverride.startSelectionAt;
				}
			}

            defaultSelection = [];

            // Split up years by years and strings (such as 'Mean')
            var yearValues = [];
            var additionalValues = [];
            for (var i = 0; i < years.length; i+=1) {
                var year = years[i];
                if (/[a-zA-Z]/.test(year)) {
                    additionalValues.push(year);
                } else {
                    yearValues.push(parseInt(year));
                }
            }

            if (startSelectionAt === 'latest') {
                yearValues.sort(function(a,b){return b - a;});
            } else if (startSelectionAt === 'earliest') {
                yearValues.sort();
            }

            var selectCount = (typeof(amountSelected) === 'number') ? amountSelected : 0;
            if (selectCount > yearValues.length) selectCount = yearValues.length;

            for (var i = 0; i < selectCount; i++) {
                defaultSelection.push(yearValues[i]);
            }

			var crossYears = [];
			if(startMonth >= 6) {
				for(var yr in defaultSelection) {
					if(isNaN(defaultSelection[yr])) {
						crossYears.push(defaultSelection[yr]);
					} else {
						tempYear = defaultSelection[yr] + 1;
						finalYear = defaultSelection[yr] + "-" + tempYear;
						crossYears.push(finalYear);
					}
				}
				defaultSelection = crossYears;
			}

            for (var i = 0; i < additionalValues.length; i++) {
                if (others.indexOf(additionalValues[i]) !== -1)
                    defaultSelection.push(additionalValues[i]);
            }

			if (staticSeasonNames) {
				for (var i = 0; i < staticSeasonNames.length; i++) {
					defaultSelection.push(staticSeasonNames[i]);
				}
			}

			return defaultSelection;
		},

		getShortTitle :  function (tabTitle) {

			if(tabTitle.length > 15)
			{
				tabTitle = tabTitle.substring(0, 14);
				tabTitle = tabTitle + "...";
			}
			return tabTitle;

		},

		getChartColors : function (options) {
			var chartColors = {};
			var configUrlColors = mapper.amcharts.configZ.colors;
			totalYears = options.fullSeasons;
			var yearsLength = options.fullSeasons.length;

			if (yearsLength > configUrlColors.length) {
				yearsLength -= configUrlColors.length;
				while (yearsLength > 0) {
					var hexColor = '#' + '0123456789abcdef'.split('').map(function (v, i, a) {
							return i > 5 ? null : a[Math.floor(Math.random() * 16)]
						}).join('');
					configUrlColors.push(hexColor);
					yearsLength--;
				}
			}

			for (var w = 0; w < options.fullSeasons.length; w++) {
				chartColors[totalYears[w]] = configUrlColors[w];
			}

			return chartColors;
		},

		/**
		 * For the new means, parse the mean name to get a more readable name for display.
		 */
		getSeasonDisplayName: function(season) {
			season = season.toString();
			if (season.indexOf('_') !== -1) {
				var parts = season.split('_');
				var type = parts[0].split('');
				type[0] = type[0].toUpperCase();
				season = type.join('')+' ('+parts[1]+')';
			}
			return season;
		},

        getChartItem : function (chartId) {
			for (mc in mapper.charts) {
				if (mapper.charts[mc].id == chartId) {
					return mapper.charts[mc];
				}
			}
		},

		/**
		 * Handles the manipulation and transformation of data for use in an AmChart.
		 *
		 * NOTE: This object is still under heavy development.
		 *
		 * @param object data The raw data this object will manipulate.
		 *   Must be in the form of:
		 *     {
		 * 	     [property]: [
		 *         {
		 * 	         x:1,
		 *           y:?,
		 *         },
		 *         {
		 * 	         x:2,
		 *           y:?,
		 *         },
		 *         ...
		 *       ]
		 *       ...
		 *     }
		 *
		 * @param function normalizer If the data is not in the above format, pass a function that will convert it.
		 */
		DataHandler : function (data, options, periodMultiplier, normalizer) {
			// Original, unaltered data

			this.originalData = {};

			// Data that is to be manipulated
			this.data = null;

			/**
			 * Gets the number of top level properties.
			 */
			this.length = function () {
				var properties = getSortedObjPropsAsc(this.data);
				return properties.length;
			}

			// Called at the end of a chain to return the manipulated data in object format
			this.getData = function () {
				var returnData = this.getDataCopy();
				this.data = null;
				return returnData;
			}

			// Called at the end of a chain to return the manipulated data in array format
			this.getArray = function () {
				var array = this.getArrayCopy();
				this.data = null;
				return array;
			}

			/**
			 * Retrieves a copy of the raw data manipulated to this point without destroying the manipulated data.
			 * This allows you to continue the chain.
			 */
			this.getDataCopy = function () {
				var data = this.getDataVar();
				return JSON.parse(JSON.stringify(data));
			}

			/**
			 * Retrieves a copy of the data manipulated in array format to this point without destroying the manipulated data.
			 * This allows you to continue the chain.
			 */
			this.getArrayCopy = function () {
				var data = this.getDataVar();
				var array = [];
				var properties = this.getSortedObjPropsAsc(data);

				for (var i = 0, len = properties.length; i < len; i+=1) {
					array.push(data[properties[i]]);
				}

				return array;
			}

			this.removeStaticProperties = function() {
				var data = this.getDataVar();
				var newData = {};
				for (var season in data) {
					if (!/[a-zA-Z]/.test(season)) {
						newData[season] = data[season];
					}
				}

				this.data = newData;
				return this;
			}

			this.getLatestPeriod = function() {
				var latestSeason = 0;
				var data = this.data === null ? this.originalData : this.data;
				for (var season in data) {
					if (!isNaN(parseInt(season)) && parseInt(season) > latestSeason && data[season].length > 0) {
						latestSeason = season;
					}
				}

				if (latestSeason !== 0) {
					return data[latestSeason.toString()][data[latestSeason.toString()].length - 1];
				}
				return null;
			}

            this.getStatistics = function() {
                var data = this.getDataVar(),
                min = [],
                max = [],
                totals = [],
                average = [],
                xValues = [];

                for (var prop in data) {
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        var x = parseInt(data[prop][i].x);
                        if (xValues.indexOf(x) === -1) xValues.push(x);
                    }
                }

                xValues.sort(function(a,b) {
                    if (a > b) return 1;
                    if (a < b) return -1;
                    return 0;
                });

                var minx = xValues[0], maxx = xValues[xValues.length-1];
                for (var x = minx; x <= maxx; x+=1) {
                    min.push({
                        x: x+'',
                        y: null
                    });
                    max.push({
                        x: x+'',
                        y: 0
                    });
                    totals.push({
                        x: x+'',
                        y: 0,
                        count: 0
                    });
                }

                for (var prop in data) {
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        var x = data[prop][i].x,
                        y = data[prop][i].y;
                        for (var xIndex = 0, length = min.length; xIndex < length; xIndex+=1) {
                            if (min[xIndex].x === x) {
                                if (min[xIndex].y === null || y < min[xIndex].y) min[xIndex].y = y;
                                if (y > max[xIndex].y) max[xIndex].y = y;
                                totals[xIndex].y += y;
                                totals[xIndex].count += 1;
                                break;
                            }
                        }
                    }
                }

                for (var i = 0, len = totals.length; i < len; i+=1) {
                    average.push({
                        x: totals[i].x,
                        y: totals[i].y / totals[i].count
                    });
                }

                this.data.min = min;
                this.data.max = max;
                this.data.average = average;
                return this;
            }

            this.convertCrossYears = function(startMonth, periodType) {
                if (startMonth === 1) return this;
                var data = this.getDataVar();
                var newData = {};
                var seasonsList = [];

                for (var prop in data) {
                    if (!isNaN(parseInt(prop))) seasonsList.push(parseInt(prop));
                }
                seasonsList.sort(function(a,b) {
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                });

                for (var prop in data) {
                    var splitPeriod = custom.periodicity.getPeriodOfYearFromMonth(periodType, startMonth, prop);
                    var periodsPerYear = custom.periodicity.getPeriodsPerYear(periodType, prop);
                    var offset = periodsPerYear - splitPeriod;
                    var season = data[prop];
                    for (var i = 0, len = season.length; i < len; i+=1) {
                        var value = season[i];
                        if (parseInt(value.x) <= splitPeriod) {
                            var newProp = '';
                            if (!isNaN(parseInt(prop))) {
                                newProp = (parseInt(prop) - 1) + '-' + prop;
                            } else {
                                newProp = prop;
                            }

                            if (!newData.hasOwnProperty(newProp)) {
                                newData[newProp] = [];
                            }

                            newData[newProp].push({
                                x: (parseInt(value.x)+offset)+'',
                                y: value.y
                            });
                        } else if (parseInt(value.x) > splitPeriod) {
                            var newProp = '';
                            if (!isNaN(parseInt(prop))) {
                                //if (parseInt(prop) === seasonsList[0]) continue;
                                newProp = prop + '-' + (parseInt(prop) + 1);
                            } else {
                                newProp = prop;
                            }

                            if (!newData.hasOwnProperty(newProp)) {
                                newData[newProp] = [];
                            }

                            newData[newProp].push({
                                x: (parseInt(value.x)-splitPeriod)+'',
                                y: value.y
                            });
                        }
                    }
                }

                for (var prop in newData) {
                    newData[prop].sort(function(a,b) {
                        if (parseInt(a.x) < parseInt(b.x)) return -1;
                        if (parseInt(a.x) > parseInt(b.x)) return 1;
                        return 0;
                    });
                }

                this.data = newData;
                return this;
            }

            this.getAverage = function(isEnd) {
                var data = this.getDataVar();
                var average = 0;
                var count = 0;

                for (var prop in data) {
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        average += data[prop][i].y;
                        count+=1;
                    }
                }

                if (isEnd) delete this.data;
                return average / count;
            }

            this.getTotal = function(isEnd) {
                var data = this.getDataVar();
                var total = 0;

                for (var prop in data) {
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        total += data[prop][i].y;
                    }
                }

                if (isEnd) delete this.data;
                return total;
            }

			// Called at the beginning of each function so we don't alter the original data. If this.data is null, create a copy of this.originalData.
			this.getDataVar = function () {
				if (this.data == null)
					this.data = JSON.parse(JSON.stringify(this.originalData));
				return this.data;
			}

            /**
             * Appends new top level properties to this data handler if the property does not already exist.
             */
            this.append = function(newData) {
                var data = this.getDataVar();
                var properties = this.getSortedObjPropsAsc(newData);

                for (var i = 0, len = properties.length; i < len; i+=1) {
                    if (data[properties[i]]) {
                        mapper.info('property '+properties[i]+' already exists in this data handler. If you wish to overwrite, use overwrite('+properties[i]+') instead.');
                    } else {
                        data[properties[i]] = newData[properties[i]];
                    }
                }
            }

            /**
             * Overwrites top level properties if it exists, otherwise, appends it.
             */
            this.overwrite = function(newData) {
                var data = this.getDataVar();
                var properties = this.getSortedObjPropsAsc(newData);

                for (var i = 0, len = properties.length; i < len; i+=1) {
                    data[properties[i]] = newData[properties[i]];
                }
            }

            this.mergeDatasets = function(datasets) {
                var results = {};
                for (var i = 0, len = datasets.length; i < len; i+=1) {
                    for (var prop in datasets[i]) {
                        results[prop] = datasets[i][prop];
                    }
                }

                this.data = results;
                return this;
            }

            /**
             * Merges another set of data into this data as another y value.
             */
            this.merge = function(dataSets) {
                var data = this.getDataVar();
                var result = {};

                for (var data in dataSets) {
                    for (var prop in dataSets[data]) {
                        result[data] = dataSets[data][prop];
                    }
                }

                this.data = result;
                return this;
            }

            /**
             * Merges AmCharts formatted data into a single set of data.
             */
            this.mergeChartData = function(data) {
                var result = [];
                for (var prop in data) {
                    var index = 0;
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        if (!result[index]) result[index] = {};
                        for (var y in data[prop][i]) {
                            result[index][y] = data[prop][i][y];
                        }
                        index++;
                    }
                }

                return result;
            }

            this.splitProperty = function(property, splitXValue, newPropName) {
                var data = this.getDataVar();
                var result = {};

                for (var prop in data) {  // Loop through top level properties
                    result[prop] = [];
                    if (prop == property) {  // Property is to be split
                        result[newPropName] = [];
                        for (var i = 0, len = data[prop].length; i < len; i+=1) {  // Loop through property to split
                            var obj = {};
                            for (var value in data[prop][i]) {  // Retrieve properties of object in array (x, y)
                                obj[value] = data[prop][i][value];
                            }

                            if (i >= splitXValue) {  // New property gets data
                                result[newPropName].push(obj);
                            } else {  // Old property keeps data
                                result[prop].push(obj);
                            }
                        }
                    }
                    else {  // Property is to remain the same
                        result[prop] = data[prop];
                    }
                }

                this.data = result;
                return this;
            }

            /**
             * Changes the y property name to the specified name.
             *
             * Useful for specifying specific value fields in an AmGraph
             */
            this.setYName = function(name) {
                var data = this.getDataVar();
                var result = {};

                for (var prop in data) {
                    result[prop] = [];
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        result[prop][i] = {};
                        result[prop][i].x = data[prop][i].x;
                        result[prop][i][name] = data[prop][i].y;
                    }
                }

                this.data = result;
                return this;
            }

			/**
			 * Gets the current period of the current year when working with time series data.
			 */
			this.getCurrentPeriod = function () {
				return this.originalData[this.currentYear].length - 1;
			}

            /**
             * Removes a top level property and all nested values.
             */
            this.removeProperty = function(propName) {
                var data = this.getDataVar();
                var result = {};

                for (var prop in data) {
                    if (prop != propName) result[prop] = data[prop];
                }

                this.data = result;
                return this;
            }

            /**
             * Discards all top level properties except the specified property.
             */
            this.getSingleProperty = function(propName) {
                var data = this.getDataVar();
                var result = {};

                result[propName] = data[propName];

                this.data = result;
                return this;
            }

            /**
             * Take a series of objects with xy data (e.g. [x:1, y:5], [x:1, y:10]) and convert it into [x:1, y1:5, y2:10]
             */
            this.formatMultipleYAxis = function() {
                var data = this.getDataVar();
                var result = {};
                var properties = this.getSortedObjPropsAsc(data);

                for (var j = 0, len = properties.length; j < len; j+=1) {
                    var prop = properties[j];
                    for (var i = 0, length = data[prop].length; i < length; i+=1) {
                        var index = data[prop][i].x;
                        if (!result[index]) {
                            result[index] = {
                                x: index,
                            };
                        }

                        for (var k in data[prop][i]) {
                            if (k !== 'x' && k !== 'y') result[index][k] = data[prop][i][k];
                        }

                        result[index][prop] = data[prop][i].y;
                    }
                }

                this.data = result;
                return this;
            }

            /**
             * Formats the data by the top level properties
             */
            this.formatByTopLvlProperty = function () {
                var data = this.getDataVar();
                var properties = this.getSortedObjPropsAsc(data);
                var yearsTotals = [];
                var x = 0;

                for (var property = 0, len = properties.length; property < len; property+=1) {
                    var prop = properties[property];
                    var obj = {};
                    var total = 0;
                    x++
                    obj.x = x;

                    for (var i = 0, length = data[prop].length; i < length; i+=1) {
                        if (!obj.y) obj.y = 0;
                        obj.y += data[prop][i].y;
                    }

                    yearsTotals.push(obj);
                }

                this.data = {totals: yearsTotals};
                return this;
            }

			/**
			 * Rounds all the chart data y values.
			 *
			 * @param int decimalPlaces (default: 2) The number of decimal places to round.
			 */

			this.roundChartData = function (decimalPlaces) {
				if (!decimalPlaces)
					decimalPlaces = 2;

				var data = this.getDataVar();
				for (var prop in data) {
					for (var i = 0, len = data[prop].length; i < len; i+=1) {
						for (var y in data[prop][i]) {
							if (y == 'x') continue;
							data[prop][i][y] = this.fixedDecimal(data[prop][i][y], decimalPlaces);
						}
					}
				}

				return this;
			}
			this.fixedDecimal = function (decimalNumber, decimalPlaces) {
				var leftdecimalpart = decimalNumber.toString().split(".")[0];
				var rightdecimalpart = decimalNumber.toString().split(".")[1];

				if (rightdecimalpart != undefined) {
					var rightdecimalpartlength = rightdecimalpart.length;
				} else {
					var rightdecimalpartlength = 0;
				}

				if (rightdecimalpartlength > decimalPlaces) {
					var lengthdifference = rightdecimalpartlength - decimalPlaces;
					rightdecimalpart = rightdecimalpart.slice(0,  - (lengthdifference));
				}

				decimalNumber = parseFloat(leftdecimalpart + "." + rightdecimalpart);

				return decimalNumber;
			}

			/**
			 * Truncates the data for each high level property by the x values.
			 *
			 * @param object period The [start] and [end] x values to truncate to.
			 */
			this.truncateData = function (period) {
				var data = this.getDataVar();
				var result = {};

				for (var prop in data) {
					result[prop] = [];

					for (var i = 0, len = data[prop].length; i < len; i+=1) {
						if ((!period.hasOwnProperty('start') || data[prop][i].x - 1 >= period.start) && (!period.hasOwnProperty('end') || data[prop][i].x - 1 <= period.end)) {
							result[prop].push(data[prop][i]);
						}
					}
				}

				this.data = result;

				return this;
			}

            /**
             * Truncates the data up to a specific x value.
             *
             * @param int period
             */
            this.truncateToPeriod = function (period) {
                var data = this.getDataVar();
                var result = {};

                for (var prop in data) {
                    result[prop] = [];
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        if (data[prop][i].x <= period) {
                            result[prop].push(data[prop][i]);
                        }
                    }
                }

                this.data = result;
                return this;
            }

			this.filterByPeriod = function(periods) {
			    var data = this.getDataVar();
                var result = {};

                for (var prop in data) {
                    result[prop] = [];

                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        if (periods.indexOf(parseInt(data[prop][i].x)) != -1) {
                            result[prop].push(data[prop][i]);
                        }
                    }
                }

                this.data = result;
                return this;
			}

            /**
             * Adds a strait line to the data.
             *
             * @param object value An object with a single property. The name of the property and the value will be injected as y values.
             */
            this.addLine = function(value) {
                var data = this.getDataVar();
                var lineName = '';
                var lineValue = 0;

                for (var prop in value) {
                    lineName = prop;
                    lineValue = value[prop];
                }

                for (var prop in data) {
                    if (typeof(data[prop]) == 'array') {
                        for (var i = 0, len = data[prop].length; i < len; i+=1) {
                            data[prop][i][lineName] = lineValue;
                        }
                    }
                    else if (typeof(data[prop]) == 'object') {
                        data[prop][lineName] = lineValue;
                    }
                }

                return this;
            }

            /**
             * Gets the total of all y values for each top level property.
             */
            this.formatAsTotals = function () {
                var data = this.getDataVar();
                var result = {};
                var properties = this.getSortedObjPropsAsc(data);

                for (var j = 0, len = properties.length; j < len; j+=1) {
                    var prop = properties[j];
                    var total = 0;
                    for (var i = 0, length = data[prop].length; i < length; i+=1) {
                        total += data[prop][i].y;
                    }
                    result[prop] = [{x: j, y: total}];
                }

                this.data = result;
                return this;
            }

            /**
             * Gets the total of the y values for a specific top level property and transforms it into a strait line.
             * Useful for displaying the average across a bar graph.
             *
             * @param string property
             */
            this.transformPropertyToLine = function (property) {
                var data = this.getDataVar();
                var result = {};
                var mean = 0;

                if (isNaN(data[property])) {
                    var count = 0;
                    for (var i = 0, len = data[property].length; i < len; i+=1) {
                        count++;
                        mean += data[property][i].y;
                    }
                    mean = math.divide(mean, count);
                } else {
                    mean = data[property];
                }

                for (var prop in data) {
                    if (prop == property) continue;

                    result[prop] = [];

                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        result[prop][i] = data[prop][i];
                        result[prop][i][property] = mean;
                    }
                }

                this.data = result;
                return this;
            }

            /**
             * Retrieves the average of the totals for all top level properties and injects it as a new top level property.
             */
            this.getAverageYValues = function() {
                var data = this.getDataVar();
                var averages = [];
                var count = 0;
                var total = 0;
                var average = 0;

                for (var prop in data) {
                    count++;
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        for (var y in data[prop][i]) {
                            if (y == 'x') continue;
                            total += data[prop][i][y];
                        }
                    }
                }

                average = math.divide(total, count);
                var x = 0;

                for (var prop in data) {
                    x+=1;
                    averages.push({x: x, y: average})
                }

                this.data = {averages: averages};
                return this;
            }

            this.getAverage = function(name) {
                var data = this.getDataVar();
                var averages = [];
                var count = [];

                for (var prop in data) {
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        if (!count[i]) count[i] = 0;
                        count[i]+=1;
                        if (!averages[i]) averages[i] = {x: data[prop][i].x, y: 0};
                        averages[i].y += parseInt(data[prop][i].y);
                    }
                }

                for (var i = 0, len = averages.length; i < len; i+=1) {
                    averages[i].y /= count[i];
                }

                this.data[name] = averages;
                return this;
            }

            /**
             * Gets the total of the values for the data and transforms it into a strait line.
             * Useful for displaying the average across a bar graph.
             *
             * @param string property
             */
            this.transformToLine = function () {
                var data = this.getDataVar();
                var mean = 0;
                var total = 0;
                var count = 0;

                for (var prop in data) {
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        for (var y in data[prop][i]) {
                            if (y == 'x') continue;
                            count+=1;
                            total += data[prop][i][y];
                        }
                    }

                }

                mean = math.divide(total, count);

                for (var prop in data) {
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        for (var y in data[prop][i]) {
                            if (y == 'x') continue;
                            data[prop][i][y] = mean;
                        }
                    }
                }

                return this;
            }

			/**
			 * Truncates the data by the top level properties.
			 *
			 * @param string|array properties A comma seperated string or an array of the properties to keep.
			 */
			this.truncateDataByProperty = function (properties) {
				var data = this.getDataVar();
				var result = {};
				var propArray = [];

				if (properties[0]) {
					propArray = properties;
				} else if (typeof(properies) == 'string') {
					propArray = properties.split(',');
				} else {
					propArray = [];
				}

				for (var i = 0, len = propArray.length; i < len; i+=1) {
					var prop = propArray[i];
					if (data[prop])
						result[prop] = data[prop];
				}

				this.data = result;
				return this;
			}

			/**
             * Transforms the data into cumulative data.
             *
             * Each y value becomes the sum of itself plus all previous y values for each top level property.
             */
            this.cumulate = function() {
                var data = this.getDataVar();
                var results = {};

                for (var prop in data) {
                    results[prop] = [];
                    var total = 0;

                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        total += data[prop][i].y;
                        var obj = {
                            y: total,
                            x: data[prop][i].x,
                        }

                        for (var k in data[prop][i]) {
                            if (k != 'y' && k != 'x') {
                                obj[k] = data[prop][i][k];
                            }
                        }
                        results[prop].push(obj);
                    }
                }

                this.data = results;
                return this;
            }

            this.joinProperties = function() {
                var data = this.getDataVar();
                var result = {data: []};
                var x = 1;

                for (var prop in data) {
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        var obj = {
                            y: data[prop][i].y,
                            x: x,
                            name: prop,
                        };
                        result.data.push(obj);
                        x+=1;
                    }
                }

                this.data = result;
                return this;
            }

            this.formatByXValues = function(xValues) {
                var data = this.getDataVar();
                var result = {};

                for (var prop in data) {
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        var x = data[prop][i].x + '';

                        if (!result[x]) result[x] = [];
                        result[x].push({
                            y: data[prop][i].y,
                            x: data[prop][i].x,
                            name: prop,
                        });
                    }
                }

                this.data = result;
                return this;
            }

			/**
			 * Calculates +1 standard deviation and -1 standard deviation for each x value and sets them as top level properties.
			 */
			this.getStandardDeviation = function () {
				var data = this.getDataVar();
				var yValues = {};
				values = [];
				var total_y = 0;
				for (var prop in data) {
					for (var i = 0, len = data[prop].length; i < len; i+=1) {
						if (!yValues[data[prop][i].x]) {
							yValues[data[prop][i].x] = {
								total : 0,
								count : 0,
								values : [],
							};
						}

						values.push(data[prop][i].y);
						total_y += data[prop][i].y;
						yValues[data[prop][i].x].values.push(data[prop][i].y);
						yValues[data[prop][i].x].total += data[prop][i].y;
						yValues[data[prop][i].x].count++;
					}
				}

				var mean_sd = total_y / values.length;

				var total_variance = 0;

				for (var o = 0, len = values.length; o < len; o+=1) {
					total_variance += (values[o] * values[o]);
				}

				var variance_sd = total_variance / values.length;

				if (mapper.chartsConfig.standarddeviation != "false") {
					for (var prop in yValues) {

						data.plus1SD.push({
							y : math.round((math.divide(yValues[prop].total, yValues[prop].count) + math.std(values)), 2),
							x : prop,
						});
						data.minus1SD.push({
							y : math.round((math.divide(yValues[prop].total, yValues[prop].count) - math.std(values)), 2),
							x : prop,
						});

						data.plus1SD.push({
							y : this.fixedDecimal(((yValues[prop].total / yValues[prop].count) + math.std(values)), 2),
							x : prop,
						});
						data.minus1SD.push({
							y : this.fixedDecimal(((yValues[prop].total / yValues[prop].count) - math.std(values)), 2),
							x : prop,
						});
					}
				}

				return this;
			}

			/**
			 * Gets an objects properies and sorts them in descending order.
			 *
			 * @param object obj
			 */
			this.getSortedObjPropsDesc = function (obj, sortFunction) {
				var properties = [];
				var stringProperties = [];
				var isNumeric = true;

				// If the property looks like '2013-2014', then parseInt(prop) will return everything before the dash
				// so that isNaN() will return false. isNaN() will return true without parseInt so we can sort as a string.
				// However, if property looks like '2013', sorting as a string wont work but isNaN will return false. Then we can sort as a number.
				for (var prop in obj) {
					if (isNaN(parseInt(prop))) {  // If property is a string, such as 'stm', parseInt(prop) returns NaN.
						stringProperties.push(prop);
					} else {
						if (isNaN(prop))
							isNumeric = false;
						properties.push(prop);
					}
				}

				if (isNumeric) {
					properties.sort(function (a, b) {
						return b - a
					});
				} else {
					properties.sort(function (a, b) {
						if (a > b)
							return -1;
						if (a < b)
							return 1;
						return 0;
					});
				}

				stringProperties.sort(function (a, b) {
					if (a > b)
						return -1;
					if (a < b)
						return 1;
					return 0;
				});

				return properties.concat(stringProperties);
			}

			/**
			 * Gets an objects properies and sorts them in ascending order.
			 *
			 * @param object obj
			 */
			this.getSortedObjPropsAsc = function (obj) {
				var properties = [];
				var stringProperties = [];
				var isNumeric = true;

				// If the property looks like '2013-2014', then parseInt(prop) will return everything before the dash
				// so that isNaN() will return false. isNaN() will return true without parseInt so we can sort as a string.
				// However, if property looks like '2013', sorting as a string wont work but isNaN will return false. Then we can sort as a number.
				for (var prop in obj) {
					if (isNaN(parseInt(prop))) {
						stringProperties.push(prop);
					} else {
						if (isNaN(prop))
							isNumeric = false;
						properties.push(prop);
					}
				}

				if (isNumeric) {
					properties.sort(function (a, b) {
						return a - b
					});
				} else {
					properties.sort();
				}

				stringProperties.sort();

				return properties.concat(stringProperties);
			}

			/**
			 * Gets this data's top level properties in ascending order.
			 */
			this.getTopLvlPropsAsc = function () {
				return this.getSortedObjPropsAsc(this.originalData);
			}

			/**
			 * Gets this data's top level properties in descending order.
			 */
			this.getTopLvlPropsDesc = function () {
				return this.getSortedObjPropsDesc(this.originalData);
			}

			this.setPeriodMultiplier = function (periodMultiplier) {
				this.periodMultiplier = periodMultiplier;
			}

			this.convertNotation = function(sciNumber){
				var data = String(sciNumber).split(/[eE]/);
				if (data.length == 1) return data[0];

				var zeros = '';
				var sign = sciNumber<0? '-':'';
				var str = data[0].replace('.', '');
				var mag = Number(data[1])+ 1;

				if (mag < 0) {
					zeros = sign + '0.';
					while(mag++) zeros += '0';
					return zeros + str.replace(/^\-/,'');
				}

				mag -= str.length;

				while(mag--) zeros += '0';

				return str + zeros;
			}

			this.convertScientificNotations =  function () {
				for (var year in data) {
					var yearData = data[year];
					for (var d in yearData) {
						yearData[d].y = parseFloat(this.convertNotation(yearData[d].y));
					}
				}
			}

			this.periodMultiplier = periodMultiplier || 1;
			this.convertScientificNotations();
			this.originalData = normalizer != undefined ? normalizer(data) : data;
			var topLvlProps = this.getTopLvlPropsDesc();

			for (var i = 0; i < topLvlProps.length; i++) {
				if (!isNaN(parseInt(topLvlProps[i]))) {
					this.currentYear = topLvlProps[i];
					break;
				}
			}

			custom.amcharts.data.setDataHandlerMethods(this, options);
		}, // end DataHandler()
		
		/**
		 * This object wraps one or more charts and provides convenient methods for building or updating charts.
		 */
		ChartHandler : function (chartData) {


			/**
			 * This object wraps a single chart. It takes an instance of a chart builder and a chart type.
			 * Optionally, it can also accept a series of exporters for downloading the data and can register events.
			 */
            var Chart = function(configs) {
                this.defaultOptions = {
                    "type" : "serial",
                    "theme" : "none",
                    "pathToImages" : "lib/amcharts/images/",
                    "columnWidth" : 1,
                    "categoryField" : "x",
                    "categoryAxis" : {
                        "parseDates" : true,
                        "markPeriodChange" : false,
                        "gridPosition" : "start",
                        "autoGridCount" : false,
                        "gridCount" : 12,
                    },
                    "valueAxes" : [{
                            "fontSize" : 8,
                            "id" : "ValueAxis-1",
                            "position" : "left",
                            "axisAlpha" : 0
                        }
                    ],
                    "export" : {
                        "enabled" : true,
                        "menu" : [],
                        "dataDateFormat": "MM-DD"
                    },
                    "chartScrollbar" : {
                        "autoGridCount" : true,
                        "scrollbarHeight" : 15
                    },
                    "legend": {
                        "useGraphSettings" : true,
                        "switchable" : false,
                        "labelText" : "[[title]]",
                        "position" : "bottom",
                        "equalWidths" : true,
                    }
                };

                this.init = function(configs) {
                    if (typeof(configs.options) === 'undefined') {
                        configs.options = this.defaultOptions;
                    }

                    this.id = configs.id;

                    this.options = configs.options;
                    this.divId = configs.name;
                    var chartType;

					// We currently do not show values in the legend but if we did, this would round the values.
                    if (this.options.hasOwnProperty('legend')) {
                        this.options.legend.valueFunction = function(graphDataItem, text) {
                            if (text.trim() === '') return '';
                            var multiplier = '1';
                            for (var i = 0, len = mapper.amcharts.configZ.decimalDigits; i < len; i+=1) {
                                multiplier += '0';
                            }
                            multiplier = parseInt(multiplier);
                            var value = parseFloat(text);
                            return (Math.round(value * multiplier) / multiplier) + '';
                        }
                    }

                    this.chart = AmCharts.makeChart(configs.name, this.options);
                    this.exporters = {};

                    for (var event in configs.events) {
                        this.chart[event] = configs.events[event];
                    }

                    chartType = this.getNewChartType(configs.custom.chartType);
                    this.chartBuilder = this.getNewChartBuilder(configs.custom.chartBuilder, chartType);

					// Set exporters.
                    for (var formatName in configs.custom.exporters) {
						var exporterName = configs.custom.exporters[formatName];
						var coreExporters = mapper.amcharts.exporters[formatName];
						var customExporters = custom.amcharts.exporters[formatName];
						
						// If the exporter exists in mapper, use it. Otherwise assume it is in customize.js.
                        if (typeof(coreExporters[exporterName]) !== 'undefined') {
                            this.exporters[formatName] = coreExporters[exporterName];
                        } else {
                            this.exporters[formatName] = customExporters[exporterName];
                        }
                    }
                }

                this.getNewChartBuilder = function(chartBuilderName, chartType) {
                    var chartBuilder;
					var coreChartBuilders = mapper.amcharts.chartBuilders;
					var customChartBuilders = custom.amcharts.chartBuilders;
					
					// If a name is passed, first check to see if mapper has that chart builder.
					// If not, assume it is in customize.js. If no name is passed, use the default.
                    if (typeof(chartBuilderName) !== 'undefined') {
                        if (typeof(coreChartBuilders[chartBuilderName]) !== 'undefined') {
                            chartBuilder = coreChartBuilders[chartBuilderName];
                        } else {
                            chartBuilder = customChartBuilders[chartBuilderName];
                        }
                    } else {
                        chartBuilder = coreChartBuilders.DefaultChartBuilder;
                    }
                    return new chartBuilder(this.chart, chartType);
                }

                this.setChartBuilder = function(chartBuilder) {
                    this.chartBuilder = chartBuilder;
                }

                this.getNewChartType = function(chartTypeName) {
                    var chartType;
					var coreChartTypes = mapper.amcharts.chartTypes;
					var customChartTypes = custom.amcharts.chartTypes;
					
					// If a name is passed, first check to see if mapper has that chart type.
					// If not, assume it is in customize.js. If no name is passed, use the default.
                    if (typeof(chartTypeName) !== 'undefined') {
                        if (typeof(coreChartTypes[chartTypeName]) !== 'undefined') {
                            chartType = coreChartTypes[chartTypeName];
                        } else {
                            chartType = customChartTypes[chartTypeName];
                        }
                    } else {
                        chartType = coreChartTypes.StaticChartType;
                    }
                    return new chartType();
                }

                this.setChartType = function(chartType) {
                    this.chartBuilder.chartType = chartType;
                }
				
                this.init(configs);
            }

			this.charts = [];

			this.init = function(chartData) {
			    for (var i = 0, len = chartData.length; i < len; i+=1) {
                    this.charts.push(new Chart(chartData[i]));
    			}
			}

            this.getChartById = function(id) {
                for (var i = 0, len = this.charts.length; i < len; i+=1) {
                    if (this.charts[i].id === id) return this.charts[i];
                }
                return null;
            }

			/**
			 * Call the exporter to download the data for the specified format.
			 */
            this.exportChart = function(id, format, options) {
                var chart = this.getChartById(id);
                if (chart == null) return;
                chart.exporters[format](chart.chart, options);
            }

			// If a chart is hidden when it is built, AmCharts doesn't know how to size it properly.
			// Call this on a chart after it is shown. (popups do this automatically)
			this.refresh = function (id) {
				if (typeof(id) !== 'undefined') {
                    var chart = this.getChartById(id);
					chart.validateData();
					chart.validateSize();
				} else {
					for (var i = 0, len = this.charts.length; i < len; i+=1) {
						this.charts[i].chart.validateData();
						this.charts[i].chart.validateSize();
					}
				}
			}

			/**
			 * Builds a single chart by name.
			 *
			 * @param string name The name of the chart given when instantiating the chart handler.
			 * @param array data An array of DataHandler objects for creating the chart data.
			 * @param object options An object of extra parameters required by the chart builders.
			 */
			this.buildChart = function (id, data, options) {
                var chart = this.getChartById(id);
				if (chart !== null) chart.chartBuilder.buildChart(data, options);
			}

			/**
			 * Builds all charts associated with this chart handler.
			 *
			 * @param array data An array of DataHandler objects for creating the chart data.
			 * @param object options An object of extra parameters required by the chart builders.
			 */
			this.buildCharts = function (data, options) {
				for (var i = 0, len = this.charts.length; i < len; i+=1) {
					this.charts[i].chartBuilder.buildChart(data, options);
				}
			}

			this.setTitle = function(id, title) {
				var chartWrapper = this.getChartById(id);
				var chart = chartWrapper.chart;
				chart.titles = [];
				chart.addTitle(title);
				chart.validateNow();
			}

			/**
			 * This allows resizing the chart without rebuilding it from scratch.
			 */
            this.setChartSize = function(width, height) {
                for (var i = 0, len = this.charts.length; i < len; i+=1) {
                    var chart = this.charts[i];
                    var chartDiv = document.getElementById(chart.divId);
                    chartDiv.style.width = width+'px';
                    chartDiv.style.height = (height-15)+'px';
                    chart.chart.invalidateSize();
                }
            }

			this.buildEmptyChart = function(message) {
				mapper.amcharts.common.setNoData(this.charts[0].chart);
			}

			this.init(chartData);
		},
		
		/**
		 * A chart builder formats the data and sets dynamic configurations.
		 */
		chartBuilders : {
            DefaultChartBuilder : function(chart, chartType) {
				this.chart = chart;
				this.chartType = chartType;

                this.buildChart = function (data, options) {
                    mapper.amcharts.common.setYAxesMinMax(this.chart, options);

                    this.chart.dataProvider = data;
                    this.chart.graphs = this.chartType.buildGraphs(options.years, options.colors);
                    this.chart.validateData();
                }
            },

            MinMaxChartBuilder : function (chart, chartType) {
				this.chart = chart;
				this.chartType = chartType;

				this.buildChart = function (data, options) {
                    mapper.amcharts.common.setYAxesMinMax(this.chart, options);

					if (mapper.common.isEmptyObject(data.originalData)) {
						mapper.amcharts.common.setNoData(this.chart);
						return;
					}

                    data.convertCrossYears(parseInt(options.startMonth), options.period);
                    if (options.cumulative === true) {
                        data.cumulate();
                    }

                    var chartData = data.getStatistics()
                        .truncateDataByProperty(options.years.concat(['min','max','average']))
                        .processData(options.period)
                        .formatMultipleYAxis()
                        .getArray();

                    chartData = custom.amcharts.data.postProcessData(chartData, options.period);

					this.chart.legend.useGraphSettings = true;
					this.chart.legend.markerSize = 10;
					this.chart.dataProvider = chartData;
					this.chart.graphs = this.chartType.buildGraphs(options.years, options.colors, options.period, options.startMonth);
					this.chart.categoryAxis.minPeriod = mapper.amcharts.common.getMinPeriod(options.period);
					this.chart.categoryAxis.title =  mapper.periodsConfig[options.period].xLabel;
                    this.chart.categoryAxis.period= options.period;
					this.chart.categoryAxis.startMonth = options.startMonth;
					this.chart.validateData();
				}
			},

			ChartBuilder : function (chart, chartType) {
				this.chart = chart;
				this.chartType = chartType;

				this.buildChart = function (data, options) {
                    mapper.amcharts.common.setYAxesMinMax(this.chart, options);

					if (mapper.common.isEmptyObject(data.originalData)) {
						mapper.amcharts.common.setNoData(this.chart);
						return;
					}

                    data.convertCrossYears(parseInt(options.startMonth), options.period).truncateDataByProperty(options.years);
                    if (options.cumulative === true) {
						if (!isNaN(options.truncateStartPeriod)) {
							data.truncateData({start: options.truncateStartPeriod});
						}
                        data.cumulate();
                    }
                    var chartData = data.processData(options.period)
                        .formatMultipleYAxis()
                        .getArray();

                    chartData = custom.amcharts.data.postProcessData(chartData, options.period);

					this.chart.legend.data = this.chartType.getLegendData(options.years, options.colors);
					this.chart.dataProvider = chartData;
					this.chart.graphs = this.chartType.buildGraphs(options.years, options.colors, options.period, options.startMonth);
					this.chart.categoryAxis.minPeriod = mapper.amcharts.common.getMinPeriod(options.period);
					this.chart.categoryAxis.title =  mapper.periodsConfig[options.period].xLabel;
                    this.chart.categoryAxis.period= options.period;
					this.chart.categoryAxis.startMonth = options.startMonth;
					this.chart.validateData();
				}
			},
			AnnualChartBuilder : function (chart, chartType) {
				this.chart = chart;
				this.chartType = chartType;

				this.buildChart = function (dataHandler, options) {
                    mapper.amcharts.common.setYAxesMinMax(this.chart, options);
                    if (!(dataHandler instanceof mapper.amcharts.DataHandler) && Object.prototype.toString.call(dataHandler) === '[object Array]') {
                        dataHandler = dataHandler[0];
                    }

					if (mapper.common.isEmptyObject(dataHandler.originalData)) {
						mapper.amcharts.common.setNoData(this.chart);
						return;
					}

                    if (options.startMonth > 1) {
                        dataHandler.convertCrossYears(parseInt(options.startMonth), options.period);
                        dataHandler.data = mapper.amcharts.common.handleCrossYears(dataHandler.getDataVar(), options.period, options.startMonth);
                    }

                    dataHandler.removeStaticProperties()
                        .filterByPeriod(options.years)
                        .formatByXValues(options.years);

                    dataHandler.data = mapper.amcharts.common.processAnnualData(dataHandler.data, options.period);

					this.chart.legend.useGraphSettings = true;
					this.chart.legend.markerSize = 10;
                    var formattedData = dataHandler.formatMultipleYAxis().getArray();
					this.chart.dataProvider = formattedData;
					this.chart.graphs = this.chartType.buildGraphs(options.years, options.colors, options.period);
					var configurl_legend = (mapper.amcharts.configZ.legend == "true") ? true : false;
					this.chart.categoryAxis.title =  mapper.periodsConfig[options.period].xLabel;
                    this.chart.categoryAxis.period = options.period;
					this.chart.categoryAxis.startMonth = options.startMonth;
					this.chart.validateData();
				}
			},
			
			/**
			 * Prelim data is separate from the actual data but this chart builder makes it appear as one.
			 */
            PrelimChartBuilder : function(chart, chartType) {
                this.chart = chart;
                this.chartType = chartType;

				this.buildChart = function (dataHandlers, options) {
                    mapper.amcharts.common.setYAxesMinMax(this.chart, options);

					if (mapper.common.isEmptyObject(dataHandlers[0].originalData)) {
						mapper.amcharts.common.setNoData(this.chart);
						return;
					}

                    var dataHandler = dataHandlers[0]; // Use first data handler as main one.
					// Get the latest season so we know which season to append the prelim data to.
					var latestSeason = 0;
					var seasons = Object.keys(dataHandler.originalData);
					for (var i = 0, len = seasons.length; i < len; i+=1) {
						var season = parseInt(seasons[i]);
						if (!isNaN(season) && season > latestSeason) {
							latestSeason = season;
						}
					}

					var prelimDataHandler = dataHandlers[1];
					dataHandler.convertCrossYears(parseInt(options.startMonth), options.period).truncateDataByProperty(options.years);
					prelimDataHandler.convertCrossYears(parseInt(options.startMonth), options.period).truncateDataByProperty(options.years);

					var latestPeriod = dataHandler.getLatestPeriod();
					// For cumulative, we need to add the cumulative value of the latest season in 
					// the final data to the beginning of the prelim data before cumulating it.
					// Note that if the final data has data through the full season and 
					// the prelim data starts at the first period of the next season,
					// then we can't add the cumulative final to the prelim.
					if (options.cumulative === true) {
						// Truncate the start period if set start point tool is used.
						if (!isNaN(options.truncateStartPeriod)) {
							dataHandler.truncateData({start: options.truncateStartPeriod});
							prelimDataHandler.truncateData({start: options.truncateStartPeriod});
						}
						dataHandler.cumulate();
						// Since the value of the latest period changes after cumulating, 
						// we need to get it again here.
						latestPeriod = dataHandler.getLatestPeriod();
						if (latestPeriod !== null) {
							var prelimData = prelimDataHandler.getDataCopy();
							for (var season in prelimData) {
								if (dataHandler.data.hasOwnProperty(season) && prelimDataHandler.data[season].length > 0) {
									prelimDataHandler.data[season][0].y += latestPeriod.y;
								}
							}
						}
						prelimDataHandler.cumulate();
					}

					// Check to be sure that there is final data selected.
					if (latestPeriod !== null) {
						for (var season in prelimDataHandler.data) {
							if (dataHandler.data.hasOwnProperty(season)) {
								if (this.chartType instanceof mapper.amcharts.chartTypes.PrelimLineGraph) {
									var x = parseInt(prelimDataHandler.data[season][0].x) - 1;
									prelimDataHandler.data[season].unshift({
										x: x.toString(),
										y: latestPeriod.y
									});
								}
							}
						}
					}
					
					var data = dataHandler.getData();
					var prelimData = prelimDataHandler.getData();

					for (var season in prelimData) {
                        data[season + ' prelim'] = prelimData[season];
                    }
					var properties = Object.keys(data);
					dataHandler.data = data;

                    var chartData = dataHandler.processData(options.period)
                        .formatMultipleYAxis()
                        .getArray();

                    chartData = custom.amcharts.data.postProcessData(chartData, options.period);

					this.chart.legend.data = this.chartType.getLegendData(properties, options.colors);
					this.chart.dataProvider = chartData;
					this.chart.graphs = this.chartType.buildGraphs(properties, options.colors, options.period, options.startMonth, latestSeason);
					this.chart.categoryAxis.minPeriod = mapper.amcharts.common.getMinPeriod(options.period);
					this.chart.categoryAxis.title =  mapper.periodsConfig[options.period].xLabel;
                    this.chart.categoryAxis.period = options.period;
					this.chart.categoryAxis.startMonth = options.startMonth;
					this.chart.validateData();
				}
            },
            AnnualPrelimChartBuilder : function (chart, chartType) {
				this.chart = chart;
				this.chartType = chartType;

				this.buildChart = function (dataHandlers, options) {
                    mapper.amcharts.common.setYAxesMinMax(this.chart, options);
                    var dataHandler = dataHandlers[0];

					if (mapper.common.isEmptyObject(dataHandler.originalData)) {
						mapper.amcharts.common.setNoData(this.chart);
						return;
					}

                    var data = dataHandler.convertCrossYears(parseInt(options.startMonth), options.period).getData();
                    var prelimData = dataHandlers[1].convertCrossYears(parseInt(options.startMonth), options.period).getData();

					// Get latest season for prelim.
                    var prelimSeason = '0', prelimPeriod = '0';
                    for (var season in data) {
                        if (isNaN(parseInt(season))) continue;
                        if (parseInt(season) > parseInt(prelimSeason)) prelimSeason = season;
                    }

					// Get latest period in the latest season.
                    for (var i = 0, len = data[prelimSeason].length; i < len; i+=1) {
                        if (parseInt(data[prelimSeason][i].x) > parseInt(prelimPeriod)) {
                            prelimPeriod = data[prelimSeason][i].x;
                        }
                    }

                    var prelimData = dataHandlers[1].convertCrossYears(parseInt(options.startMonth), options.period).truncateDataByProperty(options.years).getData();
                    var newPrelimData = {};
                    for (var season in prelimData) {
                        for (var i = 0, len = prelimData[season].length; i < len; i+=1) {
                            if (season === prelimSeason && parseInt(prelimData[season][i].x) <= parseInt(prelimPeriod)) continue;
                            if (!newPrelimData.hasOwnProperty(season+' prelim')) {
                                newPrelimData[season+' prelim'] = [];
                            }
                            newPrelimData[season+' prelim'].push({
                                x: prelimData[season][i].x,
                                y: prelimData[season][i].y
                            });
                        }
                    }

                    for (var season in newPrelimData) {
                        data[season] = newPrelimData[season];
                    }

                    dataHandler.data = data;
                    dataHandler.removeProperty('stm').filterByPeriod(options.years).formatByXValues(options.years);
                    dataHandler.data = mapper.amcharts.common.processAnnualData(dataHandler.data, options.period);
                    var properties = Object.keys(dataHandler.data);

					this.chart.legend.useGraphSettings = true;
					this.chart.legend.markerSize = 10;
                    var formattedData = dataHandler.formatMultipleYAxis().getArray();
					this.chart.dataProvider = formattedData;
					this.chart.graphs = this.chartType.buildGraphs(properties, options.colors, options.period, prelimSeason, prelimPeriod);
					var configurl_legend = (mapper.amcharts.configZ.legend == "true") ? true : false;
					this.chart.categoryAxis.title =  mapper.periodsConfig[options.period].xLabel;
                    this.chart.categoryAxis.period = options.period;
					this.chart.categoryAxis.startMonth = options.startMonth;
					this.chart.validateData();
				}
			},
            GradientChartBuilder : function(chart, chartType) {
				this.chart = chart;
				this.chartType = chartType;

				this.buildChart = function (data, options) {
                    var data = data.getData();
                    var percents = [18.71, 4.67, 4.67, 4.67, 14.03, 4.67, 4.67, 17.54];
                    var highestValue = 0;
                    var properties = {};

                    for (var prop in data) {
                        for (var i = 0, len = data[prop].length; i < len; i+=1) {
                            if (data[prop][i].y > highestValue) highestValue = data[prop][i].y;
                        }
                    }

                    for (var i = 0, len = percents.length; i < len; i+=1) {
                        properties['stack'+(i+2)] = highestValue * (percents[i] / 100);
                    }
                    properties['stack1'] = 1;
                    this.chart.dataProvider = [properties];
                    this.chart.graphs = this.chartType.buildGraphs();
                    this.chart.validateData();
                }
            }
		}, // End chartBuilders

		/**
		 * A chart type build the graphs for a chart. This is separate from 
		 * the chart builder so that you can swap chart types at will.
		 */
		chartTypes : {
			StaticChartType : function() {
                this.buildGraphs = function (yNames, colors) {

                }
            },

            MinMaxLineGraph : function () {
				this.buildGraphs = function (yNames, colors, period, startMonth) {
					var graphs = [];

                    yNames.sort(mapper.amcharts.common.sortSeasons);

					for (var i = 0, len = yNames.length; i < len; i+=1) {
						var yName = yNames[i] + '';
						var graph = new AmCharts.AmGraph();
						graph.balloonFunction = function (graphDataItem) {
							return custom.periodicity.getChartCursorLabel(graphDataItem, period, startMonth);
						}
                        graph.title = yName;
						graph.lineAlpha = 1;
						graph.type = "line";
						graph.lineThickness = 2;
						graph.lineColor = colors[yName + ''];
						graph.valueField = yName + '';

						graphs.push(graph);
					}

                    var averageGraph = new AmCharts.AmGraph();
                    averageGraph.balloonFunction = function (graphDataItem) {
                        return custom.periodicity.getChartCursorLabel(graphDataItem, period, startMonth);
                    }
                    averageGraph.title = 'Average';
                    averageGraph.lineAlpha = 1;
                    averageGraph.type = "line";
                    averageGraph.lineThickness = 3;
                    averageGraph.lineColor = '#0000FF';
                    averageGraph.valueField = 'average';
                    averageGraph.dashLength = 5;

                    graphs.push(averageGraph);

                    var minGraph = new AmCharts.AmGraph();
                    minGraph.balloonFunction = function (graphDataItem) {
                        return custom.periodicity.getChartCursorLabel(graphDataItem, period, startMonth);
                    }
                    minGraph.title = 'Min';
                    minGraph.lineAlpha = .5;
                    minGraph.type = "line";
                    minGraph.lineThickness = 1;
                    minGraph.lineColor = '#808080';
                    minGraph.valueField = 'min';

                    graphs.push(minGraph);

                    var maxGraph = new AmCharts.AmGraph();
                    maxGraph.balloonFunction = function (graphDataItem) {
                        return custom.periodicity.getChartCursorLabel(graphDataItem, period, startMonth);
                    }
                    maxGraph.title = 'Max';
                    maxGraph.lineAlpha = .5;
                    maxGraph.type = "line";
                    maxGraph.lineThickness = 1;
                    maxGraph.lineColor = '#808080';
                    maxGraph.valueField = 'max';
                    maxGraph.fillAlphas = .5;
                    maxGraph.fillToGraph = minGraph;

                    graphs.push(maxGraph);

					return graphs;
				}
			},

			LineGraph : function () {
				this.getLegendData = function(seasons, colors) {
					return mapper.amcharts.common.getLegendData(seasons, colors, 'line');
				}

				this.buildGraphs = function (yNames, colors, period, startMonth) {
					var graphs = [];

                    yNames.sort(mapper.amcharts.common.sortSeasons);

					for (var i = 0, len = yNames.length; i < len; i+=1) {
						var yName = yNames[i] + '';
						var graph = new AmCharts.AmGraph();
						graph.balloonFunction = function (graphDataItem) {
							return custom.periodicity.getChartCursorLabel(graphDataItem, period, startMonth);
						}
                        graph.title = yName;
						graph.lineAlpha = 1;
						graph.type = "line";
						graph.lineThickness = 1;
						graph.lineColor = colors[yName + ''];
						graph.bullet = "circle";
						graph.bulletSize = 5;
						graph.valueField = yName + '';

						graphs.push(graph);
					}

					return graphs;
				}
			},

			BarGraph : function () {
				this.getLegendData = function(seasons, colors) {
					return mapper.amcharts.common.getLegendData(seasons, colors, 'square');
				}

				this.buildGraphs = function (yNames, colors, period, startMonth) {
					var graphs = [];

                    yNames.sort(mapper.amcharts.common.sortSeasons);

					for (var i = 0, len = yNames.length; i < len; i+=1) {
						var yName = yNames[i] + '';
						var graph = new AmCharts.AmGraph();
						graph.balloonFunction = function (graphDataItem) {
							return custom.periodicity.getChartCursorLabel(graphDataItem, period, startMonth);
						}
                        graph.title = yName;
						graph.fillAlphas = 0.8;
                        graph.columnWidth = .8;
                        graph.type = 'column';
                        if (yNames.length < 4) {
                            graph.fixedColumnWidth = 4;
                        } else if (yNames.length < 6) {
                            graph.fixedColumnWidth = 3;
                        } else {
                            graph.fixedColumnWidth = 2;
                        }
						graph.lineColor = colors[yName + ''];
						graph.valueField = yName + '';

						graphs.push(graph);
					}

					return graphs;
				}
			},

            PrelimLineGraph : function () {
				this.getLegendData = function(seasons, colors) {
					return mapper.amcharts.common.getPrelimLegendData(seasons, colors, 'line');
				}

				this.buildGraphs = function (yNames, colors, period, startMonth, prelimSeason) {
					var graphs = [];

                    yNames.sort(mapper.amcharts.common.sortPrelimSeasons);

					for (var i = 0, len = yNames.length; i < len; i+=1) {
						var yName = yNames[i] + '';
						var graph = new AmCharts.AmGraph();
                        if (yName.indexOf('prelim') !== -1 && parseInt(yName.split(' ')[0]) === parseInt(prelimSeason)) {
                            graph.balloonFunction = function (graphDataItem, graph) {
                                var data = graph.data;
                                for (var j = 0, length = data.length; j < length; j+=1) {
                                    var context = data[j].dataContext;
                                    if (context.hasOwnProperty(graph.title)) {
                                        if (context.x === graphDataItem.dataContext.x) return '';
                                        break;
                                    }
                                }
                                return custom.periodicity.getChartCursorLabel(graphDataItem, period, startMonth);
                            }
                        } else {
                            graph.balloonFunction = function (graphDataItem, graph) {
                                return custom.periodicity.getChartCursorLabel(graphDataItem, period, startMonth);
                            }
                        }
                        graph.title = yName;
						graph.lineAlpha = 1;
						graph.type = "line";
						graph.lineThickness = 1;
						graph.lineColor = colors[yName + ''];
						graph.bullet = "circle";
						graph.bulletSize = 5;
						graph.valueField = yName + '';
                        if (yName.indexOf('prelim') !== -1) {
                            graph.lineColor = '#7F7F7F';
                        }

						graphs.push(graph);
					}

					return graphs;
				}
			},

            PrelimBarGraph : function () {
				this.getLegendData = function(seasons, colors) {
					return mapper.amcharts.common.getPrelimLegendData(seasons, colors, 'square');
				}

				this.buildGraphs = function (yNames, colors, period, startMonth, prelimSeason) {
					var graphs = [];

                    yNames.sort(mapper.amcharts.common.sortPrelimSeasons);

					for (var i = 0, len = yNames.length; i < len; i+=1) {
						var yName = yNames[i] + '';
						var graph = new AmCharts.AmGraph();
                        graph.balloonFunction = function (graphDataItem, graph) {
                            return custom.periodicity.getChartCursorLabel(graphDataItem, period, startMonth);
                        }
                        graph.title = yName;
						graph.fillAlphas = 0.8;
                        graph.lineThickness = 3;
                        graph.pointPosition = "end";
                        graph.type = 'column';
						graph.lineColor = colors[yName + ''];
						graph.valueField = yName + '';
                        if (yName.indexOf('prelim') !== -1) {
                            graph.lineColor = '#7F7F7F';
							graph.clustered = false;
							graph.columnWidth = .2;
                        }

						graphs.push(graph);
					}

					return graphs;
				}
			},

			AnnualBarGraph : function () {
				this.getLegendData = function(seasons, colors) {
					return mapper.amcharts.common.getAnnualLegendData(seasons, colors, 'square');
				}

				this.buildGraphs = function (yNames, colors, period) {
					var graphs = [];

                    yNames.sort(mapper.amcharts.common.sortInterannualSeasons);

					for (var i = 0, len = yNames.length; i < len; i+=1) {
						var yName = yNames[i].toString();
						var graph = new AmCharts.AmGraph();

                        graph.title = custom.periodicity.getPeriodLabel(period, parseInt(yName));
						graph.valueField = yName;
						graph.balloonFunction = function (graphDataItem) {
                            var multiplier = '1';
                            for (var i = 0, len = mapper.amcharts.configZ.decimalDigits; i < len; i+=1) {
                                multiplier += '0';
                            }
                            multiplier = parseInt(multiplier);
							var dataContext = graphDataItem.dataContext;
							var title = graphDataItem.graph.title;
                            return dataContext.x + " " + title + " : " + (Math.round(graphDataItem.values.value * multiplier) / multiplier);
						}
						graph.fillAlphas = 0.8;
						graph.type = "column";
						graph.lineThickness = 2;
						graph.lineColor = colors[yName + ''];

						graphs.push(graph);
					}

					return graphs;
				}
			},

			AnnualLineGraph : function () {
				this.getLegendData = function(seasons, colors) {
					return mapper.amcharts.common.getAnnualLegendData(seasons, colors, 'line');
				}

				this.buildGraphs = function (yNames, colors, period) {
					var graphs = [];

                    yNames.sort(mapper.amcharts.common.sortInterannualSeasons);

					for (var i = 0, len = yNames.length; i < len; i+=1) {
						var yName = yNames[i].toString();
						var graph = new AmCharts.AmGraph();

                        graph.title = custom.periodicity.getPeriodLabel(period, parseInt(yName));
						graph.valueField = yName;
						graph.balloonFunction = function (graphDataItem) {
                            var multiplier = '1';
                            for (var i = 0, len = mapper.amcharts.configZ.decimalDigits; i < len; i+=1) {
                                multiplier += '0';
                            }
                            multiplier = parseInt(multiplier);
							var dataContext = graphDataItem.dataContext;
							var title = graphDataItem.graph.title;
                            return dataContext.x + " " + title + " : " + (Math.round(graphDataItem.values.value * multiplier) / multiplier);
						}
						graph.fillAlphas = 0;
						graph.type = "line";
						graph.lineColor = colors[yName + ''];
						graph.bullet = "circle";
						graph.bulletSize = 5;

						graphs.push(graph);
					}

					return graphs;
				}
			},

			LineGraphWithSD : function () {
				this.buildGraphs = function (yNames, colors, period) {
					var graphs = [];
					for (var i = 0, len = yNames.length; i < len; i+=1) {
						var yName = yNames[i];
						var graph = new AmCharts.AmGraph();
						graph.title = yName;
						graph.fillAlphas = graph_fillAlphas;
						graph.openField = 'startTime';
						graph.lineThickness = 1;
						graph.lineColor = colors[yName];
						graph.type = "line";
						graph.bullet = graph_bullets;
						graph.bulletSize = 5;
						graph.valueField = yName;
						graph.balloonText = "[[title]]: [[value]]";

						graphs.push(graph);
					}

					var lowerGraph = new AmCharts.AmGraph();
					lowerGraph.title = 'Minus 1 Standard Deviation';
					lowerGraph.fillAlphas = 0;
					lowerGraph.openField = 'startTime';
					lowerGraph.lineThickness = 3;
					lowerGraph.lineColor = '#C0C0C0';
					lowerGraph.type = 'line';
					lowerGraph.valueField = 'minus1SD';
					lowerGraph.balloonText = "[[title]]: [[value]]";

					var upperGraph = new AmCharts.AmGraph();
					upperGraph.title = 'Plus 1 Standard Deviation';
					upperGraph.fillAlphas = 0.5;
					upperGraph.openField = 'startTime';
					upperGraph.lineThickness = 3;
					upperGraph.lineColor = '#C0C0C0';
					upperGraph.type = 'line';
					upperGraph.valueField = 'plus1SD';
					upperGraph.balloonText = "[[title]]: [[value]]";
					upperGraph.fillToGraph = lowerGraph;

					//graphs.push(lowerGraph);
					//graphs.push(upperGraph);

					return graphs;
				}
			},
            GradientGraph : function() {
                this.buildGraphs = function() {
                    var graphs = [{
                      "showBalloon": false,
                      "lineAlpha": 0,
                      "fillAlphas": 1,
                      "fillColors": "#000000",
                      "visibleInLegend": false,
                      "type": "column",
                      "valueField": "stack1",
                      "valueAxis": "ValueAxis-2",
                      "fixedColumnWidth": 200
                    }, {
                      "showBalloon": false,
                      "lineAlpha": 0,
                      "fillAlphas": 1,
                      "fillColors": "#6B0000",
                      "visibleInLegend": false,
                      "type": "column",
                      "valueField": "stack2",
                      "valueAxis": "ValueAxis-2",
                      "fixedColumnWidth": 200
                    }, {
                      "showBalloon": false,
                      "lineAlpha": 0,
                      "fillAlphas": 1,
                      "fillColors": "#C81E32",
                      "visibleInLegend": false,
                      "type": "column",
                      "valueField": "stack3",
                      "valueAxis": "ValueAxis-2",
                      "fixedColumnWidth": 200
                    }, {
                      "showBalloon": false,
                      "lineAlpha": 0,
                      "fillAlphas": 1,
                      "fillColors": "#E66900",
                      "visibleInLegend": false,
                      "type": "column",
                      "valueField": "stack4",
                      "valueAxis": "ValueAxis-2",
                      "fixedColumnWidth": 200
                    }, {
                      "showBalloon": false,
                      "lineAlpha": 0,
                      "fillAlphas": 1,
                      "fillColors": "#FFE500",
                      "visibleInLegend": false,
                      "type": "column",
                      "valueField": "stack5",
                      "valueAxis": "ValueAxis-2",
                      "fixedColumnWidth": 200
                    }, {
                      "showBalloon": false,
                      "lineAlpha": 0,
                      "fillAlphas": 1,
                      "fillColors": "#FFFFFF",
                      "visibleInLegend": false,
                      "type": "column",
                      "valueField": "stack6",
                      "valueAxis": "ValueAxis-2",
                      "fixedColumnWidth": 200
                    }, {
                      "showBalloon": false,
                      "lineAlpha": 0,
                      "fillAlphas": 1,
                      "fillColors": "#87FAC2",
                      "visibleInLegend": false,
                      "type": "column",
                      "valueField": "stack7",
                      "valueAxis": "ValueAxis-2",
                      "fixedColumnWidth": 200
                    }, {
                      "showBalloon": false,
                      "lineAlpha": 0,
                      "fillAlphas": 1,
                      "fillColors": "#53C289",
                      "visibleInLegend": false,
                      "type": "column",
                      "valueField": "stack8",
                      "valueAxis": "ValueAxis-2",
                      "fixedColumnWidth": 200
                    }, {
                      "showBalloon": false,
                      "lineAlpha": 0,
                      "fillAlphas": 1,
                      "fillColors": "#288233",
                      "visibleInLegend": false,
                      "type": "column",
                      "valueField": "stack9",
                      "valueAxis": "ValueAxis-2",
                      "fixedColumnWidth": 200
                    }];

                    return graphs;
                }
            }
		}, // End chartTypes

		exporters : {
			PNG : {
				// png export customised to include the chart legend.
				defaultExport : function (chart, options) {
                    var layerName = '',
                    chartId = '';

                    if (typeof(options.layerName) !== 'undefined') {
                        layerName = '-' + options.layerName;
                    }

                    if (typeof(options.chartId) !== 'undefined') {
                        chartId = '-' + options.chartId;
                    }

					chart.export.capture({}, function () {
                        var width = (this.setup.chart.realWidth > this.setup.chart.legend.divWidth) ? this.setup.chart.realWidth : this.setup.chart.legend.divWidth;
                        this.setup.fabric.setWidth(width);
						this.toPNG({}, function (data) {
							this.download(data, "image/png", "export" + layerName + chartId + ".png");
						});
					});
				},
			},
			
			// Custom csv formatters for downloading chart data.
			CSV : {
				// Exporter for most charts.
				monthlyExport : function (chart, options) {
					var selectedPeriod = options.period,
                    startMonth = options.startMonth,
                    layerName = '',
                    chartId = '';

                    if (typeof(options.layerName) !== 'undefined') {
                        layerName = '-' + options.layerName;
                    }

                    if (typeof(options.chartId) !== 'undefined') {
                        chartId = '-' + options.chartId;
                    }

					chart.export.toJSON({}, function (data) {
						data = JSON.parse(data);
						// Because we use parseDates on AmCharts, to display cross year data correctly we have 
						// to convert the period into a linear date. In order to format the csv output correctly, 
						// we need to convert it back to the original here.
						var periodsPerMonth = custom.periodicity.getPeriodsPerMonth(selectedPeriod);
						var splitPeriod = (parseInt(startMonth) - 1) * parseInt(periodsPerMonth) + 1;
						var maxPeriods = periodsPerMonth * 12;
						var crossYearPeriodCount = 0;

						for (var i = 0, len = data.length; i < len; i+=1) {
							var obj = data[i];
							var period = parseInt(obj.period)-1;
							var month = "";

							if (period + splitPeriod <= maxPeriods) {
								period += splitPeriod;
							} else {
								crossYearPeriodCount++;
								period = crossYearPeriodCount;
							}

							var months = mapper.periodsConfig[selectedPeriod].months;

							if (startMonth > 1) {
								var split = startMonth - 1;
								var firstHalf = months.slice(0, split);
								var secondHalf = months.slice(split);
								months = secondHalf.concat(firstHalf);
							}

							if (periodsPerMonth === 1 || period % periodsPerMonth == 1)
								month = months[Math.floor(parseInt(obj.period) / periodsPerMonth)];

							obj.Month = month;
							obj.Period = period;
							for (var prop in obj) {
								if (prop != "Month" && prop !== 'x' && prop !== 'period') {
                                    if (prop.indexOf('prelim') !== -1 && obj.hasOwnProperty(prop.split(' ')[0])) {
                                        obj[prop] = null;
                                    } else {
                                        obj[prop] = (Math.round(obj[prop] * 10000) / 10000) + "";
                                    }
                                }
							}
						}

						var headers = [];
						var values = [];
						for (var i = 0, len = data.length; i < len; i+=1) {
							for (var prop in data[i]) {
								if (headers.indexOf(prop) == -1) {
									if (prop != "x" && prop != "name" && prop !== 'period')
										headers.push(prop);
									if (prop == "name")
										headers.push("Year");
								}
							}
						}

						headers.sort(function (a, b) {
							if (b == "Month")
								return 1;
							if (b == "Period" && a != "Month")
								return 1;
							if (!isNaN(parseInt(b)) && isNaN(parseInt(a)))
								return -1;
							if (isNaN(parseInt(b)) && !isNaN(parseInt(a)))
								return 1;
							if (!isNaN(parseInt(b)) && !isNaN(parseInt(a)))
								return parseInt(a) - parseInt(b);
							return 0;
						});

						for (var i = 0, len = data.length; i < len; i+=1) {
							for (var j = 0, length = headers.length; j < length; j+=1) {
								var header = headers[j];
								var value = data[i][header] ? data[i][header] : "";
								if (j == 0) {
									values.push("\n" + value);
								} else {
									values.push(value);
								}
							}
						}
						var csvOutput = headers.join(',') + ',' + values.join(',');
						this.download(csvOutput, "text/csv", "export" + layerName + chartId + ".csv");
					});
				},
				// Exporter for interannual charts.
				yearlyExport : function (chart, options) {
					var selectedPeriod = options.period,
                    layerName = '',
                    chartId = '';

                    if (typeof(options.layerName) !== 'undefined') {
                        layerName = '-' + options.layerName;
                    }

                    if (typeof(options.chartId) !== 'undefined') {
                        chartId = '-' + options.chartId;
                    }

					chart.export.toJSON({}, function (data) {
						data = JSON.parse(data);
						var dataReformatted = {};
						var headers = ["Period"];
						var values = [];
						for (var i = 0, len = data.length; i < len; i+=1) {
							headers.push(data[i].name);
						}

						headers.sort(function (a, b) {
							if (b == "Period")
								return 1;
							if (!isNaN(parseInt(b)) && isNaN(parseInt(a)))
								return -1;
							if (isNaN(parseInt(b)) && !isNaN(parseInt(a)))
								return 1;
							if (!isNaN(parseInt(b)) && !isNaN(parseInt(a)))
								return parseInt(a) - parseInt(b);
							return 0;
						});

						for (var i = 0, len = data.length; i < len; i+=1) {
							for (var prop in data[i]) {
								if (prop === "x" || prop === "name")
									continue;
								if (typeof(dataReformatted[prop]) === 'undefined')
									dataReformatted[prop] = {};

								dataReformatted[prop][data[i].x] = data[i][prop];
							}
						}
						data = dataReformatted;

						for (var prop in data) {
							for (var j = 0, len = headers.length; j < len; j+=1) {
								var header = headers[j];
								if (header === "Period") {
									values.push("\n" + prop);
								} else {
									values.push(data[prop][header]);
								}
							}
						}

						var csvOutput = headers.join(',') + ',' + values.join(',');
						this.download(csvOutput, "text/csv", "export" + layerName + chartId + ".csv");
					});
				},
                sevenDayExport : function (chart, options) {
					var selectedPeriod = options.period,
                    startMonth = options.startMonth,
                    layerName = '',
                    chartId = '';

                    if (typeof(options.layerName) !== 'undefined') {
                        layerName = '-' + options.layerName;
                    }

                    if (typeof(options.chartId) !== 'undefined') {
                        chartId = '-' + options.chartId;
                    }

					chart.export.toJSON({}, function (data) {
						data = JSON.parse(data);
                        var weeksPerMonth = [0,0,0,0,0,0,0,0,0,0,0,0];
                        var headers = [];
                        var yearData = {};
                        for (var i = 0, len = data.length; i < len; i+=1) {
                            var x = data[i].x;
                            for (var prop in data[i]) {
                                if (prop !== 'x') {
                                    if (headers.indexOf(prop) === -1) {
                                        headers.push(prop);
                                    }

                                    var date = new Date(x);
                                    var day = date.getDate();
                                    date.setYear(prop);

                                    var week = 1;
                                    var tempDate = new Date(date.getFullYear(), date.getMonth(), 1);
                                    while (tempDate.getDay() !== 1) {
                                        var nextDay = tempDate.getDate() + 1;
                                        tempDate.setDate(nextDay);
                                    }

                                    while (tempDate.getDate() < date.getDate()) {
                                        var nextWeekDay = tempDate.getDate() + 7;
                                        week++;
                                        tempDate.setDate(nextWeekDay);
                                    }

                                    if (weeksPerMonth[date.getMonth()] < week)
                                        weeksPerMonth[date.getMonth()] = week;

                                    if (typeof(yearData[prop]) === 'undefined')
                                        yearData[prop] = [];

                                    yearData[prop].push({
                                        value: data[i][prop],
                                        month: date.getMonth(),
                                        week: week,
                                    });
                                }
                            }
                        }

                        headers.sort(function(a,b){
                            if (isNaN(parseInt(a)) && isNaN(parseInt(b))) return 0;  // Both are strings
                            if (isNaN(parseInt(a)) && !isNaN(parseInt(b))) return -1;  // a is a string, b is a number
                            if (!isNaN(parseInt(a)) && isNaN(parseInt(b))) return 1;  // a is a number, b is a string
                            if (!isNaN(parseInt(a)) && !isNaN(parseInt(b))) return parseInt(b) - parseInt(a);  // Both a and b are numbers
                        });

                        var values = [];
                        for (var month = 0, len = weeksPerMonth.length; month < len; month+=1) {
                            for (var week = 1; week <= weeksPerMonth[month]; week++) {
                                if (week === 1) {
                                    values.push("\r\n"+mapper.periodsConfig[selectedPeriod].months[month]);
                                } else {
                                    values.push("\r\n");
                                }

                                values.push(week);

                                for (var j = 0, length = headers.length; j < length; j+=1) {
                                    var header = headers[j];
                                    var found = false;

                                    for (var k = 0, yearLen = yearData[header].length; k < yearLen; k+=1) {
                                        if (yearData[header][k].month === month && yearData[header][k].week === week) {
                                            found = true;
                                            values.push(yearData[header][k].value);
                                        }
                                    }

                                    if (!found) values.push("");
                                }
                            }
                        }

                        headers.splice(0, 0, 'Month', 'Week');
						var csvOutput = headers.join(',') + ',' + values.join(',');
						this.download(csvOutput, "text/csv", "export" + layerName + chartId + ".csv");
					});
                },
                oneDayExport : function (chart, options) {
					var selectedPeriod = options.period,
                    startMonth = options.startMonth,
                    layerName = '',
                    chartId = '';
                    var months = mapper.periodsConfig['1-day'].months;

                    if (typeof(options.layerName) !== 'undefined') {
                        layerName = '-' + options.layerName;
                    }

                    if (typeof(options.chartId) !== 'undefined') {
                        chartId = '-' + options.chartId;
                    }
                    var data = JSON.parse(JSON.stringify(chart.dataProvider));

                    var headers = [];
                    for (var i = 0, len = data.length; i < len; i+=1) {
                        for (var prop in data[i]) {
                            if (prop !== 'x') {
                                if (headers.indexOf(prop) === -1) {
                                    headers.push(prop);
                                }
                            }
                        }
                    }

                    headers.sort(function(a,b){
                        if (isNaN(parseInt(a)) && isNaN(parseInt(b))) return 0;  // Both are strings
                        if (isNaN(parseInt(a)) && !isNaN(parseInt(b))) return -1;  // a is a string, b is a number
                        if (!isNaN(parseInt(a)) && isNaN(parseInt(b))) return 1;  // a is a number, b is a string
                        if (!isNaN(parseInt(a)) && !isNaN(parseInt(b))) return parseInt(b) - parseInt(a);  // Both a and b are numbers
                    });

                    var rows = [];
                    var prevMonth = null;
                    for (var i = 0, len = data.length; i < len; i+=1) {
                        var x = data[i].x;
                        var date = mapper.amcharts.common.convertCrossYearDate(new Date(x), startMonth);
                        var day = date.getDate();
                        var month = date.getMonth();
                        var monthText = (month === prevMonth) ? "" : months[month];
                        prevMonth = month;
                        var row = [monthText, day];
                        for (var j = 0, length = headers.length; j < length; j+=1) {
                            var header = headers[j];
                            var value = '';
                            if (data[i].hasOwnProperty(header)) {
                                value = data[i][header];
                            }
                            row.push(value);
                        }
                        rows.push(row);
                    }

                    var csvOutput = (["month", "day"].concat(headers)).join(',') + "\r\n";
                    for (var i = 0, len = rows.length; i < len; i+=1) {
                        csvOutput += rows[i].join(',') + "\r\n";
                    }
                    chart.export.download(csvOutput, "text/csv", "export" + layerName + chartId + ".csv");
                }
			},
		},

		common : {
			getLegendData: function(seasons, colors, markerType) {
				var legendData = [];
				seasons.sort(this.sortSeasons);
				for (var i = 0, len = seasons.length; i < len; i+=1) {
					var season = seasons[i].toString();
					var color = colors[season];
					legendData.push({
						title: mapper.amcharts.getSeasonDisplayName(season),
						color: color,
						markerSize: 30,
						markerType: markerType
					});
				}
				return legendData;
			},

			getPrelimLegendData: function(seasons, colors, markerType) {
				var legendData = [];
				seasons.sort(this.sortPrelimSeasons);
				for (var i = 0, len = seasons.length; i < len; i+=1) {
					var season = seasons[i].toString();
					var color = colors[season];
					legendData.push({
						title: mapper.amcharts.getSeasonDisplayName(season),
						color: season.indexOf('prelim') === -1 ? color : '#7F7F7F',
						markerSize: 30,
						markerType: markerType
					});
				}
				return legendData;
			},

			getAnnualLegendData: function(seasons, colors, markerType) {
				var legendData = [];
				seasons.sort(this.sortInterannualSeasons);
				for (var i = 0, len = seasons.length; i < len; i+=1) {
					var season = seasons[i].toString();
					var color = colors[season];
					legendData.push({
						title: mapper.amcharts.getSeasonDisplayName(season),
						color: color,
						markerSize: 30,
						markerType: markerType
					});
				}
				return legendData;
			},

			sortSeasons: function(a, b) {
				if (!isNaN(parseInt(a)) && isNaN(parseInt(b))) return 1;
				if (isNaN(parseInt(a)) && !isNaN(parseInt(b))) return -1;
				if (isNaN(a) && isNaN(b)) return parseInt(b) - parseInt(a);
				if (!isNaN(parseInt(a)) && !isNaN(parseInt(b))) return b - a;
				return 0;
			},

			sortPrelimSeasons: function(a, b) {
				if (b.toString().toLowerCase().indexOf('prelim') !== -1 && parseInt(a.toString().slice(0, 4)) < parseInt(b.toString().slice(0, 4))) return 1;
				if (!isNaN(parseInt(a)) && isNaN(parseInt(b))) return 1;
				if (isNaN(parseInt(a)) && !isNaN(parseInt(b))) return -1;
				if (isNaN(a) && isNaN(b)) return parseInt(b) - parseInt(a);
				if (!isNaN(parseInt(a)) && !isNaN(parseInt(b))) return b - a;
				return 0;
			},

			sortInterannualSeasons: function(a, b) {
				if (!isNaN(a) && isNaN(b)) return 1;
				if (isNaN(a) && !isNaN(b)) return -1;
				if (!isNaN(a) && !isNaN(b)) return b - a;
				return 0;
			},

			/**
			 * If no data is returned from the timeseries request, show a message to the user.
			 */
            setNoData : function(chart) {
                delete chart.dataProvider;
                chart.allLabels = [{
                        text : 'No Data at Selected Coordinates',
                        size : 30,
                        align : 'center',
                        x : 10,
                        bold : true,
                        color : '#CCC',
                        y : 50,
                    }
                ];
                chart.validateData();
            },

			/**
			 * Get the AmCharts date format for the smallest period to be interpreted by parseDates.
			 */
			getMinPeriod : function (period) {
				switch (period) {
				case '1-month':
					return 'MM';
				case '2-month':
					return 'MM';
				case '3-month':
					return 'MM';
				default:
					return 'DD';
				}
			},

			formatYearCategory : function (valueText, date, categoryAxis) {
				return valueText;
			},

			/**
			 * Converts the x values into a timestamp for AmCharts' parseDates.
			 */
			processData : function (period) {
                var dataProvider = this.getData();
                var daysInMonth = {
                    '01': 31,
                    '02': 28,
                    '03': 31,
                    '04': 30,
                    '05': 31,
                    '06': 30,
                    '07': 31,
                    '08': 31,
                    '09': 30,
                    '10': 31,
                    '11': 30,
                    '12': 31,
                };

                for (var prop in dataProvider) {
                    for (var i = 0, len = dataProvider[prop].length; i < len; i+=1) {
                        data = dataProvider[prop][i];
                        if (isNaN(prop)) {
                            var tempYear = new Date().getFullYear().toString();
                        } else {
                            var tempYear = prop;
                        }
                        var month = custom.periodicity.getChartMonthOfPeriod(parseInt(data.x), period, tempYear);
                        var day = custom.periodicity.getChartDayOfPeriod(period, parseInt(data.x), month, tempYear);
                        if (day > daysInMonth[month]) day = daysInMonth[month]; // In case of leap year, make sure the last day of each month is the same.
						data.period = data.x;
                        data.x = new Date(1968, month - 1, day).getTime();
                    }
                }

                this.data = dataProvider;
                return this;
			},

			processAnnualData : function (dataProvider, period) {
				var result = {};

				for (var prop in dataProvider) {
					for (var i = 0, len = dataProvider[prop].length; i < len; i+=1) {
						data = dataProvider[prop][i];
						data.x = data.name;
					}
				}
				return dataProvider;
			},

            processSevenDayData : function (period) {
                var dataProvider = this.getData();

                for (var prop in dataProvider) {
                    var date = new Date(prop, 0, 1);
                    var dataIndex = 0;
                    var firstMonday = 1;

                    while (date.getDay() !== 1) {  // Get the date of the first Monday in the year.
                        firstMonday++
                        date.setDate(firstMonday);
                    }

                    for (var i = 0, len = dataProvider[prop].length; i < len; i+=1) {
                        var data = dataProvider[prop][i];

                        var month = 0;
                        date = new Date(prop, month, firstMonday);
                        var day = ((parseInt(data.x) - 1) * 7) + firstMonday;
                        var daysInMonth = new Date(prop, date.getMonth()+1, 0).getDate();

                        while (day > daysInMonth) {
                            month+=1;
                            day -= daysInMonth;
                            daysInMonth = new Date(prop, month+1, 0).getDate();
                        }

                        date.setMonth(month);
                        date.setDate(day);
                        if (month === 1 && day === 29) {
                            date.setDate(28);
                        }
                        date.setYear(1970);
                        data.x = date.getTime();
                    }
                }

                this.data = dataProvider;
                return this;
            },

            processDailyData : function (period) {
                var data = this.getData();

                for (var prop in data) {
                    for (var i = 0, len = data[prop].length; i < len; i+=1) {
                        data[prop][i].x = new Date(1970, 0, parseInt(data[prop][i].x)).getTime();
                    }
                }

                this.data = data;
                return this;
            },

			/**
			 * Interannual charts are a special case when dealing with cross years. Converting cross years also changes the x 
			 * value for each period but interannual charts need the original x value.
			 */
			handleCrossYears : function (dataProvider, period, startMonth) {
				if (startMonth === 1)
					return;
				var result = {};

				for (var prop in dataProvider) {
                    var periodsPerYear = custom.periodicity.getPeriodsPerYear(period, prop);
                    var splitPeriod = periodsPerYear - custom.periodicity.getPeriodOfYearFromMonth(period, startMonth, prop);
                    result[prop] = [];
					for (var i = 0, len = dataProvider[prop].length; i < len; i+=1) {
						var data = dataProvider[prop][i];
						var x = parseInt(data.x);

						if (x <= splitPeriod) {
							data.x = (x + (periodsPerYear - splitPeriod)).toString();
						} else {
							data.x = (x - (periodsPerYear - (periodsPerYear - splitPeriod))).toString();
						}

						result[prop].push(data);
					}
				}

				return result;
			},

			formatMonthCategory : function (valueText, date, categoryAxis, period) {
				var day = '';
				if (period != "MM") {
					day = ' ' + ('00' + date.getDate()).slice(-2); //for zero padding
				}

				var shortMonths = mapper.periodsConfig[categoryAxis.period].shortMonths;
				var months = mapper.amcharts.common.getMonth(shortMonths, categoryAxis.startMonth);
				return months[date.getMonth()] + day;
			},

			getMonth : function (months, startMonth) {
				if (startMonth > 1) {
					var split = startMonth - 1;
					var firstHalf = months.slice(0, split);
					var secondHalf = months.slice(split);
					months = secondHalf.concat(firstHalf);
				}

				return months;
			},

			/**
			 * This is used whenever you want a chart to have a static y axis.
			 */
            setYAxesMinMax: function(chart, options) {
                if (typeof(options.yAxisRange) !== 'undefined' && options.yAxisRange !== 'auto') {
                    var valueAxes = chart.valueAxes;

                    for (var i = 0; i < valueAxes.length; i++) {

                        var valueAxis = valueAxes[i];

                        if (typeof(options.yAxisRange.min)!=='undefined') {
                            valueAxis.minimum = options.yAxisRange.min;
                        }
                        if (typeof(options.yAxisRange.max)!=='undefined') {
                            valueAxis.maximum = options.yAxisRange.max;
                        }


                        //https://www.amcharts.com/kbase/user-defined-minmax-values-of-value-axis/
                        valueAxis.autoGridCount = false;
                        valueAxis.gridCount = 50;

                    }
                }
            },

            getCategoryBalloonFunction : function(startMonth, period) {
                if (period === '1-dekad') {
                    var months = mapper.amcharts.common.getMonth(mapper.periodsConfig[period].months, startMonth);
                    return function(date) {
                        if (date.getDate() > 20) {
                            var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                            if (startMonth > 1) {
                                days = days.slice(startMonth-1).concat(days.slice(0, startMonth-1));
                            }
                            return months[date.getMonth()] + ' ' + days[date.getMonth()];
                        } else {
                            return months[date.getMonth()] + ' ' + date.getDate();
                        }
                    }
                } else if (period === '1-pentad') {
                    var months = mapper.amcharts.common.getMonth(mapper.periodsConfig[period].months, startMonth);
                    return function(date) {
                        if (date.getDate() > 25) {
                            var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                            if (startMonth > 1) {
                                days = days.slice(startMonth-1).concat(days.slice(0, startMonth-1));
                            }
                            return months[date.getMonth()] + ' ' + days[date.getMonth()];
                        } else {
                            return months[date.getMonth()] + ' ' + date.getDate();
                        }
                    }
                } else if (period === '1-month' || period === '2-month' || period === '3-month') {
                    var months = mapper.amcharts.common.getMonth(mapper.periodsConfig[period].months, startMonth);
                    return function(date) {
                        return months[date.getMonth()];
                    }
                } else if (startMonth === 1) {
                    var months = mapper.periodsConfig[period].months;
                    return function(date) {
                        return months[date.getMonth()] + ' ' + date.getDate();
                    }
                } else {
                    var months = mapper.periodsConfig[period].months;
                    return function(date) {
                        var date = mapper.amcharts.common.convertCrossYearDate(date, startMonth);
                        return months[date.getMonth()] + ' ' + date.getDate();
                    }
                }
            },

			/**
			 * With AmCharts' parseDates, for displaying the correct date for cross years, 
			 * we need to convert the date back to the correct date.
			 */
            convertCrossYearDate: function(date, startMonth) {
                if (startMonth === 1) return date;
                var day = date.getDate();
                var month = date.getMonth();
                for (var i = 1; i <= month; i+=1) {
                    day += new Date(2001, i, 0).getDate();
                }
                var month = startMonth;

                var daysInMonth = new Date(1971, month, 0).getDate();
                while (day > daysInMonth) {
                    day -= daysInMonth;
                    if (month === 12) month = 1;
                    else month += 1;
                    daysInMonth = new Date(1971, month, 0).getDate();
                }
                return new Date(1971, month-1, day);
            }
		}, // End common
	} //end of amcharts
};
