-- Server-only cache for positions obtained from the public Lichess cloud
-- evaluation database. Browser clients must not write arbitrary engine data.

CREATE TABLE IF NOT EXISTS public.position_evaluations (
  fen_hash text PRIMARY KEY
    CONSTRAINT position_evaluations_hash_format
    CHECK (fen_hash ~ '^[0-9a-f]{64}$'),
  fen text NOT NULL UNIQUE
    CONSTRAINT position_evaluations_fen_length
    CHECK (char_length(fen) BETWEEN 15 AND 160),
  depth smallint NOT NULL
    CONSTRAINT position_evaluations_depth_range
    CHECK (depth BETWEEN 0 AND 255),
  knodes bigint NOT NULL DEFAULT 0
    CONSTRAINT position_evaluations_knodes_nonnegative
    CHECK (knodes >= 0),
  pvs jsonb NOT NULL
    CONSTRAINT position_evaluations_pvs_array
    CHECK (jsonb_typeof(pvs) = 'array'),
  requested_multipv smallint NOT NULL DEFAULT 1
    CONSTRAINT position_evaluations_multipv_range
    CHECK (requested_multipv BETWEEN 1 AND 5),
  source text NOT NULL DEFAULT 'lichess'
    CONSTRAINT position_evaluations_source
    CHECK (source = 'lichess'),
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS position_evaluations_fetched_at_idx
  ON public.position_evaluations (fetched_at DESC);

ALTER TABLE public.position_evaluations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.position_evaluations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.position_evaluations TO service_role;

COMMENT ON TABLE public.position_evaluations IS
  'Server-only cache of CC0 Lichess cloud evaluations keyed by normalized FEN.';
