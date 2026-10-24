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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agent_settings: {
        Row: {
          active: boolean
          frequency: number
          id: string
          language: string
          mode: string
          niche: string
          platforms: string[]
          time_slots: string[]
          tone: string
          updated_at: string
          user_id: string
          video_length: number
        }
        Insert: {
          active?: boolean
          frequency?: number
          id?: string
          language?: string
          mode?: string
          niche?: string
          platforms?: string[]
          time_slots?: string[]
          tone?: string
          updated_at?: string
          user_id: string
          video_length?: number
        }
        Update: {
          active?: boolean
          frequency?: number
          id?: string
          language?: string
          mode?: string
          niche?: string
          platforms?: string[]
          time_slots?: string[]
          tone?: string
          updated_at?: string
          user_id?: string
          video_length?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          detail: string
          id: string
          read: boolean
          title: string
          tone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          read?: boolean
          title: string
          tone?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          read?: boolean
          title?: string
          tone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_connections: {
        Row: {
          auth_type: string | null
          base_url: string | null
          color: string | null
          created_at: string
          custom: boolean
          followers: number
          handle: string | null
          id: string
          name: string
          platform_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_type?: string | null
          base_url?: string | null
          color?: string | null
          created_at?: string
          custom?: boolean
          followers?: number
          handle?: string | null
          id?: string
          name: string
          platform_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_type?: string | null
          base_url?: string | null
          color?: string | null
          created_at?: string
          custom?: boolean
          followers?: number
          handle?: string | null
          id?: string
          name?: string
          platform_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          plan: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          plan?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          plan?: string
        }
        Relationships: []
      }
      provider_keys: {
        Row: {
          category: string
          created_at: string
          custom_headers: Json | null
          encrypted_key: string
          endpoint: string | null
          id: string
          is_default: boolean
          key_hint: string
          label: string
          last_used_at: string | null
          provider: string
          quota: number
          status: string
          usage_count: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          custom_headers?: Json | null
          encrypted_key: string
          endpoint?: string | null
          id?: string
          is_default?: boolean
          key_hint: string
          label?: string
          last_used_at?: string | null
          provider: string
          quota?: number
          status?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          custom_headers?: Json | null
          encrypted_key?: string
          endpoint?: string | null
          id?: string
          is_default?: boolean
          key_hint?: string
          label?: string
          last_used_at?: string | null
          provider?: string
          quota?: number
          status?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      run_history: {
        Row: {
          action: string
          created_at: string
          id: string
          result: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          result?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          result?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          created_at: string
          hue: number
          id: string
          platforms: string[]
          post_date: string
          post_time: string
          retries: number
          status: string
          title: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          hue?: number
          id?: string
          platforms?: string[]
          post_date: string
          post_time: string
          retries?: number
          status?: string
          title: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          hue?: number
          id?: string
          platforms?: string[]
          post_date?: string
          post_time?: string
          retries?: number
          status?: string
          title?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_log: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          key_id: string | null
          provider: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          id?: string
          key_id?: string | null
          provider: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          key_id?: string | null
          provider?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_log_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "provider_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          duration: string
          hue: number
          id: string
          platforms: string[]
          scenes: Json
          script: string
          status: string
          thumb_url: string | null
          title: string
          topic: string
          user_id: string
          video_url: string | null
          views: number
        }
        Insert: {
          created_at?: string
          duration?: string
          hue?: number
          id?: string
          platforms?: string[]
          scenes?: Json
          script?: string
          status?: string
          thumb_url?: string | null
          title: string
          topic?: string
          user_id: string
          video_url?: string | null
          views?: number
        }
        Update: {
          created_at?: string
          duration?: string
          hue?: number
          id?: string
          platforms?: string[]
          scenes?: Json
          script?: string
          status?: string
          thumb_url?: string | null
          title?: string
          topic?: string
          user_id?: string
          video_url?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
