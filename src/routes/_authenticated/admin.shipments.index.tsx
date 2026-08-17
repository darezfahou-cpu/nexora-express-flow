import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { PortalShell, PortalHeading, EmptyState } from "@/components/portal-shell";
import { adminNav } from "@/components/portal-nav";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, serviceLabel, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/admin/shipments/")({
  head: () => ({
    meta: [
      { title: "All shipments — NEXORA Admin" },
      { name: "description", content: "Search and manage every shipment in the NEXORA network." },
      { property: "og:title", content: "All shipments — NEXORA Admin" },
      { property: "og:description", content: "Search and manage every shipment in the NEXORA network." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminShipments,
});

function AdminShipments() {
  const { user } = useSession();
  const [term, setTerm] = useState("");

  const q = useQuery({
    queryKey: ["admin-shipments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const needle = term.trim().toLowerCase();
  const rows = (q.data ?? []).filter((s) =>
    !needle
      ? true
      : [s.tracking_number, s.origin, s.destination, s.recipient_name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle),
  );

  return (
    <PortalShell kind="Admin console" nav={adminNav} email={user?.email}>
      <PortalHeading
        title="Shipments"
        subtitle="Every consignment across the network."
        action={
          <Button asChild>
            <Link to="/admin/shipments/new">Create shipment</Link>
          </Button>
        }
      />

      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search tracking number, route or recipient"
        className="mt-6 max-w-md rounded-none"
      />

      {q.isLoading ? (
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No shipments" description="Create the first shipment to start tracking it." />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-border">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="p-3">Tracking</th>
                <th className="p-3">Route</th>
                <th className="p-3">Service</th>
                <th className="p-3">Recipient</th>
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
                  <td className="p-3 text-muted-foreground">{s.recipient_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(s.estimated_delivery)}</td>
                  <td className="p-3">
                    <StatusBadge status={s.status as ShipmentStatus} />
                  </td>
                  <td className="p-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/shipments/$id" params={{ id: s.id }}>
                        Manage
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
