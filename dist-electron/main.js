import { app, ipcMain, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
import Database from "better-sqlite3";
import path from "path";
const dbPath = path.join(app.getPath("userData"), "crm.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
function initDb() {
  db.exec(`
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
    db.exec("ALTER TABLE payments ADD COLUMN end_date TEXT");
  } catch (e) {
  }
}
const __dirname$1 = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
initDb();
function createWindow() {
  win = new BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path$1.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
ipcMain.handle("get-clients", () => {
  return db.prepare("SELECT * FROM clients ORDER BY name ASC").all();
});
ipcMain.handle("add-client", (_, client) => {
  const stmt = db.prepare("INSERT INTO clients (name, phone, email, address, notes) VALUES (@name, @phone, @email, @address, @notes)");
  return stmt.run(client);
});
ipcMain.handle("update-client", (_, client) => {
  const stmt = db.prepare("UPDATE clients SET name = @name, phone = @phone, email = @email, address = @address, notes = @notes WHERE id = @id");
  return stmt.run(client);
});
ipcMain.handle("delete-client", (_, id) => {
  return db.prepare("DELETE FROM clients WHERE id = ?").run(id);
});
ipcMain.handle("get-payments", () => {
  return db.prepare(`
    SELECT p.*, c.name as client_name 
    FROM payments p 
    LEFT JOIN clients c ON p.client_id = c.id 
    ORDER BY p.due_date ASC
  `).all();
});
ipcMain.handle("add-payment", (_, payment) => {
  const stmt = db.prepare("INSERT INTO payments (client_id, amount, due_date, status, description, recurrence, end_date) VALUES (@client_id, @amount, @due_date, @status, @description, @recurrence, @end_date)");
  return stmt.run(payment);
});
ipcMain.handle("update-payment-status", (_, { id, status }) => {
  return db.prepare("UPDATE payments SET status = ? WHERE id = ?").run(status, id);
});
ipcMain.handle("update-payment", (_, payment) => {
  const stmt = db.prepare("UPDATE payments SET client_id = @client_id, amount = @amount, due_date = @due_date, description = @description, recurrence = @recurrence, end_date = @end_date WHERE id = @id");
  return stmt.run(payment);
});
ipcMain.handle("delete-payment", (_, id) => {
  return db.prepare("DELETE FROM payments WHERE id = ?").run(id);
});
ipcMain.handle("get-processes", () => {
  return db.prepare(`
    SELECT p.*, c.name as client_name 
    FROM process_pipelines p 
    LEFT JOIN clients c ON p.client_id = c.id 
    ORDER BY p.created_at DESC
  `).all();
});
ipcMain.handle("add-process", (_, process2) => {
  const stmt = db.prepare("INSERT INTO process_pipelines (client_id, title, status, stage, value, deadline) VALUES (@client_id, @title, @status, @stage, @value, @deadline)");
  return stmt.run(process2);
});
ipcMain.handle("update-process-stage", (_, { id, stage }) => {
  return db.prepare("UPDATE process_pipelines SET stage = ? WHERE id = ?").run(stage, id);
});
ipcMain.handle("update-process", (_, process2) => {
  const stmt = db.prepare("UPDATE process_pipelines SET client_id = @client_id, title = @title, value = @value, deadline = @deadline WHERE id = @id");
  return stmt.run(process2);
});
ipcMain.handle("delete-process", (_, id) => {
  return db.prepare("DELETE FROM process_pipelines WHERE id = ?").run(id);
});
ipcMain.handle("get-appointments", () => {
  return db.prepare(`
    SELECT a.*, c.name as client_name 
    FROM appointments a 
    LEFT JOIN clients c ON a.client_id = c.id 
    ORDER BY a.start_date ASC
  `).all();
});
ipcMain.handle("add-appointment", (_, appt) => {
  const stmt = db.prepare("INSERT INTO appointments (client_id, title, type, day_of_month, start_date, end_date, recurrence, notes) VALUES (@client_id, @title, @type, @day_of_month, @start_date, @end_date, @recurrence, @notes)");
  return stmt.run(appt);
});
ipcMain.handle("update-appointment", (_, appt) => {
  const stmt = db.prepare("UPDATE appointments SET client_id = @client_id, title = @title, type = @type, day_of_month = @day_of_month, start_date = @start_date, end_date = @end_date, recurrence = @recurrence, notes = @notes WHERE id = @id");
  return stmt.run(appt);
});
ipcMain.handle("delete-appointment", (_, id) => {
  return db.prepare("DELETE FROM appointments WHERE id = ?").run(id);
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
