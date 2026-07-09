-- 1) Warm-up cardio + bodyweight + park exercises (TODO: warmups like
--    treadmill; workouts that need no full gym — bodyweight & park bars).
-- 2) Precise per-exercise demo patterns: every exercise now points at a
--    hand-authored pattern in <ExerciseDemo> instead of a generic one.

insert into exercises (slug, name, muscle_groups, equipment, difficulty, demo_keyframes, form_cues, common_mistakes, adaptations) values

-- Cardio warm-ups
('treadmill-walk', 'Treadmill Warm-Up Walk', '{Cardio,Mobility}', 'full_gym', 1, '{"pattern":"treadmill"}',
 'Brisk incline walk, 3–5 minutes; relaxed shoulders, easy breathing.',
 '{"Holding the handrails","Starting too fast"}',
 '{}'),
('bike-easy', 'Stationary Bike (Easy)', '{Cardio,Mobility}', 'full_gym', 1, '{"pattern":"bike"}',
 'Light resistance, smooth cadence; raise the seat so the knee stays soft at the bottom.',
 '{"Seat too low","Grinding a heavy gear"}',
 '{"knee": {"note": "Keep resistance light and cadence high.", "avoid": false}}'),
('jump-rope', 'Jump Rope', '{Cardio}', 'basic', 2, '{"pattern":"jumprope"}',
 'Small hops on the balls of the feet; wrists spin the rope, not the arms.',
 '{"Jumping too high","Landing on the heels"}',
 '{"knee": {"note": "Swap for march in place.", "avoid": true}, "ankle": {"note": "Swap for march in place.", "avoid": true}}'),
('high-knees', 'High Knees', '{Cardio}', 'none', 2, '{"pattern":"highknees"}',
 'Drive knees to hip height, quick ground contact, pump the arms.',
 '{"Leaning back","Flat, heavy feet"}',
 '{"knee": {"note": "March instead of bouncing.", "avoid": false}}'),

-- Bodyweight mains
('pike-push-up', 'Pike Push-Up', '{Delts,Triceps}', 'none', 2, '{"pattern":"pike"}',
 'Hips high in an inverted V; lower the crown of the head toward the floor between the hands.',
 '{"Bending the knees","Flaring the elbows wide"}',
 '{"shoulder": {"note": "Reduce depth; stop before any pinch.", "avoid": false}, "wrist": {"note": "Use fists or handles to keep wrists neutral.", "avoid": false}}'),
('split-squat', 'Split Squat', '{Quads,Glutes}', 'none', 2, '{"pattern":"lunge"}',
 'Feet staggered, torso tall; drop the back knee straight down.',
 '{"Front knee collapsing inward","Pushing off the back foot"}',
 '{"knee": {"note": "Shorten the range — stop above 90°.", "avoid": false}}'),
('reverse-lunge', 'Reverse Lunge', '{Quads,Glutes}', 'none', 1, '{"pattern":"lunge"}',
 'Step back, drop the back knee; front shin stays vertical.',
 '{"Short choppy steps","Torso pitching forward"}',
 '{"knee": {"note": "Hold something for balance and reduce depth.", "avoid": false}}'),
('single-leg-glute-bridge', 'Single-Leg Glute Bridge', '{Glutes,Hamstrings}', 'none', 2, '{"pattern":"bridge"}',
 'One foot planted, the other leg extended; drive through the heel, hips square.',
 '{"Hips rotating","Overarching the lower back"}',
 '{"back": {"note": "Reduce range; stop before the back arches.", "avoid": false}}'),
('wall-sit', 'Wall Sit', '{Quads,Glutes}', 'none', 1, '{"pattern":"wallsit"}',
 'Back flat on the wall, thighs parallel to the floor, weight through the heels.',
 '{"Hands on the thighs","Sliding too low"}',
 '{"knee": {"note": "Sit higher — well above 90°.", "avoid": false}}'),
('side-plank', 'Side Plank', '{Core}', 'none', 2, '{"pattern":"sideplank"}',
 'Elbow under shoulder, body one straight line; brace and breathe.',
 '{"Hips sagging","Rolling forward"}',
 '{"shoulder": {"note": "Do it from the knees to reduce load.", "avoid": false}}'),
('crunch', 'Crunch', '{Core}', 'none', 1, '{"pattern":"situp"}',
 'Curl the ribs toward the hips; lower back stays on the floor.',
 '{"Pulling on the neck","Using momentum"}',
 '{"back": {"note": "Keep the range small — shoulder blades only.", "avoid": false}}'),
('burpee', 'Burpee', '{Cardio,Compound}', 'none', 3, '{"pattern":"burpee"}',
 'Squat, kick back to a plank, back in, stand or jump; keep the plank tight.',
 '{"Sagging hips in the plank","Landing stiff-legged"}',
 '{"knee": {"note": "Step back instead of jumping.", "avoid": false}, "wrist": {"note": "Use fists or handles.", "avoid": false}, "back": {"note": "Step, don''t jump, and skip the push-up.", "avoid": false}}'),
