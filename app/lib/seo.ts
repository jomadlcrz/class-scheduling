export const SITE_CONFIG = {
  name: "GWC Class Scheduling",
  shortName: "GWC Schedule",
  domain: "gwc-class-scheduling.app",
  /** Canonical custom domain URL — configurable via VITE_SITE_URL env, defaults to official domain */
  siteUrl:
    (typeof import.meta !== "undefined" &&
      (import.meta.env?.VITE_SITE_URL as string | undefined)) ||
    "https://www.gwc-class-scheduling.app",
  tagline: "Build conflict-free academic timetables in minutes.",
  description:
    "Build conflict-free academic timetables in minutes. GWC Class Scheduling turns rooms, faculty, and sections into a clean, published weekly plan.",
  institution: "Golden West Colleges, Inc.",
  locale: "en_US",
  logoUrl: "/images/logos/gwc-logo.avif",
  logoWhiteUrl: "/images/logos/gwc-logo-white.avif",
  ogImageUrl: "/images/covers/home-cover.avif",
  address: {
    street: "San Jose Drive",
    city: "Alaminos",
    region: "Pangasinan",
    country: "PH",
  },
  social: {
    facebook: "https://www.facebook.com/gwcalaminosofficial",
  },
} as const;

/** Public sitelinks navigation hierarchy for Google Rich Snippets & SiteNavigationElement (excludes private/authenticated areas) */
export const SITELINKS_NAV = [
  {
    name: "Portal Log In",
    path: "/login",
    description:
      "Secure portal login for students, faculty members, and academic administrators.",
  },
  {
    name: "Help Center",
    path: "/help",
    description:
      "Guides, documentation, and support resources for class scheduling and timetable management.",
  },
  {
    name: "Frequently Asked Questions",
    path: "/faqs",
    description:
      "Answers to common questions regarding academic timetables, account access, and scheduling policies.",
  },
  {
    name: "Contact Us",
    path: "/contact-us",
    description:
      "Official contact details and campus location for Golden West Colleges scheduling administration.",
  },
  {
    name: "Privacy Policy",
    path: "/privacy-policy",
    description:
      "Institutional privacy guidelines and data protection policies for GWC Class Scheduling.",
  },
  {
    name: "Terms of Use",
    path: "/terms-of-use",
    description:
      "Terms of service, system rules, and acceptable usage policies for the scheduling platform.",
  },
] as const;

/** Normalizes a relative path into an absolute canonical URL on the custom domain */
export function getCanonicalUrl(path = "/"): string {
  const base = SITE_CONFIG.siteUrl.replace(/\/+$/, "");
  if (!path || path === "/") return `${base}/`;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/** Generates the Schema.org WebSite JSON-LD with Sitelinks Searchbox */
export function getWebSiteSchema() {
  const canonicalRoot = getCanonicalUrl("/");
  return {
    "@type": "WebSite",
    "@id": `${canonicalRoot}#website`,
    name: SITE_CONFIG.name,
    alternateName: [
      SITE_CONFIG.domain,
      "GWC Scheduling",
      "Golden West Colleges Class Scheduling",
      "GWC Class Timetables",
    ],
    url: canonicalRoot,
    description: SITE_CONFIG.description,
    publisher: {
      "@id": `${canonicalRoot}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${canonicalRoot}faqs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-US",
  };
}

/** Generates the Schema.org EducationalOrganization JSON-LD */
export function getOrganizationSchema() {
  const canonicalRoot = getCanonicalUrl("/");
  return {
    "@type": "EducationalOrganization",
    "@id": `${canonicalRoot}#organization`,
    name: SITE_CONFIG.institution,
    alternateName: "GWC",
    url: canonicalRoot,
    logo: {
      "@type": "ImageObject",
      "@id": `${canonicalRoot}#logo`,
      url: getCanonicalUrl(SITE_CONFIG.logoUrl),
      caption: `${SITE_CONFIG.institution} Logo`,
    },
    image: getCanonicalUrl(SITE_CONFIG.ogImageUrl),
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.region,
      addressCountry: SITE_CONFIG.address.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Academic Registrar & Scheduling Office",
      url: getCanonicalUrl("/contact-us"),
    },
    sameAs: [SITE_CONFIG.social.facebook].filter(Boolean),
  };
}

/** Generates the Schema.org SiteNavigationElement / ItemList JSON-LD for Google Sitelinks */
export function getSiteNavigationSchema() {
  const canonicalRoot = getCanonicalUrl("/");
  return {
    "@type": "ItemList",
    "@id": `${canonicalRoot}#sitelinks`,
    name: "GWC Class Scheduling Navigation",
    description: "Primary academic scheduling portal destinations and resources",
    numberOfItems: SITELINKS_NAV.length,
    itemListElement: SITELINKS_NAV.map((item, index) => ({
      "@type": "SiteNavigationElement",
      position: index + 1,
      name: item.name,
      description: item.description,
      url: getCanonicalUrl(item.path),
    })),
  };
}

/** Generates the Schema.org WebApplication JSON-LD */
export function getWebApplicationSchema() {
  const canonicalRoot = getCanonicalUrl("/");
  return {
    "@type": "WebApplication",
    "@id": `${canonicalRoot}#application`,
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.shortName,
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    description: SITE_CONFIG.description,
    url: canonicalRoot,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "PHP",
    },
  };
}

