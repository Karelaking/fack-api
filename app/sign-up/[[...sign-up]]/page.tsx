import type { Metadata } from "next";

import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata: Metadata = {
  title: "Create account · Fack API's",
  description:
    "Create a Fack API Studio account and start building against a realistic mock backend in minutes.",
};

/**
 * Custom Clerk sign-up page, styled with the app's design system.
 * The optional catch-all segment keeps Clerk's multi-step path routing working.
 */
export default function SignUpPage(): React.JSX.Element {
  return <AuthScreen mode="sign-up" />;
}
