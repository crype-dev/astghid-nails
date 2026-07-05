ALTER TABLE appointments ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed';
ALTER TABLE appointments ADD COLUMN service_duration_minutes INTEGER NOT NULL DEFAULT 60;
ALTER TABLE appointments ADD COLUMN service_price TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS blocked_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocked_date TEXT NOT NULL,
  blocked_time TEXT,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots (blocked_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments (status, date);
