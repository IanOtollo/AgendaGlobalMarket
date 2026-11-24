import { BarChart3, CalendarDays, ClipboardList, HardHat, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; keywords: string; blurb: string };
export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, keywords: "home overview today summary", blurb: "Today at a glance" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/work-orders", label: "Work Orders", icon: ClipboardList, keywords: "jobs tasks invoices billing payments", blurb: "Every job, from call to payment" },
      { href: "/admin/schedule", label: "Schedule", icon: CalendarDays, keywords: "calendar week availability dispatch", blurb: "Who is where this week" },
      { href: "/admin/reports", label: "Reports", icon: BarChart3, keywords: "invoices balances outstanding payments productivity performance export csv revenue analysis", blurb: "Invoices, balances and worker productivity" },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/team", label: "Team", icon: HardHat, keywords: "workers staff employees providers technicians resign hire", blurb: "Profiles and staff management" },
      { href: "/admin/customers", label: "Customers", icon: Users, keywords: "clients contacts phone", blurb: "Customer records" },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings, keywords: "business name phone number admin line reset", blurb: "Business details and contact line" },
    ],
  },
];

// Flat list, used by the global search.
export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
