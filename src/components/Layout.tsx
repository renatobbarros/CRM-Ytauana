import { Link, Outlet, useLocation } from 'react-router-dom';
import { Users, CreditCard, LayoutDashboard, GanttChart, CalendarDays, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Layout() {
    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card hidden md:flex flex-col shadow-sm">
                <div className="flex h-16 items-center border-b px-6 gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Stethoscope className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-primary">Ytauana CRM</span>
                </div>
                <nav className="p-4 flex-1 space-y-1 overflow-y-auto">
                    <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground opacity-70">Menu Principal</div>
                    <NavLink to="/" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</NavLink>
                    <NavLink to="/calendar" icon={<CalendarDays className="w-4 h-4" />}>Agenda Clínica</NavLink>

                    <div className="px-3 mb-2 mt-6 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground opacity-70">Gestão</div>
                    <NavLink to="/clients" icon={<Users className="w-4 h-4" />}>Pacientes</NavLink>
                    <NavLink to="/payments" icon={<CreditCard className="w-4 h-4" />}>Financeiro</NavLink>
                    <NavLink to="/pipeline" icon={<GanttChart className="w-4 h-4" />}>Tratamentos</NavLink>
                </nav>
                <div className="p-4 border-t border-border/40">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-secondary/50 border border-border/20">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">YT</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-primary">Ytauana</p>
                            <p className="text-[10px] text-muted-foreground truncate">Proprietária</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b bg-card/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
                    <h2 className="font-semibold text-lg text-primary/80">Painel de Controle</h2>
                    <div className="text-xs font-medium px-4 py-1.5 rounded-full bg-accent text-accent-foreground border border-accent/20">
                        Clínica Ativa
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-8 relative">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium border border-transparent",
                isActive
                    ? "bg-secondary text-primary border-primary/10 shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-primary"
            )}
        >
            <div className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                {icon}
            </div>
            {children}
        </Link>
    )
}

