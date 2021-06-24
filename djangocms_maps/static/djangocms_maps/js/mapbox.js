/*
 * Mapbox OSM map for djangocms_maps, https://github.com/Organice/djangocms-maps
 *
 * Copyright (c) 2016 Peter Bittner <django@bittner.it>
 * Copyright (c) 2016 Divio (original author for Google Maps implementation)
 *
 * documentation: https://www.mapbox.com/mapbox.js/api/
 */

var djangocms = window.djangocms || {};

var STYLES = {
    default: 'mapbox://styles/mapbox/streets-v11',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v11'
}

/**
 * Mapbox OSM map instances from plugins.
 *
 * @class Maps
 * @namespace djangocms
 */

djangocms.Maps = {

    options: {
        container: ".djangocms-maps-container"
    },

    /**
     * Initializes all Map instances.
     *
     * @method init
     * @private
     * @param {Object} opts overwrite default options
     */
    init: function init(opts) {
        var that = this;
        var options = $.extend(true, {}, this.options, opts);

        // loop through every instance
        var containers = $(options.container);
        containers.each(function (index, container) {
            that._loadMap($(container));
        });
    },

    /**
     * Loads a single Map instance provided by ``init``.
     *
     * @method _loadMap
     * @private
     * @param {jQuery} instance jQuery element used for initialization
     */
    _loadMap: function _loadMap(instance) {
        var that = this;
        var container = instance;
        var data = container.data();

        var options = {
            container: container[0],
            apiKey: data.api_key,
            zoom: data.zoom,
            scrollWheelZoom: data.scrollwheel,
            doubleClickZoom: data.double_click_zoom,
            dragging: data.draggable,
            keyboard: data.keyboard_shortcuts,
            panControl: data.pan_control,
            zoomControl: data.zoom_control,
            layersControl: data.layers_control,
            scaleBar: data.scale_bar,
            style: STYLES.default,
            styles: data.style,
            center: { lat: 46.94708, lng: 7.445975 } // default to switzerland;
        };

        mapboxgl.accessToken = options.apiKey;

        var map = new mapboxgl.Map(options);

        if (options.layersControl) {
            var layer = new LayersControl();
            map.addControl(layer, 'top-left');
        }
        if (options.zoomControl || options.panControl) {
            var nav = new mapboxgl.NavigationControl();
            map.addControl(nav, 'top-right');
        }
        if (options.scaleBar) {
            var scale = new mapboxgl.ScaleControl({
                maxWidth: 80,
                unit: 'metric'
            });
            map.addControl(scale);
        }

        // latitute or longitute have precedence over the address when provided
        // inside the plugin form
        data.lat = data.lat.toString();
        data.lng = data.lng.toString();
        if (data.lat.length && data.lng.length) {
            var latlng = {
                lat: parseFloat(data.lat.replace(",", ".")),
                lng: parseFloat(data.lng.replace(",", "."))
            };
            map.jumpTo({center: latlng, zoom: data.zoom});
            this.addMarker(map, latlng, data);
        } else {
            // load latlng from given address
            var geocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl: mapboxgl,
                limit: 1
            });
            var geocoderContainer = document.createElement("div");
            geocoderContainer.setAttribute('style', 'display: none;');
            container.append(geocoderContainer);
            geocoder.addTo(geocoderContainer);
            geocoder.query(data.address).on("results", function(geodata) {
                if (geodata.features[0].center) {
                    var center = geodata.features[0].center;
                    map.jumpTo({center: center, zoom: 13});
                    that.addMarker(map, center, data);
                }
            });
        }
    },

    /**
     * Adds a marker to a Map instance.
     *
     * @method _loadMap
     * @param {jQuery} map ``L.Map`` instance
     * @param {jQuery} latlng proper formatted lat/lng coordinates
     * @param {jQuery} data the data objects from a Map instance
     */
    addMarker: function addMarker(map, latlng, data) {
        var windowContent = "";
        var marker = new mapboxgl.Marker()
            .setLngLat(latlng)
            .addTo(map);

        if (data.show_infowindow) {
            // prepare info window
            if (data.title) {
                windowContent += "<h2>" + data.title + "</h2>";
            }

            windowContent += data.address;

            if (data.info_content) {
                windowContent += "<br /><em>" + data.info_content + "</em>";
            }

            var popup = new mapboxgl.Popup({ offset: 25 }).setHTML(windowContent);
            marker.setPopup(popup).togglePopup()
        }

        // reposition map
        map.panTo(latlng);
    }
};

function LayersControl() { }

LayersControl.prototype.onAdd = function(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl-layers mapboxgl-ctrl-group mapboxgl-ctrl';
   
    var that = this;
    var inputs = [];
    Object.keys(STYLES).forEach(function(key, index) {
        var input = document.createElement('input');
        input.setAttribute('id', 'layers_control_' + key);
        input.setAttribute('type', 'radio');
        input.setAttribute('name', 'layers-toggle');
        input.setAttribute('value', key);
        if (index == 0) {
            input.setAttribute('checked', 'checked');
        }
        that._container.append(input);

        var label = document.createElement('label');
        label.setAttribute('for', input.id);
        label.innerText = key;
        that._container.append(label);

        inputs.push(input);
    });

    function switchLayer(layer) {
        var styleId = layer.target.value;
        map.setStyle(STYLES[styleId]);
    }
        
    $(inputs).each(function (index, input) {
        $(inputs).click(switchLayer);
    })
    
    return this._container;
};

LayersControl.prototype.onRemove = function () {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
};

// initializes all occurring Maps plugins at once.
djangocms.Maps.init();
