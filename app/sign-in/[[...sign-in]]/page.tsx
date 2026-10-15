import type { Metadata } from "next";

import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata: Metadata = {
  title: "Sign in · Fack API's",
  description:
    "Sign in to your Fack API Studio workspace and keep building against a live mock backend.",
};

/**
 * Custom Clerk sign-in page, styled with the app's design system.
 * The optional catch-all segment keeps Clerk's multi-step path routing working.
 */
export default function SignInPage(): React.JSX.Element {
  return <AuthScreen mode="sign-in" />;
}
