import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
  const svgPath = './public/favicon.svg';
  const icoPath = './public/favicon.ico';

  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const browser = await chromium.launch({ channel: "chrome", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  
  // Set content directly as HTML containing the SVG, styling it to fill the page
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: transparent;
        }
        svg {
          width: 100%;
          height: 100%;
          display: block;
        }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>
  `);

  // We want to generate 16x16, 32x32, and 48x48 versions
  const sizes = [16, 32, 48];
  const pngBuffers = [];

  for (const size of sizes) {
    await page.setViewportSize({ width: size, height: size });
    const buffer = await page.screenshot({
      omitBackground: true,
      type: 'png'
    });
    pngBuffers.push({ size, buffer });
  }

  await browser.close();

  // Create the ICO file structure
  // Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type (1 = ICO)
  header.writeUInt16LE(sizes.length, 4); // Number of images

  const directoryEntries = [];
  let currentOffset = 6 + 16 * sizes.length;

  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size === 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes (1)
    entry.writeUInt16LE(32, 6); // Bits per pixel (32)
    entry.writeUInt32LE(buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Image offset

    directoryEntries.push(entry);
    currentOffset += buffer.length;
  }

  const finalBuffer = Buffer.concat([
    header,
    ...directoryEntries,
    ...pngBuffers.map(p => p.buffer)
  ]);

  fs.writeFileSync(icoPath, finalBuffer);
  console.log(`Successfully generated favicon.ico at ${icoPath}`);
}

main().catch(console.error);
