"use client"

import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { subscribeGallery, uploadPhoto, deletePhoto } from "@/lib/firestore/gallery"
import type { GalleryPhoto } from "@/lib/types"

const MAX_PHOTOS = 5

interface Props {
  coupleId: string
  activityId: string
  uid: string
}

export function PhotoGallery({ coupleId, activityId, uid }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsub = subscribeGallery(coupleId, activityId, setPhotos)
    return unsub
  }, [coupleId, activityId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Máximo ${MAX_PHOTOS} fotos por actividad`)
      return
    }
    setUploading(true)
    try {
      await uploadPhoto(coupleId, activityId, uid, file)
      toast.success("Foto subida")
    } catch {
      toast.error("No se pudo subir la foto")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleDelete(photo: GalleryPhoto) {
    try {
      await deletePhoto(coupleId, activityId, photo.id, photo.cloudinaryId)
    } catch {
      toast.error("No se pudo eliminar la foto")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-outline">
          Galería
        </h3>
        <span className="text-xs text-on-surface-variant">{photos.length}/{MAX_PHOTOS}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
            <img
              src={photo.url}
              alt=""
              className="w-full h-full object-cover"
            />
            {photo.uploadedBy === uid && (
              <button
                onClick={() => handleDelete(photo)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-surface/80 backdrop-blur-sm text-error text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Eliminar foto"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-outline-variant/30 flex items-center justify-center text-on-surface-variant/40 text-2xl hover:border-primary/40 hover:text-primary/40 transition-colors disabled:opacity-40"
              aria-label="Agregar foto"
            >
              {uploading ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : "+"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
