import { digits } from "./utils";

/** WhatsApp link to the office line with a prefilled message. Empty string when no line is configured. */
export const waUrl = (phone: string, text: string) => (phone ? `https://wa.me/${digits(phone)}?text=${encodeURIComponent(text)}` : "");
