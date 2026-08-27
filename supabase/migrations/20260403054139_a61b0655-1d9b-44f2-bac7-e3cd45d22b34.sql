
-- Tournaments
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'arena',
  time_control text NOT NULL DEFAULT '5+0',
  max_players int NOT NULL DEFAULT 64,
  status text NOT NULL DEFAULT 'upcoming',
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tournament_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  games_played int NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

CREATE TABLE public.tournament_pairings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  round int NOT NULL,
  white_id uuid NOT NULL,
  black_id uuid NOT NULL,
  result text,
  game_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Social
CREATE TABLE public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournaments viewable by everyone" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tournaments" ON public.tournaments FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their tournaments" ON public.tournaments FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

-- RLS on tournament_players
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament players viewable by everyone" ON public.tournament_players FOR SELECT USING (true);
CREATE POLICY "Users can join tournaments" ON public.tournament_players FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave tournaments" ON public.tournament_players FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS on tournament_pairings
ALTER TABLE public.tournament_pairings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pairings viewable by everyone" ON public.tournament_pairings FOR SELECT USING (true);

-- RLS on friends
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their friendships" ON public.friends FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can send friend requests" ON public.friends FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update friendships they received" ON public.friends FOR UPDATE TO authenticated USING (auth.uid() = friend_id);
CREATE POLICY "Users can delete their friendships" ON public.friends FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS on activity_feed
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activity feed viewable by everyone" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Users can insert their activity" ON public.activity_feed FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
