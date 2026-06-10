import { createClient, type Client } from "@libsql/client";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id TEXT UNIQUE,
    business_name TEXT,
    dba_name TEXT,
    industry TEXT,
    amount_requested TEXT,
    use_of_funds TEXT,
    priority TEXT,
    first_time_funding TEXT,
    entity_type TEXT,
    date_started TEXT,
    num_employees TEXT,
    ein TEXT,
    credit_score TEXT,
    business_address TEXT,
    owner_name TEXT,
    owner_home_address TEXT,
    owner_phone TEXT,
    owner_dob TEXT,
    owner_ssn TEXT,
    owner_email TEXT,
    ownership_percentage TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    archived INTEGER NOT NULL DEFAULT 0,
    application_date TEXT,
    status_updated_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS _migrations (key TEXT PRIMARY KEY);


  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    document_type TEXT,
    original_url TEXT,
    filename TEXT,
    file_path TEXT,
    uploaded_by TEXT,
    uploaded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (application_id) REFERENCES applications(id)
  );

  CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    changed_by TEXT,
    changed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (application_id) REFERENCES applications(id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (application_id) REFERENCES applications(id)
  );
`;

let _db: Client | null = null;
let initialized = false;

function getDb(): Client {
  if (!_db) {
    const url = process.env.TURSO_DATABASE_URL ?? "file:./data/loan-crm.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;
    _db = createClient({ url, authToken });
  }
  return _db;
}

export async function initDb(): Promise<Client> {
  const db = getDb();
  if (!initialized) {
    await db.executeMultiple(SCHEMA);
    // Add archived column to existing DBs that predate the schema change
    try {
      await db.execute("ALTER TABLE applications ADD COLUMN archived INTEGER NOT NULL DEFAULT 0");
    } catch {}
    initialized = true;
  }
  return db;
}
