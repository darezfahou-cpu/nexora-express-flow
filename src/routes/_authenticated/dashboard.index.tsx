import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { PortalShell, PortalHeading, StatCard, EmptyState, ProgressBar } from "@/components/portal-shell";
import { customerNav } from "@/components/portal-nav";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, statusProgress, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — NEXORA Logistics" },
      { name: "description", content: "Track your NEXORA freight shipments, milestones and delivery estimates." },
      { property: "og:title", content: "Dashboard — NEXORA Logistics" },
      { property: "og:description", content: "Track your NEXORA freight shipments and delivery estimates." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardOverview,
});

function DashboardOverview() {
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
  const active = rows.filter((r) => r.status !== "delivered" && r.status !== "exception");
  const delivered = rows.filter((r) => r.status === "delivered");

  return (
    <PortalShell kind="Customer portal" nav={customerNav} email={user?.email}>
      <PortalHeading
        title="Overview"
        subtitle={user?.email ? `Signed in as ${user.email}` : undefined}
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard/shipments">View all shipments</Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-px bg-border sm:grid-cols-3">
        <StatCard label="Total shipments" value={rows.length} />
        <StatCard label="In motion" value={active.length} hint="Not yet delivered" />
        <StatCard label="Delivered" value={delivered.length} />
      </div>

      <div className="mt-10">
        <p className="eyebrow">Recent activity</p>
        <h2 className="mt-2 text-2xl uppercase">Latest shipments</h2>

        {q.isLoading ? (
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No shipments yet"
              description="Shipments booked under your account will appear here with live tracking milestones."
              action={
                <Button asChild>
                  <Link to="/quote">Request a quote</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-px bg-border sm:grid-cols-2">
            {rows.slice(0, 4).map((s) => (
              <Link
                key={s.id}
                to="/dashboard/shipments/$id"
                params={{ id: s.id }}
                className="bg-background p-5 transition-colors hover:bg-secondary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{s.tracking_number}</p>
                    <p className="mt-2 text-sm">
                      {s.origin} → {s.destination}
                    </p>
                  </div>
                  <StatusBadge status={s.status as ShipmentStatus} />
                </div>
                <div className="mt-4">
                  <ProgressBar value={statusProgress(s.status as ShipmentStatus)} />
                </div>
                <p className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <Package className="h-3 w-3" /> ETA {formatDate(s.estimated_delivery)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
