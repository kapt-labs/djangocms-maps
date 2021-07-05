/*
 * Mapbox OSM map for djangocms_maps, https://github.com/Organice/djangocms-maps
 *
 * Copyright (c) 2016 Peter Bittner <django@bittner.it>
 * Copyright (c) 2016 Divio (original author for Google Maps implementation)
 *
 * documentation: https://www.mapbox.com/mapbox.js/api/
 */

const djangocms = window.djangocms || {};

const STYLES = {
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
        let that = this;
        let options = Object.assign({}, this.options, opts);

        // loop through every instance
        let containers = document.querySelectorAll(options.container);
        for (let container of containers) {
            that._loadMap(container);
        }
    },

    /**
     * Loads a single Map instance provided by ``init``.
     *
     * @method _loadMap
     * @private
     * @param {object} instance used for initialization
     */
    _loadMap: function _loadMap(instance) {
        let that = this;
        const container = instance;
        const data = container.dataset;

        let options = {
            container: container,
            apiKey: data.api_key,
            zoom: data.zoom,
            scrollWheelZoom: data.scrollwheel === "true",
            doubleClickZoom: data.double_click_zoom === "true",
            dragging: data.draggable === "true",
            keyboard: data.keyboard_shortcuts === "true",
            panControl: data.pan_control === "true",
            zoomControl: data.zoom_control === "true",
            layersControl: data.layers_control === "true",
            scaleBar: data.scale_bar === "true",
            style: STYLES.default,
            styles: data.style,
            center: {lat: 46.94708, lng: 7.445975} // default to switzerland;
        };

        mapboxgl.accessToken = options.apiKey;

        let map = new mapboxgl.Map(options);
        var markers = document.getElementsByClassName('js-marker');
        markers = [].slice.call(markers);


        if (options.layersControl) {
            const layer = new LayersControl();
            map.addControl(layer, 'top-left');
        }
        if (options.zoomControl || options.panControl) {
            const nav = new mapboxgl.NavigationControl();
            map.addControl(nav, 'top-right');
        }
        if (options.scaleBar) {
            const scale = new mapboxgl.ScaleControl({
                maxWidth: 80,
                unit: 'metric'
            });
            map.addControl(scale);
        }

        // display markers
        for (marker of markers){
            const marker_data = marker.dataset;
            if (marker.dataset.lat.length && marker.dataset.lng.length) {
                const latlng = {
                    lat: parseFloat(marker.dataset.lat.replace(",", ".")),
                    lng: parseFloat(marker.dataset.lng.replace(",", "."))
                };
                this.addMarker(map, latlng, marker_data);
            } else {
                // load latlng from given address
                const geocoder = new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken,
                    mapboxgl: mapboxgl,
                    limit: 1
                });
                const marker_data = marker.dataset;
                const geocoderContainer = document.createElement("div");
                geocoderContainer.setAttribute('style', 'display: none;');
                container.append(geocoderContainer);
                geocoder.addTo(geocoderContainer);
                geocoder.query(marker.dataset.address).on("results", function(geodata) {
                    if (geodata.features[0].center) {
                        const center = geodata.features[0].center;
                        that.addMarker(map, center, marker_data);
                    }
                });
            }
        }

        // latitute or longitude have precedence over the address when provided
        // inside the plugin form
        if (data.lat.length && data.lng.length) {
            const latlng = {
                lat: parseFloat(data.lat.replace(",", ".")),
                lng: parseFloat(data.lng.replace(",", "."))
            };
            map.jumpTo({center: latlng, zoom: data.zoom});
        } else {
            // load latlng from given address
            const geocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl: mapboxgl,
                limit: 1
            });
            const geocoderContainer = document.createElement("div");
            geocoderContainer.setAttribute('style', 'display: none;');
            container.append(geocoderContainer);
            geocoder.addTo(geocoderContainer);
            geocoder.query(data.address).on("results", function(geodata) {
                if (geodata.features[0].center) {
                    const center = geodata.features[0].center;
                    map.jumpTo({center: center, zoom: options.zoom});
                }
            });
        }
    },

    /**
     * Adds a marker to a Map instance.
     *
     * @method _loadMap
     * @param map ``mapboxgl.Map`` instance
     * @param latlng proper formatted lat/lng coordinates
     * @param data the data objects from a Map instance
     */
    addMarker: function addMarker(map, latlng, data) {
        let windowContent = "";
        let marker = new mapboxgl.Marker()
            .setLngLat(latlng)
            .addTo(map);

        if (data.showContent === "true") {
            // prepare info window
            if (data.title.length) {
                windowContent += "<h2>" + data.title + "</h2>";
            }

            windowContent += data.address;

            if (data.infoContent.length) {
                windowContent += "<br /><em>" + data.infoContent + "</em>";
            }

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(windowContent);
            marker.setPopup(popup).togglePopup()
        }

        // reposition map
        map.panTo(latlng);
    }
};

class LayersControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl-layers mapboxgl-ctrl-group mapboxgl-ctrl';
    
        const that = this;
        let inputs = [];
        Object.keys(STYLES).forEach(function(key, index) {
            const input = document.createElement('input');
            input.setAttribute('id', 'layers_control_' + key);
            input.setAttribute('type', 'radio');
            input.setAttribute('name', 'layers-toggle');
            input.setAttribute('value', key);
            if (index == 0) {
                input.setAttribute('checked', 'checked');
            }
            that._container.append(input);

            const label = document.createElement('label');
            label.setAttribute('for', input.id);
            label.innerText = key;
            that._container.append(label);

            inputs.push(input);
        });

        function switchLayer(layer) {
            const styleId = layer.target.value;
            map.setStyle(STYLES[styleId]);
        }
            
        for (let input of inputs) {
            input.onclick = switchLayer;
        }
        
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

// initializes all occurring Maps plugins at once.
djangocms.Maps.init();
