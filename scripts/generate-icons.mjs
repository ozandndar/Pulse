import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const sourceSvg = path.resolve(projectRoot, "renderer", "src", "assets", "pulse-logo.svg");
const resourcesDir = path.resolve(projectRoot, "resources", "icons");
const pngOutput = path.join(resourcesDir, "pulse.png");
const icoOutput = path.join(resourcesDir, "pulse.ico");

async function generateIcons() {
  await mkdir(resourcesDir, { recursive: true });

  // Create a high resolution PNG for general usage (installer previews, etc.).
  await sharp(sourceSvg)
    .resize(512, 512, { fit: "contain", background: "#050505" })
    .png({ compressionLevel: 9 })
    .toFile(pngOutput);

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map((size) =>
      sharp(sourceSvg)
        .resize(size, size, { fit: "contain", background: "#050505" })
        .png({ compressionLevel: 9 })
        .toBuffer()
    )
  );

  const icoBuffer = await pngToIco(pngBuffers);
  await writeFile(icoOutput, icoBuffer);

  console.log("✓ Generated", path.relative(projectRoot, pngOutput));
  console.log("✓ Generated", path.relative(projectRoot, icoOutput));
}

generateIcons().catch((error) => {
  console.error("Failed to generate icons", error);
  process.exitCode = 1;
});
