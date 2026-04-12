import { useState } from "react";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import AppPage from "./pages/AppPage";
import PricingPage from "./pages/PricingPage";

type Route = "home" | "app" | "pricing";

function routeFromPath(pathname: string): Route {
  if (pathname.startsWith("/app")) return "app";
  if (pathname.startsWith("/pricing")) return "pricing";
  return "home";
}

export default function App() {
  const [route, setRoute] = useState<Route>(() =>
    routeFromPath(window.location.pathname)
  );

  const navigate = (next: Route) => {
    const path = next === "home" ? "/" : `/${next}`;
    window.history.pushState({}, "", path);
    setRoute(next);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar current={route} onNavigate={navigate} />
      <main className="flex-1">
        {route === "home" && <HomePage onNavigate={navigate} />}
        {route === "app" && <AppPage />}
        {route === "pricing" && <PricingPage />}
      </main>
      <Footer />
    </div>
  );
}
