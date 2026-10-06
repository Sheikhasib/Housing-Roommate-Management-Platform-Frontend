import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { UsersList } from "./_components/users-list";
import { UsersListSkeleton } from "./_components/users-list-skeleton";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false },
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Search the directory, block or unblock accounts and manage roles." />
      <Suspense fallback={<UsersListSkeleton />}>
        <UsersList />
      </Suspense>
    </div>
  );
}
