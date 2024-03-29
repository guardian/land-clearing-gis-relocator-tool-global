import template from '../../templates/template.html'

//import GoogleMapsLoader from '@google/maps'
import mapstyles from '../data/mapstyles.json'
import L from '../modules/leaflet/dist/leaflet-src'
import '../modules/Leaflet.GoogleMutant.js'
import { Gis } from '../modules/gis'
import * as turf from '@turf/turf' //jspm install npm:@turf/turf
import Ractive from 'ractive'
import ractiveTap from 'ractive-events-tap'
import ractiveEventsHover from 'ractive-events-hover'
import ractiveFade from 'ractive-transitions-fade'
import { Toolbelt } from '../modules/toolbelt'
import share from '../modules/share'
//https://github.com/Turfjs/turf/tree/master/packages/turf-transform-translate

export class Relocator {

	constructor(application) {

		var self = this

		this.toolbelt = new Toolbelt();

        this.gis = new Gis();

		this.database = application.database

        this.database.cities = application.settings.cities

        this.settings = application.settings

        this.counter = 0

        this.interval = setInterval(function(){ self.flighcheck(); }, 500);

	}

    getCity(country) {

        return (country==='GB') ? 0 :
            (country==='US') ? 1 :
            (country==='NZ') ? 8 :
            (country==='AU') ? Math.floor(Math.random() * 5) + 3  : 0 ;

    }

    flighcheck() {

        var self = this

        if (window.guardian) {

            try {

                if (window.guardian.config.page.pageAdTargeting.cc) {

                    self.database.displayCity = self.getCity(window.guardian.config.page.pageAdTargeting.cc)

                    self.database.latitude = self.database.cities[self.database.displayCity].latitude

                    self.database.longitude = self.database.cities[self.database.displayCity].longitude

                    if (self.settings.shareLat!=null&&self.settings.shareLng!=null) {
                        console.log("This has the lat and lng in the URL")
                        console.log(self.settings.shareLat,self.settings.shareLng)
                        self.database.latitude = self.settings.shareLat
                        self.database.longitude = self.settings.shareLng
                        self.database.displayCity = -1
                        self.database.dropCity = false
                    }

                    clearInterval(self.interval);

                    self.interval = null

                    self.ractivate()

                }

            } catch(err) {

              console.log(err)

            }

        }

        this.counter = this.counter + 1

        if (this.counter > 5) {

            clearInterval(self.interval);

            self.interval = null
            self.database.displayCity = Math.floor(Math.random() * 8);
            self.database.latitude = self.database.cities[self.database.displayCity].latitude
            self.database.longitude = self.database.cities[self.database.displayCity].longitude

            if (self.settings.shareLat!=null&&self.settings.shareLng!=null) {
                console.log("This has the lat and lng in the URL")
                console.log(self.settings.shareLat,self.settings.shareLng)
                self.database.latitude = self.settings.shareLat
                self.database.longitude = self.settings.shareLng
                self.database.displayCity = -1
                self.database.dropCity = false
            }

            self.ractivate()

        }

    }

    ractivate() {

        console.log("ractivate")

        var self = this
        Ractive.DEBUG = false;
        this.ractive = new Ractive({
            events: { 
                tap: ractiveTap,
                hover: ractiveEventsHover
            },
            el: '#app',
            data: self.database,
            template: template,
        })

        this.ractive.observe('user_input', ( input ) => {

            if (input && input.length > 2) {

               self.database.list = true

                self.database.postcodeShortlist = self.database.postcodes.filter(function(item) {

                    var results = item.meta.toLowerCase()

                    if (results.includes(input.toLowerCase())) {

                        return item

                    }

                });

            } else {

               self.database.list = false

            }

            self.ractive.set(self.database)

        });


        this.ractive.on( 'keydown', function ( event ) {

            if (event.original.keyCode===13) {

                if (self.database.postcodeShortlist.length > 0 && self.database.list) {

                    var lat = self.database.postcodeShortlist[0].latitude
                    var lng = self.database.postcodeShortlist[0].longitude

                    self.database.user_input = ""
                    self.database.list = false
                    self.reposition(lat, lng, false)

                }

                event.original.preventDefault()

            }
           
        });

        this.ractive.on('postcode', (context, lat, lng) => {

            self.database.user_input = ""

            self.database.list = false

            self.reposition(lat, lng, false)

        })

        this.ractive.observe('displayGeo', ( newValue, oldValue ) => {

            self.database.displayGeo = newValue;

            if (oldValue != undefined) {

                this.database.source = this.database.googledoc[self.database.displayGeo].source

                this.database.headline = this.database.googledoc[self.database.displayGeo].headline

                this.database.description = this.database.googledoc[self.database.displayGeo].description

                this.settings.multiply = this.multiplyer(this.database.googledoc[self.database.displayGeo].unit)

                this.settings.area = this.database.googledoc[self.database.displayGeo].area * this.settings.multiply 

                self.reposition(self.database.latitude, self.database.longitude, false)

            }

        });

        this.ractive.observe('displayCity', ( newValue, oldValue ) => {

            if (oldValue != undefined && newValue != -1) {

                self.database.displayCity = newValue;

                self.database.latitude = self.database.cities[self.database.displayCity].latitude

                self.database.longitude = self.database.cities[self.database.displayCity].longitude
            
                self.reposition(self.database.latitude, self.database.longitude, true)


            }
        });

        this.ractive.on( 'geo', function ( context ) {

            if (self.database.userLatitude!=null) {

               self.reposition(self.database.userLatitude, self.database.userLongitude, false)

            }

        });

        this.ractive.on('showLink', function(e) {

            self.database.showLink = self.database.showLink ? false : true ;

            self.ractive.set(self.database)
        })

        self.initMap()

    }

