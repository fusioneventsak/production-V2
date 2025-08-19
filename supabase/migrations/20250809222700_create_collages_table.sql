-- Create collages table for storing 360° photo collages
CREATE TABLE IF NOT EXISTS public.collages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.collages ENABLE ROW LEVEL SECURITY;

-- Create policies for collages
CREATE POLICY "Users can view their own collages"
    ON public.collages
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collages"
    ON public.collages
    FOR SELECT
    USING (is_public = TRUE);

CREATE POLICY "Users can insert their own collages"
    ON public.collages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collages"
    ON public.collages
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collages"
    ON public.collages
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_collages_user_id ON public.collages(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collages_updated_at
BEFORE UPDATE ON public.collages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.collages TO authenticated;
GRANT ALL ON public.collages TO service_role;

-- Add comments
COMMENT ON TABLE public.collages IS 'Stores 360° photo collages created by users';
COMMENT ON COLUMN public.collages.user_id IS 'Reference to the user who owns this collage';
COMMENT ON COLUMN public.collages.is_public IS 'Whether the collage is visible to other users';
COMMENT ON COLUMN public.collages.thumbnail_url IS 'URL to the thumbnail image for the collage';
