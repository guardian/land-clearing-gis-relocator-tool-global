//https://self.stackexchange.com/questions/5821/calculating-latitude-longitude-x-miles-from-point 

export class Gis {

  constructor() {

    console.log("Initiated GIS class")

  }
  /**
  * All coordinates expected EPSG:4326
  * @param {Array} start Expected [lon, lat]
  * @param {Array} end Expected [lon, lat]
  * @return {number} Distance - meter.
  */
  calculateDistance(start, end) {

    var self = this
    var lat1 = parseFloat(start[1]),
        lon1 = parseFloat(start[0]),
        lat2 = parseFloat(end[1]),
        lon2 = parseFloat(end[0]);

    return self.sphericalCosinus(lat1, lon1, lat2, lon2);
  }

  /**
  * All coordinates expected EPSG:4326
  * @param {number} lat1 Start Latitude
  * @param {number} lon1 Start Longitude
  * @param {number} lat2 End Latitude
  * @param {number} lon2 End Longitude
  * @return {number} Distance - meters.
  */
  sphericalCosinus(lat1, lon1, lat2, lon2) {
    var self = this
    var radius = 6371e3; // meters
    var dLon = self.toRad(lon2 - lon1),
        lat1 = self.toRad(lat1),
        lat2 = self.toRad(lat2),
        distance = Math.acos(Math.sin(lat1) * Math.sin(lat2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon)) * radius;

    return distance;
  }

  /**
  * @param {Array} coord Expected [lon, lat] EPSG:4326
  * @param {number} bearing Bearing in degrees
  * @param {number} distance Distance in meters
  * @return {Array} Lon-lat coordinate.
  */
  createCoord(coord, bearing, distance) {

    var self = this
    /** http://www.movable-type.co.uk/scripts/latlong.html
    * φ is latitude, λ is longitude, 
    * θ is the bearing (clockwise from north), 
    * δ is the angular distance d/R; 
    * d being the distance travelled, R the earth’s radius*
    **/
    var 
      radius = 6371e3, // meters
      δ = Number(distance) / radius, // angular distance in radians
      θ = self.toRad(Number(bearing)),
      φ1 = self.toRad(coord[1]),
      λ1 = self.toRad(coord[0]);

    var φ2 = Math.asin(Math.sin(φ1)*Math.cos(δ) + 
      Math.cos(φ1)*Math.sin(δ)*Math.cos(θ));

    var λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ)*Math.cos(φ1),
      Math.cos(δ)-Math.sin(φ1)*Math.sin(φ2));
    // normalise to -180..+180°
    λ2 = (λ2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI; 

    return [self.toDeg(λ2), self.toDeg(φ2)];
  }
  /**
   * All coordinates expected EPSG:4326
   * @param {Array} start Expected [lon, lat]
   * @param {Array} end Expected [lon, lat]
   * @return {number} Bearing in degrees.
   */
  getBearing(start, end) {
    var self = this
    var
      startLat = self.toRad(start[1]),
      startLong = self.toRad(start[0]),
      endLat = self.toRad(end[1]),
      endLong = self.toRad(end[0]),
      dLong = endLong - startLong;

    var dPhi = Math.log(Math.tan(endLat/2.0 + Math.PI/4.0) / 
      Math.tan(startLat/2.0 + Math.PI/4.0));

    if (Math.abs(dLong) > Math.PI) {
      dLong = (dLong > 0.0) ? -(2.0 * Math.PI - dLong) : (2.0 * Math.PI + dLong);
    }

    return (self.toDeg(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
  }

  toDeg(n) { return n * 180 / Math.PI; }

  toRad(n) { return n * Math.PI / 180; }

  /*
  UTM is the acronym for Universal Transverse Mercator, a plane coordinate grid system 
  named for the map projection on which it is based (Transverse Mercator). 
  The UTM system consists of 60 zones, each 6-degrees of longitude in width.
  */
  utm(lat, lon) {

      // http://en.wikipedia.org/wiki/Universal_Transverse_Mercator_coordinate_system
      const a = 6378.137, f = 1/298.257223563;
      const N0 = 0, E0 = 500, k0 = 0.9996;
      const n = f / (2 - f);
      const n2 = n*n, n3 = n*n2, n4 = n*n3;
      const t_part = 2 * Math.sqrt(n)/(1 + n);
      const A = a/(1+n) * (1 + 1/4*n2 + 1/64*n4);
      const zone = 30;
      const λ0 = self.toRad(zone * 6 - 183);
      const k0A = k0 * A;

      let φ = self.toRad(lat);
      let λ = self.toRad(lon) - λ0;

      let sinφ = Math.sin(φ);
      let t = Math.sinh(Math.atanh(sinφ) - t_part * Math.atanh(t_part * sinφ));

      let E = E0 + k0A*Math.atanh(Math.sin(λ)/Math.sqrt(1 + t*t));
      let N = N0 + k0A*Math.atan(t/Math.cos(λ));
      return [E, -N];
  }

  // Returns the centroid of supplied points
  centroid(points) {
      return points.reduce((a, b) => [a[0] + b[0], a[1] + b[1]]).map((c) => c / points.length);
  }

  /**
   * All coordinates expected EPSG:4326
   * Convert latitude, longitude coordinates to x, y coordinates to be used with an image
   * https://stackoverflow.com/questions/2103924/mercator-longitude-and-latitude-calculations-to-x-and-y-on-a-cropped-map-of-the/10401734#10401734
   * https://thomasthoren.com/2016/02/28/making-a-new-york-times-map.html
   * https://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object/14691788#14691788
   */
  convertGeoToPixel(latitude, longitude,
                    mapWidth, // in pixels
                    mapHeight, // in pixels
                    mapLngLeft, // in degrees. the longitude of the left side of the map (i.e. the longitude of whatever is depicted on the left-most part of the map image)
                    mapLngRight, // in degrees. the longitude of the right side of the map
                    mapLatBottom) // in degrees.  the latitude of the bottom of the map
  {

    var self = this
    const mapLatBottomRad = mapLatBottom * Math.PI / 180
    const latitudeRad = latitude * Math.PI / 180
    const mapLngDelta = (mapLngRight - mapLngLeft)

    const worldMapWidth = ((mapWidth / mapLngDelta) * 360) / (2 * Math.PI)
    const mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(mapLatBottomRad)) / (1 - Math.sin(mapLatBottomRad))))

    const x = (longitude - mapLngLeft) * (mapWidth / mapLngDelta)
    const y = mapHeight - ((worldMapWidth / 2 * Math.log((1 + Math.sin(latitudeRad)) / (1 - Math.sin(latitudeRad)))) - mapOffsetY)

    return {x, y} // the pixel x,y value of this point on the map image
  }

};