import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, serviceLabel, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Customer dashboard — NEXORA Logistics" },
      {
        name: "description",
        content: "View and track your active and completed NEXORA shipments.",
      },
      { property: "og:title", content: "Customer dashboard — NEXORA Logistics" },
      {
        property: "og:description",
        content: "View and track your active and completed NEXORA shipments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const shipments = useQuery({
    queryKey: ["customer-shipments", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    await navigate({ to: "/auth" });
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Customer portal</p>
          <h1 className="mt-4 text-4xl uppercase sm:text-5xl">Your shipments</h1>
          <p className="mt-3 text-sm text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <Button variant="outline" className="rounded-none" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      {shipments.isLoading && (
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Loading shipments…
        </p>
      )}

      {shipments.isError && (
        <div className="mt-10 border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
          Shipment data could not be loaded. Please try again.
        </div>
      )}

      {shipments.data?.length === 0 && (
        <div className="mt-10 border border-border py-16 text-center">
          <PackageSearch className="mx-auto h-8 w-8 text-primary" strokeWidth={1.5} />
          <h2 className="mt-5 text-xl uppercase">No shipments assigned</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Shipments connected to your account will appear here. You can still track any NEXORA
            reference from the public tracker.
          </p>
          <Button asChild className="mt-6 rounded-none">
            <Link to="/track" search={{}}>Open tracker</Link>
          </Button>
        </div>
      )}

      {shipments.data && shipments.data.length > 0 && (
        <div className="mt-8 grid gap-px bg-border md:grid-cols-2">
          {shipments.data.map((shipment) => (
            <article key={shipment.id} className="bg-background p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-sm tracking-widest text-primary">
                  {shipment.tracking_number}
                </span>
                <StatusBadge status={shipment.status as ShipmentStatus} />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4">
                <ShipmentField label="Origin" value={shipment.origin} />
                <ShipmentField label="Destination" value={shipment.destination} />
                <ShipmentField label="Service" value={serviceLabel(shipment.service_level)} />
                <ShipmentField
                  label="Estimated delivery"
                  value={formatDate(shipment.estimated_delivery)}
                />
              </div>
              <Link
                to="/track"
                search={{ code: shipment.tracking_number }}
                className="mt-6 inline-flex font-mono text-[11px] uppercase tracking-[0.18em] text-primary"
              >
                View timeline
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ShipmentField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm">{value}</p>
    </div>
  );
}