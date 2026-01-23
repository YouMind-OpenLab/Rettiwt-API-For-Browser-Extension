/**
 * Simple script to generate placeholder icons for the extension.
 * Run with: node scripts/generate-icons.js
 *
 * This creates simple blue square PNG icons.
 * For production, replace with proper icons.
 */

const fs = require('fs');
const path = require('path');

// Simple 1x1 blue pixel PNG (base64)
// We'll scale it conceptually - browsers will handle the display
const createSimplePNG = (size) => {
  // PNG header + IHDR + IDAT + IEND for a simple blue image
  // This is a minimal valid PNG that displays as blue

  // For simplicity, we create a basic PNG structure
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const width = size;
  const height = size;
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk - create uncompressed image data
  // Each row: filter byte + RGB pixels
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Twitter blue color: #1DA1F2 (RGB: 29, 161, 242)
      rawData[pixelOffset] = 29;     // R
      rawData[pixelOffset + 1] = 161; // G
      rawData[pixelOffset + 2] = 242; // B
    }
  }

  // Compress with zlib
  const zlib = require('zlib');
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
};

const createChunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
};

// CRC32 implementation for PNG
const crc32 = (data) => {
  let crc = 0xFFFFFFFF;
  const table = makeCRCTable();

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
};

const makeCRCTable = () => {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
};

// Generate icons
const iconsDir = path.join(__dirname, '..', 'icons');

const sizes = [16, 48, 128];

sizes.forEach(size => {
  const png = createSimplePNG(size);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created ${filename}`);
});

console.log('Icons generated successfully!');
