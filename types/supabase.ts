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
      user_stripe_history: {
        Row: {
          id: string
          created_at: string
          user_id: string
          stripe_event_type: string
          stripe_invoice_id: string | null
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          amount: number | null
          currency: string | null
          hosted_invoice_url: string | null
          status: string | null
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          stripe_event_type: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          amount?: number | null
          currency?: string | null
          hosted_invoice_url?: string | null
          status?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          stripe_event_type?: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          amount?: number | null
          currency?: string | null
          hosted_invoice_url?: string | null
          status?: string | null
          description?: string | null
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
      },
      ai_interactions: {
        Row: {
          id: string;
          timestamp: string;
          request: Json;
          response: Json | null;
          latency_ms: number | null;
          error_code: string | null;
          error_message: string | null;
          model_name: string;
          user_id: string | null;
          file_metadata: Json | null;
          status: string;
          prompt_hash: string | null;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          timestamp?: string;
          request: Json;
          response?: Json | null;
          latency_ms?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          model_name: string;
          user_id?: string | null;
          file_metadata?: Json | null;
          status?: string;
          prompt_hash?: string | null;
          ip_address?: string | null;
        };
        Update: {
          id?: string;
          timestamp?: string;
          request?: Json;
          response?: Json | null;
          latency_ms?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          model_name?: string;
          user_id?: string | null;
          file_metadata?: Json | null;
          status?: string;
          prompt_hash?: string | null;
          ip_address?: string | null;
        };
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