import { SiteFooter } from "@/components/shared/site-footer";
import { SiteNavbar } from "@/components/shared/site-navbar";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteNavbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
