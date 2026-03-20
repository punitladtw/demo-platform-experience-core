import { Layout } from "@/components/layout";
import { useListStarterKits } from "@workspace/api-client-react";
import { Package, Check, Terminal, FileCode2, Globe, Database, BrainCircuit, Rocket } from "lucide-react";

export function StarterKits() {
  const { data: kits, isLoading } = useListStarterKits();

  const getIcon = (category: string) => {
    switch (category) {
      case 'web': return <Globe className="w-6 h-6 text-blue-400" />;
      case 'api': return <Terminal className="w-6 h-6 text-emerald-400" />;
      case 'worker': return <Rocket className="w-6 h-6 text-amber-400" />;
      case 'data': return <Database className="w-6 h-6 text-purple-400" />;
      case 'ml': return <BrainCircuit className="w-6 h-6 text-pink-400" />;
      default: return <Package className="w-6 h-6 text-indigo-400" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Starter Kits</h1>
          <p className="text-muted-foreground mt-1">Pre-approved scaffolding for secure, compliant microservices.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-card rounded-xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits?.map(kit => (
              <div key={kit.id} className="bg-card border border-border/50 hover:border-primary/50 rounded-2xl p-6 shadow-lg shadow-black/10 transition-all hover:-translate-y-1 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center">
                    {getIcon(kit.category)}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                    {kit.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-2">{kit.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 flex-grow">{kit.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md font-mono">{kit.language}</span>
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md font-mono">{kit.framework}</span>
                  {kit.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">{tag}</span>
                  ))}
                </div>
                
                <div className="space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${kit.dockerfileIncluded ? 'text-green-500' : 'text-border'}`} />
                    <span className={kit.dockerfileIncluded ? 'text-foreground' : ''}>Dockerfile Included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${kit.cicdIncluded ? 'text-green-500' : 'text-border'}`} />
                    <span className={kit.cicdIncluded ? 'text-foreground' : ''}>CI/CD Pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${kit.complianceReady ? 'text-green-500' : 'text-border'}`} />
                    <span className={kit.complianceReady ? 'text-foreground font-medium' : ''}>Compliance Ready</span>
                  </div>
                </div>
                
                <button className="mt-6 w-full py-2 bg-muted hover:bg-primary/20 hover:text-primary rounded-lg font-medium transition-colors border border-transparent hover:border-primary/30 flex items-center justify-center gap-2">
                  <FileCode2 className="w-4 h-4" /> Initialize
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
