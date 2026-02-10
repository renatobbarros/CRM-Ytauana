import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Clients
  getClients: () => ipcRenderer.invoke('get-clients'),
  addClient: (client: any) => ipcRenderer.invoke('add-client', client),
  updateClient: (client: any) => ipcRenderer.invoke('update-client', client),
  deleteClient: (id: number) => ipcRenderer.invoke('delete-client', id),

  // Payments
  getPayments: () => ipcRenderer.invoke('get-payments'),
  addPayment: (payment: any) => ipcRenderer.invoke('add-payment', payment),
  updatePaymentStatus: (id: number, status: string) => ipcRenderer.invoke('update-payment-status', { id, status }),
  updatePayment: (payment: any) => ipcRenderer.invoke('update-payment', payment),
  deletePayment: (id: number) => ipcRenderer.invoke('delete-payment', id),

  // Processes
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  addProcess: (process: any) => ipcRenderer.invoke('add-process', process),
  updateProcessStage: (id: number, stage: string) => ipcRenderer.invoke('update-process-stage', { id, stage }),
  updateProcess: (process: any) => ipcRenderer.invoke('update-process', process),
  deleteProcess: (id: number) => ipcRenderer.invoke('delete-process', id),

  // Appointments
  getAppointments: () => ipcRenderer.invoke('get-appointments'),
  addAppointment: (appt: any) => ipcRenderer.invoke('add-appointment', appt),
  updateAppointment: (appt: any) => ipcRenderer.invoke('update-appointment', appt),
  deleteAppointment: (id: number) => ipcRenderer.invoke('delete-appointment', id),
})
