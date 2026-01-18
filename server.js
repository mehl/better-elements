import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".json": "application/json; charset=utf-8",
};

async function applyHtmlVars(content) {
  let result = content;
  for (const [key, value] of Object.entries(await getHtmlVars())) {
    result = result.replaceAll(`%${key}%`, escapeAttr(value));
  }
  return result;
}

async function getHtmlVars() {
  const demoDir = path.join(__dirname, "demo");

  const slides = [
    {
      src: "aprilia.webp",
      hotspot: [.5, .8]
    },
    {
      src: "husky.webp",
      hotspot: [.5, 1]
    },
    {
      src: "sc.webp",
      hotspot: [.5, .5]
    },
    {
      src: "husky2.webp",
      hotspot: [.7, .2]
    }
  ];
  // HTML template variables for demo/index.html.
  const htmlVars = {
    TITLE: "bf-slideshow",
    SLIDES: JSON.stringify(slides),
  };
  return htmlVars;
}

export async function startDevServer() {
  const demoDir = path.join(__dirname, "demo");
  const distDir = path.join(__dirname, "dist");

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const isDistRequest = pathname.startsWith("/dist/");
    const baseDir = isDistRequest ? distDir : demoDir;
    const relativePath = isDistRequest ? pathname.slice("/dist/".length) : pathname;
    const filePath = path.join(baseDir, relativePath);

    if (!filePath.startsWith(baseDir)) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }

    try {
      let data = await fs.readFile(filePath);
      if (path.extname(filePath) === ".html") {
        data = Buffer.from(await applyHtmlVars(data.toString("utf8")));
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", mimeTypes[path.extname(filePath)] ?? "application/octet-stream");
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end("Not Found");
    }
  });

  const port = 3000;
  server.listen(port, () => {
    console.log(`Dev server running at http://localhost:${port}`);
  });
}
