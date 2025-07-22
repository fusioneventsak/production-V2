/*
  # Add Photobooth Settings to Collage Settings

  1. Updates
    - Add photobooth settings to existing collage_settings records
    - Update the default collage settings creation function to include photobooth settings
    
  2. Changes
    - All existing collages will get default photobooth settings
    - New collages will automatically include photobooth settings
    - Settings include frame selection, text overlay, and customization options
    
  3. Settings Structure
    - selectedFrameId: Frame selection (default: 'none')
    - selectedFrameUrl: URL to frame image
    - frameOpacity: Frame transparency (0-100)
    - enableTextOverlay: Show/hide text overlay
    - defaultText: Event name text
    - textColor: Text color hex code
    - textSize: Text size in pixels
    - textPosition: Text position (top/center/bottom)
*/

-- Update existing collage_settings records to include photobooth settings
UPDATE collage_settings 
SET settings = settings || jsonb_build_object(
  'photobooth', jsonb_build_object(
    'selectedFrameId', 'none',
    'selectedFrameUrl', null,
    'frameOpacity', 80,
    'enableTextOverlay', true,
    'defaultText', 'PhotoSphere Event',
    'textColor', '#FFFFFF',
    'textSize', 24,
    'textPosition', 'bottom',
    'textFont', 'Inter',
    'enableCountdown', true,
    'countdownDuration', 3,
    'showCaptureButton', true,
    'buttonStyle', 'circle',
    'buttonColor', '#8B5CF6',
    'photoResolution', '1080p',
    'compressionQuality', 85,
    'enableFlash', true,
    'enableLogo', false,
    'logoPosition', 'top-right',
    'logoSize', 'small',
    'logoOpacity', 80,
    'frontCamera', true,
    'enableZoom', true,
    'enableFlip', true,
    'showGridLines', false,
    'enableFilterPreview', false,
    'previewDuration', 5,
    'uploadedFrames', '[]'::jsonb
  )
)
WHERE NOT (settings ? 'photobooth');

-- Update the create_default_collage_settings function to include photobooth settings
CREATE OR REPLACE FUNCTION create_default_collage_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO collage_settings (collage_id, settings)
  VALUES (
    NEW.id,
    jsonb_build_object(
      'gridSize', 200,
      'floorSize', 200,
      'gridColor', '#444444',
      'photoSize', 4.0,
      'floorColor', '#1A1A1A',
      'photoCount', 50,
      'wallHeight', 0,
      'gridEnabled', true,
      'gridOpacity', 1.0,
      'cameraHeight', 10,
      'floorEnabled', true,
      'floorOpacity', 0.8,
      'photoSpacing', 0,
      'cameraEnabled', true,
      'gridDivisions', 30,
      'animationSpeed', 50,
      'cameraDistance', 25,
      'emptySlotColor', '#FF3333',
      'floorMetalness', 0.7,
      'floorRoughness', 0.2,
      'spotlightAngle', 1.2566370614359172,
      'spotlightColor', '#ffffff',
      'spotlightCount', 3,
      'spotlightWidth', 1.8,
      'backgroundColor', '#000000',
      'gridAspectRatio', 1.77778,
      'spotlightHeight', 35,
      'animationEnabled', false,
      'animationPattern', 'grid',
      'photoRotation', true,
      'floorReflectivity', 0.8,
      'spotlightDistance', 60,
      'spotlightPenumbra', 1.2,
      'backgroundGradient', false,
      'spotlightIntensity', 600.0,
      'cameraRotationSpeed', 0.2,
      'ambientLightIntensity', 0.6,
      'backgroundGradientEnd', '#1a1a1a',
      'cameraRotationEnabled', true,
      'backgroundGradientAngle', 180,
      'backgroundGradientStart', '#000000',
      'photoBrightness', 1.2,
      'patterns', jsonb_build_object(
        'grid', jsonb_build_object(
          'enabled', true,
          'spacing', 0.1,
          'aspectRatio', 1.77778,
          'wallHeight', 0,
          'photoCount', 50
        ),
        'float', jsonb_build_object(
          'enabled', false,
          'spacing', 0.1,
          'height', 60,
          'spread', 25,
          'photoCount', 100
        ),
        'wave', jsonb_build_object(
          'enabled', false,
          'spacing', 0.15,
          'amplitude', 15,
          'frequency', 0.3,
          'photoCount', 75
        ),
        'spiral', jsonb_build_object(
          'enabled', false,
          'spacing', 0.1,
          'radius', 20,
          'heightStep', 0.5,
          'photoCount', 150
        )
      ),
      'photobooth', jsonb_build_object(
        'selectedFrameId', 'none',
        'selectedFrameUrl', null,
        'frameOpacity', 80,
        'enableTextOverlay', true,
        'defaultText', NEW.name,
        'textColor', '#FFFFFF',
        'textSize', 24,
        'textPosition', 'bottom',
        'textFont', 'Inter',
        'enableCountdown', true,
        'countdownDuration', 3,
        'showCaptureButton', true,
        'buttonStyle', 'circle',
        'buttonColor', '#8B5CF6',
        'photoResolution', '1080p',
        'compressionQuality', 85,
        'enableFlash', true,
        'enableLogo', false,
        'logoPosition', 'top-right',
        'logoSize', 'small',
        'logoOpacity', 80,
        'frontCamera', true,
        'enableZoom', true,
        'enableFlip', true,
        'showGridLines', false,
        'enableFilterPreview', false,
        'previewDuration', 5,
        'uploadedFrames', '[]'::jsonb
      )
    )
  );
  RETURN NEW;
END;
$$;