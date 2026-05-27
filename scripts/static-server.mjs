import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const port = 4173;

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".webmanifest", "application/manifest+json"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"]
]);

http
  .createServer((req, res) => {
    const rawPath = req.url?.split("?")[0] || "/";
    const decoded = decodeURIComponent(rawPath);
    const relPath = decoded === "/" ? "/index.html" : decoded;
    const fullPath = path.resolve(root, `.${relPath}`);

    if (!fullPath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(fullPath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const ext = path.extname(fullPath).toLowerCase();
      const type = contentTypes.get(ext) || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
      fs.createReadStream(fullPath).pipe(res);
    });
  })
  .listen(port, "127.0.0.1", () => {
    process.stdout.write(`Static server running on http://127.0.0.1:${port}\n`);
  });
