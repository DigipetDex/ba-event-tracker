const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const htmlPath = path.join(distDir, 'index.html');
const outPath = path.join(__dirname, '..', 'BA_Event_Planner.html');

let html = fs.readFileSync(htmlPath, 'utf8');

// Inline CSS
html = html.replace(
  /<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+)"[^>]*>/g,
  (_, fileName) => {
    const cssPath = path.join(distDir, 'assets', fileName);
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    return `<style>${cssContent}</style>`;
  }
);

// Inline JS (place at end of body so #root exists when executed, or keep type="module")
let scriptBlocks = [];
html = html.replace(
  /<script type="module"[^>]*src="\.\/assets\/([^"]+)"[^>]*><\/script>/g,
  (_, fileName) => {
    const jsPath = path.join(distDir, 'assets', fileName);
    const jsContent = fs.readFileSync(jsPath, 'utf8').replace(/<\/script/gi, '<\\/script');
    scriptBlocks.push(`<script type="module">${jsContent}</script>`);
    return '';
  }
);

html = html.replace('</body>', () => `${scriptBlocks.join('\n')}\n</body>`);

fs.writeFileSync(outPath, html, 'utf8');
console.log('Successfully generated standalone HTML:', outPath);
