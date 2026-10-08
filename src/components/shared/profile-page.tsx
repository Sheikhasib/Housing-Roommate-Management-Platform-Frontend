"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AccountSection } from "@/components/shared/account-section";
import { ErrorState } from "@/components/shared/error-state";
import { ManagerProfileForm } from "@/components/shared/manager-profile-form";
import { OwnerCompanyForm } from "@/components/shared/owner-company-form";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileHeader } from "@/components/shared/profile-header";
import { ProfileSkeleton } from "@/components/shared/profile-skeleton";
import { TenantPreferencesForm } from "@/components/shared/tenant-preferences-form";
import { OwnerVerification, TenantVerification } from "@/components/shared/verification-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetMe } from "@/hooks/useGetMe";
import { useManagerProfile, useOwnerProfile, useTenantProfile } from "@/hooks/useProfile";
import { ApiError } from "@/lib/api/apiError";
import type { Role } from "@/validation/enums";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.errors[0]?.message || error.message;
  return "We could not load your profile. Try again";
}

/** Toasts a failed load once per error. */
function useLoadErrorToast(error: unknown) {
  useEffect(() => {
    if (error) toast.error(errorMessage(error));
  }, [error]);
}

function TabSkeleton() {
  return <Skeleton className="h-72 w-full rounded-xl" aria-label="Loading" />;
}

interface RoleQuery<T> {
  data: T | undefined;
  isPending: boolean;
  error: unknown;
  refetch: () => unknown;
}

/** Loading, error and ready states for one role profile query. */
function QueryGate<T>({ query, children }: { query: RoleQuery<T>; children: (data: T) => React.ReactNode }) {
  if (query.isPending) return <TabSkeleton />;
  if (query.error || !query.data) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  return <>{children(query.data)}</>;
}

/** The tab named in `?tab=`, when this role has it; otherwise the first tab. */
function pickTab(value: string | null, allowed: readonly string[]): string {
  return value && allowed.includes(value) ? value : "account";
}

export function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const tabParam = useSearchParams().get("tab");
  const me = useGetMe();
  const role: Role | undefined = me.data?.role;

  const tenant = useTenantProfile(role === "TENANT");
  const owner = useOwnerProfile(role === "OWNER");
  const manager = useManagerProfile(role === "PROPERTY_MANAGER");

  useLoadErrorToast(me.error);
  useLoadErrorToast(tenant.error);
  useLoadErrorToast(owner.error);
  useLoadErrorToast(manager.error);

  if (me.isPending) return <ProfileSkeleton />;
  if (me.error || !me.data) {
    return <ErrorState error={me.error} onRetry={() => void me.refetch()} />;
  }

  const user = me.data;
  const verificationStatus =
    role === "TENANT"
      ? tenant.data?.verificationStatus
      : role === "OWNER"
        ? owner.data?.verificationStatus
        : undefined;

  const account = <AccountSection user={{ name: user.name, email: user.email }} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your account details and how others see you." />
      <ProfileHeader
        name={user.name}
        email={user.email}
        imageUrl={user.imageUrl}
        role={user.role}
        verificationStatus={verificationStatus}
      />

      {role === "TENANT" ? (
        <Tabs defaultValue={pickTab(tabParam, ["account", "preferences", "verification"])}>
          <TabsList className="h-10 w-full sm:w-fit">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="pt-4">
            {account}
          </TabsContent>
          <TabsContent value="preferences" className="pt-4">
            <QueryGate query={tenant}>{(profile) => <TenantPreferencesForm profile={profile} />}</QueryGate>
          </TabsContent>
          <TabsContent value="verification" className="pt-4">
            <QueryGate query={tenant}>{(profile) => <TenantVerification profile={profile} />}</QueryGate>
          </TabsContent>
        </Tabs>
      ) : role === "OWNER" ? (
        <Tabs defaultValue={pickTab(tabParam, ["account", "company", "verification"])}>
          <TabsList className="h-10 w-full sm:w-fit">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="pt-4">
            {account}
          </TabsContent>
          <TabsContent value="company" className="pt-4">
            <QueryGate query={owner}>{(profile) => <OwnerCompanyForm profile={profile} />}</QueryGate>
          </TabsContent>
          <TabsContent value="verification" className="pt-4">
            <QueryGate query={owner}>{(profile) => <OwnerVerification profile={profile} />}</QueryGate>
          </TabsContent>
        </Tabs>
      ) : role === "PROPERTY_MANAGER" ? (
        <Tabs defaultValue="account">
          <TabsList className="h-10 w-full sm:w-fit">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="contact">Contact details</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="pt-4">
            {account}
          </TabsContent>
          <TabsContent value="contact" className="pt-4">
            <QueryGate query={manager}>{(profile) => <ManagerProfileForm profile={profile} />}</QueryGate>
          </TabsContent>
        </Tabs>
      ) : (
        account
      )}
    </div>
  );
}
