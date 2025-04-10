export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          company: string | null
          email: string
          phone: string | null
          role: 'admin' | 'user'
          subscription_level: 'free' | 'basic' | 'premium' | null
          subscription_status: 'active' | 'inactive' | 'trial' | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          email_verified: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name: string
          company?: string | null
          email: string
          phone?: string | null
          role?: 'admin' | 'user'
          subscription_level?: 'free' | 'basic' | 'premium' | null
          subscription_status?: 'active' | 'inactive' | 'trial' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          email_verified?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string
          company?: string | null
          email?: string
          phone?: string | null
          role?: 'admin' | 'user'
          subscription_level?: 'free' | 'basic' | 'premium' | null
          subscription_status?: 'active' | 'inactive' | 'trial' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          email_verified?: boolean
        }
      }
      email_templates: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          type: 'verification' | 'reset_password'
          subject: string
          body: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          type: 'verification' | 'reset_password'
          subject: string
          body: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          type?: 'verification' | 'reset_password'
          subject?: string
          body?: string
        }
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
  }
} 