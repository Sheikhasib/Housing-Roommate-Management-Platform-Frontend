import { APP_NAME } from "@/lib/constants";

// Placeholder: the real home page is built in spec 03-public-rooms.
export default function HomePage() {
  return (
    <div className="min-h-[50vh]">
      <h1 className="sr-only">{APP_NAME}</h1>
    </div>
  );
}
