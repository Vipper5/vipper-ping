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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agenda_events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          link: string | null
          location: string | null
          note: string | null
          time: string | null
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["event_category"]
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          link?: string | null
          location?: string | null
          note?: string | null
          time?: string | null
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          link?: string | null
          location?: string | null
          note?: string | null
          time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_members: {
        Row: {
          event_id: string
          profile_id: string
        }
        Insert: {
          event_id: string
          profile_id: string
        }
        Update: {
          event_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "agenda_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          id: string
          initials: string
          name: string
          phone: string | null
          photo: string | null
          responsibilities: string[]
          role: Database["public"]["Enums"]["user_role"]
          title: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          id: string
          initials: string
          name: string
          phone?: string | null
          photo?: string | null
          responsibilities?: string[]
          role?: Database["public"]["Enums"]["user_role"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          initials?: string
          name?: string
          phone?: string | null
          photo?: string | null
          responsibilities?: string[]
          role?: Database["public"]["Enums"]["user_role"]
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_docs: {
        Row: {
          added_at: string
          id: string
          project_id: string
          title: string
          url: string
        }
        Insert: {
          added_at?: string
          id?: string
          project_id: string
          title: string
          url: string
        }
        Update: {
          added_at?: string
          id?: string
          project_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_docs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          project_id: string
          text: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          project_id: string
          text: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_objectives: {
        Row: {
          created_at: string
          description: string | null
          done: boolean
          id: string
          position: number
          project_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          done?: boolean
          id?: string
          position?: number
          project_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          done?: boolean
          id?: string
          position?: number
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_objectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_responsibles: {
        Row: {
          profile_id: string
          project_id: string
        }
        Insert: {
          profile_id: string
          project_id: string
        }
        Update: {
          profile_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_responsibles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_responsibles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client: string
          completion_description: string | null
          completion_title: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          stack: string[]
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          client: string
          completion_description?: string | null
          completion_title?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          stack?: string[]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          client?: string
          completion_description?: string | null
          completion_title?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          stack?: string[]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          created_at: string
          description: string | null
          done: boolean
          id: string
          position: number
          task_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          done?: boolean
          id?: string
          position?: number
          task_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          done?: boolean
          id?: string
          position?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          profile_id: string
          task_id: string
        }
        Insert: {
          profile_id: string
          task_id: string
        }
        Update: {
          profile_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          note: string | null
          parent_task_id: string | null
          period: Database["public"]["Enums"]["task_period"] | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          note?: string | null
          parent_task_id?: string | null
          period?: Database["public"]["Enums"]["task_period"] | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          note?: string | null
          parent_task_id?: string | null
          period?: Database["public"]["Enums"]["task_period"] | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          date: string
          entrada: string | null
          id: string
          profile_id: string
          saida: string | null
          saida_almoco: string | null
          updated_at: string
          volta_almoco: string | null
        }
        Insert: {
          created_at?: string
          date: string
          entrada?: string | null
          id?: string
          profile_id: string
          saida?: string | null
          saida_almoco?: string | null
          updated_at?: string
          volta_almoco?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          entrada?: string | null
          id?: string
          profile_id?: string
          saida?: string | null
          saida_almoco?: string | null
          updated_at?: string
          volta_almoco?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_profile_id_fkey"
            columns: ["profile_id"]
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
      is_socio: { Args: never; Returns: boolean }
    }
    Enums: {
      event_category: "reuniao" | "lembrete"
      project_status: "Ativo" | "Pausado" | "Concluído"
      task_period: "diaria" | "semanal"
      task_priority: "baixa" | "media" | "alta"
      task_status: "pendente" | "em_andamento" | "concluida"
      user_role: "socio" | "estagiario"
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
      event_category: ["reuniao", "lembrete"],
      project_status: ["Ativo", "Pausado", "Concluído"],
      task_period: ["diaria", "semanal"],
      task_priority: ["baixa", "media", "alta"],
      task_status: ["pendente", "em_andamento", "concluida"],
      user_role: ["socio", "estagiario"],
    },
  },
} as const
