/**
 * Sets page-level SEO meta tags: title, description, robots.
 * Call inside useEffect on each page.
 */
export function setPageMeta({
  title,
  description,
  canonical,
}: {
  title: string;
  description: string;
  canonical?: string;
}) {
  document.title = title;

  // Meta description
  let descEl = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );
  if (!descEl) {
    descEl = document.createElement("meta");
    descEl.name = "description";
    document.head.appendChild(descEl);
  }
  descEl.content = description;

  // Robots — ensure index, follow on every page
  let robotsEl = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!robotsEl) {
    robotsEl = document.createElement("meta");
    robotsEl.name = "robots";
    document.head.appendChild(robotsEl);
  }
  robotsEl.content = "index, follow";

  // Canonical
  if (canonical) {
    let canonEl = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonEl) {
      canonEl = document.createElement("link");
      canonEl.rel = "canonical";
      document.head.appendChild(canonEl);
    }
    canonEl.href = canonical;
  }
}
