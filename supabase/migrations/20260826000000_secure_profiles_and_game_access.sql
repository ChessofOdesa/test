-- First production-safety pass for Chess of Odesa.
-- Apply this migration before deploying the updated web client and online server.

-- Keep personal registration data out of the public profiles table.
CREATE TABLE IF NOT EXISTS public.private_profile_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  country text,
  date_of_birth date,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.private_profile_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their private profile data" ON public.private_profile_data;
CREATE POLICY "Users can view their private profile data"
ON public.private_profile_data
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their private profile data" ON public.private_profile_data;
CREATE POLICY "Users can insert their private profile data"
ON public.private_profile_data
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their private profile data" ON public.private_profile_data;
CREATE POLICY "Users can update their private profile data"
ON public.private_profile_data
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_private_profile_data_updated_at ON public.private_profile_data;
CREATE TRIGGER update_private_profile_data_updated_at
BEFORE UPDATE ON public.private_profile_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- A signed-in browser may edit only its ordinary private settings. Consent
-- timestamps are set at signup and must not be forged later from the client.
CREATE OR REPLACE FUNCTION public.restrict_private_profile_data_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.user_id := OLD.user_id;
    NEW.terms_accepted_at := OLD.terms_accepted_at;
    NEW.privacy_accepted_at := OLD.privacy_accepted_at;
    NEW.created_at := OLD.created_at;
  ELSIF auth.uid() IS NOT NULL AND auth.role() <> 'service_role' THEN
    NEW.terms_accepted_at := NULL;
    NEW.privacy_accepted_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restrict_private_profile_data_write_trigger ON public.private_profile_data;
CREATE TRIGGER restrict_private_profile_data_write_trigger
BEFORE INSERT OR UPDATE ON public.private_profile_data
FOR EACH ROW EXECUTE FUNCTION public.restrict_private_profile_data_write();

-- Move existing sensitive values before removing them from the public table.
INSERT INTO public.private_profile_data (user_id, country, date_of_birth)
SELECT user_id, country, date_of_birth
FROM public.profiles
ON CONFLICT (user_id) DO UPDATE
SET country = COALESCE(EXCLUDED.country, public.private_profile_data.country),
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, public.private_profile_data.date_of_birth),
    updated_at = now();

ALTER TABLE public.profiles DROP COLUMN IF EXISTS country;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS date_of_birth;

