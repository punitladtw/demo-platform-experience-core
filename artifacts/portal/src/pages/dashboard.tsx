import { Layout } from "@/components/layout";
import { 
  useListTeams, 
  useListNamespaces, 
  useListDeployments, 
  useListEvidence 
} from "@workspace/api-client-react";
import { Users, Box, Rocket, ShieldCheck, Terminal, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export function Dashboard() {
  const { data: teams } = useListTeams();
  const { data: namespaces } = useListNamespaces();
  const { data: deployments } = useListDeployments();
  const { data: evidence } = useListEvidence();

  const complianceRate = evidence && evidence.length > 0
    ? Math.round((evidence.filter(e => e.status === 'passed').length / evidence.length) * 100)
    : 100;

  const stats = [
    { label: "Active Teams", value: teams?.length || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Namespaces", value: namespaces?.length || 0, icon: Box, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Total Deployments", value: deployments?.length || 0, icon: Rocket, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Compliance Rate", value: `${complianceRate}%`, icon: ShieldCheck, color: complianceRate < 90 ? "text-amber-500" : "text-cyan-500", bg: complianceRate < 90 ? "bg-amber-500/10" : "bg-cyan-500/10" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Platform operations command center.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label} 
              className="bg-card/50 backdrop-blur-sm border border-border/50 p-6 rounded-2xl hover:border-border transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2 text-foreground font-mono">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CLI Block */}
          <div className="col-span-1 lg:col-span-2 space-y-4">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" /> CLI Quickstart
            </h2>
            <div className="bg-[#0D1117] border border-slate-800 rounded-xl overflow-hidden shadow-xl font-mono text-sm">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#161B22] border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-2 text-slate-400 text-xs font-sans">platform-cli</span>
              </div>
              <div className="p-4 space-y-2 text-slate-300">
                <div className="flex">
                  <span className="text-indigo-400 mr-2">$</span>
                  <span>platform login</span>
                </div>
                <div className="flex text-green-400 pb-2">✓ Authenticated successfully</div>
                
                <div className="flex">
                  <span className="text-indigo-400 mr-2">$</span>
                  <span>platform namespaces list --team myteam</span>
                </div>
                
                <div className="flex">
                  <span className="text-indigo-400 mr-2">$</span>
                  <span>platform deploy --namespace myteam-prod --service api --image v1.2.3 --coverage 85</span>
                </div>
                <div className="flex text-cyan-400 pb-2">Running compliance checks... PASSED</div>
                
                <div className="flex">
                  <span className="text-indigo-400 mr-2">$</span>
                  <span><span className="w-1.5 h-4 bg-indigo-400 inline-block animate-pulse align-middle"></span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="col-span-1 space-y-4">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-400" /> Recent Deployments
            </h2>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-4">
              {deployments?.slice(0, 5).map(dep => (
                <div key={dep.id} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="mt-1">
                    {dep.status === 'succeeded' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : dep.status === 'blocked' || dep.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {dep.serviceName} <span className="text-muted-foreground font-mono text-xs">{dep.imageTag}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dep.namespaceName} • {format(new Date(dep.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {(!deployments || deployments.length === 0) && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No recent deployments
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
