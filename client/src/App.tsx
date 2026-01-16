import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { PreviewShell } from "@/components/PreviewShell";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import CategoryList from "@/pages/CategoryList";
import CategoryDetail from "@/pages/CategoryDetail";
import BusinessDetail from "@/pages/BusinessDetail";
import SearchResults from "@/pages/SearchResults";
import MapView from "@/pages/MapView";
import Offers from "@/pages/Offers";
import Favorites from "@/pages/Favorites";
import Compare from "@/pages/Compare";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import { NotificationPrompt } from "@/components/NotificationPrompt";

function PreviewHome() {
  return <PreviewShell><Home /></PreviewShell>;
}

function PreviewCategoryList() {
  return <PreviewShell><CategoryList /></PreviewShell>;
}

function PreviewCategoryDetail() {
  return <PreviewShell><CategoryDetail /></PreviewShell>;
}

function PreviewBusinessDetail() {
  return <PreviewShell><BusinessDetail /></PreviewShell>;
}

function PreviewSearchResults() {
  return <PreviewShell><SearchResults /></PreviewShell>;
}

function PreviewMapView() {
  return <PreviewShell><MapView /></PreviewShell>;
}

function PreviewOffers() {
  return <PreviewShell><Offers /></PreviewShell>;
}

function PreviewFavorites() {
  return <PreviewShell><Favorites /></PreviewShell>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categories" component={CategoryList} />
      <Route path="/categories/:id" component={CategoryDetail} />
      <Route path="/businesses/:id" component={BusinessDetail} />
      <Route path="/search" component={SearchResults} />
      <Route path="/map" component={MapView} />
      <Route path="/offers" component={Offers} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/compare" component={Compare} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/preview" component={PreviewHome} />
      <Route path="/preview/categories" component={PreviewCategoryList} />
      <Route path="/preview/categories/:id" component={PreviewCategoryDetail} />
      <Route path="/preview/businesses/:id" component={PreviewBusinessDetail} />
      <Route path="/preview/search" component={PreviewSearchResults} />
      <Route path="/preview/map" component={PreviewMapView} />
      <Route path="/preview/offers" component={PreviewOffers} />
      <Route path="/preview/favorites" component={PreviewFavorites} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <NotificationPrompt />
          <Router />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
