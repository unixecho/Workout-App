-- Weight-based badges: milestone loading achievements and progression tracking
-- These complement the existing volume (reps/minutes) and streak badges.

insert into badges (key, section, name, description, unlock_rule) values
  ('loaded_300', 'milestones', 'Loaded 300', 'Log a single lift at 300+ lbs', '{"type":"milestone_loading","threshold":136,"exercise":"any"}'),
  ('loaded_500', 'milestones', 'Loaded 500', 'Log a single lift at 500+ lbs', '{"type":"milestone_loading","threshold":227,"exercise":"any"}'),
  ('daily_1000', 'milestones', '1000 lb Day', 'Achieve 1000+ total daily loading', '{"type":"total_daily_loading","threshold":1000}'),
  ('deadlift_plate', 'milestones', 'Plate Loaded', 'Log a 405+ lb deadlift', '{"type":"milestone_loading","threshold":184,"exercise":"barbell-deadlift"}'),
  ('squatter', 'milestones', 'Squatter', 'Log a 300+ lb squat', '{"type":"milestone_loading","threshold":136,"exercise":"barbell-back-squat"}'),
  ('bencher', 'milestones', 'Bencher', 'Log a 225+ lb bench press', '{"type":"milestone_loading","threshold":102,"exercise":"barbell-bench-press"}');
