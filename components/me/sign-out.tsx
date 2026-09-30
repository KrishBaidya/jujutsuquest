"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { btnClass } from "@/components/ui";

export function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signOut();
          router.replace("/onboarding");
          router.refresh();
        })
      }
      className={btnClass("ghost", "sm")}
    >
      <LogOut className="size-4" aria-hidden />
      {pending ? "Leaving…" : "Sign out"}
    </button>
  );
}
