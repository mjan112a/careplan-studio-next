export interface PromptCategory {
  primary: string;
  secondary?: string;
  tertiary?: string;
}

export interface PromptMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// This interface should match our Supabase database structure
// But we'll maintain camelCase in our app and convert as needed
export interface Prompt {
  // Database fields (matching Supabase column names)
  id: string;
  prompt_id: string; // In Supabase, this is prompt_id
  version: number;
  is_latest: boolean; // In Supabase, this is is_latest
  category: PromptCategory;
  title: string;
  template: string;
  metadata: PromptMetadata;
  created_at: Date; // In Supabase, this is created_at
  updated_at: Date; // In Supabase, this is updated_at
  
  // For backward compatibility with existing code
  // These will be mapped from the snake_case fields
  promptId?: string;
  isLatest?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePromptRequest {
  category: PromptCategory;
  title: string;
  template: string;
  metadata: Omit<PromptMetadata, 'createdAt' | 'updatedAt'>;
}

export interface UpdatePromptRequest extends CreatePromptRequest {
  promptId: string;
} 