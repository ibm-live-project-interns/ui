/**
 * KnowledgeInsights Component
 * Displays RAG-retrieved knowledge entries that contributed to alert analysis
 *
 * @architecture docs/arch/AIProcessing/Class.puml
 * "class RAGConnector { +fetchRelevantEntries(query: String): List<KnowledgeEntry> }"
 * "class KnowledgeEntry { -content: String, -sourceType: String }"
 *
 * @see docs/arch/AIProcessing/README.md
 * "RAG Connector for knowledge base retrieval"
 */

import { Tile, Tag, SkeletonText } from '@carbon/react';
import { Book, Document, Archive, Notebook } from '@carbon/icons-react';
import type { KnowledgeEntry } from '../../models';

interface KnowledgeInsightsProps {
  entries?: KnowledgeEntry[];
  loading?: boolean;
}

/**
 * Map source type to display label and icon
 */
function getSourceTypeInfo(sourceType: KnowledgeEntry['sourceType']) {
  const mapping = {
    mib: { label: 'MIB Documentation', icon: Book, kind: 'blue' as const },
    vendor_doc: { label: 'Vendor Documentation', icon: Document, kind: 'teal' as const },
    past_alert: { label: 'Historical Alert', icon: Archive, kind: 'purple' as const },
    runbook: { label: 'Runbook', icon: Notebook, kind: 'green' as const },
  };
  return mapping[sourceType] || { label: sourceType, icon: Document, kind: 'gray' as const };
}

/**
 * KnowledgeInsights - Shows AI knowledge context used for analysis
 * RAG = Retrieval-Augmented Generation
 */
export function KnowledgeInsights({ entries, loading }: KnowledgeInsightsProps) {
  if (loading) {
    return (
      <Tile className="knowledge-insights">
        <div className="knowledge-insights__header">
          <h4>
            <Book size={20} />
            Knowledge Insights
          </h4>
        </div>
        <div className="knowledge-insights__skeleton">
          <SkeletonText paragraph lineCount={3} />
        </div>
      </Tile>
    );
  }

  if (!entries || entries.length === 0) {
    return null; // Don't show component if no knowledge entries
  }

  return (
    <Tile className="knowledge-insights">
      <div className="knowledge-insights__header">
        <h4>
          <Book size={20} />
          Knowledge Insights
        </h4>
        <span className="knowledge-insights__badge">RAG-Enhanced</span>
      </div>

      <p className="knowledge-insights__description">
        The AI analysis was enhanced using the following knowledge sources:
      </p>

      <ul className="knowledge-insights__list">
        {entries.map((entry) => {
          const { label, icon: Icon, kind } = getSourceTypeInfo(entry.sourceType);

          return (
            <li key={entry.id} className="knowledge-insights__item">
              <div className="knowledge-insights__item-header">
                <Icon size={16} />
                <Tag type={kind} size="sm">
                  {label}
                </Tag>
                {entry.relevanceScore !== undefined && (
                  <span className="knowledge-insights__score">
                    {Math.round(entry.relevanceScore * 100)}% match
                  </span>
                )}
              </div>
              <p className="knowledge-insights__content">{entry.content}</p>
            </li>
          );
        })}
      </ul>
    </Tile>
  );
}
