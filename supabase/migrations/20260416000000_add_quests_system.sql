-- Add quests system for gamification

-- Function to claim quest reward
CREATE OR REPLACE FUNCTION public.claim_quest_reward(p_user_id UUID, p_quest_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest RECORD;
  v_user_quest RECORD;
BEGIN
  -- Get quest details
  SELECT * INTO v_quest FROM quests WHERE id = p_quest_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found';
  END IF;

  -- Get user quest progress
  SELECT * INTO v_user_quest FROM user_quests WHERE user_id = p_user_id AND quest_id = p_quest_id;
  IF NOT FOUND OR v_user_quest.completed_at IS NULL THEN
    RAISE EXCEPTION 'Quest not completed';
  END IF;

  IF v_user_quest.claimed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Reward already claimed';
  END IF;

  -- Mark as claimed
  UPDATE user_quests SET claimed_at = now() WHERE id = v_user_quest.id;

  -- Add XP to profile
  UPDATE profiles SET xp = xp + v_quest.reward_xp WHERE user_id = p_user_id;

  -- Insert activity
  INSERT INTO activity_feed (user_id, type, message, data)
  VALUES (p_user_id, 'quest_completed', 'Completed quest: ' || v_quest.title, jsonb_build_object('quest_id', p_quest_id, 'xp_gained', v_quest.reward_xp));
END;
$$;

-- Function to update quest progress
CREATE OR REPLACE FUNCTION public.update_quest_progress(p_user_id UUID, p_action_type TEXT, p_amount INTEGER DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest RECORD;
  v_user_quest RECORD;
  v_progress JSONB;
  v_completed BOOLEAN;
  req_key TEXT;
  req_value TEXT;
BEGIN
  -- Loop through quests that have this action in requirements
  FOR v_quest IN SELECT * FROM quests WHERE requirements ? p_action_type LOOP
    -- Get or create user quest
    SELECT * INTO v_user_quest FROM user_quests WHERE user_id = p_user_id AND quest_id = v_quest.id;
    IF NOT FOUND THEN
      INSERT INTO user_quests (user_id, quest_id, progress) VALUES (p_user_id, v_quest.id, '{}'::jsonb)
      RETURNING * INTO v_user_quest;
    END IF;

    -- Update progress
    v_progress := COALESCE(v_user_quest.progress, '{}'::jsonb);
    v_progress := jsonb_set(
      v_progress,
      ARRAY[p_action_type],
      to_jsonb(COALESCE((v_progress ->> p_action_type)::integer, 0) + p_amount),
      true
    );

    -- Check if completed
    v_completed := true;
    FOR req_key, req_value IN
      SELECT key, value FROM jsonb_each_text(v_quest.requirements)
    LOOP
      IF COALESCE((v_progress ->> req_key)::integer, 0) < req_value::integer THEN
        v_completed := false;
        EXIT;
      END IF;
    END LOOP;

    -- Update user quest
    UPDATE user_quests SET
      progress = v_progress,
      completed_at = CASE WHEN v_completed AND v_user_quest.completed_at IS NULL THEN now() ELSE v_user_quest.completed_at END
    WHERE id = v_user_quest.id;
  END LOOP;
END;
$$;

-- Quests table
CREATE TABLE public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'achievement')),
  requirements JSONB NOT NULL DEFAULT '{}',
  reward_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests are viewable by everyone" ON public.quests FOR SELECT USING (true);

-- User quests progress
CREATE TABLE public.user_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  progress JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quest progress" ON public.user_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quest progress" ON public.user_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quest progress" ON public.user_quests FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_quests_updated_at BEFORE UPDATE ON public.user_quests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample quests
INSERT INTO public.quests (title, description, type, requirements, reward_xp) VALUES
('Щоденний вирішувач задач', 'Вирішіть 5 задач сьогодні', 'daily', '{"solve_puzzles": 5}', 50),
('Переможець ігор', 'Вигрійте 2 ігри сьогодні', 'daily', '{"win_games": 2}', 75),
('Майстер серій', 'Підтримуйте серію входів 7 днів', 'achievement', '{"streak_days": 7}', 200),
('Експерт задач', 'Вирішіть 50 задач загалом', 'achievement', '{"total_puzzles": 50}', 150);