-- Keep public profiles editable, but only for presentation fields. Trusted
-- server work and tightly scoped SECURITY DEFINER functions can opt in to
-- changing ratings, XP and statistics.
CREATE OR REPLACE FUNCTION public.restrict_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role'
    OR current_setting('app.trusted_profile_update', true) = 'on' THEN
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
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

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- The signup trigger now creates a public profile and private data separately.
-- A deterministic suffix prevents a duplicate display name from blocking signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fallback_display_name text;
  normalized_username text;
  fallback_username text;
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
  normalized_username := trim(both '_' from normalized_username);
  normalized_username := COALESCE(NULLIF(left(normalized_username, 24), ''), 'player');
  fallback_username := left(normalized_username, 17) || '_' || left(replace(NEW.id::text, '-', ''), 6);

  BEGIN
    INSERT INTO public.profiles (user_id, display_name, username, avatar_url, bio)
    VALUES (
      NEW.id,
      fallback_display_name,
      normalized_username,
      NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
      COALESCE(NEW.raw_user_meta_data->>'bio', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN unique_violation THEN
    INSERT INTO public.profiles (user_id, display_name, username, avatar_url, bio)
    VALUES (
      NEW.id,
      fallback_display_name,
      fallback_username,
      NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
      COALESCE(NEW.raw_user_meta_data->>'bio', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END;

  INSERT INTO public.private_profile_data (
    user_id,
    country,
    date_of_birth,
    terms_accepted_at,
    privacy_accepted_at,
    marketing_opt_in
  )
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'profile_country', ''),
    CASE
      WHEN NULLIF(NEW.raw_user_meta_data->>'profile_date_of_birth', '') IS NULL THEN NULL
      ELSE (NEW.raw_user_meta_data->>'profile_date_of_birth')::date
    END,
    CASE WHEN COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::boolean, false) THEN now() ELSE NULL END,
    CASE WHEN COALESCE((NEW.raw_user_meta_data->>'privacy_accepted')::boolean, false) THEN now() ELSE NULL END,
    COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- A browser must never be authoritative for an online position, clock or result.
DROP POLICY IF EXISTS "Online games viewable by everyone" ON public.online_games;
DROP POLICY IF EXISTS "Users can create online games" ON public.online_games;
DROP POLICY IF EXISTS "Players can update their games" ON public.online_games;

CREATE POLICY "Players can read their online games"
ON public.online_games
FOR SELECT TO authenticated
USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);

-- Online game inserts and updates are intentionally service-role/server only.

-- The remaining score- or history-related tables are also server-owned. This
-- stops a browser from inserting an invented win, solved puzzle or activity.
DROP POLICY IF EXISTS "Users can insert their own games" ON public.games;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.puzzle_attempts;
DROP POLICY IF EXISTS "Users can insert their activity" ON public.activity_feed;

-- Notifications must be generated by trusted server code, not forged in a browser.
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications for others" ON public.notifications;

-- The old two-argument function could be called for any user id. Leave it
-- inaccessible for compatibility while replacing the public API below.
REVOKE ALL ON FUNCTION public.claim_quest_reward(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_quest_reward(p_quest_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_quest record;
  v_user_quest record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  SELECT * INTO v_quest FROM public.quests WHERE id = p_quest_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found';
  END IF;

  SELECT * INTO v_user_quest
  FROM public.user_quests
  WHERE user_id = v_user_id AND quest_id = p_quest_id;

  IF NOT FOUND OR v_user_quest.completed_at IS NULL THEN
    RAISE EXCEPTION 'Quest not completed';
  END IF;

  IF v_user_quest.claimed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Reward already claimed';
  END IF;

  UPDATE public.user_quests
  SET claimed_at = now()
  WHERE id = v_user_quest.id;

  PERFORM set_config('app.trusted_profile_update', 'on', true);
  UPDATE public.profiles
  SET xp = xp + v_quest.reward_xp
  WHERE user_id = v_user_id;

  INSERT INTO public.activity_feed (user_id, type, message, data)
  VALUES (
    v_user_id,
    'quest_completed',
    'Completed quest: ' || v_quest.title,
    jsonb_build_object('quest_id', p_quest_id, 'xp_gained', v_quest.reward_xp)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_quest_reward(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_quest_reward(uuid) TO authenticated;

-- Progress may only be recorded by trusted game/puzzle backend code.
-- The browser retains read-only access to its own progress.
DROP POLICY IF EXISTS "Users can insert their own quest progress" ON public.user_quests;
DROP POLICY IF EXISTS "Users can update their own quest progress" ON public.user_quests;
REVOKE ALL ON FUNCTION public.update_quest_progress(uuid, text, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_quest_progress(p_user_id uuid, p_action_type text, p_amount integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest record;
  v_user_quest record;
  v_progress jsonb;
  v_completed boolean;
  v_requirement record;
BEGIN
  IF p_user_id IS NULL OR p_action_type IS NULL OR p_amount < 1 OR p_amount > 100 THEN
    RAISE EXCEPTION 'Invalid quest progress event';
  END IF;

  FOR v_quest IN SELECT * FROM public.quests WHERE requirements ? p_action_type LOOP
    SELECT * INTO v_user_quest
    FROM public.user_quests
    WHERE user_id = p_user_id AND quest_id = v_quest.id;

    IF NOT FOUND THEN
      INSERT INTO public.user_quests (user_id, quest_id, progress)
      VALUES (p_user_id, v_quest.id, '{}'::jsonb)
      RETURNING * INTO v_user_quest;
    END IF;

    v_progress := jsonb_set(
      v_user_quest.progress,
      ARRAY[p_action_type],
      to_jsonb(COALESCE((v_user_quest.progress ->> p_action_type)::integer, 0) + p_amount),
      true
    );

    v_completed := true;
    FOR v_requirement IN SELECT key, value FROM jsonb_each_text(v_quest.requirements) LOOP
      IF COALESCE((v_progress ->> v_requirement.key)::integer, 0) < v_requirement.value::integer THEN
        v_completed := false;
        EXIT;
      END IF;
    END LOOP;

    UPDATE public.user_quests
    SET progress = v_progress,
        completed_at = CASE
          WHEN v_completed AND v_user_quest.completed_at IS NULL THEN now()
          ELSE v_user_quest.completed_at
        END
    WHERE id = v_user_quest.id;
  END LOOP;
END;
$$;