/**
 * Generates the complete JSON-LD structured data graph for the home / root page.
 * This links WebSite, EducationalOrganization, SiteNavigationElement, and WebApplication
 * in a single unified graph that Google search engines parse for rich snippets and sitelinks.
 */
export function getCompleteStructuredDataGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      getWebSiteSchema(),
      getOrganizationSchema(),
      getSiteNavigationSchema(),
      getWebApplicationSchema(),
    ],
  };
}

export interface SeoMetaOptions {
  /** Page title. If omitted, uses default site title */
  title?: string;
  /** Whether to append the brand suffix " — GWC Class Scheduling" (default: true if title provided, false for home) */
  brandSuffix?: boolean;
  /** Page description for Google snippet */
  description?: string;
  /** Route path (e.g. "/login", "/faqs") to generate canonical URL */
  path?: string;
  /** Social share image path or URL */
  image?: string;
  /** OpenGraph type (default: "website") */
  type?: "website" | "article" | "profile";
  /** Prevent search engines from indexing this page (e.g. private dashboards, internal error pages) */
  noIndex?: boolean;
  /** Optional custom structured JSON-LD data to embed */
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Unified SEO metadata builder for React Router 7.
 * Generates standards-compliant meta tags, OpenGraph, Twitter cards, canonical link,
 * and JSON-LD structured data for Google Search.
 */
export function createSeoMeta(options: SeoMetaOptions = {}) {
  const {
    title,
    brandSuffix = true,
    description = SITE_CONFIG.description,
    path = "/",
    image = SITE_CONFIG.ogImageUrl,
    type = "website",
    noIndex = false,
    structuredData,
  } = options;

  const canonicalUrl = getCanonicalUrl(path);
  const imageUrl = image.startsWith("http") ? image : getCanonicalUrl(image);

  let formattedTitle: string = SITE_CONFIG.name;
  if (title) {
    formattedTitle = brandSuffix && !title.includes(SITE_CONFIG.name)
      ? `${title} — ${SITE_CONFIG.name}`
      : title;
  }

  const tags: Array<Record<string, unknown>> = [
    { title: formattedTitle },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonicalUrl },

    // Robots directives
    {
      name: "robots",
      content: noIndex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    },
    {
      name: "googlebot",
      content: noIndex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    },

    // OpenGraph
    { property: "og:site_name", content: SITE_CONFIG.name },
    { property: "og:title", content: formattedTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: canonicalUrl },
    { property: "og:image", content: imageUrl },
    { property: "og:type", content: type },
    { property: "og:locale", content: SITE_CONFIG.locale },

    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: formattedTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];

  if (structuredData) {
    tags.push({ "script:ld+json": structuredData });
  }

  return tags;
}
