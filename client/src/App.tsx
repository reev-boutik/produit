import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import NotFound from "@/pages/not-found";
import Scanner from "@/pages/scanner";
import Products from "@/pages/products";
import Analytics from "@/pages/analytics";
import Navigation from "@/components/navigation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Scanner} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/products" component={Products} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LocalizationProvider>
          <CurrencyProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-material-surface-dark">
              <Navigation />
              <Router />
              <Toaster />
            </div>
          </CurrencyProvider>
        </LocalizationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
