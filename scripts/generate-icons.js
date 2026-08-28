// Simple SVG-based icon generator for AfroConnect PWA
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon for each size
sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#008000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2ca42c;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.1}"/>

  <!-- Handshake icon (simplified) -->
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Left hand -->
    <path d="M ${-size*0.2} 0 L ${-size*0.05} ${-size*0.1} L ${-size*0.05} ${size*0.1} Z"
          fill="#FFC300" opacity="0.9"/>

    <!-- Right hand -->
    <path d="M ${size*0.2} 0 L ${size*0.05} ${-size*0.1} L ${size*0.05} ${size*0.1} Z"
          fill="#FFC300" opacity="0.9"/>

    <!-- "AC" text -->
    <text x="0" y="${size*0.05}"
          font-family="Arial, sans-serif"
          font-weight="bold"
          font-size="${size*0.35}"
          fill="white"
          text-anchor="middle">AC</text>
  </g>
</svg>`;

  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`✓ Generated ${filename}`);
});

console.log(`\n✅ Generated ${sizes.length} PWA icons in public/icons/`);
console.log('📝 Note: SVG icons work perfectly for PWAs. PNG conversion optional.');
