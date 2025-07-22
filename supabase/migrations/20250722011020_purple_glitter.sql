/*
  # Add Storage Policies for Photobooth Frames

  1. Storage Policies
    - Allow authenticated users to upload photobooth frames to their own collages
    - Allow public read access to photobooth frames for display
    - Allow users to delete their own photobooth frames
  
  2. Security
    - Upload restricted to authenticated users only
    - Public read access for frame display in photobooths
    - Delete restricted to authenticated users (frame ownership validation would need app-level logic)
*/

-- Allow authenticated users to upload photobooth frames
CREATE POLICY "Users can upload photobooth frames" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'photos' 
  AND (storage.foldername(name))[1] = 'photobooth-frames'
  AND auth.uid() IS NOT NULL
);

-- Allow public read access to photobooth frames
CREATE POLICY "Public can view photobooth frames" ON storage.objects
FOR SELECT USING (
  bucket_id = 'photos' 
  AND (storage.foldername(name))[1] = 'photobooth-frames'
);

-- Allow users to delete their own photobooth frames
CREATE POLICY "Users can delete their photobooth frames" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos' 
  AND (storage.foldername(name))[1] = 'photobooth-frames'
  AND auth.uid() IS NOT NULL
);