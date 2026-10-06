import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RoleGuard } from "@/components/shared/can";
import { PageHeader } from "@/components/shared/page-header";
import { RoomCreateForm } from "./_components/room-create-form";

export const metadata: Metadata = {
  title: "Create room",
  robots: { index: false },
};

export default function NewRoomPage() {
  return (
    <RoleGuard roles={["OWNER"]}>
      <div className="space-y-6">
        <Link
          href="/owner/rooms"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All rooms
        </Link>
        <PageHeader
          title="Create room"
          description="Add a room to one of your properties."
        />
        <RoomCreateForm />
      </div>
    </RoleGuard>
  );
}
