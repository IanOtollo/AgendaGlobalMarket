import { BrickWall, Droplets, Hammer, PaintRoller, Zap, type LucideIcon } from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Plumbing: Droplets, Carpentry: Hammer, Masonry: BrickWall, Electrical: Zap, Painting: PaintRoller,
};
