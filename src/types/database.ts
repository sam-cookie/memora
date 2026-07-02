export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      meeting_contacts: {
        Row: {
          id: string
          created_at: string
          meeting_id: string
          contact_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          meeting_id: string
          contact_id: string
        }
        Update: {
          id?: string
          created_at?: string
          meeting_id?: string
          contact_id?: string
        }
      }
      contacts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          workspace_id: string
          name: string
          email: string | null
          company: string | null
          notes: string | null
          archived: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          workspace_id: string
          name: string
          email?: string | null
          company?: string | null
          notes?: string | null
          archived?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          workspace_id?: string
          name?: string
          email?: string | null
          company?: string | null
          notes?: string | null
          archived?: boolean
        }
      }
      workspace_members: {
        Row: {
          id: string
          created_at: string
          workspace_id: string
          user_id: string
          role: WorkspaceRole
          invited_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          workspace_id: string
          user_id: string
          role?: WorkspaceRole
          invited_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          workspace_id?: string
          user_id?: string
          role?: WorkspaceRole
          invited_by?: string | null
        }
      }
      workspaces: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          icon: string | null
          color: WorkspaceColor
          owner_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          icon?: string | null
          color?: WorkspaceColor
          owner_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: WorkspaceColor
          owner_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
        }
      }
      folders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          workspace_id: string | null
          name: string
          color: FolderColor
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
          name: string
          color?: FolderColor
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
          name?: string
          color?: FolderColor
        }
      }
      meetings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          workspace_id: string | null
          folder_id: string | null
          title: string
          description: string | null
          status: MeetingStatus
          duration_seconds: number | null
          file_path: string | null
          file_size_bytes: number | null
          file_type: string | null
          transcript: string | null
          summary: string | null
          key_points: string[] | null
          participants: string[] | null
          tags: string[] | null
          meeting_date: string | null
          processed_at: string | null
          ai_analysis: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
          folder_id?: string | null
          title: string
          description?: string | null
          status?: MeetingStatus
          duration_seconds?: number | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          transcript?: string | null
          summary?: string | null
          key_points?: string[] | null
          participants?: string[] | null
          tags?: string[] | null
          meeting_date?: string | null
          processed_at?: string | null
          ai_analysis?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
          folder_id?: string | null
          title?: string
          description?: string | null
          status?: MeetingStatus
          duration_seconds?: number | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          transcript?: string | null
          summary?: string | null
          key_points?: string[] | null
          participants?: string[] | null
          tags?: string[] | null
          meeting_date?: string | null
          processed_at?: string | null
          ai_analysis?: Json | null
        }
      }
      action_items: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          meeting_id: string
          user_id: string
          content: string
          assignee: string | null
          due_date: string | null
          completed: boolean
          priority: ActionItemPriority
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          meeting_id: string
          user_id: string
          content: string
          assignee?: string | null
          due_date?: string | null
          completed?: boolean
          priority?: ActionItemPriority
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          meeting_id?: string
          user_id?: string
          content?: string
          assignee?: string | null
          due_date?: string | null
          completed?: boolean
          priority?: ActionItemPriority
        }
      }
      key_decisions: {
        Row: {
          id: string
          created_at: string
          meeting_id: string
          user_id: string
          content: string
          context: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          meeting_id: string
          user_id: string
          content: string
          context?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          meeting_id?: string
          user_id?: string
          content?: string
          context?: string | null
        }
      }
      risks: {
        Row: {
          id: string
          created_at: string
          meeting_id: string
          user_id: string
          content: string
          severity: RiskSeverity
        }
        Insert: {
          id?: string
          created_at?: string
          meeting_id: string
          user_id: string
          content: string
          severity?: RiskSeverity
        }
        Update: {
          id?: string
          created_at?: string
          meeting_id?: string
          user_id?: string
          content?: string
          severity?: RiskSeverity
        }
      }
      participants: {
        Row: {
          id: string
          created_at: string
          meeting_id: string
          name: string
          email: string | null
          role: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          meeting_id: string
          name: string
          email?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          meeting_id?: string
          name?: string
          email?: string | null
          role?: string | null
        }
      }
      follow_up_questions: {
        Row: {
          id: string
          created_at: string
          meeting_id: string
          user_id: string
          question: string
          answered: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          meeting_id: string
          user_id: string
          question: string
          answered?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          meeting_id?: string
          user_id?: string
          question?: string
          answered?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      meeting_status: MeetingStatus
      action_item_priority: ActionItemPriority
      risk_severity: RiskSeverity
      folder_color: FolderColor
    }
  }
}

