import { useEffect, useState } from 'react';
import { ProcessPipeline, Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Activity, Stethoscope, ClipboardCheck, MessageSquare, Briefcase, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STAGES: Record<string, { label: string; icon: any; color: string }> = {
    'lead': { label: 'Novos Leads', icon: Stethoscope, color: 'border-cyan-500' },
    'contact': { label: 'Em Contato', icon: MessageSquare, color: 'border-purple-500' },
    'proposal': { label: 'Orçamento/Plano', icon: Briefcase, color: 'border-blue-500' },
    'negotiation': { label: 'Negociação', icon: Activity, color: 'border-orange-500' },
    'closed': { label: 'Tratamento Iniciado', icon: ClipboardCheck, color: 'border-emerald-500' }
};

type StageKey = 'lead' | 'contact' | 'proposal' | 'negotiation' | 'closed';

const emptyForm = { client_id: '', title: '', value: '', deadline: '', stage: 'lead' as StageKey };
const emptyConvertForm = { title: '', type: 'consulta', start_date: '', notes: '' };

export function PipelinePage() {
    const [processes, setProcesses] = useState<(ProcessPipeline & { client_name: string })[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
    const [editingProcess, setEditingProcess] = useState<ProcessPipeline | null>(null);
    const [selectedProcess, setSelectedProcess] = useState<(ProcessPipeline & { client_name: string }) | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [convertFormData, setConvertFormData] = useState(emptyConvertForm);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const loadData = async () => {
        const [pData, cData] = await Promise.all([
            window.api.getProcesses(),
            window.api.getClients()
        ]);
        setProcesses(pData);
        setClients(cData);
    };

    useEffect(() => { loadData(); }, []);

    const openAdd = () => {
        setEditingProcess(null);
        setFormData(emptyForm);
        setIsDialogOpen(true);
    };

    const openEdit = (process: ProcessPipeline) => {
        setEditingProcess(process);
        setFormData({
            client_id: String(process.client_id),
            title: process.title,
            value: String(process.value || ''),
            deadline: process.deadline || '',
            stage: (process.stage || 'lead') as StageKey,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProcess) {
            await window.api.updateProcess({
                ...editingProcess,
                client_id: Number(formData.client_id),
                title: formData.title,
                value: Number(formData.value),
                deadline: formData.deadline,
            });
        } else {
            await window.api.addProcess({
                ...formData,
                status: 'todo',
                client_id: Number(formData.client_id),
                value: Number(formData.value),
                stage: formData.stage,
            });
        }
        setIsDialogOpen(false);
        setFormData(emptyForm);
        setEditingProcess(null);
        loadData();
    };

    const moveStage = async (id: number, currentStage: string, direction: 'next' | 'prev') => {
        const stages = Object.keys(STAGES);
        const idx = stages.indexOf(currentStage);
        if (idx === -1) return;
        const newIdx = direction === 'next' ? idx + 1 : idx - 1;
        if (newIdx >= 0 && newIdx < stages.length) {
            await window.api.updateProcessStage(id, stages[newIdx]);
            loadData();
        }
    };

    const handleDelete = async (id: number) => {
        await window.api.deleteProcess(id);
        setDeleteConfirm(null);
        loadData();
    };

    const openConvert = (process: ProcessPipeline & { client_name: string }) => {
        setSelectedProcess(process);
        setConvertFormData({
            title: process.title,
            type: 'consulta',
            start_date: process.deadline || '',
            notes: `Convertido de Tratamento: ${process.title}`
        });
        setIsConvertDialogOpen(true);
    };

    const handleConvertSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProcess) return;

        await window.api.addAppointment({
            client_id: selectedProcess.client_id,
            title: convertFormData.title,
            type: convertFormData.type,
            start_date: convertFormData.start_date,
            notes: convertFormData.notes,
            recurrence: 'none',
            day_of_month: null,
            end_date: null
        } as any);

        setIsConvertDialogOpen(false);
        setSelectedProcess(null);
        setConvertFormData(emptyConvertForm);
        // Optional: Move stage to 'closed' or keep as is? 
        // User said "transform lead into appointment", so maybe we move it if it's not already closed.
        if (selectedProcess.stage !== 'closed') {
            await window.api.updateProcessStage(selectedProcess.id!, 'closed');
            loadData();
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 pb-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border/40 shadow-sm transition-all hover:shadow-md">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Tratamentos da Ytauana</h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Acompanhe a evolução clínica e financeira de cada paciente.</p>
                </div>
                <Button onClick={openAdd} className="h-11 px-6 font-semibold shadow-md active:scale-95 transition-transform">
                    <Plus className="mr-2 h-5 w-5" /> Novo Processo
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 h-full min-w-[1200px]">
                    {Object.entries(STAGES).map(([key, config]) => {
                        const stageProcesses = processes.filter(p => p.stage === key);
                        const totalValue = stageProcesses.reduce((acc, p) => acc + (p.value || 0), 0);

                        return (
                            <div key={key} className="w-[300px] flex flex-col gap-4">
                                <div className={cn(
                                    "p-4 rounded-xl border-t-4 bg-muted/30 shadow-sm flex flex-col gap-1",
                                    config.color
                                )}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <config.icon className="h-4 w-4 text-primary opacity-70" />
                                            <h3 className="font-bold text-sm tracking-tight">{config.label}</h3>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background border border-border">
                                            {stageProcesses.length}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-primary/60">Total: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-muted">
                                    {stageProcesses.length === 0 && (
                                        <div className="h-24 flex items-center justify-center border-2 border-dashed border-muted rounded-xl text-muted-foreground/30 text-[10px] font-bold uppercase tracking-widest">
                                            Sem Processos
                                        </div>
                                    )}
                                    {stageProcesses.map(process => (
                                        <Card key={process.id} className="group border-border/30 hover:border-primary/40 hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-card">
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className="text-sm font-bold flex justify-between items-start gap-2">
                                                    <span className="truncate group-hover:text-primary transition-colors">{process.title}</span>
                                                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/20" onClick={() => openEdit(process)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        {deleteConfirm === process.id ? (
                                                            <Button variant="destructive" size="sm" className="h-7 px-2 text-[10px] font-bold" onClick={() => handleDelete(process.id!)}>
                                                                SIM
                                                            </Button>
                                                        ) : (
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/20 text-destructive" onClick={() => setDeleteConfirm(process.id!)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardTitle>
                                                <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mt-1">
                                                    <Stethoscope className="h-3 w-3 opacity-50" />
                                                    {process.client_name}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-2 space-y-3">
                                                <div className="flex justify-between items-center text-[11px] font-bold bg-muted/30 p-2 rounded-lg border border-border/20">
                                                    <span className="text-emerald-700">R$ {process.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    <span className="text-primary/70">{process.deadline ? new Date(process.deadline).toLocaleDateString() : 'Sem prazo'}</span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t border-border/10">
                                                    <div className="flex gap-2">
                                                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full shadow-sm text-primary hover:bg-primary/10" onClick={() => openConvert(process)}>
                                                            <CalendarDays className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm disabled:opacity-30" disabled={key === 'lead'} onClick={() => moveStage(process.id!, key, 'prev')}>
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="default" className="h-8 w-8 rounded-full shadow-sm bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all disabled:opacity-30" disabled={key === 'closed'} onClick={() => moveStage(process.id!, key, 'next')}>
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dialog for Add/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingProcess(null); }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none">
                    <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Activity className="w-32 h-32" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{editingProcess ? 'Editar Oportunidade' : 'Novo Atendimento Clínico'}</DialogTitle>
                            <p className="text-primary-foreground/70 text-sm font-medium">Defina os detalhes do tratamento e expectativa financeira.</p>
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

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Título do Tratamento / Projeto *</Label>
                            <Input required className="h-11 rounded-xl" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Implante Dentário, Limpa Geral, etc." />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Valor Estimado (R$)</Label>
                                <Input type="number" step="0.01" className="h-11 rounded-xl" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} placeholder="0,00" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expectativa de Início</Label>
                                <Input type="date" className="h-11 rounded-xl" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                            </div>
                        </div>

                        {!editingProcess && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Etapa Inicial do Funil</Label>
                                <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                                    value={formData.stage} onChange={e => setFormData({ ...formData, stage: e.target.value as StageKey })}>
                                    {Object.entries(STAGES).map(([key, config]) => (
                                        <option key={key} value={key}>{config.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
                                {editingProcess ? 'Atualizar Dados' : 'Iniciar Atendimento'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Dialog for Conversion */}
            <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none">
                    <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <CalendarDays className="w-32 h-32" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Converter para Agendamento</DialogTitle>
                            <p className="text-primary-foreground/70 text-sm font-medium">Agende uma consulta clínica para {selectedProcess?.client_name}.</p>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleConvertSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Procedimento a Agendar *</Label>
                            <Input required className="h-11 rounded-xl" value={convertFormData.title} onChange={e => setConvertFormData({ ...convertFormData, title: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tipo de Atendimento</Label>
                                <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                                    value={convertFormData.type} onChange={e => setConvertFormData({ ...convertFormData, type: e.target.value })}>
                                    <option value="consulta">Consulta / Avaliação</option>
                                    <option value="manutencao">Manutenção</option>
                                    <option value="procedimento">Procedimento Cirúrgico</option>
                                    <option value="retorno">Retorno</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data do Agendamento *</Label>
                                <Input type="date" required className="h-11 rounded-xl" value={convertFormData.start_date} onChange={e => setConvertFormData({ ...convertFormData, start_date: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Observações Complementares</Label>
                            <Input className="h-11 rounded-xl" value={convertFormData.notes} onChange={e => setConvertFormData({ ...convertFormData, notes: e.target.value })} placeholder="Ex: Paciente com urgência..." />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
                                Confirmar Agendamento
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
