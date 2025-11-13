CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO todos (title, description) VALUES
  ('Õpi Docker Compose', 'Multi-container rakendus'),
  ('Tee kodutöö', 'Labori ülesanded'),
  ('Test rakendust', 'Kontrolli et kõik töötab');
