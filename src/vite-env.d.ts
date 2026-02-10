/// <reference types="vite/client" />

import { Client, Payment, ProcessPipeline, Appointment } from './types';

declare global {
    interface Window {
        api: {
            // Clients
            getClients: () => Promise<Client[]>;
            addClient: (client: Omit<Client, 'id' | 'created_at'>) => Promise<any>;
            updateClient: (client: Client) => Promise<any>;
            deleteClient: (id: number) => Promise<any>;

            // Payments
            getPayments: () => Promise<(Payment & { client_name: string })[]>;
            addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<any>;
            updatePaymentStatus: (id: number, status: string) => Promise<any>;
            updatePayment: (payment: Payment) => Promise<any>;
            deletePayment: (id: number) => Promise<any>;

            // Processes
            getProcesses: () => Promise<(ProcessPipeline & { client_name: string })[]>;
            addProcess: (process: Omit<ProcessPipeline, 'id' | 'created_at'>) => Promise<any>;
            updateProcessStage: (id: number, stage: string) => Promise<any>;
            updateProcess: (process: ProcessPipeline) => Promise<any>;
            deleteProcess: (id: number) => Promise<any>;

            // Appointments
            getAppointments: () => Promise<(Appointment & { client_name: string })[]>;
            addAppointment: (appt: Omit<Appointment, 'id' | 'created_at'>) => Promise<any>;
            updateAppointment: (appt: Appointment) => Promise<any>;
            deleteAppointment: (id: number) => Promise<any>;
        }
    }
}
