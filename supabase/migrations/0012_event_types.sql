-- New activity event types (FD §11):
--   'friendship' — "you became friends" (Steam-style), fans out normally.
--   'poke'       — a direct fist-bump; routed to the target only (see 0013).
-- Kept separate from 0013 because a new enum value can't be added and used in
-- the same transaction.
alter type event_type_enum add value if not exists 'friendship';
alter type event_type_enum add value if not exists 'poke';
