import { Link } from "@tanstack/react-router";
import {
  ExternalLink,
  Globe,
  Layout,
  LogIn,
  Mail,
  Map as MapIcon,
  Smartphone,
  UserPlus,
} from "lucide-react";
import { useEffect } from "react";

const SITE_PAGES = [
  {
    group: "Main Pages",
    pages: [
      {
        name: "Home",
        path: "/",
        description:
          "NeoChain Digital Store homepage — plans, earnings hub, and referral program.",
        icon: Layout,
      },
      {
        name: "Products",
        path: "/products",
        description:
          "View all digital earning plans — Starter, Growth, Pro, and Elite.",
        icon: Globe,
      },
      {
        name: "Mobile Apps",
        path: "/mobile-apps",
        description:
          "Access NeoChain on your mobile browser with full functionality.",
        icon: Smartphone,
      },
      {
        name: "Contact",
        path: "/contact",
        description: "Reach NeoChain Digital Store support team.",
        icon: Mail,
      },
    ],
  },
  {
    group: "Account",
    pages: [
      {
        name: "Login",
        path: "/login",
        description: "Sign in to your NeoChain Digital Store account.",
        icon: LogIn,
      },
      {
        name: "Register",
        path: "/register",
        description: "Create a new NeoChain account and start earning.",
        icon: UserPlus,
      },
    ],
  },
  {
    group: "Legal",
    pages: [
      {
        name: "Privacy Policy",
        path: "/privacy",
        description: "Read our privacy policy and data handling practices.",
        icon: ExternalLink,
      },
      {
        name: "Refund Policy",
        path: "/refund",
        description: "Understand our refund and cancellation terms.",
        icon: ExternalLink,
      },
      {
        name: "Terms & Conditions",
        path: "/terms",
        description: "Review the terms of service for NeoChain Digital Store.",
        icon: ExternalLink,
      },
    ],
  },
];

export default function SitemapPage() {
  useEffect(() => {
    document.title = "Sitemap - NeoChain Digital Store";
  }, []);

  return (
    <div className="min-h-screen px-4 py-8" style={{ paddingTop: "88px" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <MapIcon className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Site Map</h1>
          </div>
          <p className="text-sm text-gray-400">
            Complete list of all pages on{" "}
            <span className="text-cyan-400">NeoChain Digital Store</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            XML Sitemap:{" "}
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline"
            >
              /sitemap.xml
            </a>
          </p>
        </div>

        {/* Page Groups */}
        <div className="space-y-6">
          {SITE_PAGES.map((group) => (
            <div
              key={group.group}
              className="rounded-xl border p-5"
              style={{
                background: "rgba(10, 8, 30, 0.7)",
                borderColor: "rgba(123, 77, 255, 0.25)",
              }}
            >
              <h2 className="text-sm font-semibold text-violet-300 uppercase tracking-wider mb-4">
                {group.group}
              </h2>
              <ul className="space-y-3">
                {group.pages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <li key={page.path}>
                      <Link
                        to={page.path}
                        className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-white/5 group"
                      >
                        <Icon className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                              {page.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {page.path}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                            {page.description}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
