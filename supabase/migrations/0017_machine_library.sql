-- Machine library completion: covers the rest of a standard commercial gym
-- floor beyond 0004/0014 — smith machine, hip abduction/adduction, lying leg
-- curl, seated calf, glute kickback, plate/stack rows, reverse pec deck,
-- machine laterals, preacher curl, dip machines, ab/rotation machines, roman
-- chair, and the remaining cable staples. Same contract as 0014:
-- demo_keyframes holds a pattern key the shared <ExerciseDemo> maps to a
-- hand-authored SVG loop (new patterns this pass: abduction, adduction,
-- reversefly, kickback, pullover, overheadext, seatedcalf). adaptations
-- keyed by lowercase limitation tag; avoid:true excludes the exercise from
-- generation for that user. Isolation arm work carries the 'Arms' tag so
-- "Upper — Shoulders & Arms" days match it.

insert into exercises (slug, name, muscle_groups, equipment, difficulty, demo_keyframes, form_cues, common_mistakes, adaptations) values

-- Smith machine & landmine
('smith-machine-squat', 'Smith Machine Squat', '{Quads,Glutes,Compound}', 'full_gym', 2, '{"pattern":"squat"}',
 'Feet slightly ahead of the bar path; sit straight down, drive through mid-foot.',
 '{"Standing too far under the bar","Bouncing out of the bottom","Knees caving inward"}',
 '{"knee": {"note": "Limit depth to a pain-free range; feet a touch further forward.", "avoid": false}, "back": {"note": "The fixed path helps — brace hard and keep the ribs down.", "avoid": false}}'),
('smith-machine-bench', 'Smith Machine Bench Press', '{Chest,Triceps}', 'full_gym', 2, '{"pattern":"push"}',
 'Bar path over mid-chest; unrack with straight wrists, stop just short of lockout.',
 '{"Setting the bench too far forward or back","Bouncing the bar off the chest","Flaring elbows to 90°"}',
 '{"shoulder": {"note": "Shorten the range — stop an inch off the chest.", "avoid": false}, "wrist": {"note": "Stack knuckles over forearms; the fixed bar makes this easier.", "avoid": false}}'),
('landmine-press', 'Landmine Press', '{Delts,Chest,Compound}', 'full_gym', 2, '{"pattern":"press"}',
 'Stagger stance, brace; press the bar up and away along its arc, finish long.',
 '{"Leaning back to finish the press","Shrugging into the ear","Letting the hips swing forward"}',
 '{"shoulder": {"note": "The angled path is friendlier than vertical pressing — stay in a pain-free range.", "avoid": false}, "back": {"note": "Keep ribs down; use a half-kneeling stance for more support.", "avoid": false}}'),

-- Lower-body machines
('lying-leg-curl', 'Lying Leg Curl', '{Hamstrings}', 'full_gym', 1, '{"pattern":"legcurl"}',
 'Hips pressed into the pad; curl the heels to the glutes, lower with control.',
 '{"Hips popping up off the pad","Kicking with momentum","Letting the stack yank the legs straight"}',
 '{"knee": {"note": "Lighter load, smooth tempo, pain-free range.", "avoid": false}, "back": {"note": "Squeeze the glutes so the hips stay glued to the pad.", "avoid": false}}'),
('hip-abduction-machine', 'Hip Abduction Machine', '{Glutes,Hip}', 'full_gym', 1, '{"pattern":"abduction"}',
 'Sit tall, knees against the pads; press apart, pause, return without slamming.',
 '{"Leaning back to move more weight","Letting the pads slam shut","Rushed half-range reps"}',
 '{"hip": {"note": "Light weight, pain-free arc only.", "avoid": false}, "back": {"note": "Stay tall against the backrest — don''t rock the torso.", "avoid": false}}'),
('hip-adduction-machine', 'Hip Adduction Machine', '{Hip,Glutes}', 'full_gym', 1, '{"pattern":"adduction"}',
 'Start at a comfortable stretch; squeeze the pads together, control the way back out.',
 '{"Starting wider than your mobility allows","Letting the pads fly open","Gripping the handles to cheat"}',
 '{"hip": {"note": "Narrow the start position; go light and smooth.", "avoid": false}}'),
