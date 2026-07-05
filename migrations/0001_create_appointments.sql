CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE (date, time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (date);
