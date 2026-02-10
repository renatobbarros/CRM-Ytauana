export interface Client {
    id?: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    created_at?: string;
}

export interface Payment {
    id?: number;
    client_id: number;
    amount: number;
    due_date: string;
    status: 'pending' | 'paid' | 'overdue';
    description?: string;
    recurrence: 'monthly' | 'yearly' | 'none';
    end_date?: string;
    created_at?: string;
}

export interface ProcessPipeline {
    id?: number;
    client_id: number;
    title: string;
    status: 'todo' | 'in-progress' | 'done';
    stage: 'lead' | 'contact' | 'proposal' | 'negotiation' | 'closed';
    value?: number;
    deadline?: string;
    created_at?: string;
}

export interface Appointment {
    id?: number;
    client_id: number;
    title: string;
    type: 'consulta' | 'manutencao' | 'procedimento' | 'retorno';
    day_of_month?: number;
    start_date: string;
    end_date?: string;
    recurrence: 'none' | 'weekly' | 'monthly';
    notes?: string;
    created_at?: string;
}
