import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { PortalShell, PortalHeading, StatCard } from "@/components/portal-shell";
import { adminNav } from "@/components/portal-nav";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin console — NEXORA Logistics" },
      { name: "description", content: "Operations overview for NEXORA dispatchers: shipments, statuses and tracking activity." },
      { property: "og:title", content: "Admin console — NEXORA Logistics" },
      { property: "og:description", content: "Operations overview for NEXORA dispatchers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { user } = useSession();
  const q = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data: shipments, error } = await supabase
        .from("shipments")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const { data: events, error: eventsError } = await supabase
        .from("shipment_events")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(6);
      if (eventsError) throw eventsError;
      const { count } = await supabase.from("quote_requests").select("*", { count: "exact", head: true });
      return { shipments: shipments ?? [], events: events ?? [], quotes: count ?? 0 };
    },
  });

  const shipments = q.data?.shipments ?? [];
  const exceptions = shipments.filter((s) => s.status === "exception").length;
  const inTransit = shipments.filter((s) => s.status !== "delivered" && s.status !== "exception").length;

  return (
    <PortalShell kind="Admin console" nav={adminNav} email={user?.email}>
      <PortalHeading
        title="Operations"
        subtitle="Network-wide shipment and tracking activity."
        action={
          <Button asChild>
            <Link to="/admin/shipments/new">Create shipment</Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Shipments" value={shipments.length} />
        <StatCard label="In transit" value={inTransit} />
        <StatCard label="Exceptions" value={exceptions} hint="Need attention" />
        <StatCard label="Quote requests" value={q.data?.quotes ?? 0} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Latest</p>
          <h2 className="mt-2 text-2xl uppercase">Recent shipments</h2>
          <div className="mt-5 border border-border">
            {shipments.slice(0, 6).map((s) => (
              <Link
                key={s.id}
                to="/admin/shipments/$id"
                params={{ id: s.id }}
                className="flex items-center justify-between gap-3 border-b border-border p-4 last:border-0 hover:bg-secondary/40"
              >
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{s.tracking_number}</p>
                  <p className="mt-1 text-sm">
                    {s.origin} → {s.destination}
                  </p>
                </div>
                <StatusBadge status={s.status as ShipmentStatus} />
              </Link>
            ))}
            {shipments.length === 0 && (
              <p className="p-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">No shipments</p>
            )}
          </div>
        </div>

        <div>
          <p className="eyebrow">Live feed</p>
          <h2 className="mt-2 text-2xl uppercase">Tracking updates</h2>
          <div className="mt-5 border border-border">
            {(q.data?.events ?? []).map((e) => (
              <div key={e.id} className="border-b border-border p-4 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={e.status as ShipmentStatus} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {formatDateTime(e.occurred_at)}
                  </span>
                </div>
                <p className="mt-2 text-sm">{e.location ?? "Location pending"}</p>
                {e.note && <p className="text-sm text-muted-foreground">{e.note}</p>}
              </div>
            ))}
            {(q.data?.events ?? []).length === 0 && (
              <p className="p-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">No updates</p>
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
