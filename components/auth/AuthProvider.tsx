import * as React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";

/**
 * Scopes Clerk to the routes that actually render auth UI.
 *
 * The public marketing page is fully static and links to `/dashboard` rather
 * than reading session state, so it must not mount Clerk: doing so ships the
 * browser SDK, the themed sign-in bundles, and — on a Clerk development
 * instance — a cross-origin handshake redirect, none of which the landing page
 * needs. Authenticated routes and the auth screens opt in here instead.
 */
export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => (
  <ClerkProvider
    appearance={{ theme: shadcn }}
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
    signInFallbackRedirectUrl="/dashboard"
    signUpFallbackRedirectUrl="/dashboard"
  >
    {children}
  </ClerkProvider>
);
