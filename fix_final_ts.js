const fs = require('fs');

// Fix lib/memory/reflect.ts
let reflectTs = fs.readFileSync('lib/memory/reflect.ts', 'utf8');

reflectTs = reflectTs.replace(/r\.content/g, '(r.content || "")');

// Find the first create call
reflectTs = reflectTs.replace(`            data: {
                userId,
                title: data.title,
                content: data.observation,
                reflectionText: data.observation,
                reflectionText: data.observation,
                type: 'insight',
                triggeredBy,
                confidence: Math.min(data.confidence, 0.95),
                promptVersion: PROMPT_VERSION,
            }`, `            data: {
                userId,
                title: data.title,
                content: data.observation,
                reflectionText: data.observation,
                type: 'insight',
                triggeredBy,
                confidence: Math.min(data.confidence, 0.95),
                promptVersion: PROMPT_VERSION,
            }`);

// Find the second create call (weekly summary)
reflectTs = reflectTs.replace(`            data: {
                userId,
                title: '最近の振り返り',
                content: insight.content,
                type: 'weekly_summary',
                triggeredBy: recentMemories.map(m => m.id),
                confidence: insight.confidence,
                promptVersion: PROMPT_VERSION,
            }`, `            data: {
                userId,
                title: '最近の振り返り',
                content: insight.content,
                reflectionText: insight.content,
                type: 'weekly_summary',
                triggeredBy: recentMemories.map(m => m.id),
                confidence: insight.confidence,
                promptVersion: PROMPT_VERSION,
            }`);

fs.writeFileSync('lib/memory/reflect.ts', reflectTs);

// Fix lib/memory/context.ts
let contextTs = fs.readFileSync('lib/memory/context.ts', 'utf8');
contextTs = contextTs.replace(
`    const emotion = recentMemories.find(m => m.type === 'emotional_pattern');
    const behavior = recentMemories.find(m => m.type === 'behavior_pattern');

    return {
        recentThemes: recentThemes.map(m => ({ title: m.title || '', content: m.content || '' })),
        values: values.map(m => ({ title: m.title || '', content: m.content || '' })),
        emotion: emotion ? { title: emotion.title || '', content: emotion.content || '' } : null,
        behavior: behavior ? { title: behavior.title || '', content: behavior.content || '' } : null,
    };`,
`    const emotion = recentMemories.find(m => m.type === 'emotional_pattern');
    const behavior = recentMemories.find(m => m.type === 'behavior_pattern');

    return {
        recentThemes: recentThemes.map(m => ({ title: m.title || '', content: m.content || '' })),
        values: values.map(m => ({ title: m.title || '', content: m.content || '' })),
        emotion: emotion ? { title: emotion.title || '', content: emotion.content || '' } as {title: string, content: string} : null,
        behavior: behavior ? { title: behavior.title || '', content: behavior.content || '' } as {title: string, content: string} : null,
    };`
);
fs.writeFileSync('lib/memory/context.ts', contextTs);

console.log('Fixed');
