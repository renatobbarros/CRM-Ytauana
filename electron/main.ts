import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import db, { initDb } from './db'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

// Initialize DB
initDb();

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// IPC Handlers - Clients
ipcMain.handle('get-clients', () => {
  return db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
});

ipcMain.handle('add-client', (_, client) => {
  const stmt = db.prepare('INSERT INTO clients (name, phone, email, address, notes) VALUES (@name, @phone, @email, @address, @notes)');
  return stmt.run(client);
});

ipcMain.handle('update-client', (_, client) => {
  const stmt = db.prepare('UPDATE clients SET name = @name, phone = @phone, email = @email, address = @address, notes = @notes WHERE id = @id');
  return stmt.run(client);
});

ipcMain.handle('delete-client', (_, id) => {
  return db.prepare('DELETE FROM clients WHERE id = ?').run(id);
});

// IPC Handlers - Payments
ipcMain.handle('get-payments', () => {
  return db.prepare(`
    SELECT p.*, c.name as client_name 
    FROM payments p 
    LEFT JOIN clients c ON p.client_id = c.id 
    ORDER BY p.due_date ASC
  `).all();
});

ipcMain.handle('add-payment', (_, payment) => {
  const stmt = db.prepare('INSERT INTO payments (client_id, amount, due_date, status, description, recurrence, end_date) VALUES (@client_id, @amount, @due_date, @status, @description, @recurrence, @end_date)');
  return stmt.run(payment);
});

ipcMain.handle('update-payment-status', (_, { id, status }) => {
  return db.prepare('UPDATE payments SET status = ? WHERE id = ?').run(status, id);
});

ipcMain.handle('update-payment', (_, payment) => {
  const stmt = db.prepare('UPDATE payments SET client_id = @client_id, amount = @amount, due_date = @due_date, description = @description, recurrence = @recurrence, end_date = @end_date WHERE id = @id');
  return stmt.run(payment);
});

ipcMain.handle('delete-payment', (_, id) => {
  return db.prepare('DELETE FROM payments WHERE id = ?').run(id);
});

// IPC Handlers - Processes
ipcMain.handle('get-processes', () => {
  return db.prepare(`
    SELECT p.*, c.name as client_name 
    FROM process_pipelines p 
    LEFT JOIN clients c ON p.client_id = c.id 
    ORDER BY p.created_at DESC
  `).all();
});

ipcMain.handle('add-process', (_, process) => {
  const stmt = db.prepare('INSERT INTO process_pipelines (client_id, title, status, stage, value, deadline) VALUES (@client_id, @title, @status, @stage, @value, @deadline)');
  return stmt.run(process);
});

ipcMain.handle('update-process-stage', (_, { id, stage }) => {
  return db.prepare('UPDATE process_pipelines SET stage = ? WHERE id = ?').run(stage, id);
});

ipcMain.handle('update-process', (_, process) => {
  const stmt = db.prepare('UPDATE process_pipelines SET client_id = @client_id, title = @title, value = @value, deadline = @deadline WHERE id = @id');
  return stmt.run(process);
});

ipcMain.handle('delete-process', (_, id) => {
  return db.prepare('DELETE FROM process_pipelines WHERE id = ?').run(id);
});

// IPC Handlers - Appointments
ipcMain.handle('get-appointments', () => {
  return db.prepare(`
    SELECT a.*, c.name as client_name 
    FROM appointments a 
    LEFT JOIN clients c ON a.client_id = c.id 
    ORDER BY a.start_date ASC
  `).all();
});

ipcMain.handle('add-appointment', (_, appt) => {
  const stmt = db.prepare('INSERT INTO appointments (client_id, title, type, day_of_month, start_date, end_date, recurrence, notes) VALUES (@client_id, @title, @type, @day_of_month, @start_date, @end_date, @recurrence, @notes)');
  return stmt.run(appt);
});

ipcMain.handle('update-appointment', (_, appt) => {
  const stmt = db.prepare('UPDATE appointments SET client_id = @client_id, title = @title, type = @type, day_of_month = @day_of_month, start_date = @start_date, end_date = @end_date, recurrence = @recurrence, notes = @notes WHERE id = @id');
  return stmt.run(appt);
});

ipcMain.handle('delete-appointment', (_, id) => {
  return db.prepare('DELETE FROM appointments WHERE id = ?').run(id);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
