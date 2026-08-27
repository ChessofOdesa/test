ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';

UPDATE public.profiles
SET username = lower(regexp_replace(coalesce(nullif(display_name, ''), concat('player_', left(user_id::text, 8))), '[^a-zA-Z0-9_]+', '_', 'g'))
WHERE username IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
ON public.profiles (lower(username))
WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fallback_display_name text;
  normalized_username text;
BEGIN
  fallback_display_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'Player'
  );

  normalized_username := lower(
    regexp_replace(
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), fallback_display_name),
      '[^a-zA-Z0-9_]+',
      '_',
      'g'
    )
  );

  INSERT INTO public.profiles (
    user_id,
    display_name,
    username,
    country,
    date_of_birth,
    avatar_url,
    bio
  )
  VALUES (
    NEW.id,
    fallback_display_name,
    normalized_username,
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    CASE
      WHEN NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '') IS NULL THEN NULL
      ELSE (NEW.raw_user_meta_data->>'date_of_birth')::date
    END,
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.restrict_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := OLD.user_id;
  NEW.rating_bullet := OLD.rating_bullet;
  NEW.rating_blitz := OLD.rating_blitz;
  NEW.rating_rapid := OLD.rating_rapid;
  NEW.rating_classical := OLD.rating_classical;
  NEW.puzzle_rating := OLD.puzzle_rating;
  NEW.games_played := OLD.games_played;
  NEW.games_won := OLD.games_won;
  NEW.games_drawn := OLD.games_drawn;
  NEW.games_lost := OLD.games_lost;
  NEW.puzzles_solved := OLD.puzzles_solved;
  NEW.xp := OLD.xp;
  NEW.level := OLD.level;
  NEW.streak_days := OLD.streak_days;
  NEW.created_at := OLD.created_at;

  IF NEW.username IS NOT NULL THEN
    NEW.username := lower(regexp_replace(NEW.username, '[^a-zA-Z0-9_]+', '_', 'g'));
  END IF;

  RETURN NEW;
END;
$$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatar images" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatar images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated users can update avatar images" ON storage.objects;
CREATE POLICY "Authenticated users can update avatar images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated users can delete avatar images" ON storage.objects;
CREATE POLICY "Authenticated users can delete avatar images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
