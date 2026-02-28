/**
 * Ensures database tables exist on server startup.
 */
const db = require('./db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL, failed_attempts INTEGER DEFAULT 0, locked_until TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
    category TEXT DEFAULT 'other', description TEXT, location TEXT,
    purchase_date TEXT, purchase_price REAL, current_value REAL,
    serial_number TEXT, make TEXT, model TEXT, condition TEXT DEFAULT 'good', notes TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
    type TEXT DEFAULT 'other_doc', description TEXT, issue_date TEXT, expiry_date TEXT,
    issued_by TEXT, policy_number TEXT, linked_item_id TEXT, notes TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_item_id) REFERENCES items(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, action TEXT NOT NULL,
    details TEXT, ip_address TEXT, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
  CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_documents_linked_item ON documents(linked_item_id);
  CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
`);
