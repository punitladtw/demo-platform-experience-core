import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useGetTeam, useListTeamMembers } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Shield, User, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export function TeamDetail() {
  const params = useParams();
  const teamId = parseInt(params.id || "0", 10);
  
  const { data: team, isLoading: isTeamLoading } = useGetTeam(teamId);
  const { data: members, isLoading: isMembersLoading } = useListTeamMembers(teamId);

  if (isTeamLoading) return <Layout><div className="animate-pulse h-64 bg-card rounded-xl border border-border"></div></Layout>;
  if (!team) return <Layout>Team not found.</Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <Link href="/teams" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Teams
        </Link>
        
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-8 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">{team.name}</h1>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">{team.slug}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Created {format(new Date(team.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{team.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Team Members
            </h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members?.map(member => (
                    <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-400">
                          {member.user.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{member.user.displayName}</div>
                          <div className="text-xs text-muted-foreground">@{member.user.username}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'owner' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {member.role === 'owner' && <Shield className="w-3 h-3" />}
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
