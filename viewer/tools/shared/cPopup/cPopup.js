/* This popup tool is just a button that pops up an
   alert.  The button icon, title, and message is
   configured within the template.
*/
var cPopup = {
  options: {},
  getComponent: function(extendedTool, items,toolbar, menu) {
    var block = extendedTool.owningBlock.blockConfigs;

    var extjsButton = {
      extendedTool: extendedTool,
      xtype: 'button',
      id: 'btn-popup',
      iconCls: block.iconCls,
      marginLeft: 10,
      marginBottom: 10,
      tooltip: block.tooltip,
      handler: function() {
        Ext.Msg.alert(block.title, block.popupMessage);
      }
    };
    return extjsButton;
  }
};

export var toolName = "cPopup";
export var tool = cPopup;
