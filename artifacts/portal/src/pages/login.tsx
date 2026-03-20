import { Command, ShieldCheck, Code2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface Props {
  onLogin: () => void;
}

const PERSONAS = [
  {
    id: "admin",
    name: "Alex Admin",
    role: "Platform Admin",
    description: "Full access · team management · compliance",
    icon: ShieldCheck,
    gradient: "from-indigo-500 to-cyan-500",
    badge: "Admin",
    badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  {
    id: "member",
    name: "Sam Dev",
    role: "Developer",
    description: "Deploy services · manage namespaces",
    icon: Code2,
    gradient: "from-emerald-500 to-teal-500",
    badge: "Member",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
];

export function Login({ onLogin }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleLogin(persona: string) {
    setLoading(persona);
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      onLogin();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md px-4"
      >
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 rounded-2xl shadow-2xl shadow-black/50 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500" />

          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
            <Command className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground mb-1">PlatformOS</h1>
          <p className="text-muted-foreground mb-8">Engineering Control Plane</p>

          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Choose a demo persona</p>

          <div className="flex flex-col gap-3">
            {PERSONAS.map((p) => {
              const Icon = p.icon;
              const isLoading = loading === p.id;
              return (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleLogin(p.id)}
                  disabled={!!loading}
                  className="flex items-center gap-4 w-full bg-muted/40 hover:bg-muted/70 border border-border/50 hover:border-border px-5 py-4 rounded-xl transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${p.gradient} flex items-center justify-center shrink-0`}>
                    {isLoading
                      ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <Icon className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{p.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${p.badgeClass} font-medium`}>{p.badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-6 text-xs text-muted-foreground">
            Demo environment · no real credentials required
          </div>
        </div>
      </motion.div>
    </div>
  );
}
