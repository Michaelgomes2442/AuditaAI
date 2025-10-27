'use client';

import { OrganizationSetup } from "@/components/organization-setup";
import { Toaster } from "sonner";

export default function OrganizationSetupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <Toaster position="top-center" />
      <OrganizationSetup />
    </main>
  );
}