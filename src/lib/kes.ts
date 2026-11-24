// Shared by server pages and client components. Keep it out of any "use client" file: a server page cannot call a
// function that is exported from a client module.
export const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
