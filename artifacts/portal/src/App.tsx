import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Hooks
import { useGetMe } from "@workspace/api-client-react";

// Pages
import { Login } from "./pages/login";
import { Dashboard } from "./pages/dashboard";
import { Teams } from "./pages/teams";
import { TeamDetail } from "./pages/team-detail";
import { Namespaces } from "./pages/namespaces";
import { StarterKits } from "./pages/starter-kits";
import { Deployments } from "./pages/deployments";
import { EvidenceVault } from "./pages/evidence-vault";
import { Operators } from "./pages/operators";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error, refetch } = useGetMe();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-mono animate-pulse text-sm">Initializing PlatformOS...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return <Login onLogin={() => refetch()} />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/teams" component={Teams} />
      <Route path="/teams/:id" component={TeamDetail} />
      <Route path="/namespaces" component={Namespaces} />
      <Route path="/starterkits" component={StarterKits} />
      <Route path="/deployments" component={Deployments} />
      <Route path="/evidence" component={EvidenceVault} />
      <Route path="/operators" component={Operators} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGuard>
            <Router />
          </AuthGuard>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
