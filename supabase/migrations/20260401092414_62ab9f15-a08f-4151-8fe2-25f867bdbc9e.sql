
-- Fix 1: Restrict profiles UPDATE to only safe columns (display_name, avatar_url)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a function to restrict profile updates to safe columns only
CREATE OR REPLACE FUNCTION public.restrict_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow updating display_name and avatar_url
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
  RETURN NEW;
END;
$$;

CREATE TRIGGER restrict_profile_update_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.restrict_profile_update();

-- Fix 2: Remove OR (is_ai_game = true) from games INSERT policy
DROP POLICY IF EXISTS "Users can insert their own games" ON public.games;
CREATE POLICY "Users can insert their own games"
ON public.games
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = white_player_id OR auth.uid() = black_player_id);
