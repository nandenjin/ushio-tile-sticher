/**
 * Converts latitude and longitude coordinates to meters using the Web Mercator projection.
 * @param lat - The latitude coordinate.
 * @param lon - The longitude coordinate.
 * @returns An array containing the x and y coordinates in meters.
 */
const getMetersByLatLng = function (lat: number, lon: number) {
  const x = (lon * 20037508.34) / 180.0
  let y =
    Math.log(Math.tan(((90.0 + lat) * Math.PI) / 360.0)) / (Math.PI / 180.0)
  y = (y * 20037508.34) / 180.0
  return [x, y]
}

/** Radius of the Earth in meters */
const GEO_R = 6378137

/**
 * The x-coordinate of the origin point.
 */
const originX = -1 * ((2 * GEO_R * Math.PI) / 2)

/**
 * The y-coordinate of the origin point.
 */
const originY = (2 * GEO_R * Math.PI) / 2

/**
 * Calculates the tile coordinates (xtile, ytile) based on the given latitude, longitude, and zoom level.
 * @param lat - The latitude value.
 * @param lng - The longitude value.
 * @param zoom - The zoom level.
 * @returns An array containing the xtile and ytile values.
 */
export const getTileByLatLng = (lat: number, lng: number, zoom: number) => {
  const xy = getMetersByLatLng(lat, lng)
  const unit = (2 * GEO_R * Math.PI) / Math.pow(2, zoom)

  const xtile = Math.floor((xy[0] - originX) / unit)
  const ytile = Math.floor((originY - xy[1]) / unit)

  return [xtile, ytile]
}
