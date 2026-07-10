-- Warmup category: every exercise suitable as a warm-up carries a 'Warmup'
-- tag in muscle_groups (same convention as 'Compound' — a functional tag,
-- not an anatomical muscle). Powers the Library "Warmup" filter and the
-- warm-up slot selection in src/lib/plan/exercises.ts.
--
-- Also rounds out warm-up coverage per environment:
--   full gym: rowing machine, elliptical (existing: treadmill, bike)
--   home/anywhere: leg swings, torso twists, shoulder rolls, butt kicks
--   park: dead hang (bar shoulder decompression)
-- 'Warmup' is appended LAST in each array so library cards (which show the
-- first two tags) keep showing real muscle groups.

insert into exercises (slug, name, muscle_groups, equipment, difficulty, demo_keyframes, form_cues, common_mistakes, adaptations) values

('rower-easy', 'Rowing Machine (Easy)', '{Cardio,Mobility,Warmup}', 'full_gym', 1, '{"pattern":"rower"}',
 'Light damper, smooth strokes: push with the legs, then lean, then pull the arms.',
 '{"Yanking with the arms first","Rounding the back"}',
 '{"back": {"note": "Sit tall and keep the stroke short; stop if the back rounds.", "avoid": false}}'),

('elliptical-easy', 'Elliptical (Easy)', '{Cardio,Mobility,Warmup}', 'full_gym', 1, '{"pattern":"elliptical"}',
 'Easy resistance, tall posture; push and pull the handles evenly.',
 '{"Leaning on the handles","Locking the knees"}',
 '{"knee": {"note": "Great low-impact option - keep resistance light.", "avoid": false}}'),

('leg-swings', 'Leg Swings', '{Hip,Mobility,Warmup}', 'none', 1, '{"pattern":"legswing"}',
 'Hold something for balance; swing one leg forward and back, relaxed and controlled.',
 '{"Arching the lower back","Swinging too hard"}',
 '{"hip": {"note": "Keep the swing small and slow.", "avoid": false}, "back": {"note": "Keep the range small; do not let the back arch.", "avoid": false}}'),

('torso-twists', 'Torso Twists', '{Core,Mobility,Warmup}', 'none', 1, '{"pattern":"torsotwist"}',
 'Feet planted hip-width; rotate the torso side to side with loose arms.',
 '{"Twisting from the knees","Rushing the rotation"}',
 '{"back": {"note": "Keep the twist gentle and slow.", "avoid": false}}'),

('shoulder-rolls', 'Shoulder Rolls', '{Delts,Mobility,Warmup}', 'none', 1, '{"pattern":"shoulderroll"}',
 'Roll the shoulders up, back, and down in big slow circles.',
 '{"Holding tension at the top","Tiny rushed circles"}',
 '{"shoulder": {"note": "Keep the circles small and pain-free.", "avoid": false}, "neck": {"note": "Keep the neck relaxed and tall.", "avoid": false}}'),

('butt-kicks', 'Butt Kicks', '{Cardio,Warmup}', 'none', 2, '{"pattern":"buttkick"}',
 'Jog in place, kicking the heels toward the glutes; land soft on the balls of the feet.',
 '{"Leaning forward","Heavy landings"}',
 '{"knee": {"note": "March instead of bouncing.", "avoid": false}, "ankle": {"note": "Swap for march in place.", "avoid": true}}'),

('dead-hang', 'Dead Hang', '{Back,Mobility,Warmup}', 'park', 1, '{"pattern":"deadhang"}',
 'Grip the bar, arms straight, and let the body hang; breathe and let the shoulders stretch.',
 '{"Holding the breath","Swinging"}',
 '{"shoulder": {"note": "Keep the shoulders slightly engaged; skip if it pinches.", "avoid": false}, "wrist": {"note": "Use shorter hold times.", "avoid": false}}');

-- Tag the existing warm-up-suitable exercises.
update exercises set muscle_groups = array_append(muscle_groups, 'Warmup')
where slug in ('treadmill-walk','bike-easy','jump-rope','high-knees','jumping-jacks',
               'light-march','arm-circles','cat-cow','hip-circles')
  and not ('Warmup' = any(muscle_groups));
