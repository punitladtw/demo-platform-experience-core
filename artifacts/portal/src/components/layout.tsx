import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Box, 
  Package, 
  Rocket, 
  ShieldCheck, 
  Database,
  LogOut,
  Command,
  TerminalSquare
} from "lucide-react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Namespaces", href: "/namespaces", icon: Box },
  { name: "Starter Kits", href: "/starterkits", icon: Package },
  { name: "Deployments", href: "/deployments", icon: Rocket },
  { name: "Evidence Vault", href: "/evidence", icon: ShieldCheck },
  { name: "Operators", href: "/operators", icon: Database },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const { mutate: logout } = useLogout();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl flex flex-col relative z-20">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Command className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            PlatformOS
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href} className="block">
                <div className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  {item.name}
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active" 
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.displayName || user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
            <button 
              onClick={() => logout({}, { onSuccess: () => window.location.href = '/' })}
              className="p-2 hover:bg-destructive/20 hover:text-destructive rounded-md transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
