import { useRef, useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/shared'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { SalesByLocation } from '@/@types/dashboard'

// Replace with your actual Mapbox token in a real environment
// In production, this should be stored in environment variables
mapboxgl.accessToken = 'pk.placeholder.mapbox.token'

interface SalesMapProps {
    data: SalesByLocation[]
    loading: boolean
}

const SalesMap = ({ data = [], loading }: SalesMapProps) => {
    const mapContainer = useRef<HTMLDivElement | null>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const [mapInitialized, setMapInitialized] = useState(false)

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [-95.7129, 37.0902], // Center on the US
            zoom: 3,
        })

        map.current.on('load', () => {
            setMapInitialized(true)
        })

        return () => {
            map.current?.remove()
            map.current = null
        }
    }, [])

    // Add data points when data changes or map initializes
    useEffect(() => {
        if (!map.current || !mapInitialized || loading || data.length === 0)
            return

        // Clear existing markers
        const markers = document.querySelectorAll('.mapboxgl-marker')
        markers.forEach((marker) => marker.remove())

        // Add new markers
        data.forEach((location) => {
            // Skip if missing coordinates
            if (!location.latitude || !location.longitude) return

            // Calculate marker size based on revenue (min 20px, max 50px)
            const minSize = 20
            const maxSize = 50
            const maxRevenue = Math.max(...data.map((loc) => loc.revenue))
            const size =
                minSize + (location.revenue / maxRevenue) * (maxSize - minSize)

            // Create marker element
            const el = document.createElement('div')
            el.className = 'mapboxgl-marker'
            el.style.width = `${size}px`
            el.style.height = `${size}px`
            el.style.borderRadius = '50%'
            el.style.backgroundColor = 'rgba(56, 189, 248, 0.6)'
            el.style.border = '2px solid rgba(56, 189, 248, 1)'

            // Add tooltip
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                    <strong>${location.name}</strong><br/>
                    Revenue: $${location.revenue.toLocaleString()}<br/>
                    Transactions: ${location.count.toLocaleString()}
                `)

            // Add marker to map
            new mapboxgl.Marker(el)
                .setLngLat([location.longitude, location.latitude])
                .setPopup(popup)
                .addTo(map.current!)
        })

        // Fit map to markers if we have at least 2 locations
        if (data.length >= 2) {
            const bounds = new mapboxgl.LngLatBounds()

            data.forEach((location) => {
                if (location.latitude && location.longitude) {
                    bounds.extend([location.longitude, location.latitude])
                }
            })

            map.current.fitBounds(bounds, {
                padding: 50,
                maxZoom: 9,
            })
        }
    }, [data, loading, mapInitialized])

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loading loading={true} size={50} />
            </div>
        )
    }

    if (!data.length) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                No location data available
            </div>
        )
    }

    return (
        <div
            ref={mapContainer}
            className="h-full w-full rounded-lg overflow-hidden"
        />
    )
}

export default SalesMap
