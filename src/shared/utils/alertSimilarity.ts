/**
 * Alert Similarity Utility
 *
 * Calculates similarity scores between alerts based on:
 * - AI analysis keywords (root cause, summary, recommendations)
 * - Alert category and severity
 * - Device information
 * - Title and description content
 *
 * Works with the transformed DetailedAlert/PriorityAlert types
 * returned by alertDataService.
 */

import type { DetailedAlert, PriorityAlert } from '@/features/alerts/types';

/** Minimal alert shape for similarity comparison */
type SimilarityAlert = PriorityAlert & Partial<Pick<DetailedAlert, 'aiAnalysis' | 'category'>>;

/**
 * Extract keywords from text fields
 */
function extractKeywords(text: string | undefined | null): string[] {
    if (!text) return [];

    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
        'those', 'it', 'its', 'which', 'what', 'when', 'where', 'who', 'how',
    ]);

    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
        .map(word => word.trim())
        .filter(Boolean);
}

/**
 * Calculate Jaccard similarity between two sets of keywords
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate weighted keyword similarity (simplified TF-IDF)
 */
function weightedKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    const freq1 = new Map<string, number>();
    const freq2 = new Map<string, number>();
    keywords1.forEach(k => freq1.set(k, (freq1.get(k) || 0) + 1));
    keywords2.forEach(k => freq2.set(k, (freq2.get(k) || 0) + 1));

    let score = 0;
    let maxScore = 0;

    set1.forEach(keyword => {
        const w1 = freq1.get(keyword) || 0;
        const w2 = freq2.get(keyword) || 0;
        score += Math.min(w1, w2);
        maxScore += Math.max(w1, w2);
    });

    set2.forEach(keyword => {
        if (!set1.has(keyword)) {
            maxScore += freq2.get(keyword) || 0;
        }
    });

    return maxScore === 0 ? 0 : score / maxScore;
}

/**
 * Extract AI-related keywords from a DetailedAlert / PriorityAlert
 */
function getAIKeywords(alert: SimilarityAlert): string[] {
    const keywords: string[] = [];

    // From structured aiAnalysis (DetailedAlert)
    if (alert.aiAnalysis) {
        keywords.push(...extractKeywords(alert.aiAnalysis.summary));
        if (alert.aiAnalysis.rootCauses) {
            alert.aiAnalysis.rootCauses.forEach(rc => keywords.push(...extractKeywords(rc)));
        }
        keywords.push(...extractKeywords(alert.aiAnalysis.businessImpact));
        if (alert.aiAnalysis.recommendedActions) {
            alert.aiAnalysis.recommendedActions.forEach(ra => keywords.push(...extractKeywords(ra)));
        }
    }

    // From aiSummary (PriorityAlert)
    keywords.push(...extractKeywords(alert.aiSummary));

    return keywords;
}

/**
 * Calculate similarity score between two alerts
 */
export function calculateAlertSimilarity(
    currentAlert: SimilarityAlert,
    candidateAlert: SimilarityAlert,
    options: {
        weightAIAnalysis?: number;
        weightCategory?: number;
        weightSeverity?: number;
        weightDevice?: number;
        weightContent?: number;
    } = {}
): number {
    const {
        weightAIAnalysis = 0.45,
        weightCategory = 0.20,
        weightSeverity = 0.10,
        weightDevice = 0.15,
        weightContent = 0.10,
    } = options;

    let totalScore = 0;
    let totalWeight = 0;

    // 1. AI Analysis Similarity (highest weight)
    const currentKeywords = getAIKeywords(currentAlert);
    const candidateKeywords = getAIKeywords(candidateAlert);

    if (currentKeywords.length > 0 && candidateKeywords.length > 0) {
        const aiSimilarity = weightedKeywordSimilarity(currentKeywords, candidateKeywords);
        totalScore += aiSimilarity * weightAIAnalysis;
        totalWeight += weightAIAnalysis;
    }

    // 2. Category Similarity
    if (currentAlert.category && candidateAlert.category) {
        const categoryMatch = currentAlert.category.toLowerCase() === candidateAlert.category.toLowerCase() ? 1 : 0;
        totalScore += categoryMatch * weightCategory;
        totalWeight += weightCategory;
    }

    // 3. Severity Similarity
    if (currentAlert.severity && candidateAlert.severity) {
        const severityLevels: Record<string, number> = {
            critical: 4, high: 3, major: 3, medium: 2, minor: 1, low: 1, info: 0,
        };
        const currentLevel = severityLevels[currentAlert.severity] ?? 0;
        const candidateLevel = severityLevels[candidateAlert.severity] ?? 0;
        const severityDiff = Math.abs(currentLevel - candidateLevel);
        const severitySimilarity = Math.max(0, 1 - (severityDiff / 4));
        totalScore += severitySimilarity * weightSeverity;
        totalWeight += weightSeverity;
    }

    // 4. Device Similarity (device is DeviceInfo with .name)
    if (currentAlert.device?.name && candidateAlert.device?.name) {
        const deviceMatch = currentAlert.device.name === candidateAlert.device.name ? 1 : 0.3;
        totalScore += deviceMatch * weightDevice;
        totalWeight += weightDevice;
    }

    // 5. Content Similarity (aiTitle, aiSummary)
    const currentContent = [
        ...extractKeywords(currentAlert.aiTitle),
        ...extractKeywords(currentAlert.aiSummary),
    ];
    const candidateContent = [
        ...extractKeywords(candidateAlert.aiTitle),
        ...extractKeywords(candidateAlert.aiSummary),
    ];

    if (currentContent.length > 0 && candidateContent.length > 0) {
        const contentSimilarity = jaccardSimilarity(
            new Set(currentContent),
            new Set(candidateContent),
        );
        totalScore += contentSimilarity * weightContent;
        totalWeight += weightContent;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Find similar historical alerts
 */
export function findSimilarAlerts(
    currentAlert: SimilarityAlert,
    allAlerts: SimilarityAlert[],
    options: {
        minSimilarityScore?: number;
        maxResults?: number;
        excludeCurrentAlert?: boolean;
    } = {}
): Array<SimilarityAlert & { similarityScore: number }> {
    const {
        minSimilarityScore = 0.25,
        maxResults = 5,
        excludeCurrentAlert = true,
    } = options;

    let candidates = allAlerts.filter(alert =>
        alert.status === 'resolved' || alert.status === 'dismissed'
    );

    if (excludeCurrentAlert) {
        candidates = candidates.filter(alert => alert.id !== currentAlert.id);
    }

    return candidates
        .map(alert => ({
            ...alert,
            similarityScore: calculateAlertSimilarity(currentAlert, alert),
        }))
        .filter(alert => alert.similarityScore >= minSimilarityScore)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, maxResults);
}

/**
 * Extract top keywords from alert for display/debugging
 */
export function getAlertKeywords(alert: SimilarityAlert, maxKeywords: number = 10): string[] {
    const allKeywords = [
        ...getAIKeywords(alert),
        ...extractKeywords(alert.aiTitle),
    ];

    const freq = new Map<string, number>();
    allKeywords.forEach(k => freq.set(k, (freq.get(k) || 0) + 1));

    return Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxKeywords)
        .map(([keyword]) => keyword);
}
