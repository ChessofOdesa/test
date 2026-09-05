export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          ai_level: number | null
          black_player_id: string | null
          black_rating: number | null
          black_rating_diff: number | null
          created_at: string
          fen: string | null
          id: string
          is_ai_game: boolean
          moves_count: number
          pgn: string
          result: string | null
          time_control: string | null
          updated_at: string
          white_player_id: string | null
          white_rating: number | null
          white_rating_diff: number | null
        }
        Insert: {
          ai_level?: number | null
          black_player_id?: string | null
          black_rating?: number | null
          black_rating_diff?: number | null
          created_at?: string
          fen?: string | null
          id?: string
          is_ai_game?: boolean
          moves_count?: number
          pgn?: string
          result?: string | null
          time_control?: string | null
          updated_at?: string
          white_player_id?: string | null
          white_rating?: number | null
          white_rating_diff?: number | null
        }
        Update: {
          ai_level?: number | null
          black_player_id?: string | null
          black_rating?: number | null
          black_rating_diff?: number | null
          created_at?: string
          fen?: string | null
          id?: string
          is_ai_game?: boolean
          moves_count?: number
          pgn?: string
          result?: string | null
          time_control?: string | null
          updated_at?: string
          white_player_id?: string | null
          white_rating?: number | null
          white_rating_diff?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_black_player_id_fkey"
            columns: ["black_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "games_white_player_id_fkey"
            columns: ["white_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      online_games: {
        Row: {
          black_player_id: string | null
          black_rating_before: number | null
          black_rating_change: number | null
          black_time_ms: number
          created_at: string
          fen: string
          finished_at: string | null
          id: string
          last_move_at: string | null
          moves_count: number
          pgn: string
          rated: boolean
          result: string | null
          status: string
          termination: string | null
          time_control: string
          updated_at: string
          white_player_id: string | null
          white_rating_before: number | null
          white_rating_change: number | null
          white_time_ms: number
        }
        Insert: {
          black_player_id?: string | null
          black_rating_before?: number | null
          black_rating_change?: number | null
          black_time_ms?: number
          created_at?: string
          fen?: string
          finished_at?: string | null
          id?: string
          last_move_at?: string | null
          moves_count?: number
          pgn?: string
          rated?: boolean
          result?: string | null
          status?: string
          termination?: string | null
          time_control?: string
          updated_at?: string
          white_player_id?: string | null
          white_rating_before?: number | null
          white_rating_change?: number | null
          white_time_ms?: number
        }
        Update: {
          black_player_id?: string | null
          black_rating_before?: number | null
          black_rating_change?: number | null
          black_time_ms?: number
          created_at?: string
          fen?: string
          finished_at?: string | null
          id?: string
          last_move_at?: string | null
          moves_count?: number
          pgn?: string
          rated?: boolean
          result?: string | null
          status?: string
          termination?: string | null
          time_control?: string
          updated_at?: string
          white_player_id?: string | null
          white_rating_before?: number | null
          white_rating_change?: number | null
          white_time_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "online_games_black_player_id_fkey"
            columns: ["black_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "online_games_white_player_id_fkey"
            columns: ["white_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          games_drawn: number
          games_lost: number
          games_played: number
          games_won: number
          id: string
          level: number
          puzzle_rating: number
          puzzles_solved: number
          rating_blitz: number
          rating_bullet: number
          rating_classical: number
          rating_rapid: number
          streak_days: number
          updated_at: string
          username: string | null
          user_id: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          games_drawn?: number
          games_lost?: number
          games_played?: number
          games_won?: number
          id?: string
          level?: number
          puzzle_rating?: number
          puzzles_solved?: number
          rating_blitz?: number
          rating_bullet?: number
          rating_classical?: number
          rating_rapid?: number
          streak_days?: number
          updated_at?: string
          username?: string | null
          user_id: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          games_drawn?: number
          games_lost?: number
          games_played?: number
          games_won?: number
          id?: string
          level?: number
          puzzle_rating?: number
          puzzles_solved?: number
          rating_blitz?: number
          rating_bullet?: number
          rating_classical?: number
          rating_rapid?: number
          streak_days?: number
          updated_at?: string
          username?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      private_profile_data: {
        Row: {
          country: string | null
          created_at: string
          date_of_birth: string | null
          marketing_opt_in: boolean
          privacy_accepted_at: string | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          marketing_opt_in?: boolean
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          marketing_opt_in?: boolean
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      puzzle_attempts: {
        Row: {
          created_at: string
          id: string
          puzzle_id: string
          solved: boolean
          time_taken_ms: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          puzzle_id: string
          solved?: boolean
          time_taken_ms?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          puzzle_id?: string
          solved?: boolean
          time_taken_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "puzzle_attempts_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      puzzles: {
        Row: {
          created_at: string
          fen: string
          id: string
          move_number: number | null
          rating: number
          solution: string[]
          source_game_id: string | null
          theme: string
          title: string
        }
        Insert: {
          created_at?: string
          fen: string
          id?: string
          move_number?: number | null
          rating?: number
          solution?: string[]
          source_game_id?: string | null
          theme?: string
          title?: string
        }
        Update: {
          created_at?: string
          fen?: string
          id?: string
          move_number?: number | null
          rating?: number
          solution?: string[]
          source_game_id?: string | null
          theme?: string
          title?: string
        }
        Relationships: []
      }
      tournament_pairings: {
        Row: {
          black_id: string
          created_at: string
          game_id: string | null
          id: string
          result: string | null
          round: number
          tournament_id: string
          white_id: string
        }
        Insert: {
          black_id: string
          created_at?: string
          game_id?: string | null
          id?: string
          result?: string | null
          round: number
          tournament_id: string
          white_id: string
        }
        Update: {
          black_id?: string
          created_at?: string
          game_id?: string | null
          id?: string
          result?: string | null
          round?: number
          tournament_id?: string
          white_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_pairings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_players: {
        Row: {
          games_played: number
          id: string
          joined_at: string
          score: number
          tournament_id: string
          user_id: string
        }
        Insert: {
          games_played?: number
          id?: string
          joined_at?: string
          score?: number
          tournament_id: string
          user_id: string
        }
        Update: {
          games_played?: number
          id?: string
          joined_at?: string
          score?: number
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          creator_id: string
          ends_at: string | null
          id: string
          max_players: number
          name: string
          started_at: string | null
          status: string
          time_control: string
          type: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          ends_at?: string | null
          id?: string
          max_players?: number
          name: string
          started_at?: string | null
          status?: string
          time_control?: string
          type?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          ends_at?: string | null
          id?: string
          max_players?: number
          name?: string
          started_at?: string | null
          status?: string
          time_control?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_quest_reward: {
        Args: { p_quest_id: string }
        Returns: undefined
      }
      update_quest_progress: {
        Args: { p_user_id: string; p_action_type: string; p_amount?: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
