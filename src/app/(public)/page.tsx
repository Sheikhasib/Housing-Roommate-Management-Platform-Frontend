import type { Metadata } from "next";

import { getHomeData } from "@/lib/api/home";
import { APP_NAME } from "@/lib/constants";
import { FeaturedRoomsSection } from "./_components/featured-rooms-section";
import { HeroSection } from "./_components/hero-section";
import { RoomTypeSection } from "./_components/room-type-section";
import { StatsStrip } from "./_components/stats-strip";

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME}: find a room and a roommate` },
  description:
    "Browse real rooms, beds and flats, book a viewing and pay your deposit online. Owners list their properties and manage rent, leases and maintenance in one place.",
};

export default async function HomePage() {
  const { heroRooms, cities, stats, roomTypeCounts, featuredRooms } = await getHomeData();

  return (
    <>
      <HeroSection
        rooms={heroRooms.ok ? heroRooms.data : []}
        cities={cities.ok ? cities.data : []}
      />
      <StatsStrip stats={stats} cities={cities} />
      <RoomTypeSection counts={roomTypeCounts} />
      <FeaturedRoomsSection rooms={featuredRooms} />
    </>
  );
}
