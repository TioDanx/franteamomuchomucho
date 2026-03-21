import type { ActivityLocation } from "@/lib/types"

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export function MapsButton({ location }: { location: ActivityLocation }) {
  const hasCoords = location.lat !== undefined && location.lng !== undefined

  if (hasCoords) {
    const { lat, lng } = location as { lat: number; lng: number }
    const staticMapUrl = MAPS_KEY
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x200&markers=${lat},${lng}&key=${MAPS_KEY}`
      : null
    const deepLink = `geo:${lat},${lng}`

    return (
      <a
        href={deepLink}
        className="block w-full rounded-2xl overflow-hidden active:scale-95 transition-transform"
        aria-label="Abrir en Maps"
      >
        {staticMapUrl ? (
          <img
            src={staticMapUrl}
            alt={location.address}
            className="w-full h-[120px] object-cover"
          />
        ) : (
          <div className="w-full h-[120px] bg-surface-container-high flex items-center justify-center text-on-surface-variant text-sm">
            📍 {location.address}
          </div>
        )}
      </a>
    )
  }

  // Fallback: no coords — plain text row only, don't render a button
  return null
}
