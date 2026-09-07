-- Apply after migration 10. No user records are removed.
-- Time category uses initial seconds + 40 increments. Classical is casual only.
BEGIN;
CREATE OR REPLACE FUNCTION public.finalize_online_game(
  p_game_id uuid,
  p_fen text,
  p_pgn text,
  p_result text,
  p_reason text,
  p_white_time_ms integer,
  p_black_time_ms integer,
  p_moves_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_game public.online_games%ROWTYPE;
  v_category text;
  v_white_before integer;
  v_black_before integer;
  v_white_after integer;
  v_black_after integer;
  v_white_change integer := 0;
  v_black_change integer := 0;
  v_white_score numeric;
  v_white_expected numeric;
  v_should_rate boolean;
  v_should_record boolean;
BEGIN
  IF p_result IS NULL OR p_result NOT IN ('1-0', '0-1', '1/2-1/2') THEN
    RAISE EXCEPTION 'Invalid game result';
  END IF;

  IF p_fen IS NULL OR length(p_fen) > 200 THEN
    RAISE EXCEPTION 'Invalid final FEN';
  END IF;

  IF p_pgn IS NULL OR length(p_pgn) > 200000 THEN
    RAISE EXCEPTION 'Invalid PGN';
  END IF;

  SELECT *
  INTO v_game
  FROM public.online_games
  WHERE id = p_game_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Online game not found';
  END IF;

  IF v_game.status <> 'playing' THEN
    RETURN jsonb_build_object(
      'saved', true,
      'rated', COALESCE(v_game.rated, false),
      'white_rating_before', v_game.white_rating_before,
      'black_rating_before', v_game.black_rating_before,
      'white_rating_change', COALESCE(v_game.white_rating_change, 0),
      'black_rating_change', COALESCE(v_game.black_rating_change, 0),
      'white_rating_after', COALESCE(v_game.white_rating_before, 1500) + COALESCE(v_game.white_rating_change, 0),
      'black_rating_after', COALESCE(v_game.black_rating_before, 1500) + COALESCE(v_game.black_rating_change, 0)
    );
  END IF;

  IF v_game.white_player_id IS NULL OR v_game.black_player_id IS NULL THEN
    RAISE EXCEPTION 'Online game participants are missing';
  END IF;

  -- Lock both profiles in a deterministic order so simultaneous results cannot
  -- overwrite one another.
  PERFORM 1
  FROM public.profiles
  WHERE user_id IN (v_game.white_player_id, v_game.black_player_id)
  ORDER BY user_id
  FOR UPDATE;

  IF (SELECT count(*) FROM public.profiles WHERE user_id IN (v_game.white_player_id, v_game.black_player_id)) <> 2 THEN
    RAISE EXCEPTION 'Both player profiles are required';
  END IF;

  v_category := CASE
    WHEN split_part(v_game.time_control, '+', 1)::integer * 60 + split_part(v_game.time_control, '+', 2)::integer * 40 < 180 THEN 'bullet'
    WHEN split_part(v_game.time_control, '+', 1)::integer * 60 + split_part(v_game.time_control, '+', 2)::integer * 40 < 600 THEN 'blitz'
    ELSE 'rapid'
  END;

  SELECT CASE v_category
    WHEN 'bullet' THEN rating_bullet
    WHEN 'blitz' THEN rating_blitz
    ELSE rating_rapid
  END
  INTO v_white_before
  FROM public.profiles
  WHERE user_id = v_game.white_player_id;

  SELECT CASE v_category
    WHEN 'bullet' THEN rating_bullet
    WHEN 'blitz' THEN rating_blitz
    ELSE rating_rapid
  END
  INTO v_black_before
  FROM public.profiles
  WHERE user_id = v_game.black_player_id;

  v_white_before := COALESCE(v_white_before, 1500);
  v_black_before := COALESCE(v_black_before, 1500);
  v_white_after := v_white_before;
  v_black_after := v_black_before;
  v_should_record := COALESCE(p_reason, '') <> 'abort' AND GREATEST(COALESCE(p_moves_count, 0), 0) >= 2;
  v_should_rate := v_should_record AND v_game.rated = true
    AND split_part(v_game.time_control, '+', 1)::integer * 60 + split_part(v_game.time_control, '+', 2)::integer * 40 < 1800;

  IF v_should_rate THEN
    v_white_score := CASE p_result
      WHEN '1-0' THEN 1.0
      WHEN '0-1' THEN 0.0
      ELSE 0.5
    END;
    v_white_expected := 1.0 / (1.0 + power(10.0, (v_black_before - v_white_before) / 400.0));
    v_white_change := round(24.0 * (v_white_score - v_white_expected));
    v_white_after := GREATEST(100, v_white_before + v_white_change);
    v_black_after := GREATEST(100, v_black_before - v_white_change);
    v_white_change := v_white_after - v_white_before;
    v_black_change := v_black_after - v_black_before;
  END IF;

  IF v_should_record THEN
    UPDATE public.profiles
    SET
      rating_bullet = CASE WHEN v_category = 'bullet' THEN v_white_after ELSE rating_bullet END,
      rating_blitz = CASE WHEN v_category = 'blitz' THEN v_white_after ELSE rating_blitz END,
      rating_rapid = CASE WHEN v_category = 'rapid' THEN v_white_after ELSE rating_rapid END,
      games_played = games_played + 1,
      games_won = games_won + CASE WHEN p_result = '1-0' THEN 1 ELSE 0 END,
      games_drawn = games_drawn + CASE WHEN p_result = '1/2-1/2' THEN 1 ELSE 0 END,
      games_lost = games_lost + CASE WHEN p_result = '0-1' THEN 1 ELSE 0 END,
      updated_at = now()
    WHERE user_id = v_game.white_player_id;

    UPDATE public.profiles
    SET
      rating_bullet = CASE WHEN v_category = 'bullet' THEN v_black_after ELSE rating_bullet END,
      rating_blitz = CASE WHEN v_category = 'blitz' THEN v_black_after ELSE rating_blitz END,
      rating_rapid = CASE WHEN v_category = 'rapid' THEN v_black_after ELSE rating_rapid END,
      games_played = games_played + 1,
      games_won = games_won + CASE WHEN p_result = '0-1' THEN 1 ELSE 0 END,
      games_drawn = games_drawn + CASE WHEN p_result = '1/2-1/2' THEN 1 ELSE 0 END,
      games_lost = games_lost + CASE WHEN p_result = '1-0' THEN 1 ELSE 0 END,
      updated_at = now()
    WHERE user_id = v_game.black_player_id;

    INSERT INTO public.games (
      id,
      white_player_id,
      black_player_id,
      pgn,
      fen,
      result,
      time_control,
      white_rating,
      black_rating,
      white_rating_diff,
      black_rating_diff,
      is_ai_game,
      moves_count,
      created_at,
      updated_at
    )
    VALUES (
      v_game.id,
      v_game.white_player_id,
      v_game.black_player_id,
      p_pgn,
      p_fen,
      p_result,
      v_game.time_control,
      v_white_before,
      v_black_before,
      v_white_change,
      v_black_change,
      false,
      GREATEST(COALESCE(p_moves_count, 0), 0),
      v_game.created_at,
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  UPDATE public.online_games
  SET
    fen = p_fen,
    pgn = p_pgn,
    result = p_result,
    status = CASE WHEN COALESCE(p_reason, '') = 'abort' THEN 'aborted' ELSE 'finished' END,
    termination = left(COALESCE(p_reason, 'unknown'), 40),
    white_time_ms = GREATEST(COALESCE(p_white_time_ms, 0), 0),
    black_time_ms = GREATEST(COALESCE(p_black_time_ms, 0), 0),
    moves_count = GREATEST(COALESCE(p_moves_count, 0), 0),
    rated = v_should_rate,
    white_rating_before = v_white_before,
    black_rating_before = v_black_before,
    white_rating_change = v_white_change,
    black_rating_change = v_black_change,
    finished_at = now(),
    last_move_at = now(),
    updated_at = now()
  WHERE id = v_game.id;

  RETURN jsonb_build_object(
    'saved', true,
    'rated', v_should_rate,
    'white_rating_before', v_white_before,
    'black_rating_before', v_black_before,
    'white_rating_change', v_white_change,
    'black_rating_change', v_black_change,
    'white_rating_after', v_white_after,
    'black_rating_after', v_black_after
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_online_game(uuid, text, text, text, text, integer, integer, integer)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_online_game(uuid, text, text, text, text, integer, integer, integer)
TO service_role;

CREATE OR REPLACE FUNCTION public.play_capabilities()
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT jsonb_build_object('version', 2) $$;
REVOKE ALL ON FUNCTION public.play_capabilities() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.play_capabilities() TO service_role;
COMMIT;
