-- ============================================================
-- 009_streaming_and_media_experience.sql
-- Public stream sessions, private media bucket, and gallery metadata
-- ============================================================

ALTER TABLE stream_sessions
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_stream_sessions_live_public
  ON stream_sessions(is_live, is_public);

CREATE INDEX IF NOT EXISTS idx_stream_sessions_sort
  ON stream_sessions(sort_order, started_at DESC, created_at DESC);

ALTER TABLE media
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS alt_text TEXT,
  ADD COLUMN IF NOT EXISTS album TEXT,
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS price_label TEXT,
  ADD COLUMN IF NOT EXISTS purchase_url TEXT,
  ADD COLUMN IF NOT EXISTS download_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE media
SET
  title = COALESCE(title, NULLIF(caption, ''), 'Imagen de galeria'),
  alt_text = COALESCE(
    alt_text,
    NULLIF(caption, ''),
    title,
    'Imagen de la galeria oficial'
  ),
  storage_bucket = COALESCE(
    storage_bucket,
    CASE
      WHEN url LIKE 'event-media/%' THEN split_part(url, '/', 1)
      ELSE NULL
    END
  ),
  storage_path = COALESCE(
    storage_path,
    CASE
      WHEN url LIKE 'event-media/%' THEN substring(url from '^[^/]+/(.*)$')
      ELSE NULL
    END
  ),
  updated_at = COALESCE(updated_at, created_at);

CREATE INDEX IF NOT EXISTS idx_media_visibility_featured_sort
  ON media(is_visible, is_featured, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_album
  ON media(album);

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'event-media',
  'event-media',
  false,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read stream sessions" ON stream_sessions;

CREATE POLICY "Public can read public stream sessions"
  ON stream_sessions FOR SELECT
  USING (is_public = true OR public.is_admin_like());

DROP POLICY IF EXISTS "Admin-like users can manage event media objects" ON storage.objects;

CREATE POLICY "Admin-like users can manage event media objects"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'event-media'
    AND public.is_admin_like()
  )
  WITH CHECK (
    bucket_id = 'event-media'
    AND public.is_admin_like()
  );
