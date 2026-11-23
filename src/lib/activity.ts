import { uid } from "./utils";
import type { Activity } from "./types";

export const activity = (text: string): Activity => ({ id: uid("a"), at: new Date().toISOString(), text });
