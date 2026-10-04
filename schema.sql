-- File ini digunakan untuk membuat tabel di Cloudflare D1
-- Tabel Pemain
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'player'
);

-- Tabel Beatmap
CREATE TABLE IF NOT EXISTS beatmaps (
    id TEXT PRIMARY KEY,
    mod TEXT NOT NULL,
    name TEXT NOT NULL
);

-- Tabel Skor
CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    map_key TEXT NOT NULL,
    score INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Insert Data Default (Admin & Default Maps)
INSERT OR IGNORE INTO players (id, username, password, role) VALUES ('admin1', 'admin', 'admin', 'admin');
INSERT OR IGNORE INTO beatmaps (id, mod, name) VALUES 
('nm1', 'NM', 'NM1'), ('nm2', 'NM', 'NM2'), ('nm3', 'NM', 'NM3'), ('nm4', 'NM', 'NM4'),
('hd1', 'HD', 'HD1'), ('hd2', 'HD', 'HD2'), ('hd3', 'HD', 'HD3'),
('hr1', 'HR', 'HR1'), ('hr2', 'HR', 'HR2'), ('hr3', 'HR', 'HR3'),
('dt1', 'DT', 'DT1'), ('dt2', 'DT', 'DT2'), ('dt3', 'DT', 'DT3'),
('mm1', 'MM', 'MM1'), ('mm2', 'MM', 'MM2'), ('tb1', 'TB', 'TB1');