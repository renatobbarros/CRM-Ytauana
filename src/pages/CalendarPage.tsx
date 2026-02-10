import { useEffect, useState, useMemo } from 'react';
import { Appointment, Client, Payment } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, CreditCard, Stethoscope, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppointmentWithClient = Appointment & { client_name: string };
type PaymentWithClient = Payment & { client_name: string };

interface DayEvent {
    type: 'appointment' | 'payment';
    title: string;
    clientName: string;
    color: string;
    original: AppointmentWithClient | PaymentWithClient;
}

const TYPE_LABELS: Record<string, string> = {
    consulta: 'Consulta',
    manutencao: 'Manutenção',
    procedimento: 'Procedimento',
    retorno: 'Retorno',
};

const TYPE_COLORS: Record<string, string> = {
    consulta: 'bg-cyan-600',
    manutencao: 'bg-orange-500',
    procedimento: 'bg-emerald-600',
    retorno: 'bg-purple-600',
};

// Helper for local date parsing (avoids timezone issues with YYYY-MM-DD)
const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const emptyForm = {
    client_id: '',
    title: '',
    type: 'consulta' as string,
    day_of_month: '',
    start_date: '',
    end_date: '',
    recurrence: 'none' as string,
    notes: '',
    include_payment: false,
    payment_day: '',
    payment_amount: '',
    payment_end_date: '',
};

