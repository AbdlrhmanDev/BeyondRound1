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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          reason: string | null
          status: string | null
          target_id: string | null
          target_table: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          status?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          status?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      algorithm_audit_log: {
        Row: {
          algorithm_version: string | null
          calculated_at: string | null
          compatibility_score: number
          id: string
          input_features: Json
          match_id: string
          user_1_id: string
          user_2_id: string
          weight_availability: number | null
          weight_interests: number | null
          weight_location: number | null
          weight_specialty: number | null
        }
        Insert: {
          algorithm_version?: string | null
          calculated_at?: string | null
          compatibility_score: number
          id?: string
          input_features: Json
          match_id: string
          user_1_id: string
          user_2_id: string
          weight_availability?: number | null
          weight_interests?: number | null
          weight_location?: number | null
          weight_specialty?: number | null
        }
        Update: {
          algorithm_version?: string | null
          calculated_at?: string | null
          compatibility_score?: number
          id?: string
          input_features?: Json
          match_id?: string
          user_1_id?: string
          user_2_id?: string
          weight_availability?: number | null
          weight_interests?: number | null
          weight_location?: number | null
          weight_specialty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "algorithm_audit_log_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          match_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          page_url: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          page_url?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          page_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_conversations: {
        Row: {
          created_at: string
          group_id: string
          id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_conversations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "match_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "match_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          reactions: Json | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          reactions?: Json | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          reactions?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "group_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      match_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          id: string
          match_id: string
          met_in_person: boolean | null
          rating: number | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          match_id: string
          met_in_person?: boolean | null
          rating?: number | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          match_id?: string
          met_in_person?: boolean | null
          rating?: number | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "match_feedback_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      match_groups: {
        Row: {
          created_at: string
          gender_composition: string | null
          group_type: string
          id: string
          match_week: string
          name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gender_composition?: string | null
          group_type: string
          id?: string
          match_week: string
          name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gender_composition?: string | null
          group_type?: string
          id?: string
          match_week?: string
          name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_quality_metrics: {
        Row: {
          algorithm_version: string | null
          calculated_at: string | null
          compatibility_score: number | null
          conversation_quality_score: number | null
          days_active: number | null
          id: string
          match_id: string
          messages_exchanged: number | null
          updated_at: string | null
        }
        Insert: {
          algorithm_version?: string | null
          calculated_at?: string | null
          compatibility_score?: number | null
          conversation_quality_score?: number | null
          days_active?: number | null
          id?: string
          match_id: string
          messages_exchanged?: number | null
          updated_at?: string | null
        }
        Update: {
          algorithm_version?: string | null
          calculated_at?: string | null
          compatibility_score?: number | null
          conversation_quality_score?: number | null
          days_active?: number | null
          id?: string
          match_id?: string
          messages_exchanged?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_quality_metrics_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          match_score: number | null
          matched_user_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_score?: number | null
          matched_user_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_score?: number | null
          matched_user_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_preferences: {
        Row: {
          activity_level: string | null
          availability_slots: string[] | null
          career_stage: string | null
          completed_at: string | null
          conversation_style: string | null
          created_at: string
          culture_interests: string[] | null
          dietary_preferences: string[] | null
          friendship_type: string[] | null
          goals: string[] | null
          id: string
          ideal_weekend: string[] | null
          interests: string[] | null
          life_stage: string | null
          lifestyle: string[] | null
          meeting_activities: string[] | null
          meeting_frequency: string | null
          movie_preferences: string[] | null
          music_preferences: string[] | null
          open_to_business: boolean | null
          other_interests: string[] | null
          personality_traits: Json | null
          preferred_meet_duration: string | null
          social_energy: string | null
          social_style: string[] | null
          specialty: string | null
          specialty_preference: string | null
          sports: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_level?: string | null
          availability_slots?: string[] | null
          career_stage?: string | null
          completed_at?: string | null
          conversation_style?: string | null
          created_at?: string
          culture_interests?: string[] | null
          dietary_preferences?: string[] | null
          friendship_type?: string[] | null
          goals?: string[] | null
          id?: string
          ideal_weekend?: string[] | null
          interests?: string[] | null
          life_stage?: string | null
          lifestyle?: string[] | null
          meeting_activities?: string[] | null
          meeting_frequency?: string | null
          movie_preferences?: string[] | null
          music_preferences?: string[] | null
          open_to_business?: boolean | null
          other_interests?: string[] | null
          personality_traits?: Json | null
          preferred_meet_duration?: string | null
          social_energy?: string | null
          social_style?: string[] | null
          specialty?: string | null
          specialty_preference?: string | null
          sports?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_level?: string | null
          availability_slots?: string[] | null
          career_stage?: string | null
          completed_at?: string | null
          conversation_style?: string | null
          created_at?: string
          culture_interests?: string[] | null
          dietary_preferences?: string[] | null
          friendship_type?: string[] | null
          goals?: string[] | null
          id?: string
          ideal_weekend?: string[] | null
          interests?: string[] | null
          life_stage?: string | null
          lifestyle?: string[] | null
          meeting_activities?: string[] | null
          meeting_frequency?: string | null
          movie_preferences?: string[] | null
          music_preferences?: string[] | null
          open_to_business?: boolean | null
          other_interests?: string[] | null
          personality_traits?: Json | null
          preferred_meet_duration?: string | null
          social_energy?: string | null
          social_style?: string[] | null
          specialty?: string | null
          specialty_preference?: string | null
          sports?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          birth_year: number | null
          city: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          gender: string | null
          gender_preference: string | null
          id: string
          languages: string[] | null
          license_url: string | null
          nationality: string | null
          neighborhood: string | null
          soft_delete: boolean | null
          status: string
          updated_at: string
          user_id: string
          verification_method: string | null
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          gender?: string | null
          gender_preference?: string | null
          id?: string
          languages?: string[] | null
          license_url?: string | null
          nationality?: string | null
          neighborhood?: string | null
          soft_delete?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
          verification_method?: string | null
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          gender?: string | null
          gender_preference?: string | null
          id?: string
          languages?: string[] | null
          license_url?: string | null
          nationality?: string | null
          neighborhood?: string | null
          soft_delete?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_method?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      specialty_relationships: {
        Row: {
          id: string
          relationship_score: number | null
          specialty_1: string
          specialty_2: string
        }
        Insert: {
          id?: string
          relationship_score?: number | null
          specialty_1: string
          specialty_2: string
        }
        Update: {
          id?: string
          relationship_score?: number | null
          specialty_1?: string
          specialty_2?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string | null
          goal: Database["public"]["Enums"]["user_goal_type"]
          id: string
          priority: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal: Database["public"]["Enums"]["user_goal_type"]
          id?: string
          priority?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal?: Database["public"]["Enums"]["user_goal_type"]
          id?: string
          priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          initiator_id: string
          interaction_type: string
          match_id: string | null
          recipient_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          initiator_id: string
          interaction_type: string
          match_id?: string | null
          recipient_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          initiator_id?: string
          interaction_type?: string
          match_id?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          category: Database["public"]["Enums"]["interest_category"]
          created_at: string | null
          id: string
          tags: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["interest_category"]
          created_at?: string | null
          id?: string
          tags?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["interest_category"]
          created_at?: string | null
          id?: string
          tags?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          reviewed_at: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          reviewed_at?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_match_score: {
        Args: { user_a_id: string; user_b_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      interest_category: string
      user_goal_type: string
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      interest_category: [],
      user_goal_type: [],
    },
  },
} as const
