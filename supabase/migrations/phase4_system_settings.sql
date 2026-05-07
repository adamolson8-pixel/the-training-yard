-- Phase 4: System Settings Table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO system_settings (key, value) VALUES (
  'email_templates',
  '[
    {"key": "booking_confirm", "label": "Booking Confirmation", "body": "Hi {{name}},\n\nYour session at The Training Yard is confirmed!\n\n📅 Date: {{date}}\n⚾ Service: {{service}}\n\nSee you on the field!\n— The Training Yard Team"},
    {"key": "booking_reminder", "label": "Session Reminder (24 hrs before)", "body": "Hi {{name}},\n\nReminder: You have a session tomorrow at The Training Yard.\n\n📅 Date: {{date}}\n⚾ Service: {{service}}\n\nQuestions? Reply to this email.\n— The Training Yard Team"},
    {"key": "booking_cancel", "label": "Cancellation Confirmation", "body": "Hi {{name}},\n\nYour session on {{date}} has been cancelled. If a refund is due, allow 5–10 business days to appear.\n\nWe hope to see you again soon!\n— The Training Yard Team"}
  ]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Insert default operating hours
INSERT INTO system_settings (key, value) VALUES (
  'operating_hours',
  '{"mon": {"open": true, "start": "06:00", "end": "22:00"}, "tue": {"open": true, "start": "06:00", "end": "22:00"}, "wed": {"open": true, "start": "06:00", "end": "22:00"}, "thu": {"open": true, "start": "06:00", "end": "22:00"}, "fri": {"open": true, "start": "06:00", "end": "22:00"}, "sat": {"open": true, "start": "07:00", "end": "20:00"}, "sun": {"open": false, "start": "09:00", "end": "17:00"}}'::jsonb
) ON CONFLICT (key) DO NOTHING;
