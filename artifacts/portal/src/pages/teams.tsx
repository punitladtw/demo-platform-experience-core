import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListTeams, useCreateTeam, getListTeamsQueryKey, Team } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Plus, ShieldAlert, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import * as Dialog from "@radix-ui/react-dialog";

export function Teams() {
  const { data: teams, isLoading } = useListTeams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const queryClient = useQueryClient();
  const { mutate: createTeam, isPending } = useCreateTeam({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
        setIsModalOpen(false);
        setName(""); setSlug(""); setDescription("");
      }
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTeam({ data: { name, slug, description } });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Teams</h1>
            <p className="text-muted-foreground mt-1">Manage organizational units and their resources.</p>
          </div>
          
          <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30">
                <Plus className="w-4 h-4" /> Create Team
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-card border border-border p-6 rounded-2xl shadow-2xl w-full max-w-md z-50 animate-in zoom-in-95">
                <Dialog.Title className="text-xl font-display font-semibold mb-4">Create New Team</Dialog.Title>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Team Name</label>
                    <input 
                      required 
                      value={name} 
                      onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Engineering Core"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <input 
                      required 
                      value={slug} 
                      onChange={e => setSlug(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-sm"
                      placeholder="eng-core"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                      value={description} 
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Dialog.Close asChild>
                      <button type="button" className="px-4 py-2 hover:bg-muted rounded-lg font-medium transition-colors">Cancel</button>
                    </Dialog.Close>
                    <button 
                      type="submit" 
                      disabled={isPending}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isPending ? 'Creating...' : 'Create Team'}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams?.map((team: Team) => (
              <div key={team.id} className="bg-card border border-border/50 hover:border-primary/50 rounded-xl p-5 shadow-lg shadow-black/10 transition-all hover:-translate-y-1 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">{team.slug}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{team.name}</h3>
                <p className="text-sm text-muted-foreground h-10 line-clamp-2 mb-4">{team.description || 'No description provided.'}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-5 border-t border-border/50 pt-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Members</div>
                    <div className="font-semibold">{team.memberCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Namespaces</div>
                    <div className="font-semibold">{team.namespaceCount}</div>
                  </div>
                </div>

                <Link href={`/teams/${team.id}`} className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-primary/20 hover:text-primary text-foreground px-4 py-2 rounded-lg font-medium transition-colors">
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
