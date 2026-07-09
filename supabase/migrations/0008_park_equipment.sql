-- Add a "park" equipment tier: bodyweight plus public calisthenics-park
-- gear (pull-up bar, dip bars, benches). Sits between 'none' and 'full_gym'
-- conceptually, but selection uses capability sets (src/lib/plan/exercises.ts),
-- not a linear tier, because home "basic" kit (dumbbells/bands) and a park
-- (bars) are different capabilities, neither a superset of the other.
--
-- NOTE: kept as its own migration — Postgres forbids using a new enum value
-- in the same transaction that adds it, so the seed rows live in 0009.
alter type equipment_enum add value if not exists 'park' after 'none';
