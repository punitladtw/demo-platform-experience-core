import { Layout } from "@/components/layout";
import { useListEvidence } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";

export function EvidenceVault() {
  const { data: evidence, isLoading } = useListEvidence();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Evidence Vault</h1>
          <p className="text-muted-foreground mt-1">Immutable audit log of all automated compliance checks.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4"><div className="h-64 bg-card rounded-xl animate-pulse"></div></div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Check Type</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Result</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Context</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Details</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {evidence?.map(record => (
                  <tr key={record.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        {record.checkType === 'test_coverage' && <Shield className="w-4 h-4 text-cyan-500" />}
                        {record.checkType === 'security_scan' && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                        {record.checkType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {record.status === 'passed' && <span className="inline-flex items-center gap-1 text-emerald-400 font-medium"><ShieldCheck className="w-4 h-4"/> Passed</span>}
                      {record.status === 'failed' && <span className="inline-flex items-center gap-1 text-red-400 font-bold"><ShieldAlert className="w-4 h-4"/> Failed</span>}
                      {record.status === 'skipped' && <span className="text-muted-foreground">Skipped</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{record.serviceName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{record.environment.toUpperCase()} • {record.teamName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{record.details}</p>
                      {record.threshold !== null && record.actual !== null && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          Required: {record.threshold} | Actual: <span className={record.actual < record.threshold ? 'text-red-400' : 'text-emerald-400'}>{record.actual}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm:ss')}
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
