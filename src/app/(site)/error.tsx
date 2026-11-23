"use client";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ds/button";
import { Container, Section } from "@/components/ds/primitives";

// Shown inside the site header and footer if a page cannot load (for example the database is briefly unreachable).
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <Section>
      <Container className="max-w-xl text-center">
        <h1 className="text-h1">This page could not load</h1>
        <p className="mt-4 text-lg text-muted-foreground">It is on our side, not yours. Please try again in a moment.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="accent" size="lg" onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary" size="lg">Go to the home page</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
