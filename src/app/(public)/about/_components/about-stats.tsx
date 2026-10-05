import { getHomeData } from "@/lib/api/home";
import { StatsStrip } from "../../_components/stats-strip";

/** The same cached numbers as Home, so the two pages never disagree. */
export async function AboutStats() {
  const { stats, cities } = await getHomeData();
  return <StatsStrip stats={stats} cities={cities} />;
}
