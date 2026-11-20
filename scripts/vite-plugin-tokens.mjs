// Plugin Vite du studio : route locale /__tokens, active seulement en développement (vite serve).
//   GET  /__tokens  → contenu actuel de tokens.json
//   POST /__tokens  → valide les jetons reçus, réécrit tokens.json, puis relance build:tokens
// Les requêtes qui ne viennent pas de la machine locale sont refusées.
import { writeFileSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildTokens, ROOT } from "./build-tokens.mjs";
import { serializeTokens, validateTokens } from "./tokens-lib.mjs";

const LOCAL = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const MAX_BODY = 512 * 1024;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((ok, fail) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        fail(new Error("corps de requête trop gros"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => ok(Buffer.concat(chunks).toString("utf8")));
    req.on("error", fail);
  });
}

export function tokensStudioPlugin({ root = ROOT } = {}) {
  const tokensPath = join(root, "tokens.json");
  const distDir = join(root, "dist");
  return {
    name: "sardinha-tokens-studio",
    apply: "serve",
    // Les fichiers réécrits par la route ne doivent pas recharger le studio.
    handleHotUpdate({ file }) {
      const f = resolve(file);
      if (f === tokensPath || f.startsWith(distDir)) return [];
    },
    configureServer(server) {
      server.middlewares.use("/__tokens", async (req, res) => {
        if (!LOCAL.has(req.socket.remoteAddress || "")) {
          return send(res, 403, { ok: false, errors: [{ path: "(serveur)", message: "accès réservé à la machine locale" }] });
        }
        if (req.method === "GET") {
          try {
            return send(res, 200, { ok: true, tokens: JSON.parse(readFileSync(tokensPath, "utf8")) });
          } catch (err) {
            return send(res, 500, { ok: false, errors: [{ path: "(fichier)", message: String(err.message) }] });
          }
        }
        if (req.method !== "POST") {
          res.setHeader("Allow", "GET, POST");
          return send(res, 405, { ok: false, errors: [{ path: "(serveur)", message: "méthode non permise" }] });
        }
        let data;
        try {
          data = JSON.parse(await readBody(req));
        } catch (err) {
          return send(res, 400, { ok: false, errors: [{ path: "(requête)", message: `JSON invalide : ${err.message}` }] });
        }
        const checked = validateTokens(data);
        if (!checked.ok) return send(res, 422, { ok: false, errors: checked.errors });
        writeFileSync(tokensPath, serializeTokens(checked.tokens));
        const built = buildTokens({ input: tokensPath, outDir: distDir });
        if (!built.ok) return send(res, 422, { ok: false, errors: built.errors });
        server.config.logger.info("  [studio] tokens.json enregistré, dist/tokens.css régénéré", { timestamp: true });
        return send(res, 200, { ok: true, tokens: checked.tokens, files: ["tokens.json", "dist/tokens.css", "dist/tokens.json"] });
      });
    },
  };
}
