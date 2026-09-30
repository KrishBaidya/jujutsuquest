import { listHostels } from "@/lib/queries/session";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  return <OnboardingForm hostels={await listHostels()} />;
}
