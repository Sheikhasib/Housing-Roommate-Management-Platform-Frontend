import type { Metadata } from "next";

import { getHomeData } from "@/lib/api/home";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { CtaBand } from "./_components/cta-band";
import { FaqSection } from "./_components/faq-section";
import { FeaturedPropertiesSection } from "./_components/featured-properties-section";
import { FeaturedRoomsSection } from "./_components/featured-rooms-section";
import { HeroSection } from "./_components/hero-section";
import { HowItWorksSection } from "./_components/how-it-works-section";
import { PopularCitiesSection } from "./_components/popular-cities-section";
import { RoomTypeSection } from "./_components/room-type-section";
import { StatsStrip } from "./_components/stats-strip";
import { WhyChooseUsSection } from "./_components/why-choose-us-section";

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME}: ${APP_TAGLINE}` },
  description:
    "Browse real rooms, beds and flats, book a viewing and pay your deposit online. Owners list their properties and manage rent, leases and maintenance in one place.",
};

export default async function HomePage() {
  const {
    heroRooms,
    cities,
    stats,
    roomTypeCounts,
    featuredRooms,
    popularCities,
    featuredProperties,
  } = await getHomeData();

  return (
    <>
      <HeroSection
        rooms={heroRooms.ok ? heroRooms.data : []}
        cities={cities.ok ? cities.data : []}
      />
      <StatsStrip stats={stats} cities={cities} />
      <RoomTypeSection counts={roomTypeCounts} />
      <FeaturedRoomsSection rooms={featuredRooms} />
      <PopularCitiesSection cities={popularCities} />
      <FeaturedPropertiesSection properties={featuredProperties} />
      <HowItWorksSection />
      <WhyChooseUsSection />
      <FaqSection />
      <CtaBand />
    </>
  );
}
