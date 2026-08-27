CREATE TABLE public.online_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  white_player_id uuid REFERENCES public.profiles(user_id),
  black_player_id uuid REFERENCES public.profiles(user_id),
  fen text NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'waiting',
  result text,
  time_control text NOT NULL DEFAULT '5+0',
  white_time_ms integer NOT NULL DEFAULT 300000,
  black_time_ms integer NOT NULL DEFAULT 300000,
  last_move_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.online_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Online games viewable by everyone" ON public.online_games
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can create online games" ON public.online_games
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = white_player_id OR auth.uid() = black_player_id);

CREATE POLICY "Players can update their games" ON public.online_games
  FOR UPDATE TO authenticated
  USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.online_games;