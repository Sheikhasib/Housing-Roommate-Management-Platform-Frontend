import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMembershipForTenant } from "@/lib/api/roommateServer";
import { MembershipDetailView } from "./_components/membership-detail-view";

export const metadata: Metadata = {
  title: "Roommate membership",
  robots: { index: false },
};

export default async function MembershipPage({
  params,
}: PageProps<"/dashboard/roommates/memberships/[membershipId]">) {
  const { membershipId } = await params;
  const membership = await getMembershipForTenant(membershipId);
  if (!membership) notFound();

  return <MembershipDetailView membership={membership} />;
}