('seated-calf-raise', 'Seated Calf Raise', '{Calves}', 'full_gym', 1, '{"pattern":"seatedcalf"}',
 'Pads on the knees, balls of the feet on the platform; full stretch, pause at the top.',
 '{"Bouncing out of the stretch","Tiny partial reps at the top","Rocking the pad with the arms"}',
 '{"ankle": {"note": "Shorter range, lighter load — work up slowly.", "avoid": false}}'),
('glute-kickback-machine', 'Glute Kickback Machine', '{Glutes,Hamstrings}', 'full_gym', 1, '{"pattern":"kickback"}',
 'Hips square, chest on the support; drive the platform back with the heel, squeeze at the top.',
 '{"Arching the lower back to finish","Bouncing the leg back down","Turning the hip open"}',
 '{"back": {"note": "Stop the drive when the glute finishes — don''t hyperextend the spine.", "avoid": false}, "hip": {"note": "Shorten the arc; keep it pain-free.", "avoid": false}}'),

-- Upper-body machines
('seated-row-machine', 'Seated Row Machine', '{Back,Biceps}', 'full_gym', 1, '{"pattern":"row"}',
 'Chest on the pad; pull the handles to the ribs, squeeze the blades, return long.',
 '{"Yanking with the arms first","Shrugging into the ears","Letting the stack slam between reps"}',
 '{"back": {"note": "The chest pad protects you — keep contact through every rep.", "avoid": false}, "elbow": {"note": "Neutral-grip handles, lighter stack.", "avoid": false}}'),
('t-bar-row', 'T-Bar Row', '{Back,Biceps,Compound}', 'full_gym', 2, '{"pattern":"row"}',
 'Hinge to ~45°, chest proud; pull the handles to the sternum without standing up.',
 '{"Standing taller with every rep","Rounding the lower back","Jerking the weight off the chest"}',
 '{"back": {"note": "", "avoid": true}, "elbow": {"note": "Use straps so grip isn''t the limiter.", "avoid": false}}'),
('reverse-pec-deck', 'Reverse Pec Deck', '{Delts,Back}', 'full_gym', 1, '{"pattern":"reversefly"}',
 'Chest on the pad, slight elbow bend; sweep the arms back until level with the shoulders.',
 '{"Using momentum from the torso","Bending the elbows to press","Sweeping past the shoulder line"}',
 '{"shoulder": {"note": "Light weight, slow tempo — usually shoulder-friendly.", "avoid": false}}'),
('lateral-raise-machine', 'Lateral Raise Machine', '{Delts}', 'full_gym', 1, '{"pattern":"latraise"}',
 'Pads just above the elbows; lead the lift with the elbows to shoulder height.',
 '{"Shrugging the traps","Lifting above shoulder height","Letting the pads drop fast"}',
 '{"shoulder": {"note": "Stop below shoulder height, lighter stack.", "avoid": false}}'),
('preacher-curl', 'Preacher Curl', '{Biceps,Arms}', 'full_gym', 1, '{"pattern":"curl"}',
 'Armpits snug on the pad; curl up without lifting the elbows, lower almost to straight.',
 '{"Lifting the elbows off the pad","Dropping into a hard lockout","Leaning back at the top"}',
 '{"elbow": {"note": "Stop short of full extension at the bottom; go light.", "avoid": false}, "wrist": {"note": "Use an EZ bar or dumbbells to keep the wrists neutral.", "avoid": false}}'),
('seated-dip-machine', 'Seated Dip Machine', '{Triceps,Chest,Arms}', 'full_gym', 1, '{"pattern":"pushdown"}',
 'Shoulders down and back; press the handles to full extension, control the return.',
 '{"Shrugging as you press","Cutting the range short","Letting the handles fly up"}',
 '{"shoulder": {"note": "Shorten the top of the range — don''t let the handles ride high.", "avoid": false}, "elbow": {"note": "Lighter stack, stop just short of lockout.", "avoid": false}}'),
('assisted-dip', 'Assisted Dip', '{Chest,Triceps}', 'full_gym', 1, '{"pattern":"dip"}',
 'Set assistance for clean full reps; slight forward lean, upper arms to parallel.',
 '{"Sinking into the shoulders","Kipping off the knee pad","Cutting depth"}',
 '{"shoulder": {"note": "", "avoid": true}, "elbow": {"note": "More assistance, smooth tempo.", "avoid": false}}'),

