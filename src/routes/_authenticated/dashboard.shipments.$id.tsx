import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { PortalShell, PortalHeading, ProgressBar, EmptyState } from "@/components/portal-shell";
import { customerNav } from "@/components/portal-nav";
import { StatusBadge } from "@/components/status-badge";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { formatDate, serviceLabel, statusProgress, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/dashboard/shipments/$id")({
  head: () => ({
    meta: [
      { title: "Shipment detail — NEXORA Logistics" },
      { name: "description", content: "Milestone-by-milestone tracking history for your NEXORA shipment." },
      { property: "og:title", content: "Shipment detail — NEXORA Logistics" },
      { property: "og:description", content: "Milestone-by-milestone tracking history for your shipment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ShipmentDetail,
});

function ShipmentDetail() {
  const { id } = Route.useParams();
  const { user } = useSession();

  const q = useQuery({
    queryKey: ["my-shipment", id],
    queryFn: async () => {
      const { data: shipment, error } = await supabase.from("shipments").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!shipment) return null;
      const { data: events, error: eventsError } = await supabase
        .from("shipment_events")
        .select("*")
        .eq("shipment_id", id)
        .order("occurred_at", { ascending: false });
      if (eventsError) throw eventsError;
      return { shipment, events: events ?? [] };
    },
  });

  const s = q.data?.shipment;

  return (
    <PortalShell kind="Customer portal" nav={customerNav} email={user?.email}>
      <Link
        to="/dashboard/shipments"
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> My shipments
      </Link>

      {q.isLoading ? (
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Loading…</p>
      ) : !s ? (
        <div className="mt-6">
          <EmptyState title="Shipment not found" description="This shipment is unavailable or not linked to your account." />
        </div>
      ) : (
        <>
          <div className="mt-5">
            <PortalHeading
              title={s.tracking_number}
              subtitle={`${s.origin} → ${s.destination}`}
              action={<StatusBadge status={s.status as ShipmentStatus} />}
            />
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="panel p-6">
              <p className="eyebrow">Consignment</p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["Service", serviceLabel(s.service_level)],
                  ["Cargo", s.cargo_type ?? "—"],
                  ["Weight", s.weight_kg ? `${s.weight_kg} kg` : "—"],
                  ["Pieces", String(s.pieces)],
                  ["Current location", s.current_location ?? "—"],
                  ["Estimated delivery", formatDate(s.estimated_delivery)],
                  ["Recipient", s.recipient_name ?? "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
              {s.description && <p className="mt-5 text-sm text-muted-foreground">{s.description}</p>}
              <div className="mt-6">
                <ProgressBar value={statusProgress(s.status as ShipmentStatus)} />
              </div>
            </div>

            <div>
              <p className="eyebrow">Tracking</p>
              <h2 className="mt-2 text-2xl uppercase">Timeline</h2>
              <div className="mt-6">
                <TrackingTimeline
                  events={(q.data?.events ?? []).map((e) => ({
                    id: e.id,
                    status: e.status as ShipmentStatus,
                    location: e.location,
                    note: e.note,
                    occurred_at: e.occurred_at,
                  }))}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}
