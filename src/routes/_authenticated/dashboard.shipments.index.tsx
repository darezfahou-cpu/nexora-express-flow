import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { PortalShell, PortalHeading, EmptyState } from "@/components/portal-shell";
import { customerNav } from "@/components/portal-nav";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, serviceLabel, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/dashboard/shipments/")({
  head: () => ({
    meta: [
      { title: "My shipments — NEXORA Logistics" },
      { name: "description", content: "Every shipment booked under your NEXORA account with live status." },
      { property: "og:title", content: "My shipments — NEXORA Logistics" },
      { property: "og:description", content: "Every shipment booked under your NEXORA account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyShipments,
});

function MyShipments() {
  const { user } = useSession();
  const q = useQuery({
    queryKey: ["my-shipments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rows = q.data ?? [];

  return (
    <PortalShell kind="Customer portal" nav={customerNav} email={user?.email}>
      <PortalHeading title="My shipments" subtitle="All consignments booked under your account." />

      {q.isLoading ? (
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing to show"
            description="Once a shipment is assigned to your account it will be listed here."
            action={
              <Button asChild>
                <Link to="/quote">Request a quote</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="p-3">Tracking</th>
                <th className="p-3">Route</th>
                <th className="p-3">Service</th>
                <th className="p-3">ETA</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono text-xs text-primary">{s.tracking_number}</td>
                  <td className="p-3">
                    {s.origin} → {s.destination}
                  </td>
                  <td className="p-3 text-muted-foreground">{serviceLabel(s.service_level)}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(s.estimated_delivery)}</td>
                  <td className="p-3">
                    <StatusBadge status={s.status as ShipmentStatus} />
                  </td>
                  <td className="p-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/dashboard/shipments/$id" params={{ id: s.id }}>
                        Open
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
