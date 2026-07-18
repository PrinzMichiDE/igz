import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/articles", label: "Tests & Artikel" },
  { href: "/admin/experiences", label: "Nutzererfahrungen" },
];

export function AdminNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? currentPath === "/admin"
            : currentPath.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
