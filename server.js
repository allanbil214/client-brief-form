// Run: node server.js   (Node 16+, no npm install needed)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DIR = path.join(__dirname, "responses");
const MAX_BYTES = 1024 * 1024; // 1 MB

fs.mkdirSync(DIR, { recursive: true });

http
  .createServer((req, res) => {
    if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?"))) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return fs.createReadStream(path.join(__dirname, "index.html")).pipe(res);
    }

    if (req.method === "POST" && req.url === "/submit") {
      let size = 0;
      const chunks = [];
      req.on("data", (c) => {
        size += c.length;
        if (size > MAX_BYTES) {
          res.writeHead(413).end("Too large");
          req.destroy();
        } else chunks.push(c);
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          const name = `response-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
          fs.writeFileSync(
            path.join(DIR, name),
            JSON.stringify({ receivedAt: new Date().toISOString(), ...data }, null, 2)
          );
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, file: name }));
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
        }
      });
      return;
    }

    res.writeHead(404).end("Not found");
  })
  .listen(PORT, () => console.log(`Form running on http://localhost:${PORT}`));