    geocheck() {

        var self = this

        self.database.geolocation = ("geolocation" in navigator) ? true : false ;

        console.log("Geolocation: " + self.database.geolocation)

        var geo_options = {

          enableHighAccuracy : true, 

          maximumAge : 30000, 

          timeout : 27000

        };

        var getCoor = (position) => {

            self.database.userLatitude = position.coords.latitude

            self.database.userLongitude = position.coords.longitude

        }

        var errorCoor = (error) => {
            
            self.database.geolocation = false

        }

        navigator.geolocation.getCurrentPosition(getCoor, errorCoor, geo_options);


    }

    multiplyer(unit) {

        return (unit==='hectares' || unit==='hectare') ? 10000 :
            (unit==='kilometers' || unit==='kilometres') ? 1000000 :
            (unit==='acres' || unit==='acre') ? 4046.86 : 1 ;

    }

    initMap() {

        var self = this

        this.map = new L.Map('map', { 
            renderer: L.canvas(),
            center: new L.LatLng(self.database.latitude, self.database.longitude), 
            zoom: self.settings.zoom,
            scrollWheelZoom: false,
            dragging: true,
            zoomControl: true,
            doubleClickZoom: true,
            zoomAnimation: true
        })

        var styled = L.gridLayer.googleMutant({

            type: 'roadmap',

            styles: mapstyles

        }).addTo(self.map);

        self.createPoly(self.database.latitude, self.database.longitude)

        this.map.on('click', function(e){
          var coord = e.latlng;
          self.database.latitude = coord.lat;
          self.database.longitude = coord.lng;
          self.reposition(self.database.latitude, self.database.longitude, false)
        });

        self.geocheck()

    }

    createPoly(lat,lng) {

        var self = this

        /*
        Latitude measures angular distance from the equator to a point north or south of the equator. 
        While longitude is an angular measure of east/west from the Prime Meridian. 
        Latitude values increase or decrease along the vertical axis, the Y axis. 
        Longitude changes value along the horizontal access, the X axis.
        */

        var unit = Math.sqrt(self.settings.area) / 2;

        var hypotenuse = Math.sqrt( ( unit * unit ) + ( unit * unit ) )

        var feature = [];

        var compass = [45,135,225,315]

        for (var i = 0; i < compass.length; i++) {

            var coordinates = self.gis.createCoord([lng,lat], compass[i], hypotenuse);

            feature.push(coordinates)
        }

        feature.push(feature[0])

        var polygons = turf.polygon([feature]);

        var bbox = turf.bbox(polygons);

        if (self.settings.geoJSON!=null) {

            self.map.removeLayer(self.settings.geoJSON);

        }

        var myStyle = {
            "color": "#c70000",
            "weight": 5,
            "opacity": 0.65
        };

        self.settings.geoJSON = L.geoJSON(polygons, {

            style: myStyle

        }).addTo(self.map);

        try {
            var southWest = L.latLng(bbox[1], bbox[0]);
            var northEast = L.latLng(bbox[3], bbox[2]);
            var bounds = new L.LatLngBounds(southWest,northEast);
            self.map.fitBounds(bounds);
        } catch (e) {
            console.log(e);
        }

    }

    reposition(latitude,longitude,dropCity=true) {

        var self = this

        self.database.latitude = latitude

        self.database.longitude = longitude

        if (self.settings.geoJSON!=null) {

            self.map.removeLayer(self.settings.geoJSON);

        }

        self.createPoly(latitude,longitude)

        if (!dropCity) {
            self.database.displayCity = -1
            self.database.dropCity=false
        } else {
            self.database.dropCity=true
        }

        self.ractive.set(self.database)

    }

}