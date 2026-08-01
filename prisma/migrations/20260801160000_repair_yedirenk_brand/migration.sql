UPDATE "AppSetting"
SET "value" = jsonb_set(
  "value"::jsonb,
  '{organizationName}',
  to_jsonb(('Yedirenk Derne' || chr(287) || 'i Ba' || chr(287) || chr(305) || chr(351) || ' Y' || chr(246) || 'netimi')::text),
  true
)
WHERE "key" = 'organization';

UPDATE "Association"
SET "name" = 'Yedirenk Derne' || chr(287) || 'i Ba' || chr(287) || chr(305) || chr(351) || ' Y' || chr(246) || 'netimi',
    "shortName" = 'Yedirenk',
    "logoDataUrl" = '/yedirenk-logo.png',
    "logoAlt" = 'Yedirenk Derne' || chr(287) || 'i kurumsal logosu'
WHERE "isDefault" = true;
