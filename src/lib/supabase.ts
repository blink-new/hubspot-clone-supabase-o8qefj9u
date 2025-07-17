import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zcodgrigkfmbayswdqzo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjb2Rncmlna2ZtYmF5c3dkcXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NDg0NzcsImV4cCI6MjA2ODMyNDQ3N30.4tPqS4uQzLKC-aazOh5tGi3dOXFOdJBcJoykmJSqh_w'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          role: 'admin' | 'marketer' | 'sales_rep' | 'support_agent' | 'user'
          language: 'en' | 'ja'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'marketer' | 'sales_rep' | 'support_agent' | 'user'
          language?: 'en' | 'ja'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'marketer' | 'sales_rep' | 'support_agent' | 'user'
          language?: 'en' | 'ja'
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          domain: string | null
          industry: string | null
          size: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          job_title: string | null
          company_id: string | null
          lead_status: 'new' | 'open' | 'in_progress' | 'closed' | 'unqualified'
          lead_source: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          job_title?: string | null
          company_id?: string | null
          lead_status?: 'new' | 'open' | 'in_progress' | 'closed' | 'unqualified'
          lead_source?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          job_title?: string | null
          company_id?: string | null
          lead_status?: 'new' | 'open' | 'in_progress' | 'closed' | 'unqualified'
          lead_source?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          title: string
          amount: number | null
          stage: 'prospecting' | 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          probability: number
          close_date: string | null
          contact_id: string | null
          company_id: string | null
          assigned_to: string | null
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          amount?: number | null
          stage?: 'prospecting' | 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          probability?: number
          close_date?: string | null
          contact_id?: string | null
          company_id?: string | null
          assigned_to?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          amount?: number | null
          stage?: 'prospecting' | 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          probability?: number
          close_date?: string | null
          contact_id?: string | null
          company_id?: string | null
          assigned_to?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'deal_update' | 'status_change'
          subject: string
          description: string | null
          contact_id: string | null
          company_id: string | null
          deal_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'deal_update' | 'status_change'
          subject: string
          description?: string | null
          contact_id?: string | null
          company_id?: string | null
          deal_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'deal_update' | 'status_change'
          subject?: string
          description?: string | null
          contact_id?: string | null
          company_id?: string | null
          deal_id?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          category: string | null
          contact_id: string | null
          assigned_to: string | null
          created_by: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category?: string | null
          contact_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category?: string | null
          contact_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_campaigns: {
        Row: {
          id: string
          name: string
          subject: string
          content: string
          status: 'draft' | 'scheduled' | 'sent' | 'paused'
          sent_at: string | null
          recipients_count: number
          opens_count: number
          clicks_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subject: string
          content: string
          status?: 'draft' | 'scheduled' | 'sent' | 'paused'
          sent_at?: string | null
          recipients_count?: number
          opens_count?: number
          clicks_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          content?: string
          status?: 'draft' | 'scheduled' | 'sent' | 'paused'
          sent_at?: string | null
          recipients_count?: number
          opens_count?: number
          clicks_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          due_date: string | null
          completed: boolean
          priority: 'low' | 'medium' | 'high'
          contact_id: string | null
          deal_id: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          priority?: 'low' | 'medium' | 'high'
          contact_id?: string | null
          deal_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          priority?: 'low' | 'medium' | 'high'
          contact_id?: string | null
          deal_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}