-- Core machines
('ab-crunch-machine', 'Ab Crunch Machine', '{Core}', 'full_gym', 1, '{"pattern":"situp"}',
 'Ribs toward the hips — flex the spine, don''t hinge; exhale on the squeeze.',
 '{"Pulling with the arms","Hinging at the hips instead of crunching","Letting the stack snap you open"}',
 '{"back": {"note": "Small range, light stack — stop if it pinches.", "avoid": false}, "neck": {"note": "Keep the head resting against the pad, gaze forward.", "avoid": false}}'),
('torso-rotation-machine', 'Torso Rotation Machine', '{Core}', 'full_gym', 1, '{"pattern":"torsotwist"}',
 'Hips pinned; rotate from the ribs, pause, come back slow — no jerking.',
 '{"Rotating from the hips","Whipping through the middle","Overrotating past comfort"}',
 '{"back": {"note": "Gentle arc, light stack — rotation under load is where backs complain.", "avoid": false}}'),
('roman-chair-leg-raise', 'Roman Chair Leg Raise', '{Core,Hip}', 'full_gym', 2, '{"pattern":"kneeraise"}',
 'Forearms on the pads, shoulders down; curl the knees up and slightly in, lower slow.',
 '{"Swinging the legs for momentum","Shrugging into the shoulders","Arching the lower back on the way down"}',
 '{"back": {"note": "Bend the knees more and shorten the lowering phase.", "avoid": false}, "shoulder": {"note": "Keep the shoulders pressed down into the pads.", "avoid": false}}'),

-- Cables (remaining staples)
('cable-lateral-raise', 'Cable Lateral Raise', '{Delts,Arms}', 'full_gym', 1, '{"pattern":"latraise"}',
 'Cable at the low pulley behind the body; lead with the elbow to shoulder height.',
 '{"Swinging the torso","Raising above shoulder height","Starting the rep with a shrug"}',
 '{"shoulder": {"note": "Stop below shoulder height, thumb slightly up.", "avoid": false}}'),
('straight-arm-pulldown', 'Straight-Arm Pulldown', '{Back,Core}', 'full_gym', 1, '{"pattern":"pullover"}',
 'Soft elbows, hinge slightly; sweep the bar from overhead to the thighs with the lats.',
 '{"Bending the elbows into a pushdown","Rounding the back as the bar rises","Using body weight to lean on the bar"}',
 '{"shoulder": {"note": "Shorten the overhead range — start the sweep lower.", "avoid": false}, "back": {"note": "Brace the core; don''t let the weight pull you into an arch.", "avoid": false}}'),
('cable-overhead-triceps', 'Overhead Triceps Extension', '{Triceps,Arms}', 'full_gym', 1, '{"pattern":"overheadext"}',
 'Elbows by the ears, pointing forward; extend to straight, lower behind the head slow.',
 '{"Elbows flaring wide","Arching the back as the arms extend","Half-range reps"}',
 '{"shoulder": {"note": "Swap for pushdowns if overhead position pinches.", "avoid": false}, "elbow": {"note": "Rope attachment, lighter weight, smooth tempo.", "avoid": false}, "back": {"note": "Ribs down, glutes tight — don''t let the load pull you into an arch.", "avoid": false}}'),
('cable-pull-through', 'Cable Pull-Through', '{Glutes,Hamstrings}', 'full_gym', 1, '{"pattern":"hinge"}',
 'Face away from the low pulley; hinge back until the hamstrings load, stand tall with the glutes.',
 '{"Squatting instead of hinging","Rounding the lower back","Yanking with the arms"}',
 '{"back": {"note": "One of the friendlier hinges — keep the range short and the spine long.", "avoid": false}, "hip": {"note": "Shorten the hinge; stop before any pinch.", "avoid": false}}')

on conflict (slug) do update set
  name = excluded.name,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  difficulty = excluded.difficulty,
  demo_keyframes = excluded.demo_keyframes,
  form_cues = excluded.form_cues,
  common_mistakes = excluded.common_mistakes,
  adaptations = excluded.adaptations;
