
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  rating_bullet INTEGER NOT NULL DEFAULT 1500,
  rating_blitz INTEGER NOT NULL DEFAULT 1500,
  rating_rapid INTEGER NOT NULL DEFAULT 1500,
  rating_classical INTEGER NOT NULL DEFAULT 1500,
  puzzle_rating INTEGER NOT NULL DEFAULT 1500,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  games_drawn INTEGER NOT NULL DEFAULT 0,
  games_lost INTEGER NOT NULL DEFAULT 0,
  puzzles_solved INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Гравець'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  white_player_id UUID REFERENCES public.profiles(user_id),
  black_player_id UUID REFERENCES public.profiles(user_id),
  pgn TEXT NOT NULL DEFAULT '',
  fen TEXT,
  result TEXT CHECK (result IN ('1-0', '0-1', '1/2-1/2', '*')),
  time_control TEXT,
  white_rating INTEGER,
  black_rating INTEGER,
  white_rating_diff INTEGER,
  black_rating_diff INTEGER,
  is_ai_game BOOLEAN NOT NULL DEFAULT false,
  ai_level INTEGER,
  moves_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone" ON public.games FOR SELECT USING (true);
CREATE POLICY "Users can insert their own games" ON public.games FOR INSERT WITH CHECK (
  auth.uid() = white_player_id OR auth.uid() = black_player_id OR is_ai_game = true
);

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Puzzles table
CREATE TABLE public.puzzles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fen TEXT NOT NULL,
  solution TEXT[] NOT NULL DEFAULT '{}',
  title TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 1000,
  source_game_id TEXT,
  move_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Puzzles are viewable by everyone" ON public.puzzles FOR SELECT USING (true);

-- Puzzle attempts
CREATE TABLE public.puzzle_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id UUID NOT NULL REFERENCES public.puzzles(id) ON DELETE CASCADE,
  solved BOOLEAN NOT NULL DEFAULT false,
  time_taken_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.puzzle_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own attempts" ON public.puzzle_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts" ON public.puzzle_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
