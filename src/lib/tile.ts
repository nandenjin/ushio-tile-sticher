const getMetersByLatLng = function (lat: number, lon: number) {
  const x = (lon * 20037508.34) / 180.0
  let y =
    Math.log(Math.tan(((90.0 + lat) * Math.PI) / 360.0)) / (Math.PI / 180.0)
  y = (y * 20037508.34) / 180.0
  return [x, y]
}

const GEO_R = 6378137
const orgX = -1 * ((2 * GEO_R * Math.PI) / 2)
const orgY = (2 * GEO_R * Math.PI) / 2

/** 緯度経度とズームレベルからタイルインデックスを取得 */
export const getTileByLatLng = (lat: number, lng: number, zoom: number) => {
  const xy = getMetersByLatLng(lat, lng)
  const unit = (2 * GEO_R * Math.PI) / Math.pow(2, zoom)

  const xtile = Math.floor((xy[0] - orgX) / unit)
  const ytile = Math.floor((orgY - xy[1]) / unit)

  return [xtile, ytile]
}
