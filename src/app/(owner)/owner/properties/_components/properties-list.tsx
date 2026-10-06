"use client";

import Link from "next/link";
import { Building2, Plus, ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { TextFilter } from "@/components/shared/text-filter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useOwnerProfile } from "@/hooks/useProfile";
import { useRole } from "@/hooks/useRole";
import { useUrlState } from "@/hooks/useUrlState";
import { hasPermission } from "@/lib/permissions";
import { useOwnedProperties } from "../_hooks/use-property-queries";
import { OwnedPropertyCard } from "./owned-property-card";
import { OwnedPropertyCardSkeleton } from "./properties-skeleton";

function CreateButton({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <Button disabled>
        <Plus aria-hidden="true" />
        Create property
      </Button>
    );
  }
  return (
    <Button asChild>
      <Link href="/owner/properties/new">
        <Plus aria-hidden="true" />
        Create property
      </Link>
    </Button>
  );
}

export function PropertiesList() {
  const { role } = useRole();
  const { page, limit, getParam } = useUrlState({ defaultLimit: 9 });
  const city = getParam("city");
  const isManager = role === "PROPERTY_MANAGER";
  const canCreate = hasPermission(role, "properties.createDelete");

  const owner = useOwnerProfile(canCreate);
  const approved = owner.data?.verificationStatus === "APPROVED";
  const query = useOwnedProperties(isManager, role !== null, { page, limit, city });

  const rows = query.data?.rows ?? [];
  const loading = role === null || query.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description={
          isManager
            ? "The properties an owner has assigned to you."
            : "Your listings. Open one to edit it, manage photos and assign managers."
        }
        action={canCreate ? <CreateButton enabled={approved} /> : null}
      />

      {canCreate && owner.data && !approved ? (
        <Alert role="status">
          <ShieldAlert aria-hidden="true" />
          <AlertDescription>
            Your owner account is {owner.data.verificationStatus.toLowerCase()}. You can create
            properties once an admin approves it.{" "}
            <Link href="/owner/profile" className="font-medium text-primary underline">
              Go to verification
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {!isManager ? <TextFilter param="city" label="City" placeholder="Any city" /> : null}

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : loading ? (
        <div
          className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <OwnedPropertyCardSkeleton key={index} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <EmptyState
            icon={Building2}
            title={
              city
                ? "No properties match this city"
                : isManager
                  ? "No properties assigned yet"
                  : "No properties yet"
            }
            description={
              city
                ? "Try a different city."
                : isManager
                  ? "No properties assigned yet. Ask an owner to assign you by email."
                  : "Create your first property to start listing rooms."
            }
            action={!city && canCreate ? <CreateButton enabled={approved} /> : null}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((property) => (
              <OwnedPropertyCard key={property.id} property={property} />
            ))}
          </div>
          {query.data ? <Pagination meta={query.data.meta} limitOptions={[9, 18, 36]} /> : null}
        </div>
      )}
    </div>
  );
}
