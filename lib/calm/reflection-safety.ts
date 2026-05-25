import { ReflectionSafetyCheck, SafetyViolation, FORBIDDEN_PATTERNS, UNCERTAINTY_PREFIXES } from "./types";

export function checkReflectionSafety(content: string): ReflectionSafetyCheck {
    const violations: SafetyViolation[] = [];

    for (const { pattern, type, severity } of FORBIDDEN_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
            violations.push({
                type,
                description: `禁止パターン検出: "${match[0].slice(0, 50)}"`,
                severity,
            });
        }
    }

    const isSafe = violations.filter((v) => v.severity === "high").length === 0;
    const sanitized = isSafe ? null : sanitizeContent(content);

    return {
        isSafe,
        violations,
        sanitizedContent: sanitized,
        confidence: isSafe ? 1.0 : 0.3,
    };
}

function sanitizeContent(content: string): string {
    let sanitized = content;

    for (const { pattern } of FORBIDDEN_PATTERNS) {
        sanitized = sanitized.replace(pattern, (match) => {
            return `【${"*".repeat(match.length)}】`;
        });
    }

    return sanitized;
}

export function ensureUncertaintyWording(content: string): string {
    const hasUncertainty = UNCERTAINTY_PREFIXES.some((p) => content.includes(p));
    if (hasUncertainty) return content;

    if (content.trim().endsWith("？") || content.trim().endsWith("?")) {
        return content;
    }

    const declarativePatterns = [/です$/m, /ます$/m, /ました$/m, /でしょう$/m];
    const isDeclarative = declarativePatterns.some((p) => p.test(content));

    if (isDeclarative && content.length > 30) {
        const prefix = UNCERTAINTY_PREFIXES[Math.floor(Math.random() * UNCERTAINTY_PREFIXES.length)];
        return prefix + " " + content.charAt(0).toLowerCase() + content.slice(1);
    }

    return content;
}

export function validateReflection(reflection: {
    title: string;
    content: string;
    confidence: number;
}): { validated: boolean; safeTitle: string; safeContent: string; adjustedConfidence: number } {
    const titleCheck = checkReflectionSafety(reflection.title);
    const contentCheck = checkReflectionSafety(reflection.content);

    const safeTitle = titleCheck.isSafe ? reflection.title : (titleCheck.sanitizedContent || reflection.title);
    const safeContent = contentCheck.isSafe ? reflection.content : (contentCheck.sanitizedContent || reflection.content);

    const uncertaintyContent = ensureUncertaintyWording(safeContent);

    const violationPenalty = (titleCheck.violations.length + contentCheck.violations.length) * 0.1;
    const adjustedConfidence = Math.max(0.1, reflection.confidence - violationPenalty);

    return {
        validated: contentCheck.isSafe && titleCheck.isSafe,
        safeTitle,
        safeContent: uncertaintyContent,
        adjustedConfidence,
    };
}

export function isOverGuiding(response: string): boolean {
    const directivePatterns = [
        /(すべき|した方がいい|しないと|するべき|やるべき)/,
        /(やってみて|試してみて|考えてみて)/,
        /(おすすめ|推奨|提案します)/,
        /(絶対|必ず|間違いなく)/,
        /(なぜ|どうして).*(しない|やらない|できない)/,
    ];

    let matchCount = 0;
    for (const pattern of directivePatterns) {
        if (pattern.test(response)) matchCount++;
    }

    return matchCount >= 2;
}

export function logSafetyViolation(
    userId: string,
    violation: SafetyViolation,
    sourceType: string
): void {
    console.warn(
        `[Safety Violation] user=${userId} type=${violation.type} ` +
        `severity=${violation.severity} source=${sourceType} ` +
        `desc=${violation.description}`
    );
}