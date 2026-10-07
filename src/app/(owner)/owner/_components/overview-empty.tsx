import Link from "next/link";
import { Building2, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function OverviewEmpty({ kind }: { kind: "owner" | "manager" }) {
  return (
    <Card>
      {kind === "owner" ? (
        <EmptyState
          icon={Building2}
          title="Add your first property"
          description="Your occupancy, workload and earnings appear here once you have a property."
          action={
            <Button asChild>
              <Link href="/owner/properties/new">
                <Plus aria-hidden="true" />
                Add your first property
              </Link>
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Building2}
          title="No properties assigned yet"
          description="When an owner assigns you to a property, its numbers appear here."
        />
      )}
    </Card>
  );
}
