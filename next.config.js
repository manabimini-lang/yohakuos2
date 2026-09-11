/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      // Settings consolidation — β版の正式Settingsは /yui/settings
      { source: "/settings", destination: "/yui/settings", permanent: false },
      { source: "/settings/ai", destination: "/yui/settings", permanent: false },
      { source: "/member/settings", destination: "/yui/settings", permanent: false },
      // Legal consolidation
      { source: "/legal/terms", destination: "/terms", permanent: true },
      { source: "/legal/privacy", destination: "/privacy", permanent: true },
      // Hide development memory routes (userId: 'default' hardcoded)
      { source: "/memory/reflection", destination: "/memory", permanent: false },
      { source: "/memory/values", destination: "/memory", permanent: false },
      { source: "/memory/beliefs", destination: "/memory", permanent: false },
      { source: "/memory/timeline", destination: "/memory", permanent: false },
      { source: "/memory/graph", destination: "/memory", permanent: false },
      { source: "/memory/resonance", destination: "/memory", permanent: false },
      // Consolidate retired product islands into the current YUI experience.
      { source: "/member/ai", destination: "/yui", permanent: false },
      { source: "/member/ai/:path*", destination: "/yui", permanent: false },
      { source: "/log", destination: "/yui", permanent: false },
      { source: "/review", destination: "/memory", permanent: false },
      { source: "/dashboard", destination: "/yui", permanent: false },
      { source: "/content/share", destination: "/yui", permanent: false },
      { source: "/legacy", destination: "/life", permanent: false },
      { source: "/legacy/:path*", destination: "/life", permanent: false },
      { source: "/life/areas", destination: "/life", permanent: false },
      { source: "/life/balance", destination: "/life", permanent: false },
      { source: "/life/direction", destination: "/life", permanent: false },
      { source: "/life/energy", destination: "/life", permanent: false },
      { source: "/life/meaning", destination: "/life", permanent: false },
      { source: "/life/planning", destination: "/life", permanent: false },
      { source: "/life/seasonal", destination: "/life", permanent: false },
      { source: "/life/timeline", destination: "/life", permanent: false },
    ];
  },


  images: {
    domains: [
      'localhost',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'img.youtube.com',
      'i.ytimg.com',
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.gstatic.com https://translate.googleapis.com; frame-src 'self' https://challenges.cloudflare.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://www.gstatic.com https://translate.googleapis.com https://translate.gstatic.com; font-src 'self' data:; connect-src 'self' https: https://www.gstatic.com https://translate.googleapis.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
