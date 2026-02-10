import { useEffect, useState } from 'react';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Users, Search, Phone, Mail, MapPin, FileText, UserPlus } from 'lucide-react';


const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

export function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadClients = async () => {
        const data = await window.api.getClients();
        setClients(data);
    };

    useEffect(() => { loadClients(); }, []);

    const openAdd = () => {
        setEditingClient(null);
        setFormData(emptyForm);
        setIsDialogOpen(true);
    };

    const openEdit = (client: Client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            phone: client.phone || '',
            email: client.email || '',
            address: client.address || '',
            notes: client.notes || '',
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingClient) {
            await window.api.updateClient({ ...formData, id: editingClient.id });
        } else {
            await window.api.addClient(formData);
        }
        setIsDialogOpen(false);
        setFormData(emptyForm);
        setEditingClient(null);
        loadClients();
    };

    const handleDelete = async (id: number) => {
        await window.api.deleteClient(id);
        setDeleteConfirm(null);
        loadClients();
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-6 pb-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border/40 shadow-sm transition-all hover:shadow-md">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Seus Pacientes</h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Prontuário e histórico personalizado de cada cliente.</p>
                </div>
                <Button onClick={openAdd} className="h-11 px-6 font-semibold shadow-md active:scale-95 transition-transform">
                    <UserPlus className="mr-2 h-5 w-5" /> Novo Paciente
                </Button>
            </div>

            <div className="bg-card rounded-2xl border border-border/40 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-border/40 bg-muted/10">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome, telefone ou e-mail..."
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
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground py-4 px-6">Paciente</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground py-4 px-6">Contato</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground py-4 px-6">Localização</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground py-4 px-6">Histórico</TableHead>
                                <TableHead className="w-[120px] text-right font-bold text-xs uppercase tracking-widest text-muted-foreground py-4 px-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.map((client) => (
                                <TableRow key={client.id} className="group border-border/30 hover:bg-primary/5 transition-colors">
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{client.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="space-y-1">
                                            {client.phone && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                    <Phone className="h-3 w-3" /> {client.phone}
                                                </div>
                                            )}
                                            {client.email && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground opacity-70">
                                                    <Mail className="h-3 w-3" /> {client.email}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span className="truncate max-w-[200px]">{client.address || 'Não informado'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <FileText className="h-3 w-3 shrink-0" />
                                            <span className="truncate max-w-[200px] italic">{client.notes || 'Sem observações'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/20" onClick={() => openEdit(client)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {deleteConfirm === client.id ? (
                                                <Button variant="destructive" size="sm" className="h-9 px-3 text-xs font-bold" onClick={() => handleDelete(client.id!)}>
                                                    Confirmar
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm(client.id!)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredClients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground/30">
                                            <Search className="h-12 w-12 mb-3 opacity-20" />
                                            <p className="font-bold text-sm">Nenhum paciente encontrado</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Dialog for Add/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingClient(null); }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none">
                    <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Users className="w-32 h-32" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{editingClient ? 'Editar Cadastro' : 'Novo Paciente Clínico'}</DialogTitle>
                            <p className="text-primary-foreground/70 text-sm font-medium">Mantenha os dados do paciente sempre atualizados.</p>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome Completo *</Label>
                            <Input id="name" required className="h-11 rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: João Silva" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Telefone / WhatsApp</Label>
                                <Input id="phone" className="h-11 rounded-xl" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">E-mail</Label>
                                <Input id="email" type="email" className="h-11 rounded-xl" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="exemplo@email.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Endereço Residencial</Label>
                            <Input id="address" className="h-11 rounded-xl" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Rua, Número, Bairro, Cidade" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Observações Clínicas e Histórico</Label>
                            <Input id="notes" className="h-11 rounded-xl" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Alergias, tratamentos anteriores, etc." />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
                                {editingClient ? 'Salvar Alterações' : 'Concluir Cadastro'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
