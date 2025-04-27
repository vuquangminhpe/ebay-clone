class GeocodingService {
  calculateDistance(originLat: number, originLng: number, destLat: number, destLng: number): number {
    const R = 6371
    const dLat = this.deg2rad(destLat - originLat)
    const dLon = this.deg2rad(destLng - originLng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(originLat)) * Math.cos(this.deg2rad(destLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return distance
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}

const geocodingService = new GeocodingService()
export default geocodingService
