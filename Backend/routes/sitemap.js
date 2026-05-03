import express from "express";

const router = express.Router();

// Base URL for frontend; override by setting FRONTEND_URL in environment
const FRONTEND_URL = process.env.FRONTEND_URL || "https://movies-watchlist-blond.vercel.app";

const staticRoutes = [
  "/",
  "/watchlist",
  "/folders",
  "/liked",
  "/recommendations",
  "/profile",
  "/add-movies"
];

router.get("/sitemap.xml", async (req, res) => {
  try {
    const now = new Date().toISOString().split("T")[0];

    const urls = staticRoutes.map((path) => {
      return `  <url>\n    <loc>${FRONTEND_URL}${path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

    res.header("Content-Type", "application/xml");
    // Short caching to reduce load; search engines will re-request
    res.header("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    console.error("Failed to generate sitemap:", err);
    res.status(500).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset></urlset>");
  }
});

export default router;
