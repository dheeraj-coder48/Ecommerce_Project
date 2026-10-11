import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(root, "source");
const outputDir = path.join(root, "images");
const svgDir = path.join(outputDir, "svg");
const config = path.join(sourceDir, "mermaid-config.json");
const puppeteerConfigSource = path.join(sourceDir, "puppeteer-config.json");
const runtimeDir = await mkdtemp(path.join(os.tmpdir(), "kc-diagram-render-"));
const puppeteerConfig = path.join(runtimeDir, "puppeteer-config.json");
const mmdcCli = process.env.MMDC_CLI;
const command = mmdcCli ? process.execPath : process.platform === "win32" ? "mmdc.cmd" : "mmdc";
const prefixArgs = mmdcCli ? [mmdcCli] : [];
const size = Number(process.env.DIAGRAM_MAX_PX || 3508);

const puppeteerSettings = JSON.parse(await readFile(puppeteerConfigSource, "utf8"));
const chromePath = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH ||
  (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined);
if (chromePath) puppeteerSettings.executablePath = chromePath;
await writeFile(puppeteerConfig, JSON.stringify(puppeteerSettings, null, 2));

const sources = (await readdir(sourceDir)).filter((file) => file.endsWith(".mmd"));
if (!sources.length) throw new Error(`No Mermaid sources found in ${sourceDir}`);

try {
  for (const file of sources) {
    const basename = path.basename(file, ".mmd");
    const inputPath = path.join(sourceDir, file);
    const sourceTime = (await stat(inputPath)).mtimeMs;
    for (const extension of ["svg", "png"]) {
      const output = path.join(extension === "svg" ? svgDir : outputDir, `${basename}.${extension}`);
      try {
        if ((await stat(output)).mtimeMs >= sourceTime) continue;
      } catch {
        // Generate missing outputs.
      }
      const args = [
        ...prefixArgs,
        "--input", inputPath,
        "--output", output,
        "--configFile", config,
        "--puppeteerConfigFile", puppeteerConfig,
        "--backgroundColor", "#ffffff",
        "--size", String(size),
        "--scale", "1",
      ];
      const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(`Mermaid render failed for ${file} (${extension})`);
    }
    console.log(`Rendered ${basename}`);
  }
} finally {
  await rm(runtimeDir, { recursive: true, force: true });
}
