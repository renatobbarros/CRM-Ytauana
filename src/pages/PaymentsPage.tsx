import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Plus, Pencil, Trash2, CreditCard, Wallet, Search, TrendingUp } from 'lucide-react';
import { Payment, Client } from '@/types';
import { cn } from '@/lib/utils';

const emptyForm = { client_id: '', amount: '', due_date: '', description: '', recurrence: 'none' };

// Helper for local date parsing (avoids timezone issues with YYYY-MM-DD)
const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export function PaymentsPage() {
    const [payments, setPayments] = useState<(Payment & { client_name: string })[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [generatorData, setGeneratorData] = useState({
        client_id: '',
        total_value: '',
        start_date: '',
        end_date: '',
        interval_days: '30',
        description: ''
    });
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        const [pData, cData] = await Promise.all([
            window.api.getPayments(),
            window.api.getClients()
        ]);
        setPayments(pData);
        setClients(cData);
    };

    useEffect(() => { loadData(); }, []);

    const openAdd = () => {
        setEditingPayment(null);
        setFormData(emptyForm);
        setIsDialogOpen(true);
    };

    const openEdit = (payment: Payment) => {
        setEditingPayment(payment);
        setFormData({
            client_id: String(payment.client_id),
            amount: String(payment.amount),
            due_date: payment.due_date,
            description: payment.description || '',
            recurrence: payment.recurrence || 'none',
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPayment) {
            await window.api.updatePayment({
                ...editingPayment,
                client_id: Number(formData.client_id),
                amount: Number(formData.amount),
                due_date: formData.due_date,
                description: formData.description,
                recurrence: formData.recurrence as any,
            });
        } else {
            await window.api.addPayment({
                ...formData,
                client_id: Number(formData.client_id),
                amount: Number(formData.amount),
                status: 'pending',
                recurrence: formData.recurrence as any
            });
        }
        setIsDialogOpen(false);
        setFormData(emptyForm);
        setEditingPayment(null);
        loadData();
    };

    const markAsPaid = async (id: number) => {
        await window.api.updatePaymentStatus(id, 'paid');
        loadData();
    };

    const toggleStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        await window.api.updatePaymentStatus(id, newStatus);
        loadData();
    };

    const handleDelete = async (id: number) => {
        await window.api.deletePayment(id);
        setDeleteConfirm(null);
        loadData();
    };

    const handleGeneratePlano = async (e: React.FormEvent) => {
        e.preventDefault();
        const start = parseLocalDate(generatorData.start_date);
        const end = parseLocalDate(generatorData.end_date);
        const interval = Number(generatorData.interval_days);
        const totalValue = Number(generatorData.total_value);
        const clientId = Number(generatorData.client_id);

        if (end < start) {
            alert('A data de término deve ser após o início.');
            return;
        }

        const dates = [];
        let curr = new Date(start);
        while (curr <= end) {
            dates.push(new Date(curr));
            curr.setDate(curr.getDate() + interval);
        }

        if (dates.length === 0) return;

        const valuePerPayment = totalValue / dates.length;

        for (const d of dates) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            await window.api.addPayment({
                client_id: clientId,
                amount: valuePerPayment,
                due_date: dateStr,
                status: 'pending',
                description: generatorData.description || 'Parcela de Tratamento',
                recurrence: 'none'
            });
        }

        setIsGeneratorOpen(false);
        setGeneratorData({
            client_id: '',
            total_value: '',
            start_date: '',
            end_date: '',
            interval_days: '30',
            description: ''
        });
        loadData();
    };

    const filteredPayments = payments.filter(p =>
        p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: payments.reduce((acc, p) => acc + p.amount, 0),
        paid: payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0),
        pending: payments.filter(p => p.status !== 'paid').reduce((acc, p) => acc + p.amount, 0)
    };

    return (
        <div className="h-full flex flex-col space-y-6 pb-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border/40 shadow-sm transition-all hover:shadow-md">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Financeiro - Ytauana</h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Controle seus recebimentos e fluxo de caixa com precisão.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => setIsGeneratorOpen(true)} className="h-11 px-6 font-semibold shadow-md active:scale-95 transition-transform bg-secondary/80 hover:bg-secondary">
                        <TrendingUp className="mr-2 h-5 w-5 text-emerald-600" /> Gerar Plano
                    </Button>
                    <Button onClick={openAdd} className="h-11 px-6 font-semibold shadow-md active:scale-95 transition-transform">
                        <Plus className="mr-2 h-5 w-5" /> Novo Pagamento
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border/40 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Geral</p>
                        <p className="text-xl font-bold text-primary">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border/40 shadow-sm flex items-center gap-4 border-l-4 border-l-emerald-500">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-emerald-700">Total Recebido</p>
                        <p className="text-xl font-bold text-emerald-700">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border/40 shadow-sm flex items-center gap-4 border-l-4 border-l-orange-500">
                    <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-orange-700">Total Pendente</p>
                        <p className="text-xl font-bold text-orange-700">R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/40 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-border/40 bg-muted/10">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por paciente ou descrição..."
                            className="pl-10 h-11 bg-background border-border/30 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10">
                            <TableRow className="border-border/40 hover:bg-transparent">
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground py-4 px-6">Paciente / Descrição</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground py-4 px-6">Vencimento</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground py-4 px-6">Valor</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground py-4 px-6">Status</TableHead>
                                <TableHead className="w-[180px] text-right font-bold text-xs uppercase tracking-widest text-muted-foreground py-4 px-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.map((payment) => (
                                <TableRow key={payment.id} className="group border-border/30 hover:bg-primary/5 transition-colors">
                                    <TableCell className="py-4 px-6">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{payment.client_name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-muted-foreground opacity-70 italic">{payment.description || 'Sem descrição'}</span>
                                                {payment.recurrence !== 'none' && (
                                                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                                        {payment.recurrence === 'monthly' ? 'Mensal' : 'Anual'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {parseLocalDate(payment.due_date).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <span className="font-bold text-sm text-primary">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <button
                                            onClick={() => toggleStatus(payment.id!, payment.status)}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-95 hover:shadow-sm cursor-pointer",
                                                payment.status === 'paid'
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50"
                                                    : payment.status === 'overdue'
                                                        ? "bg-red-50 text-red-700 border-red-100 hover:bg-red-100/50"
                                                        : "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100/50"
                                            )}
                                        >
                                            {payment.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                                            {payment.status === 'pending' && <Clock className="w-3 h-3" />}
                                            {payment.status === 'overdue' && <XCircle className="w-3 h-3" />}
                                            {payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : 'Atrasado'}
                                        </button>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            {payment.status !== 'paid' && (
                                                <Button variant="ghost" size="sm" className="h-9 px-3 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50" onClick={() => markAsPaid(payment.id!)}>
                                                    PGTO OK
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/20" onClick={() => openEdit(payment)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {deleteConfirm === payment.id ? (
                                                <Button variant="destructive" size="sm" className="h-9 px-3 text-xs font-bold" onClick={() => handleDelete(payment.id!)}>
                                                    OK
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm(payment.id!)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredPayments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground/30">
                                            <TrendingUp className="h-12 w-12 mb-3 opacity-20" />
                                            <p className="font-bold text-sm">Nenhum registro encontrado</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Dialog for Add/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingPayment(null); }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none">
                    <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <CreditCard className="w-32 h-32" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{editingPayment ? 'Editar Lançamento' : 'Novo Lançamento Financeiro'}</DialogTitle>
                            <p className="text-primary-foreground/70 text-sm font-medium">Controle as guias e recebimentos de tratamentos.</p>
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
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Valor da Guia (R$) *</Label>
                                <Input type="number" step="0.01" required className="h-11 rounded-xl" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0,00" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data de Vencimento *</Label>
                                <Input type="date" required className="h-11 rounded-xl" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Periodicidade</Label>
                                <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                                    value={formData.recurrence} onChange={e => setFormData({ ...formData, recurrence: e.target.value })}>
                                    <option value="none">Lançamento Único</option>
                                    <option value="monthly">Tratamento Mensal</option>
                                    <option value="yearly">Anuidade / Contrato</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Identificador / Nota</Label>
                                <Input className="h-11 rounded-xl" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Manutenção Abril" />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
                                {editingPayment ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog for Custom Generator */}
            <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none">
                    <div className="bg-emerald-600 p-8 text-primary-foreground relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <TrendingUp className="w-32 h-32" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Gerar Plano de Parcelamento</DialogTitle>
                            <p className="text-primary-foreground/70 text-sm font-medium">Crie várias parcelas automaticamente com intervalos personalizados.</p>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleGeneratePlano} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Paciente Responsável *</Label>
                            <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                                required value={generatorData.client_id} onChange={e => setGeneratorData({ ...generatorData, client_id: e.target.value })}>
                                <option value="">Pesquisar paciente...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Valor Total do Plano (R$) *</Label>
                                <Input type="number" step="0.01" required className="h-11 rounded-xl" value={generatorData.total_value}
                                    onChange={e => setGeneratorData({ ...generatorData, total_value: e.target.value })} placeholder="0,00" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Intervalo em Dias (Ex: 7 ou 30) *</Label>
                                <Input type="number" required className="h-11 rounded-xl" value={generatorData.interval_days}
                                    onChange={e => setGeneratorData({ ...generatorData, interval_days: e.target.value })} placeholder="30" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data do 1º Pagamento *</Label>
                                <Input type="date" required className="h-11 rounded-xl" value={generatorData.start_date}
                                    onChange={e => setGeneratorData({ ...generatorData, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data Estimada do Último *</Label>
                                <Input type="date" required className="h-11 rounded-xl" value={generatorData.end_date}
                                    onChange={e => setGeneratorData({ ...generatorData, end_date: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição das Parcelas</Label>
                            <Input className="h-11 rounded-xl" value={generatorData.description}
                                onChange={e => setGeneratorData({ ...generatorData, description: e.target.value })} placeholder="Ex: Parcelamento Implante" />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all bg-emerald-600 hover:bg-emerald-700">
                                Criar Plano Financeiro
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
