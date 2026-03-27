import { PublicLanding } from "@/components/public-landing";
import { redirectSignedInUserHome } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  await redirectSignedInUserHome();

  return <PublicLanding />;
}
