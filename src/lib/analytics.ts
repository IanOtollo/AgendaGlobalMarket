// Cookieless analytics (Umami). Does nothing unless NEXT_PUBLIC_UMAMI_SRC and NEXT_PUBLIC_UMAMI_ID are set.
// Events: search_submitted, category_selected, filter_changed, location_permission_{shown,granted,denied},
// pro_card_clicked, pro_viewed, booking_started, booking_requested, pro_apply_clicked, contact_form_sent.
export type EventName =
  | "search_submitted" | "category_selected" | "filter_changed"
  | "location_permission_shown" | "location_permission_granted" | "location_permission_denied"
  | "pro_card_clicked" | "pro_viewed" | "booking_started" | "booking_requested" | "pro_apply_clicked" | "contact_form_sent";

declare global { interface Window { umami?: { track: (name: string, data?: Record<string, unknown>) => void } } }

export function track(name: EventName, data?: Record<string, string | number | boolean>) {
  try { window.umami?.track(name, data); } catch {}
}
