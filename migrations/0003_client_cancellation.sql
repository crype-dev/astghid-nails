ALTER TABLE appointments ADD COLUMN cancel_token_hash TEXT;
ALTER TABLE appointments ADD COLUMN cancelled_at TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_cancel_token_hash
  ON appointments(cancel_token_hash);

CREATE INDEX IF NOT EXISTS idx_appointments_cancelled_at
  ON appointments(cancelled_at);
