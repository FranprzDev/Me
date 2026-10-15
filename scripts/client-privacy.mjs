import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

/**
 * Private clients are never named publicly (Francisco's rule): the CV
 * describes them generically. The names themselves must not live in this
 * public repo either, so the check compares SHA-256 hashes of normalized
 * word windows instead of plain patterns.
 *
 * To add a client, hash each spelling to block, lowercased, without accents,
 * with words joined by one space (multi-word windows are also matched run
 * together), plus any single-token form such as a domain or initials:
 *   node -e 'console.log(require("crypto").createHash("sha256").update(process.argv[1]).digest("hex"))' "client name"
 */
const BLOCKED_HASHES = new Set([
  // The accounting-firm client of the freelance role (Nov 2025 – Aug 2026): name, run-together, domain form, initials.
  "19b5a9e0ab7b68171f7a41f84590c54157f433d069f5383b34596f2040f1c517",
  "d117f51647fabbf5f0e1de1e936bea1cc35ec3eef23570a4da3a91bfe74a75f4",
  "9342364ebbc0d63fe15f82e9f76be3f8f9577773f05290731c9bae606e4ea9b8",
  "14d3983c158a44b8856737a93ad376b3373ff4f7616376b622ca5e0ff930d6ea",
]);

/** Longest name, in words, the windows must cover. */
const MAX_WORDS = 3;

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

function words(text) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Number of blocked client names found in `text` (0 when clean). */
export function privateClientMentions(text) {
  const tokens = words(text);
  let found = 0;
  for (let start = 0; start < tokens.length; start++) {
    for (let size = 1; size <= MAX_WORDS && start + size <= tokens.length; size++) {
      const window = tokens.slice(start, start + size);
      if (BLOCKED_HASHES.has(sha256(window.join(" "))) || (size > 1 && BLOCKED_HASHES.has(sha256(window.join(""))))) found++;
    }
  }
  return found;
}

/** Text files under src/ and public/ that a visitor, a crawler or an agent can reach. */
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".mjs", ".js", ".css", ".json", ".md", ".txt", ".svg", ".xml", ".html", ".wgsl"]);

async function textFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await textFiles(full)));
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const execFileAsync = promisify(execFile);

/** Text of a PDF as poppler's pdftotext extracts it (what a recruiter's ATS reads). */
export async function pdfText(file) {
  const { stdout } = await execFileAsync("pdftotext", ["-layout", file, "-"]);
  return stdout;
}

/** Files under `dirs` (text files and PDFs) that mention a private client. */
export async function privateClientLeaks(dirs) {
  const leaks = [];
  for (const dir of dirs) {
    for (const file of await textFiles(dir)) {
      if (privateClientMentions(await readFile(file, "utf8")) > 0) leaks.push(file);
    }
  }
  return leaks;
}

/** PDFs under `dir` whose extracted text mentions a private client. */
export async function privateClientPdfLeaks(dir) {
  const leaks = [];
  for (const name of (await readdir(dir)).filter((file) => file.endsWith(".pdf")).sort()) {
    const text = await pdfText(path.join(dir, name));
    assertExtracted(text, name);
    if (privateClientMentions(text) > 0) leaks.push(name);
  }
  return leaks;
}

/** A PDF whose text cannot be extracted would pass vacuously. */
function assertExtracted(text, name) {
  if (words(text).length < 50) throw new Error(`${name}: pdftotext extracted no text, cannot check it for private client names`);
}
