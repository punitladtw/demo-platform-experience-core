import { Layout } from "@/components/layout";
import { useListOperators } from "@workspace/api-client-react";
import { Database, HardDrive, Share2, Activity, Network } from "lucide-react";

export function Operators() {
  const { data: operators, isLoading } = useListOperators();

  const getIcon = (type: string) => {
    switch (type) {
      case 's3': return <HardDrive className="w-8 h-8 text-amber-500" />;
      case 'rds': return <Database className="w-8 h-8 text-blue-500" />;
      case 'salesforce': return <Share2 className="w-8 h-8 text-cyan-500" />;
      case 'kafka': return <Network className="w-8 h-8 text-purple-500" />;
      default: return <Activity className="w-8 h-8 text-indigo-500" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Platform Operators</h1>
          <p className="text-muted-foreground mt-1">Managed services available in the cluster.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-48 bg-card rounded-xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operators?.map(operator => (
              <div key={operator.id} className="bg-card border border-border hover:border-primary/30 rounded-2xl p-6 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    operator.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'
                  }`}>
                    {operator.status}
                  </span>
                </div>
                
                <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {getIcon(operator.type)}
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-1">{operator.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{operator.description}</p>
                
                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Version</span>
                  <span className="font-mono text-xs px-1.5 py-0.5 bg-muted rounded">{operator.version}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
