const fs = require('fs');

// Fix lib/memory/reflect.ts
let reflectTs = fs.readFileSync('lib/memory/reflect.ts', 'utf8');
reflectTs = reflectTs.replace('content: data.observation,', 'content: data.observation,\n                reflectionText: data.observation,');
fs.writeFileSync('lib/memory/reflect.ts', reflectTs);

// Fix lib/memory/context.ts
let contextTs = fs.readFileSync('lib/memory/context.ts', 'utf8');
contextTs = contextTs.replace(
`        recentThemes: recentThemes.map(m => ({ title: m.title, content: m.content })),
        values: values.map(m => ({ title: m.title, content: m.content })),
        emotion: emotion ? { title: emotion.title, content: emotion.content } : null,
        behavior: behavior ? { title: behavior.title, content: behavior.content } : null,`,
`        recentThemes: recentThemes.map(m => ({ title: m.title || '', content: m.content || '' })),
        values: values.map(m => ({ title: m.title || '', content: m.content || '' })),
        emotion: emotion ? { title: emotion.title || '', content: emotion.content || '' } : null,
        behavior: behavior ? { title: behavior.title || '', content: behavior.content || '' } : null,`
);
fs.writeFileSync('lib/memory/context.ts', contextTs);

console.log('Fixes applied');
