"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteOwnProperty } from "@/lib/api/ownerProperty";
import { errorMessage, propertiesKey } from "../../_hooks/use-property-queries";

export function DeleteProperty({ propertyId, title }: { propertyId: string; title: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const confirmDelete = async () => {
    try {
      const response = await deleteOwnProperty(propertyId);
      toast.success(response.message);
      queryClient.removeQueries({ queryKey: ["property", propertyId] });
      void queryClient.invalidateQueries({ queryKey: propertiesKey() });
      router.replace("/owner/properties");
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <ConfirmDialog
      destructive
      title={`Delete ${title}?`}
      description="The property disappears from your lists. Its units, rooms and images are not changed or deleted."
      confirmLabel="Delete property"
      onConfirm={confirmDelete}
      trigger={
        <Button variant="outline" className="text-error-text">
          <Trash2 aria-hidden="true" />
          Delete property
        </Button>
      }
    />
  );
}