export type MeetingStatus = 'pending' | 'uploading' | 'transcribing' | 'analyzing' | 'completed' | 'failed'
export type ActionItemPriority = 'low' | 'medium' | 'high' | 'critical'
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'
export type FolderColor = 'gray' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink'
export type WorkspaceColor = 'gray' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink'
export type WorkspaceRole = 'owner' | 'admin' | 'member'

// Convenience row types
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert']
export type WorkspaceUpdate = Database['public']['Tables']['workspaces']['Update']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type MeetingContact = Database['public']['Tables']['meeting_contacts']['Row']
export type MeetingContactWithContact = MeetingContact & { contact: Contact }
export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Folder = Database['public']['Tables']['folders']['Row']
export type FolderUpdate = Database['public']['Tables']['folders']['Update']
export type Meeting = Database['public']['Tables']['meetings']['Row']
export type MeetingUpdate = Database['public']['Tables']['meetings']['Update']
export type ActionItem = Database['public']['Tables']['action_items']['Row']
export type KeyDecision = Database['public']['Tables']['key_decisions']['Row']
export type Risk = Database['public']['Tables']['risks']['Row']
export type FollowUpQuestion = Database['public']['Tables']['follow_up_questions']['Row']
export type Participant = Database['public']['Tables']['participants']['Row']

export const WORKSPACE_COLORS: { value: WorkspaceColor; dotClass: string; bgClass: string; textClass: string }[] = [
  { value: 'gray',   dotClass: 'bg-slate-400',   bgClass: 'bg-slate-100 dark:bg-slate-800',   textClass: 'text-slate-600 dark:text-slate-300' },
  { value: 'blue',   dotClass: 'bg-blue-500',    bgClass: 'bg-blue-100 dark:bg-blue-900/40',  textClass: 'text-blue-600 dark:text-blue-300' },
  { value: 'green',  dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-100 dark:bg-emerald-900/40', textClass: 'text-emerald-600 dark:text-emerald-300' },
  { value: 'purple', dotClass: 'bg-purple-500',  bgClass: 'bg-purple-100 dark:bg-purple-900/40',  textClass: 'text-purple-600 dark:text-purple-300' },
  { value: 'orange', dotClass: 'bg-orange-500',  bgClass: 'bg-orange-100 dark:bg-orange-900/40',  textClass: 'text-orange-600 dark:text-orange-300' },
  { value: 'red',    dotClass: 'bg-red-500',      bgClass: 'bg-red-100 dark:bg-red-900/40',    textClass: 'text-red-600 dark:text-red-300' },
  { value: 'pink',   dotClass: 'bg-pink-500',     bgClass: 'bg-pink-100 dark:bg-pink-900/40',  textClass: 'text-pink-600 dark:text-pink-300' },
]

export const FOLDER_COLORS: { value: FolderColor; dotClass: string; iconClass: string }[] = [
  { value: 'gray',   dotClass: 'bg-slate-400',   iconClass: 'text-slate-400' },
  { value: 'blue',   dotClass: 'bg-blue-500',    iconClass: 'text-blue-500' },
  { value: 'green',  dotClass: 'bg-emerald-500', iconClass: 'text-emerald-500' },
  { value: 'purple', dotClass: 'bg-purple-500',  iconClass: 'text-purple-500' },
  { value: 'orange', dotClass: 'bg-orange-500',  iconClass: 'text-orange-500' },
  { value: 'red',    dotClass: 'bg-red-500',      iconClass: 'text-red-500' },
  { value: 'pink',   dotClass: 'bg-pink-500',     iconClass: 'text-pink-500' },
]
