import { Switch, Route, Router as WouterRouter } from "wouter";
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import { OnboardingModal } from "@/components/onboarding-modal";
import { UpgradeModalProvider } from "@/components/upgrade-modal";

import Home from "@/pages/home";
import GameDetail from "@/pages/game-detail";
import Ranking from "@/pages/ranking";
import MyList from "@/pages/my-list";
import Profile from "@/pages/profile";
import Subscription from "@/pages/subscription";
import Admin from "@/pages/admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    },
  },
});

type ErrorBoundaryState = { hasError: boolean; message: string };

class ErrorBoundary extends React.Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(err: unknown): ErrorBoundaryState {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return { hasError: true, message };
  }

  componentDidCatch(err: unknown) {
    console.error("[App ErrorBoundary] Caught runtime error:", err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-red-400 p-6">
        <h1 className="text-2xl font-bold mb-4">Se produjo un error en la aplicación</h1>
        <pre className="whitespace-pre-wrap text-sm max-w-2xl text-left bg-zinc-900 border border-red-500/40 rounded p-4">
          {this.state.message}
        </pre>
      </div>
    );
  }
}

function normalizeBasePath(baseUrl: string | undefined): string {
  const raw = (baseUrl ?? "/").trim();
  const noTrailing = raw.replace(/\/+$/, "");
  // Wouter expects `base=""` for root; passing `base="/"` can break initial route matching.
  if (raw === "/" || noTrailing === "") return "";
  return noTrailing.startsWith("/") ? noTrailing : `/${noTrailing}`;
}

const wouterBase = normalizeBasePath(import.meta.env.BASE_URL);

function Router() {
  if (typeof window !== "undefined") {
    console.log("[App] Router render", {
      base: wouterBase,
      pathname: window.location.pathname,
    });
  }
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/juego/:id" component={GameDetail} />
      <Route path="/ranking" component={Ranking} />
      <Route path="/mi-lista" component={MyList} />
      <Route path="/perfil" component={Profile} />
      <Route path="/suscripcion" component={Subscription} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={wouterBase}>
          <ErrorBoundary>
            <UpgradeModalProvider>
              <Layout>
                <Router />
              </Layout>
              <OnboardingModal />
            </UpgradeModalProvider>
          </ErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
