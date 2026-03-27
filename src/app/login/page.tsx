import { PublicLanding } from "@/components/public-landing";
import { redirectSignedInUserHome } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await redirectSignedInUserHome();

  return <PublicLanding />;
}
