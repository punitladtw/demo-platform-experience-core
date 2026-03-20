import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListNamespaces, useCreateNamespace, useListTeams, getListNamespacesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Plus, Server, Cpu, HardDrive } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";

export function Namespaces() {
  const { data: namespaces, isLoading } = useListNamespaces();
  const { data: teams } = useListTeams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamId, setTeamId] = useState<number | "">("");
  const [environment, setEnvironment] = useState<"dev" | "prod">("dev");

  const queryClient = useQueryClient();
  const { mutate: createNamespace, isPending } = useCreateNamespace({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNamespacesQueryKey() });
        setIsModalOpen(false);
      }
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamId === "") return;
    createNamespace({ data: { teamId: Number(teamId), environment } });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Namespaces</h1>
            <p className="text-muted-foreground mt-1">Kubernetes deployment targets and quotas.</p>
          </div>
          
          <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30">
                <Plus className="w-4 h-4" /> Create Namespace
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-card border border-border p-6 rounded-2xl shadow-2xl w-full max-w-md z-50 animate-in zoom-in-95">
                <Dialog.Title className="text-xl font-display font-semibold mb-4">Provision Namespace</Dialog.Title>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Team</label>
                    <select 
                      required 
                      value={teamId} 
                      onChange={e => setTeamId(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                    >
                      <option value="" disabled>Select a team...</option>
                      {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Environment</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setEnvironment('dev')}
                        className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${environment === 'dev' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-border bg-background hover:bg-muted'}`}
                      >
                        <Box className="w-6 h-6" />
                        <span className="font-medium">Development</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEnvironment('prod')}
                        className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${environment === 'prod' ? 'border-rose-500 bg-red-500/10 text-red-400' : 'border-border bg-background hover:bg-muted'}`}
                      >
                        <ShieldAlert className="w-6 h-6" />
                        <span className="font-medium">Production</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                    <Dialog.Close asChild>
                      <button type="button" className="px-4 py-2 hover:bg-muted rounded-lg font-medium transition-colors">Cancel</button>
                    </Dialog.Close>
                    <button 
                      type="submit" 
                      disabled={isPending || teamId === ""}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isPending ? 'Provisioning...' : 'Provision'}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {isLoading ? (
          <div className="space-y-4"><div className="h-20 bg-card rounded-xl animate-pulse"></div></div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Namespace</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Team</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Quotas</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {namespaces?.map(ns => (
                  <tr key={ns.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Box className="w-5 h-5 text-muted-foreground" />
                        <span className="font-mono font-medium text-foreground">{ns.k8sNamespace}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ns.environment === 'prod' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {ns.environment}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{ns.teamName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${ns.status === 'active' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                        <span className="capitalize text-xs font-medium">{ns.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1" title="CPU Limit"><Cpu className="w-3.5 h-3.5"/> {ns.resourceQuota.cpuLimit}</div>
                        <div className="flex items-center gap-1" title="Memory Limit"><HardDrive className="w-3.5 h-3.5"/> {ns.resourceQuota.memoryLimit}</div>
                        <div className="flex items-center gap-1" title="Pod Limit"><Server className="w-3.5 h-3.5"/> {ns.resourceQuota.podLimit}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(ns.createdAt), 'MMM d, yyyy')}
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

// Temporary icon addition for Namespaces file that was missing from imports
function ShieldAlert({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
}
