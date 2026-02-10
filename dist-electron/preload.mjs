"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  // Clients
  getClients: () => electron.ipcRenderer.invoke("get-clients"),
  addClient: (client) => electron.ipcRenderer.invoke("add-client", client),
  updateClient: (client) => electron.ipcRenderer.invoke("update-client", client),
  deleteClient: (id) => electron.ipcRenderer.invoke("delete-client", id),
  // Payments
  getPayments: () => electron.ipcRenderer.invoke("get-payments"),
  addPayment: (payment) => electron.ipcRenderer.invoke("add-payment", payment),
  updatePaymentStatus: (id, status) => electron.ipcRenderer.invoke("update-payment-status", { id, status }),
  updatePayment: (payment) => electron.ipcRenderer.invoke("update-payment", payment),
  deletePayment: (id) => electron.ipcRenderer.invoke("delete-payment", id),
  // Processes
  getProcesses: () => electron.ipcRenderer.invoke("get-processes"),
  addProcess: (process) => electron.ipcRenderer.invoke("add-process", process),
  updateProcessStage: (id, stage) => electron.ipcRenderer.invoke("update-process-stage", { id, stage }),
  updateProcess: (process) => electron.ipcRenderer.invoke("update-process", process),
  deleteProcess: (id) => electron.ipcRenderer.invoke("delete-process", id),
  // Appointments
  getAppointments: () => electron.ipcRenderer.invoke("get-appointments"),
  addAppointment: (appt) => electron.ipcRenderer.invoke("add-appointment", appt),
  updateAppointment: (appt) => electron.ipcRenderer.invoke("update-appointment", appt),
  deleteAppointment: (id) => electron.ipcRenderer.invoke("delete-appointment", id)
});
