/**
 * Pimcore
 *
 * LICENSE
 *
 * This source file is subject to the new BSD license that is bundled
 * with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.pimcore.org/license
 *
 * @copyright  Copyright (c) 2009-2010 elements.at New Media Solutions GmbH (http://www.elements.at)
 * @license    http://www.pimcore.org/license     New BSD License
 */

pimcore.registerNS("pimcore.object.tags.hotspotimage");
pimcore.object.tags.hotspotimage = Class.create(pimcore.object.tags.image, {
    hotspotCount: 0,
    type: "hotspotimage",

    data: null,
    hotspots: {},
    initialize: function (data, layoutConf) {
        if (data) {
            this.data = data.image;
            if(data.hotspots && data.hotspots != "null") {
                this.loadedHotspots = data.hotspots;
            }
        }
        this.layoutConf = layoutConf;

    },

    getLayoutEdit: function () {

        if (intval(this.layoutConf.width) < 1) {
            this.layoutConf.width = 100;
        }
        if (intval(this.layoutConf.height) < 1) {
            this.layoutConf.height = 100;
        }

        var conf = {
            width: this.layoutConf.width,
            height: this.layoutConf.height,
            tbar: [{
                xtype: "tbspacer",
                width: 20,
                height: 16,
                cls: "pimcore_icon_droptarget"
            },
            {
                xtype: "tbtext",
                text: "<b>" + this.layoutConf.title + "</b>"
            },"->",{
                xtype: "button",
                iconCls: "pimcore_icon_add",
                handler: this.addSelector.bind(this)
            },{
                xtype: "button",
                iconCls: "pimcore_icon_edit",
                handler: this.openImage.bind(this)
            }, {
                xtype: "button",
                iconCls: "pimcore_icon_delete",
                handler: this.empty.bind(this)
            },{
                xtype: "button",
                iconCls: "pimcore_icon_search",
                handler: this.openSearchEditor.bind(this)
            }]
        };

        this.layout = new Ext.Panel(conf);
        this.createImagePanel();

        return this.layout;
    },

    createImagePanel: function() {
        this.panel = new Ext.Panel({
            width: this.layoutConf.width,
            height: this.layoutConf.height-27,
            bodyCssClass: "pimcore_droptarget_image"}
        );
        this.layout.add(this.panel);


        this.panel.on("render", function (el) {

            // add drop zone
            new Ext.dd.DropZone(el.getEl(), {
                reference: this,
                ddGroup: "element",
                getTargetFromEvent: function(e) {
                    return this.reference.layout.getEl();
                },

                onNodeOver : function(target, dd, e, data) {

                    if (data.node.attributes.type == "image") {
                        return Ext.dd.DropZone.prototype.dropAllowed;
                    } else {
                        return Ext.dd.DropZone.prototype.dropNotAllowed;
                    }

                },

                onNodeDrop : this.onNodeDrop.bind(this)
            });


            el.getEl().on("contextmenu", this.onContextMenu.bind(this));

            if (this.data) {
                this.updateImage();
            }

        }.bind(this));

        this.layout.doLayout();

    },

    updateImage: function () {
        var path = "/admin/asset/get-image-thumbnail/id/" + this.data + "/width/" + (this.layoutConf.width - 20) + "/aspectratio/true";
        this.panel.getEl().update('<img id="selectorImage" style="padding: 10px 0;padding-left:8px" class="pimcore_droptarget_image" src="' + path + '" />');


        console.log(this.loadedHotspots);
        if(this.loadedHotspots.length > 0) {
            for(var i = 0; i < this.loadedHotspots.length; i++) {
                this.addHotspot(this.loadedHotspots[i]);
            }

        }

    },

    addSelector: function() {
        Ext.MessageBox.prompt(t('hotspotimage_add_selector'), t('hotspotimage_enter_name_of_new_hotspot'), this.completeAddSelector.bind(this), null, null, "");
    },

    completeAddSelector: function(button, value, object) {
        if(button == "ok") {
            var hotspot = {
                name: value,
                top: 10,
                left: 10,
                width: 100,
                height: 100
            };
            this.addHotspot(hotspot);
        }
    },

    addHotspot: function(hotspot) {
        this.hotspotCount++;
        var number = this.hotspotCount;
        console.log("add hotspot: " + hotspot.name + " => " + number);

        this.panel.getEl().createChild({
            tag: 'div',
            id: 'selector' + number,
            style: 'cursor:move; position: absolute; top: ' + hotspot.top + '; left: ' + hotspot.left + ';z-index:9000;',
            html: this.getSelectorHtml(hotspot.name)
        });

        var resizer = new Ext.Resizable('selector' + number, {
            pinned:true,
            minWidth:50,
            minHeight: 50,
            preserveRatio: false,
            dynamic:true,
            handles: 'all',
            draggable:true,
            width: hotspot.width,
            height: hotspot.height

        });

        this.hotspots[number] = hotspot;
        this.dirty = true;

        resizer.addListener("resize", function(item, width, height, e) {
            this.handleSelectorChanged(number);
        }.bind(this));

        Ext.get('selector' + number).on('mouseup', function(){
            this.handleSelectorChanged(number);
        }.bind(this));

        Ext.get('selector' + number).on("contextmenu", this.onSelectorContextMenu.bind(this, number));
    },

    getSelectorHtml: function(text) {
        return '<p style="background-color:#FFF;padding-top:5px;padding-left:7px;font: normal 11px arial,tahoma, helvetica">' + text + '</p>';
    },

    handleSelectorChanged: function(selectorNumber) {
        var dimensions = Ext.get("selector" + selectorNumber).getStyles("top","left","width","height");
        this.hotspots[selectorNumber].top = dimensions.top;
        this.hotspots[selectorNumber].left = dimensions.left;
        this.hotspots[selectorNumber].width = dimensions.width;
        this.hotspots[selectorNumber].height = dimensions.height;

        this.dirty = true;
    },

    onSelectorContextMenu: function (id, e) {
        var menu = new Ext.menu.Menu();
        menu.add(new Ext.menu.Item({
            text: t('delete'),
            iconCls: "pimcore_icon_delete",
            handler: function (item) {
                console.log(id);
                console.log(item);
                Ext.get('selector' + id).hide();
                Ext.get('selector' + id).remove();
            }.bind(this)
        }));

//        menu.add(new Ext.menu.Item({
//            text: t('edit'),
//            iconCls: "pimcore_icon_open",
//            handler: function (item) {
//                item.parentMenu.destroy();
//
//                this.openImage();
//            }.bind(this)
//        }));

        menu.showAt(e.getXY());

        e.stopEvent();
    },

    empty: function () {
        this.data = null;
        this.hotspots = null;
        this.dirty = true;
        this.layout.removeAll();
        this.createImagePanel();
    },

    getValue: function () {
        return {image: this.data, hotspots: this.hotspots};
    }
});