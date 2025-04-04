-- Script to check and update invalid interval values

-- First, let's identify any study_progress records with non-numeric interval values
SELECT id, interval 
FROM study_progress 
WHERE interval IS NOT NULL 
  AND interval !~ '^[0-9]+(\.[0-9]+)?$'; -- regex to check if not a valid number string

-- Now let's update any invalid interval values to '0'
UPDATE study_progress
SET interval = '0'
WHERE interval IS NOT NULL 
  AND interval !~ '^[0-9]+(\.[0-9]+)?$';

-- Finally, let's check the result
SELECT id, interval 
FROM study_progress 
ORDER BY id;