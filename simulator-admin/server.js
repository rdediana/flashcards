const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const {
  clonePackage,
  createEmptyPackage,
  deletePackage,
  getPackage,
  getPackageIndex,
  importItems,
  importPackage,
  listPackages,
  updateItem,
  updatePackageDetails,
  validateItemImport
} = require("./package-store");

const PORT = Number(process.env.PORT || 8888);
const PUBLIC_DIR = __dirname;
const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === "/api/packages" && request.method === "GET") {
      return sendJson(response, { packages: await listPackages() });
    }

    if (url.pathname === "/api/package-index" && request.method === "GET") {
      return sendJson(response, await getPackageIndex());
    }

    if (url.pathname === "/api/package" && request.method === "GET") {
      return sendJson(response, await getPackage(url.searchParams.get("packageId")));
    }

    if (url.pathname === "/api/package" && request.method === "POST") {
      const body = await readJsonBody(request);
      return sendJson(response, await createEmptyPackage(body));
    }

    if (url.pathname === "/api/package" && request.method === "PUT") {
      const body = await readJsonBody(request);
      return sendJson(response, await updatePackageDetails(body));
    }

    if (url.pathname === "/api/package" && request.method === "DELETE") {
      const body = await readJsonBody(request);
      return sendJson(response, await deletePackage(body.packageId));
    }

    if (url.pathname === "/api/package/import" && request.method === "POST") {
      const body = await readJsonBody(request);
      return sendJson(response, await importPackage(body));
    }

    if (url.pathname === "/api/package/clone" && request.method === "POST") {
      const body = await readJsonBody(request);
      return sendJson(response, await clonePackage(body));
    }

    if (url.pathname === "/api/import" && request.method === "POST") {
      const body = await readJsonBody(request);
      return sendJson(response, await importItems(body));
    }

    if (url.pathname === "/api/items/validate" && request.method === "POST") {
      const body = await readJsonBody(request);
      return sendJson(response, await validateItemImport(body));
    }

    if (url.pathname === "/api/item" && request.method === "POST") {
      const body = await readJsonBody(request);
      return sendJson(response, await updateItem(body));
    }

    if (request.method === "GET" || request.method === "HEAD") {
      return serveStatic(request, response);
    }

    sendJson(response, { error: "Not found" }, 404);
  } catch (error) {
    sendJson(response, {
      error: error.message || "Unexpected server error.",
      details: error.details || [],
      summary: error.summary,
      payloadType: error.payloadType
    }, error.statusCode || 500);
  }
});

server.listen(PORT, () => {
  console.log(`Test Simulator admin service running at http://localhost:${PORT}`);
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
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
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
