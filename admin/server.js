const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { importCards, listDecks } = require("./deck-store");

const PORT = Number(process.env.PORT || 8787);
const PUBLIC_DIR = __dirname;
const ROOT_DIR = path.join(__dirname, "..");

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.url === "/api/decks" && request.method === "GET") {
      return sendJson(response, { decks: await listDecks() });
    }

    if (request.url === "/api/import" && request.method === "POST") {
      const body = await readJsonBody(request);
      return sendJson(response, await importCards(body));
    }

    if (request.method === "GET" || request.method === "HEAD") {
      return serveStatic(request, response);
    }

    sendJson(response, { error: "Not found" }, 404);
  } catch (error) {
    sendJson(response, {
      error: error.message || "Unexpected server error.",
      details: error.details || []
    }, error.statusCode || 500);
  }
});

server.listen(PORT, () => {
  console.log(`Flashcard admin service running at http://localhost:${PORT}`);
});

async function readJsonBody(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 5_000_000) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
  }

  try {
    return JSON.parse(raw || "{}");
  } catch {
    const error = new Error("Request body must be JSON.");
    error.statusCode = 400;
    throw error;
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const baseDir = safePath.startsWith("/shared/") ? ROOT_DIR : PUBLIC_DIR;
  const relativePath = safePath.startsWith("/shared/") ? safePath.replace("/shared/", "") : safePath;
  const filePath = path.join(baseDir, relativePath);

  if (!filePath.startsWith(baseDir)) {
    return sendJson(response, { error: "Not found" }, 404);
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    sendJson(response, { error: "Not found" }, 404);
  }
}

function sendJson(response, payload, statusCode = 200) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}
