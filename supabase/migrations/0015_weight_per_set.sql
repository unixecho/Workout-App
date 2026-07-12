-- Weight per set logging — exercise_logs.sets_completed now stores:
-- [{ reps: N, weight: M }, ...] for reps-based exercises
-- [{ seconds: N, weight?: M }, ...] for time-based (weight optional)
--
-- This enables per-set PRs, loading progression tracking, and weight milestones.
-- No schema changes needed — jsonb is flexible. This migration exists for documentation.
-- Client code changes: WorkoutPlayer and stats queries updated to parse weight.

-- Commentary: weight is exercise-dependent
-- - Required for: all barbell lifts, smith machine, cables, machines (per-set loading)
-- - Optional for: cardio, bodyweight (reps only)
-- - Not applicable for: warmups, stretching

-- Badge rules added (completeWorkout will evaluate):
-- - "milestone_loading": max(weight) >= threshold on an exercise (e.g., 300 lbs deadlift)
-- - "total_daily_loading": sum of (reps × weight) across all weighted exercises
-- - "loading_progression": max weight on an exercise increased from last 7 days
