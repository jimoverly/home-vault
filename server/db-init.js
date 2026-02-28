/**
 * Database initialization script
 * Run with: npm run db:init
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/home-vault.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`📁 Created data directory: ${dir}`);
}

const Database = require('better-sqlite3');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('🗄️  Initializing Home Vault database...\n');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    display_name  TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    locked_until  TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS items (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL,
    name           TEXT NOT NULL,
    category       TEXT DEFAULT 'other',
    description    TEXT,
    location       TEXT,
    purchase_date  TEXT,
    purchase_price REAL,
    current_value  REAL,
    serial_number  TEXT,
    make           TEXT,
    model          TEXT,
    condition      TEXT DEFAULT 'good',
    notes          TEXT,
    created_at     TEXT DEFAULT (datetime('now')),
    updated_at     TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL,
    name           TEXT NOT NULL,
    type           TEXT DEFAULT 'other_doc',
    description    TEXT,
    issue_date     TEXT,
    expiry_date    TEXT,
    issued_by      TEXT,
    policy_number  TEXT,
    linked_item_id TEXT,
    notes          TEXT,
    created_at     TEXT DEFAULT (datetime('now')),
    updated_at     TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_item_id) REFERENCES items(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT,
    action     TEXT NOT NULL,
    details    TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
  CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_documents_linked_item ON documents(linked_item_id);
  CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
`);

console.log('✅ Tables created: users, items, documents, audit_log');
console.log(`📍 Database location: ${path.resolve(DB_PATH)}`);
console.log('🎉 Database initialization complete!\n');
db.close();
