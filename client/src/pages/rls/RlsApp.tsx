import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { RlsHeader } from "@/components/rls/RlsHeader";
import { RlsFooter } from "@/components/rls/RlsFooter";
import { isDedicatedRlsHost, rlsHref } from "@shared/brands.js";

const RlsHome = lazy(() => import("./RlsHome"));
const RlsSoilDashboard = lazy(() => import("./RlsSoilDashboard"));
const RlsProducts = lazy(() => import("./RlsProducts"));
const RlsPrograms = lazy(() => import("./RlsPrograms"));
const RlsProfessionals = lazy(() => import("./RlsProfessionals"));
const RlsConsult = lazy(() => import("./RlsConsult"));
const RlsContact = lazy(() => import("./RlsContact"));

function hostName() {
  return typeof window !== "undefined" ? window.location.hostname : "";
}

export function RlsApp() {
  const path = (suffix: string) => rlsHref(suffix, hostName());

  return (
    <div className="flex min-h-screen flex-col bg-[#F4EFE6] text-[#1B2E1F]">
      <RlsHeader />
      <main className="flex-grow">
        <Suspense fallback={<div className="px-4 py-16 text-center text-[#1B2E1F]/60">Loading…</div>}>
          <Switch>
            <Route path={path("/")} component={RlsHome} />
            <Route path={path("/soil-dashboard")} component={RlsSoilDashboard} />
            <Route path={path("/products")} component={RlsProducts} />
            <Route path={path("/programs")} component={RlsPrograms} />
            <Route path={path("/professionals")} component={RlsProfessionals} />
            <Route path={path("/consult")} component={RlsConsult} />
            <Route path={path("/contact")} component={RlsContact} />
            <Route>
              <div className="mx-auto max-w-xl px-4 py-16 text-center">
                <p className="font-heading text-2xl font-semibold">Page not found</p>
                <p className="mt-2 text-sm text-[#1B2E1F]/70">
                  {isDedicatedRlsHost(hostName())
                    ? "This Regenerative Landscape Supply page does not exist."
                    : "This /rls preview path does not exist."}
                </p>
              </div>
            </Route>
          </Switch>
        </Suspense>
      </main>
      <RlsFooter />
    </div>
  );
}

export default RlsApp;
