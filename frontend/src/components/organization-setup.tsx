import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const organizationSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  role: z.enum(["ARCHITECT", "AUDITOR", "WITNESS"]),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

export function OrganizationSetup() {
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      role: "ARCHITECT",
    },
  });

  async function onSubmit(data: OrganizationFormValues) {
    try {
      const response = await fetch("/api/organizations/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create organization");
      }

      toast.success("Organization created!", {
        description: "You can now start using AuditaAI.",
      });

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Error", {
        description: "Failed to create organization. Please try again.",
      });
    }
  }

  return (
    <div className="mx-auto max-w-[600px] p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to AuditaAI</h1>
        <p className="text-sm text-muted-foreground">
          Let's get started by setting up your organization.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="admin@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Role</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="ARCHITECT">Architect</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="WITNESS">Witness</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Create Organization
          </Button>
        </form>
      </Form>
    </div>
  );
}