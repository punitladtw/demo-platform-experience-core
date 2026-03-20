import { SiGithub } from "react-icons/si";
import { Command } from "lucide-react";
import { motion } from "framer-motion";

export function Login() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Abstract command center" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md"
      >
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 rounded-2xl shadow-2xl shadow-black/50 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500"></div>
          
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
            <Command className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">PlatformOS</h1>
          <p className="text-muted-foreground mb-8">Engineering Control Plane</p>

          <button 
            onClick={() => window.location.href = '/api/auth/github'}
            className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-white/10 hover:-translate-y-0.5 active:translate-y-0"
          >
            <SiGithub className="w-5 h-5" />
            Continue with GitHub
          </button>

          <div className="mt-8 text-xs text-muted-foreground">
            Protected by enterprise single sign-on
          </div>
        </div>
      </motion.div>
    </div>
  );
}
