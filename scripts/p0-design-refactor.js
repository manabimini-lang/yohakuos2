const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components')
];

const replacements = [
  { regex: /bg-\[#090909\]/g, replacement: 'bg-background' },
  { regex: /bg-\[#0B0B0B\]/g, replacement: 'bg-card' },
  { regex: /text-white\/([0-9]+)/g, replacement: 'text-foreground/$1' },
  { regex: /text-white\b/g, replacement: 'text-foreground' },
  { regex: /border-white\/10/g, replacement: 'border-border' },
  { regex: /border-white\/5\b/g, replacement: 'border-border/50' },
  { regex: /bg-white\/\[0\.0[23]\]/g, replacement: 'bg-card' },
  { regex: /bg-white\/5\b/g, replacement: 'bg-card' },
  { regex: /text-slate-500/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-400/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-300/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-100/g, replacement: 'text-foreground' },
  { regex: /text-slate-200/g, replacement: 'text-foreground' },
  { regex: /rounded-3xl/g, replacement: 'rounded-2xl' },
  { regex: /\bp-7\b/g, replacement: 'p-6' },
  { regex: /\bgap-5\b/g, replacement: 'gap-4' },
  { regex: /\bpb-28\b/g, replacement: 'pb-24' },
  { regex: /bg-\[#f5f5f7\]/g, replacement: 'bg-background' }, // from page.tsx
  { regex: /text-slate-900/g, replacement: 'text-foreground' },
  { regex: /text-slate-950/g, replacement: 'text-foreground' },
  { regex: /text-slate-800/g, replacement: 'text-foreground' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

for (const dir of targetDirs) {
  processDirectory(dir);
}

console.log("Refactoring complete.");
