import { OSM_ATTRIBUTION, OSM_TILE_URL } from '@shared/config/app'
import type { CircleMarker, Map as LeafletMap, LeafletMouseEvent } from 'leaflet'
import { useEffect, useRef } from 'react'
import type { LatLng } from './helpers'

import 'leaflet/dist/leaflet.css'

export function LeafletMapPicker({
  initialCenter,
  selected,
  onSelect,
}: {
  initialCenter: LatLng
  selected: LatLng | null
  onSelect: (coords: LatLng) => void
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let map: LeafletMap | undefined
    let marker: CircleMarker | undefined
    let disposed = false

    void (async () => {
      const L = await import('leaflet')
      if (disposed || !rootRef.current) return

      const mapInstance = L.map(rootRef.current, { zoomControl: true }).setView(
        [selected?.lat ?? initialCenter.lat, selected?.lng ?? initialCenter.lng],
        13,
      )
      map = mapInstance

      L.tileLayer(OSM_TILE_URL, {
        maxZoom: 19,
        attribution: OSM_ATTRIBUTION,
      }).addTo(mapInstance)

      if (selected) {
        marker = L.circleMarker([selected.lat, selected.lng], {
          radius: 8,
          color: '#2563eb',
          weight: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.7,
        }).addTo(mapInstance)
      }

      mapInstance.on('click', (e: LeafletMouseEvent) => {
        const coords: LatLng = { lat: e.latlng.lat, lng: e.latlng.lng }

        if (marker) {
          marker.setLatLng([coords.lat, coords.lng])
        } else {
          marker = L.circleMarker([coords.lat, coords.lng], {
            radius: 8,
            color: '#2563eb',
            weight: 2,
            fillColor: '#3b82f6',
            fillOpacity: 0.7,
          }).addTo(mapInstance)
        }

        onSelect(coords)
      })
    })()

    return () => {
      disposed = true
      if (map) map.remove()
    }
  }, [initialCenter.lat, initialCenter.lng, onSelect, selected])

  return <div ref={rootRef} className="h-64 w-full" />
}