export function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
    const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
    const [payments, setPayments] = useState<PaymentWithClient[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const loadData = async () => {
        const [aData, pData, cData] = await Promise.all([
            window.api.getAppointments(),
            window.api.getPayments(),
            window.api.getClients()
        ]);
        setAppointments(aData);
        setPayments(pData);
        setClients(cData);
    };

    useEffect(() => { loadData(); }, []);

    const eventsMap = useMemo(() => {
        const map: Record<number, DayEvent[]> = {};
        const daysInMonthCnt = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonthCnt; day++) {
            map[day] = [];
        }

        for (const appt of appointments) {
            if (appt.recurrence === 'monthly' && appt.day_of_month) {
                const startDate = parseLocalDate(appt.start_date);
                const endDate = appt.end_date ? parseLocalDate(appt.end_date) : null;
                const currentMonthDate = new Date(year, month, appt.day_of_month);

                // Set time to midnight for comparison
                currentMonthDate.setHours(0, 0, 0, 0);
                startDate.setHours(0, 0, 0, 0);
                if (endDate) endDate.setHours(0, 0, 0, 0);

                if (currentMonthDate >= startDate && (!endDate || currentMonthDate <= endDate)) {
                    if (appt.day_of_month >= 1 && appt.day_of_month <= new Date(year, month + 1, 0).getDate()) {
                        map[appt.day_of_month]?.push({
                            type: 'appointment',
                            title: `${TYPE_LABELS[appt.type] || appt.type}: ${appt.title}`,
                            clientName: appt.client_name,
                            color: TYPE_COLORS[appt.type] || 'bg-gray-500',
                            original: appt,
                        });
                    }
                }
            } else if (appt.recurrence === 'none') {
                const apptDate = parseLocalDate(appt.start_date);
                if (apptDate.getFullYear() === year && apptDate.getMonth() === month) {
                    const day = apptDate.getDate();
                    map[day]?.push({
                        type: 'appointment',
                        title: `${TYPE_LABELS[appt.type] || appt.type}: ${appt.title}`,
                        clientName: appt.client_name,
                        color: TYPE_COLORS[appt.type] || 'bg-gray-500',
                        original: appt,
                    });
                }
            }
        }

        for (const payment of payments) {
            const payDate = parseLocalDate(payment.due_date);
            const endDate = payment.end_date ? parseLocalDate(payment.end_date) : null;

            if (payment.recurrence === 'monthly') {
                const day = payDate.getDate();
                const currentMonthDate = new Date(year, month, day);

                // Midnight check for comparison
                currentMonthDate.setHours(0, 0, 0, 0);
                payDate.setHours(0, 0, 0, 0);
                if (endDate) endDate.setHours(0, 0, 0, 0);

                if (currentMonthDate >= payDate && (!endDate || currentMonthDate <= endDate)) {
                    if (day >= 1 && day <= new Date(year, month + 1, 0).getDate()) {
                        map[day]?.push({
                            type: 'payment',
                            title: `Pagamento: R$ ${payment.amount.toFixed(2)}`,
                            clientName: payment.client_name,
                            color: payment.status === 'paid' ? 'bg-emerald-500' : 'bg-red-500',
                            original: payment,
                        });
                    }
                }
            } else {
                if (payDate.getFullYear() === year && payDate.getMonth() === month) {
                    const day = payDate.getDate();
                    map[day]?.push({
                        type: 'payment',
                        title: `Pagamento: R$ ${payment.amount.toFixed(2)}`,
                        clientName: payment.client_name,
                        color: payment.status === 'paid' ? 'bg-emerald-500' : 'bg-red-500',
                        original: payment,
                    });
                }
            }
        }

        return map;
    }, [appointments, payments, year, month]);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const monthName = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const selectedEvents = selectedDay ? (eventsMap[selectedDay] || []) : [];

    const openAdd = (day?: number) => {
        setEditingAppt(null);
        const dateStr = day
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            : '';
        setFormData({ ...emptyForm, start_date: dateStr, day_of_month: day ? String(day) : '' });
        setIsDialogOpen(true);
    };

    const openEdit = (appt: Appointment) => {
        setEditingAppt(appt);
        setFormData({
            client_id: String(appt.client_id),
            title: appt.title,
            type: appt.type,
            day_of_month: String(appt.day_of_month || ''),
            start_date: appt.start_date,
            end_date: appt.end_date || '',
            recurrence: appt.recurrence,
            notes: appt.notes || '',
            include_payment: false,
            payment_day: '',
            payment_amount: '',
            payment_end_date: '',
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            client_id: Number(formData.client_id),
            title: formData.title,
            type: formData.type,
            day_of_month: formData.day_of_month ? Number(formData.day_of_month) : null,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            recurrence: formData.recurrence,
            notes: formData.notes,
        };

        if (editingAppt) {
            await window.api.updateAppointment({ ...data, id: editingAppt.id } as any);
        } else {
            await window.api.addAppointment(data as any);

            // Auto-create payment if requested
            if (formData.include_payment && formData.payment_amount && formData.payment_day) {
                const payDay = Number(formData.payment_day);
                const payMonth = String(month + 1).padStart(2, '0');
                const dueDate = `${year}-${payMonth}-${String(payDay).padStart(2, '0')}`;
                await window.api.addPayment({
                    client_id: Number(formData.client_id),
                    amount: Number(formData.payment_amount),
                    due_date: dueDate,
                    status: 'pending',
                    description: `Pagamento: ${formData.title}`,
                    recurrence: formData.recurrence === 'monthly' ? 'monthly' : 'none',
                    end_date: formData.payment_end_date || null
                } as any);
            }
        }
        setIsDialogOpen(false);
        setEditingAppt(null);
        setFormData(emptyForm);
        loadData();
    };

    const handleDelete = async (id: number) => {
        await window.api.deleteAppointment(id);
        setDeleteConfirm(null);
        loadData();
    };

    return (
        <div className="h-full flex flex-col space-y-6 pb-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border/40 shadow-sm transition-all hover:shadow-md">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Agenda da Ytauana</h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Seus horários e atendimentos organizados.</p>
                </div>
                <Button onClick={() => openAdd(selectedDay || undefined)} className="h-11 px-6 font-semibold shadow-md active:scale-95 transition-transform">
                    <Plus className="mr-2 h-5 w-5" /> Novo Agendamento
                </Button>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border/40 p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-primary/10 hover:text-primary transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <h3 className="text-xl font-bold capitalize text-primary tracking-tight">{monthName}</h3>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-primary/10 hover:text-primary transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {weekDays.map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-2 bg-muted/30 rounded-lg">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto pr-1">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="rounded-xl bg-muted/10 opacity-30 min-h-[80px]" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = eventsMap[day] || [];
                            const isSelected = selectedDay === day;
                            const hasEvents = dayEvents.length > 0;
                            return (
                                <div
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={cn(
                                        "rounded-xl border p-2 min-h-[80px] cursor-pointer transition-all duration-200 relative group",
                                        isSelected
                                            ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-sm"
                                            : "border-border/30 hover:border-primary/40 hover:bg-muted/30",
                                        isToday(day) && !isSelected && "border-primary-foreground/50 bg-secondary/30",
                                        !isSelected && !isToday(day) && "bg-muted/10"
                                    )}
                                >
                                    <div className={cn(
                                        "text-xs font-bold mb-1.5 flex items-center justify-between",
                                        isToday(day) ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                                    )}>
                                        {day}
                                        {isToday(day) && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                                    </div>
                                    <div className="space-y-1 mt-1">
                                        {dayEvents.slice(0, 3).map((ev, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "h-1.5 rounded-full shadow-sm",
                                                    ev.color
                                                )}
                                                title={`${ev.clientName}: ${ev.title}`}
                                            />
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[10px] font-bold text-primary/60 text-center py-0.5 bg-primary/5 rounded border border-primary/10">+{dayEvents.length - 3}</div>
                                        )}
                                    </div>
                                    {!hasEvents && !isSelected && (
                                        <Plus className="absolute bottom-2 right-2 w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Side Panel */}
                <div className="w-96 flex flex-col gap-6 min-h-0">
                    <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 opacity-70" />
                                {selectedDay ? (
                                    <span>Dia {selectedDay} - {new Date(year, month, selectedDay).toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
                                ) : (
                                    'Atendimentos do Dia'
                                )}
                            </h3>
                            {selectedDay && (
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all" onClick={() => openAdd(selectedDay)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                            {selectedEvents.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 italic text-sm text-center">
                                    <Stethoscope className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Nenhum atendimento agendado</p>
                                </div>
                            )}
                            {selectedEvents.map((ev, idx) => (
                                <Card key={idx} className="border-none shadow-sm bg-muted/30 hover:bg-muted/50 transition-colors border-l-4 overflow-hidden"
                                    style={{ borderLeftColor: ev.color.includes('-') ? `var(--${ev.color.replace('bg-', '')})` : '#ccc' }}>
                                    <CardHeader className="p-4 pb-1">
                                        <CardTitle className="text-sm flex items-start gap-3">
                                            <div className={cn("p-1.5 rounded-lg shrink-0", ev.color.replace('bg-', 'bg-opacity-10 text-'))}>
                                                {ev.type === 'appointment' ? (
                                                    <Stethoscope className="h-4 w-4" />
                                                ) : (
                                                    <CreditCard className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-bold text-primary truncate">{ev.title}</span>
                                                    {ev.type === 'appointment' && (
                                                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/20" onClick={() => openEdit(ev.original as Appointment)}>
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/20 text-destructive" onClick={() => setDeleteConfirm((ev.original as Appointment).id!)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs font-semibold text-muted-foreground mt-0.5">{ev.clientName}</p>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    {deleteConfirm === (ev.original as Appointment).id && (
                                        <div className="p-2 bg-destructive/10 flex items-center justify-between mt-2">
                                            <span className="text-[10px] font-bold text-destructive px-2">Confirmar exclusão?</span>
                                            <div className="flex gap-1">
                                                <Button variant="destructive" size="sm" className="h-6 text-[10px]" onClick={() => handleDelete((ev.original as Appointment).id!)}>Sim</Button>
                                                <Button variant="secondary" size="sm" className="h-6 text-[10px]" onClick={() => setDeleteConfirm(null)}>Não</Button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Classificação Clínica</p>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(TYPE_COLORS).map(([key, color]) => (
                                <div key={key} className="flex items-center gap-2 text-xs font-semibold text-primary/80">
                                    <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", color)} />
                                    <span>{TYPE_LABELS[key]}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary/80">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm bg-red-500" />
                                <span>Pgto Pendente</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary/80">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm bg-emerald-500" />
                                <span>Pgto Realizado</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingAppt(null); }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none">
                    <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Stethoscope className="w-32 h-32" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{editingAppt ? 'Editar Agendamento' : 'Novo Agendamento Clínico'}</DialogTitle>
                            <p className="text-primary-foreground/70 text-sm font-medium">Preencha os dados do paciente e o procedimento.</p>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Paciente Responsável *</Label>
                            <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                                required value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })}>
                                <option value="">Pesquisar paciente...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Procedimento *</Label>
                                <Input required className="h-11 rounded-xl" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Canal, Limpeza, etc." />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tipo de Atendimento</Label>
                                <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                                    value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="consulta">Consulta / Avaliação</option>
                                    <option value="manutencao">Manutenção</option>
                                    <option value="procedimento">Procedimento Cirúrgico</option>
                                    <option value="retorno">Retorno</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recorrência</Label>
                                <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm"
                                    value={formData.recurrence} onChange={e => setFormData({ ...formData, recurrence: e.target.value })}>
                                    <option value="none">Evento Único</option>
                                    <option value="monthly">Tratamento Mensal</option>
                                    <option value="weekly">Acompanhamento Semanal</option>
                                </select>
                            </div>
                            {formData.recurrence === 'monthly' && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferência de Dia (1-31) *</Label>
                                    <Input type="number" min="1" max="31" required className="h-11 rounded-xl" value={formData.day_of_month}
                                        onChange={e => setFormData({ ...formData, day_of_month: e.target.value })}
                                        placeholder="Ex: 10" />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Início do Ciclo *</Label>
                                <Input type="date" required className="h-11 rounded-xl" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Previsão de Término</Label>
                                <Input type="date" className="h-11 rounded-xl" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prontuário / Notas</Label>
                            <Input className="h-11 rounded-xl" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Observações clínicas relevantes..." />
                        </div>

                        {/* Payment Section */}
                        {!editingAppt && (
                            <div className="bg-emerald-50 rounded-2xl p-6 space-y-4 border border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="include-payment"
                                        className="h-5 w-5 rounded-lg border-emerald-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                                        checked={formData.include_payment}
                                        onChange={e => setFormData({ ...formData, include_payment: e.target.checked })}
                                    />
                                    <Label htmlFor="include-payment" className="font-bold text-emerald-800 flex items-center gap-2 cursor-pointer">
                                        <CreditCard className="h-4 w-4" />
                                        Vincular Pagamento Recorrente
                                    </Label>
                                </div>
                                {formData.include_payment && (
                                    <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Vencimento (Dia) *</Label>
                                            <Input type="number" min="1" max="31"
                                                className="h-10 rounded-lg border-emerald-200 focus:ring-emerald-500"
                                                required={formData.include_payment}
                                                value={formData.payment_day}
                                                onChange={e => setFormData({ ...formData, payment_day: e.target.value })}
                                                placeholder="Ex: 10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Valor da Guia (R$) *</Label>
                                            <Input type="number" step="0.01"
                                                className="h-10 rounded-lg border-emerald-200 focus:ring-emerald-500"
                                                required={formData.include_payment}
                                                value={formData.payment_amount}
                                                onChange={e => setFormData({ ...formData, payment_amount: e.target.value })}
                                                placeholder="0,00" />
                                        </div>
                                        {formData.recurrence === 'monthly' && (
                                            <div className="space-y-2 col-span-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Repetir até a Data de</Label>
                                                <Input type="date"
                                                    className="h-10 rounded-lg border-emerald-200 focus:ring-emerald-500"
                                                    value={formData.payment_end_date}
                                                    onChange={e => setFormData({ ...formData, payment_end_date: e.target.value })} />
                                                <p className="text-[9px] text-emerald-600/70 font-medium">As parcelas mensais pararão de aparecer após esta data.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
                                {editingAppt ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
