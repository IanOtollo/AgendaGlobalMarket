export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "pro";

export function uniqueSlug(base: string, taken: Set<string>) {
  let slug = slugify(base), n = 2;
  while (taken.has(slug)) slug = `${slugify(base)}-${n++}`;
  taken.add(slug);
  return slug;
}
