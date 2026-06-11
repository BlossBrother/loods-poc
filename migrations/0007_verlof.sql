-- 0007: verlofoverzicht (Buddee). Aparte tabel zodat de gewone agenda schoon blijft.
CREATE TABLE IF NOT EXISTS verlof (
  id TEXT PRIMARY KEY,
  external_id TEXT,
  employee_email TEXT,
  employee_name TEXT NOT NULL,
  type TEXT,
  start_at INTEGER NOT NULL,
  end_at INTEGER NOT NULL,
  status TEXT,
  source TEXT NOT NULL DEFAULT 'buddee',
  synced_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_verlof_range ON verlof(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_verlof_src ON verlof(source);

-- Demo-rijen (source='demo') zodat de planner meteen iets toont. De Buddee-sync raakt
-- alleen source='buddee' aan. Verwijderen: DELETE FROM verlof WHERE source='demo';
INSERT INTO verlof (id,external_id,employee_email,employee_name,type,start_at,end_at,status,source,synced_at) VALUES ('demo1',NULL,'peterjanvaningen@gmail.com','Peter-Jan van Ingen','vakantie',1780956000000,1781215199000,'approved','demo',NULL);
INSERT INTO verlof (id,external_id,employee_email,employee_name,type,start_at,end_at,status,source,synced_at) VALUES ('demo2',NULL,'sanne@example.com','Sanne de Vries','vakantie',1781042400000,1781128799000,'approved','demo',NULL);
INSERT INTO verlof (id,external_id,employee_email,employee_name,type,start_at,end_at,status,source,synced_at) VALUES ('demo3',NULL,'tom@example.com','Tom Bakker','vakantie',1781215200000,1781387999000,'approved','demo',NULL);
INSERT INTO verlof (id,external_id,employee_email,employee_name,type,start_at,end_at,status,source,synced_at) VALUES ('demo4',NULL,'lisa@example.com','Lisa Jansen','bijzonder',1780956000000,1781042399000,'approved','demo',NULL);
INSERT INTO verlof (id,external_id,employee_email,employee_name,type,start_at,end_at,status,source,synced_at) VALUES ('demo5',NULL,'mark@example.com','Mark Visser','vakantie',1781128800000,1781387999000,'approved','demo',NULL);
INSERT INTO verlof (id,external_id,employee_email,employee_name,type,start_at,end_at,status,source,synced_at) VALUES ('demo6',NULL,'nora@example.com','Nora El Amrani','vakantie',1781042400000,1781301599000,'approved','demo',NULL);
