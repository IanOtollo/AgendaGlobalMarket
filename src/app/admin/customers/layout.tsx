import type { Metadata } from "next";

export const metadata: Metadata = { title: "Customers · Admin" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
