"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  clubName: z.string().optional(),
  role: z.string().optional(),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileDialog({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      clubName: "Fack API Engineering Club",
      role: "Lead Organizer",
      website: "",
    },
  });

  // Sync state if user loads after mount
  React.useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        clubName:
          (user.unsafeMetadata?.clubName as string) ||
          (user.publicMetadata?.clubName as string) ||
          "Fack API Engineering Club",
        role:
          (user.unsafeMetadata?.role as string) ||
          (user.publicMetadata?.role as string) ||
          "Lead Organizer",
        website:
          (user.unsafeMetadata?.website as string) ||
          (user.publicMetadata?.website as string) ||
          "",
      });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSaving(true);
    try {
      // 1. Update unsafeMetadata for the club settings
      const newUnsafeMetadata = {
        clubName: data.clubName,
        role: data.role,
        website: data.website,
      };

      // Use updateMetadata instead of update({ unsafeMetadata }) to resolve deprecation warning
      await user.updateMetadata({ unsafeMetadata: newUnsafeMetadata });

      // 2. Try to update native firstName / lastName separately
      const nameUpdates: { firstName?: string; lastName?: string } = {};
      let nameChanged = false;
      if (data.firstName !== user.firstName) {
        nameUpdates.firstName = data.firstName;
        nameChanged = true;
      }
      if (data.lastName !== user.lastName) {
        nameUpdates.lastName = data.lastName;
        nameChanged = true;
      }

      if (nameChanged) {
        try {
          await user.update(nameUpdates);
          toast.success("Profile updated successfully");
        } catch (nameError) {
          const err = nameError as Record<string, unknown>;
          const errors = err.errors as
            Array<{ longMessage?: string; message?: string }> | undefined;
          const errorMessage =
            errors?.[0]?.longMessage ||
            errors?.[0]?.message ||
            "Failed to update profile";

          if (errorMessage.includes("first_name is not a valid parameter")) {
            toast.warning(
              "Saved custom settings, but could not save Name. Please enable 'Name' under Personal Information in your Clerk Dashboard.",
              { duration: 6000 },
            );
          } else {
            toast.error(errorMessage);
            console.error("Clerk Update Error:", nameError);
          }
        }
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update profile metadata");
      console.error("Clerk Metadata Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger
        render={React.isValidElement(children) ? children : undefined}
      >
        {!React.isValidElement(children) ? children : null}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your personal profile and club account information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6 py-4"
          >
            <div className="space-y-4">
              <h4 className="text-sm leading-none font-medium">
                Personal Information
              </h4>
              <div className="flex items-center gap-6">
                {user?.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="h-16 w-16 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary/10 text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                    {user?.firstName?.charAt(0) || "U"}
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Profile Picture</h3>
                  <p className="text-muted-foreground text-xs">
                    Upload via Clerk is currently limited in custom UI.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" disabled>
                      Upload new
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem className="sm:col-span-2">
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      value={user?.primaryEmailAddress?.emailAddress || ""}
                      disabled
                    />
                  </FormControl>
                  <FormDescription>
                    Email address cannot be changed directly.
                  </FormDescription>
                </FormItem>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm leading-none font-medium">
                Club Account Settings
              </h4>

              <FormField
                control={form.control}
                name="clubName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Website (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Note: Saving metadata requires a backend API route. UI
                      only for demo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
