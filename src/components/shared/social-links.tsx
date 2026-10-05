import { SocialIcon } from "@/components/shared/social-icons";
import { SOCIAL_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const socialClass =
  "inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground";

/** Social icons from constants. Entries without a URL stay plain icons: never an invented link. */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {SOCIAL_LINKS.map((social) => (
        <li key={social.name}>
          {social.href ? (
            <a
              href={social.href}
              aria-label={social.name}
              {...(social.href.startsWith("mailto:")
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
              className={cn(
                socialClass,
                "transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
              )}
            >
              <SocialIcon name={social.name} />
            </a>
          ) : (
            <span role="img" aria-label={social.name} className={cn(socialClass, "cursor-default")}>
              <SocialIcon name={social.name} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
