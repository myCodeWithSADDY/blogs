import { createContext, useContext } from 'react'
import { supabase } from '@/integrations/supabase/client'

export type Role = 'ADMIN' | 'EDITOR' | 'AUTHOR'
export type Staff = { userId: string; email: string; roles: Role[] }

export const StaffContext = createContext<Staff | null>(null)
export function useStaff() {
  const s = useContext(StaffContext)
  if (!s) throw new Error('useStaff outside admin')
  return {
    ...s,
    isAdmin: s.roles.includes('ADMIN'),
    canEdit: s.roles.includes('ADMIN') || s.roles.includes('EDITOR'),
  }
}

export const MEDIA_BUCKET = 'editorial-media'

/** Upload an image to the media library; returns the stored media row. */
export async function uploadImage(file: File, userId: string, alt = '') {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  const path = `${userId}/${Date.now()}-${safe}`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type })
  if (error) throw error
  const dims = await new Promise<{ w: number; h: number } | null>((res) => {
    const img = new Image()
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => res(null)
    img.src = URL.createObjectURL(file)
  })
  const { data, error: e2 } = await supabase
    .from('media')
    .insert({
      file_name: file.name,
      storage_path: path,
      public_url: `/media/${path}`,
      mime_type: file.type,
      size_bytes: file.size,
      width: dims?.w ?? null,
      height: dims?.h ?? null,
      alt_text: alt,
      uploaded_by: userId,
    })
    .select()
    .single()
  if (e2) throw e2
  return data
}
