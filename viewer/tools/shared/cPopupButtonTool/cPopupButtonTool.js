var cPopupButtonTool = 
{
    createExtendedTool: function(owningBlock) {
        var extendedTool = {
            owningBlock: owningBlock,
            showPopupWindow: function() {
                var block = this.owningBlock.blockConfigs;
                var title = block.popupTitle;
                var desc = "<p>" + block.popupBody + "</p>";

                var infoPopup = new Ext.Window
                    ({
                        id : "popupInfoWindow",
                        frame : false,
                        layout : "fit",
                        width : block.popupWidth,
                        height : block.popupHeight,
                        modal : true,
                        plain : true,
                        closable : true,
                        y : 100,
                        bodyStyle : "border: none;border-radius:10px;",
                        items : [{
                                id : "popupInfoBody",
                                items : [{
                                        height: block.popupHeight,
                                        id : 'note',
                                        html : "<div style='font-size: 16px;'>" + title + ":</div></br>" + desc,
                                        style : "font-family: verdana,arial; font-size: 13px; color: #444;padding:30px 20px;line-height: 25px;text-align:justify;",
                                        bodyStyle : "border: none;"
                                    }
                                ]
                            }
                        ]
                    });

                infoPopup.show();
            },
            setCookie: function(cname, cvalue, exdays) {
                var d = new Date();
                d.setTime(d.getTime() + (exdays*24*60*60*1000));
                var expires = "expires="+ d.toUTCString();
                document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
            },
            getCookie: function(cname) {
                var name = cname + "=";
                var decodedCookie = decodeURIComponent(document.cookie);
                var ca = decodedCookie.split(';');
                for(var i = 0; i <ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length);
                    }
                }
                return "";
            }
        };
        
        return extendedTool;
    },
    getComponent: function(extendedTool, items, toolbar, menu) {
        
        var block = extendedTool.owningBlock.blockConfigs;

        block.icon;
        block.text;
        block.tooltip;
        block.width;
        block.height;

        //block.popupTitle = "hello";
        //block.popupBody = "hello";
        //block.popupHeight = 100;

        var component = {
            extendedTool: extendedTool,
            xtype : 'button',
            //cls : 'x-btn-middle white-glyph',
            cls : 'x-btn-middle',
            //iconCls: "fa " + block.icon,
            tooltip : block.tooltip,
            width: block.width,
            height: block.height,
            handler : function () {
                this.extendedTool.showPopupWindow();
            },
            listeners: {
                afterrender: function() {
                    this.extendedTool.component = this;
                    this.extendedTool.owningBlock.component = this;
                    this.extendedTool.owningBlock.rendered = true;
                    
                    if (this.extendedTool.owningBlock.blockConfigs.showOnFirstLoad === true) {
                        var cookie = this.extendedTool.getCookie('popupOnLoad');
                        if (cookie === '') {
                            this.extendedTool.setCookie('popupOnLoad', '1', 1);
                            this.extendedTool.showPopupWindow();
                        }
                    }
                }
            }
        };

        if(typeof(block.text) !== 'undefined')
        {
          component.text = block.text;
        }
        else
        {
            component.iconCls =  "fa " + block.icon;
        }


        return component;
    }
            
};

export var toolName = "cPopupButtonTool";
export var tool = cPopupButtonTool;
