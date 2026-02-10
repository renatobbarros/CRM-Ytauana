import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, CalendarDays, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Client, Payment, Appointment, ProcessPipeline } from '@/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const STAGE_LABELS: Record<string, string> = {
    lead: 'Leads',
    contact: 'Contato',
    proposal: 'Proposta',
    negotiation: 'Negociação',
    closed: 'Fechado',
};

// Helper for local date parsing
const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export function DashboardPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [payments, setPayments] = useState<(Payment & { client_name: string })[]>([]);
    const [appointments, setAppointments] = useState<(Appointment & { client_name: string })[]>([]);
    const [processes, setProcesses] = useState<(ProcessPipeline & { client_name: string })[]>([]);

    useEffect(() => {
        (async () => {
            const [c, p, a, pr] = await Promise.all([
                window.api.getClients(),
                window.api.getPayments(),
                window.api.getAppointments(),
                window.api.getProcesses(),
            ]);
            setClients(c);
            setPayments(p);
            setAppointments(a);
            setProcesses(pr);
        })();
    }, []);

    // Stats
    const totalClients = clients.length;
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const upcomingAppointments = appointments.filter(a => {
        if (a.recurrence === 'monthly') return true;
        return parseLocalDate(a.start_date) >= new Date();
    }).length;

    // Chart Data: Pipeline by stage
    const pipelineData = Object.entries(STAGE_LABELS).map(([key, label]) => ({
        name: label,
        total: processes.filter(p => p.stage === key).length,
        value: processes.filter(p => p.stage === key).reduce((sum, p) => sum + (p.value || 0), 0),
    }));

    // Chart Data: Payments by status
    const paymentStatusData = [
        { name: 'Pendente', value: payments.filter(p => p.status === 'pending').length, color: '#f59e0b' },
        { name: 'Pago', value: payments.filter(p => p.status === 'paid').length, color: '#10b981' },
        { name: 'Atrasado', value: payments.filter(p => p.status === 'overdue').length, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Chart Data: Monthly revenue (last 6 months)
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const m = d.getMonth();
        const y = d.getFullYear();
        const monthPayments = payments.filter(p => {
            const pd = parseLocalDate(p.due_date);
            return pd.getMonth() === m && pd.getFullYear() === y;
        });
        return {
            name: d.toLocaleDateString('pt-BR', { month: 'short' }),
            recebido: monthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
            pendente: monthPayments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0),
        };
    });

    // Chart Data: Appointment types
    const appointmentTypeData = [
        { name: 'Consulta', value: appointments.filter(a => a.type === 'consulta').length, color: '#0891B2' },
        { name: 'Manutenção', value: appointments.filter(a => a.type === 'manutencao').length, color: '#f59e0b' },
        { name: 'Procedimento', value: appointments.filter(a => a.type === 'procedimento').length, color: '#059669' },
        { name: 'Retorno', value: appointments.filter(a => a.type === 'retorno').length, color: '#8b5cf6' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-10 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Painel da Ytauana</h1>
                <p className="text-muted-foreground mt-1 font-medium">Seja bem-vinda ao seu centro de controle clínico.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pacientes Totais</CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{totalClients}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Base de dados ativa</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50 hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-700">Faturamento Liquidado</CardTitle>
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-700">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-[10px] text-emerald-600/70 mt-1 font-medium">Pagamentos recebidos</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-50/50 hover:shadow-md transition-shadow border-l-4 border-l-orange-400">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-orange-700">Previsão Pendente</CardTitle>
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-700">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-[10px] text-orange-600/70 mt-1 font-medium">{pendingPayments.length} guias aguardando</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-cyan-50/50 hover:shadow-md transition-shadow border-l-4 border-l-cyan-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-cyan-700">Agendamentos</CardTitle>
                        <div className="p-2 bg-cyan-100 rounded-lg">
                            <CalendarDays className="h-4 w-4 text-cyan-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-cyan-700">{upcomingAppointments}</div>
                        <p className="text-[10px] text-cyan-600/70 mt-1 font-medium">Procedimentos ativos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-6 border-b border-border/10">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                            <TrendingUp className="h-4 w-4" />
                            Fluxo de Caixa Mensal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 px-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                />
                                <Bar dataKey="recebido" fill="#059669" radius={[6, 6, 0, 0]} name="Recebido" barSize={25} />
                                <Bar dataKey="pendente" fill="#f59e0b" opacity={0.7} radius={[6, 6, 0, 0]} name="Pendente" barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pipeline Chart */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-6 border-b border-border/10">
                        <CardTitle className="text-sm font-bold text-primary">Status de Tratamentos (Pipeline)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 px-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={pipelineData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" fontSize={11} width={100} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value, name) =>
                                        name === 'total' ? [`${value} Pacientes`, 'Volume'] : [`R$ ${Number(value).toFixed(2)}`, 'Valor']
                                    }
                                />
                                <Bar dataKey="total" fill="#0891B2" radius={[0, 6, 6, 0]} name="total" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payment Status Pie */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-6 border-b border-border/10">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                            <CreditCard className="h-4 w-4" />
                            Saúde Financeira (Status)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-8">
                        {paymentStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={paymentStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={8}
                                        dataKey="value"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {paymentStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center py-12 text-muted-foreground opacity-50">
                                <CreditCard className="w-12 h-12 mb-4" />
                                <p className="text-sm font-medium">Nenhum dado financeiro</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Appointment Types */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-6 border-b border-border/10">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                            <CalendarDays className="h-4 w-4" />
                            Especialidades & Tipos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-8">
                        {appointmentTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={appointmentTypeData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        dataKey="value"
                                        label={({ name }) => name}
                                    >
                                        {appointmentTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center py-12 text-muted-foreground opacity-50">
                                <CalendarDays className="w-12 h-12 mb-4" />
                                <p className="text-sm font-medium">Nenhum agendamento ativo</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Payments List */}
            {pendingPayments.length > 0 && (
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-orange-50 border-b border-orange-100 py-4">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-orange-700">
                            <AlertCircle className="h-4 w-4" />
                            Pendentes de Pagamento Próximos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {pendingPayments.slice(0, 5).map(p => (
                                <div key={p.id} className="flex justify-between items-center p-5 hover:bg-muted/20 transition-colors">
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-sm text-primary">{p.client_name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{p.description}</p>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                        <p className="font-bold text-sm text-emerald-600">R$ {p.amount.toFixed(2)}</p>
                                        <p className="text-[10px] font-medium text-orange-600 flex items-center justify-end gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {parseLocalDate(p.due_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Re-defining internal components if needed, or ensuring imports are correct
import { Clock } from 'lucide-react';

