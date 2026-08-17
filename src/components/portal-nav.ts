import { LayoutDashboard, Package, Plus, Radio, Users } from "lucide-react";
import type { PortalNavItem } from "@/components/portal-shell";

export const customerNav: PortalNavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/shipments", label: "My shipments", icon: Package },
];

export const adminNav: PortalNavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/shipments", label: "Shipments", icon: Package },
  { to: "/admin/shipments/new", label: "New shipment", icon: Plus },
  { to: "/admin/tracking", label: "Tracking feed", icon: Radio },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/dashboard", label: "Customer portal", icon: LayoutDashboard },
];