('squat-jump', 'Squat Jump', '{Quads,Cardio}', 'none', 2, '{"pattern":"jumpsquat"}',
 'Sit into a half squat, jump tall, land soft into the next rep.',
 '{"Landing with locked knees","Knees caving on landing"}',
 '{"knee": {"note": "Swap for bodyweight squats.", "avoid": true}, "ankle": {"note": "Swap for bodyweight squats.", "avoid": true}}'),
('doorway-row', 'Doorway Row', '{Back,Biceps}', 'none', 1, '{"pattern":"invrow"}',
 'Hold a doorframe or towel, lean back with a straight body, pull the chest to your hands.',
 '{"Hips piking","Shrugging the shoulders"}',
 '{}'),

-- Park (public calisthenics equipment)
('pull-up', 'Pull-Up', '{Back,Biceps,Compound}', 'park', 3, '{"pattern":"pullup"}',
 'Full hang to chin over the bar; lead with the chest, squeeze the shoulder blades.',
 '{"Kipping/swinging","Half range at the bottom","Chin poking forward"}',
 '{"shoulder": {"note": "Use a neutral or underhand grip; stop before any pinch.", "avoid": false}, "elbow": {"note": "Reduce volume; stop short of failure.", "avoid": false}}'),
('chin-up', 'Chin-Up', '{Biceps,Back}', 'park', 3, '{"pattern":"pullup"}',
 'Underhand grip, shoulder-width; pull the elbows down and back.',
 '{"Swinging for momentum","Dropping fast from the top"}',
 '{"elbow": {"note": "Reduce volume; stop short of failure.", "avoid": false}}'),
('bar-dip', 'Bar Dip', '{Chest,Triceps}', 'park', 3, '{"pattern":"dip"}',
 'Lean slightly forward, lower until upper arms are parallel, press tall.',
 '{"Sinking into the shoulders","Cutting depth","Flaring elbows"}',
 '{"shoulder": {"note": "Swap for bench dips or incline push-ups.", "avoid": true}}'),
('bench-dip', 'Bench Dip', '{Triceps,Chest}', 'park', 1, '{"pattern":"dip"}',
 'Hands on the bench edge, legs forward; bend the elbows straight back.',
 '{"Shoulders shrugging up","Hips drifting away from the bench"}',
 '{"shoulder": {"note": "Keep the range small; stop before any pinch.", "avoid": false}, "wrist": {"note": "Turn the hands slightly outward.", "avoid": false}}'),
('inverted-row', 'Inverted Row', '{Back,Biceps}', 'park', 2, '{"pattern":"invrow"}',
 'Hang under a low bar, body straight; pull the chest to the bar.',
 '{"Hips sagging","Shrugging at the top"}',
 '{"shoulder": {"note": "Raise the bar height to reduce load.", "avoid": false}}'),
('hanging-knee-raise', 'Hanging Knee Raise', '{Core}', 'park', 2, '{"pattern":"kneeraise"}',
 'Dead hang, ribs down; lift the knees to hip height without swinging.',
 '{"Swinging","Arching the lower back"}',
 '{"shoulder": {"note": "Swap for dead bugs on the floor.", "avoid": true}}'),
('step-up', 'Step-Up', '{Quads,Glutes}', 'park', 1, '{"pattern":"stepup"}',
 'Whole foot on the bench; drive through the heel, stand tall on top.',
 '{"Pushing off the bottom leg","Knee collapsing inward"}',
 '{"knee": {"note": "Use a lower step.", "avoid": false}}');

-- Precise patterns for existing exercises (were sharing 9 generic loops)
update exercises set demo_keyframes = '{"pattern":"deadbug"}'     where slug = 'dead-bug';
update exercises set demo_keyframes = '{"pattern":"birddog"}'     where slug = 'bird-dog';
update exercises set demo_keyframes = '{"pattern":"superman"}'    where slug = 'superman-hold';
update exercises set demo_keyframes = '{"pattern":"calfraise"}'   where slug = 'calf-raise';
update exercises set demo_keyframes = '{"pattern":"jumpingjack"}' where slug = 'jumping-jacks';
update exercises set demo_keyframes = '{"pattern":"climber"}'     where slug = 'mountain-climbers';
update exercises set demo_keyframes = '{"pattern":"childpose"}'   where slug = 'childs-pose';
update exercises set demo_keyframes = '{"pattern":"catcow"}'      where slug = 'cat-cow';
update exercises set demo_keyframes = '{"pattern":"treadmill"}'   where slug = 'treadmill-intervals';
update exercises set demo_keyframes = '{"pattern":"hipcircle"}'   where slug = 'hip-circles';
update exercises set demo_keyframes = '{"pattern":"armcircle"}'   where slug = 'arm-circles';

-- "Full Body — Strength" days focus {Compound, Core}, but nothing carried a
-- Compound tag, so those sessions matched Core-only. Tag the big lifts.
update exercises set muscle_groups = array_append(muscle_groups, 'Compound')
where slug in ('squat-bodyweight','push-up','goblet-squat','db-rdl','barbell-back-squat','barbell-bench-press')
  and not ('Compound' = any(muscle_groups));
