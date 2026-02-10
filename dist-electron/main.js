import { app as i, ipcMain as n, BrowserWindow as T } from "electron";
import { fileURLToPath as l } from "node:url";
import d from "node:path";
import _ from "better-sqlite3";
import R from "path";
const m = R.join(i.getPath("userData"), "crm.db"), t = new _(m);
t.pragma("journal_mode = WAL");
function u() {
  t.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      amount REAL,
      due_date TEXT,
      status TEXT DEFAULT 'pending',
      description TEXT,
      recurrence TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS process_pipelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      stage TEXT DEFAULT 'lead',
      value REAL,
      deadline TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'consulta',
      day_of_month INTEGER,
      start_date TEXT,
      end_date TEXT,
      recurrence TEXT DEFAULT 'none',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    );
  `);
  try {
    t.exec("ALTER TABLE payments ADD COLUMN end_date TEXT");
  } catch {
  }
}
const p = d.dirname(l(import.meta.url));
process.env.APP_ROOT = d.join(p, "..");
const s = process.env.VITE_DEV_SERVER_URL, S = d.join(process.env.APP_ROOT, "dist-electron"), c = d.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = s ? d.join(process.env.APP_ROOT, "public") : c;
let r;
u();
function o() {
  r = new T({
    icon: d.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: d.join(p, "preload.mjs")
    }
  }), r.webContents.on("did-finish-load", () => {
    r == null || r.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), s ? r.loadURL(s) : r.loadFile(d.join(c, "index.html"));
}
n.handle("get-clients", () => t.prepare("SELECT * FROM clients ORDER BY name ASC").all());
n.handle("add-client", (a, e) => t.prepare("INSERT INTO clients (name, phone, email, address, notes) VALUES (@name, @phone, @email, @address, @notes)").run(e));
n.handle("update-client", (a, e) => t.prepare("UPDATE clients SET name = @name, phone = @phone, email = @email, address = @address, notes = @notes WHERE id = @id").run(e));
n.handle("delete-client", (a, e) => t.prepare("DELETE FROM clients WHERE id = ?").run(e));
n.handle("get-payments", () => t.prepare(`
    SELECT p.*, c.name as client_name 
    FROM payments p 
    LEFT JOIN clients c ON p.client_id = c.id 
    ORDER BY p.due_date ASC
  `).all());
n.handle("add-payment", (a, e) => t.prepare("INSERT INTO payments (client_id, amount, due_date, status, description, recurrence, end_date) VALUES (@client_id, @amount, @due_date, @status, @description, @recurrence, @end_date)").run(e));
n.handle("update-payment-status", (a, { id: e, status: E }) => t.prepare("UPDATE payments SET status = ? WHERE id = ?").run(E, e));
n.handle("update-payment", (a, e) => t.prepare("UPDATE payments SET client_id = @client_id, amount = @amount, due_date = @due_date, description = @description, recurrence = @recurrence, end_date = @end_date WHERE id = @id").run(e));
n.handle("delete-payment", (a, e) => t.prepare("DELETE FROM payments WHERE id = ?").run(e));
n.handle("get-processes", () => t.prepare(`
    SELECT p.*, c.name as client_name 
    FROM process_pipelines p 
    LEFT JOIN clients c ON p.client_id = c.id 
    ORDER BY p.created_at DESC
  `).all());
n.handle("add-process", (a, e) => t.prepare("INSERT INTO process_pipelines (client_id, title, status, stage, value, deadline) VALUES (@client_id, @title, @status, @stage, @value, @deadline)").run(e));
n.handle("update-process-stage", (a, { id: e, stage: E }) => t.prepare("UPDATE process_pipelines SET stage = ? WHERE id = ?").run(E, e));
n.handle("update-process", (a, e) => t.prepare("UPDATE process_pipelines SET client_id = @client_id, title = @title, value = @value, deadline = @deadline WHERE id = @id").run(e));
n.handle("delete-process", (a, e) => t.prepare("DELETE FROM process_pipelines WHERE id = ?").run(e));
n.handle("get-appointments", () => t.prepare(`
    SELECT a.*, c.name as client_name 
    FROM appointments a 
    LEFT JOIN clients c ON a.client_id = c.id 
    ORDER BY a.start_date ASC
  `).all());
n.handle("add-appointment", (a, e) => t.prepare("INSERT INTO appointments (client_id, title, type, day_of_month, start_date, end_date, recurrence, notes) VALUES (@client_id, @title, @type, @day_of_month, @start_date, @end_date, @recurrence, @notes)").run(e));
n.handle("update-appointment", (a, e) => t.prepare("UPDATE appointments SET client_id = @client_id, title = @title, type = @type, day_of_month = @day_of_month, start_date = @start_date, end_date = @end_date, recurrence = @recurrence, notes = @notes WHERE id = @id").run(e));
n.handle("delete-appointment", (a, e) => t.prepare("DELETE FROM appointments WHERE id = ?").run(e));
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (i.quit(), r = null);
});
i.on("activate", () => {
  T.getAllWindows().length === 0 && o();
});
i.whenReady().then(o);
export {
  S as MAIN_DIST,
  c as RENDERER_DIST,
  s as VITE_DEV_SERVER_URL
};
