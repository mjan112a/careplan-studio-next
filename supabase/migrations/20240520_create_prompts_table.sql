-- Create prompts table to store AI prompt templates
CREATE TABLE IF NOT EXISTS prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    version INT NOT NULL,
    is_latest BOOLEAN DEFAULT true NOT NULL,
    category JSONB NOT NULL, -- { primary: string, secondary?: string, tertiary?: string }
    title TEXT NOT NULL,
    template TEXT NOT NULL,
    metadata JSONB NOT NULL, -- { createdAt: Date, updatedAt: Date, createdBy: string, updatedBy: string }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX idx_prompts_prompt_id_is_latest ON prompts(prompt_id, is_latest);
CREATE INDEX idx_prompts_category ON prompts USING GIN(category);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all prompts"
    ON prompts FOR SELECT
    USING (true);

CREATE POLICY "Admin users can create prompts"
    ON prompts FOR INSERT
    WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admin users can update prompts"
    ON prompts FOR UPDATE
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admin users can delete prompts"
    ON prompts FOR DELETE
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_prompts_updated_at
    BEFORE UPDATE ON prompts
    FOR EACH ROW EXECUTE FUNCTION update_prompts_updated_at();

-- Add a comment to the table
COMMENT ON TABLE prompts IS 'Stores AI prompt templates with versioning support'; 