import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListDeployments, useCreateDeployment, useListNamespaces, getListDeploymentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Rocket, Plus, Activity, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";

export function Deployments() {
  const { data: deployments, isLoading } = useListDeployments();
  const { data: namespaces } = useListNamespaces();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namespaceId, setNamespaceId] = useState<number | "">("");
  const [serviceName, setServiceName] = useState("");
  const [imageTag, setImageTag] = useState("");
  const [testCoverage, setTestCoverage] = useState<number>(85);

  const queryClient = useQueryClient();
  const { mutate: createDeployment, isPending, error } = useCreateDeployment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeploymentsQueryKey() });
        setIsModalOpen(false);
      }
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (namespaceId === "") return;
    createDeployment({ data: { namespaceId: Number(namespaceId), serviceName, imageTag, testCoverage } });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'succeeded': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Succeeded</span>;
      case 'blocked': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><XCircle className="w-3.5 h-3.5" /> Blocked</span>;
      case 'failed': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><AlertTriangle className="w-3.5 h-3.5" /> Failed</span>;
      default: return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Activity className="w-3.5 h-3.5 animate-pulse" /> {status}</span>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Deployments</h1>
            <p className="text-muted-foreground mt-1">Track rollouts and policy enforcement gates.</p>
          </div>
          
          <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30">
                <Rocket className="w-4 h-4" /> Trigger Deployment
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-card border border-border p-6 rounded-2xl shadow-2xl w-full max-w-md z-50 animate-in zoom-in-95">
                <Dialog.Title className="text-xl font-display font-semibold mb-4">New Deployment</Dialog.Title>
                
                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error.error || "Deployment failed"}</div>}

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Namespace</label>
                    <select 
                      required 
                      value={namespaceId} 
                      onChange={e => setNamespaceId(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                    >
                      <option value="" disabled>Select a namespace...</option>
                      {namespaces?.map(ns => <option key={ns.id} value={ns.id}>{ns.k8sNamespace} ({ns.environment})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Service Name</label>
                    <input 
                      required 
                      value={serviceName} 
                      onChange={e => setServiceName(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-mono text-sm"
                      placeholder="e.g. user-api"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Image Tag</label>
                    <input 
                      required 
                      value={imageTag} 
                      onChange={e => setImageTag(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-mono text-sm"
                      placeholder="v1.0.0 or sha256:..."
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium">Reported Test Coverage</label>
                      <span className="text-xs font-mono text-cyan-400">{testCoverage}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0" max="100"
                      value={testCoverage} 
                      onChange={e => setTestCoverage(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Prod deployments require {'>'}= 80% coverage to pass the gate.</p>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                    <Dialog.Close asChild>
                      <button type="button" className="px-4 py-2 hover:bg-muted rounded-lg font-medium transition-colors">Cancel</button>
                    </Dialog.Close>
                    <button 
                      type="submit" 
                      disabled={isPending || namespaceId === ""}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isPending ? 'Deploying...' : 'Deploy'}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {isLoading ? (
          <div className="space-y-4"><div className="h-40 bg-card rounded-xl animate-pulse"></div></div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Service</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Namespace</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Compliance</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Coverage</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Deployed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deployments?.map(dep => (
                  <tr key={dep.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{dep.serviceName}</div>
                      <div className="font-mono text-xs text-muted-foreground mt-0.5">{dep.imageTag}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-muted-foreground">{dep.namespaceName}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(dep.status)}
                    </td>
                    <td className="px-6 py-4">
                      {dep.complianceStatus === 'passed' && <span className="text-emerald-500 font-medium">Passed</span>}
                      {dep.complianceStatus === 'failed' && <span className="text-red-500 font-medium font-bold">Failed</span>}
                      {dep.complianceStatus === 'pending' && <span className="text-amber-500">Pending</span>}
                    </td>
                    <td className="px-6 py-4">
                      {dep.testCoverage !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${dep.testCoverage >= 80 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                              style={{width: `${dep.testCoverage}%`}}
                            />
                          </div>
                          <span className="font-mono text-xs">{dep.testCoverage}%</span>
                        </div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(dep.createdAt), 'MMM d, HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
