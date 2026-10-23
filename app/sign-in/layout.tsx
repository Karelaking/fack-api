import * as React from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";

/**
 * Clerk scopes the auth UI to these routes, so the sign-in screen mounts the
 * provider here instead of in the root layout (see AuthProvider).
 */
export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}
