import { Tile, SkeletonText } from '@carbon/react';
import { IbmWatsonxCodeAssistant } from '@carbon/icons-react';

interface ExplanationPanelProps {
  explanation: string;
  loading?: boolean;
}

/** Displays LLM explanation from Watsonx @see docs/arch/AIProcessing/Sequence.puml */
export function ExplanationPanel({ explanation, loading = false }: ExplanationPanelProps) {
  if (loading) {
    return (
      <Tile className="explanation-panel">
        <div className="explanation-panel__header">
          <h4>
            <IbmWatsonxCodeAssistant size={24} />
            AI Explanation
          </h4>
        </div>
        <div className="explanation-panel__content">
          <SkeletonText paragraph lineCount={4} />
        </div>
      </Tile>
    );
  }

  return (
    <Tile className="explanation-panel">
      <div className="explanation-panel__header">
        <h4>
          <IbmWatsonxCodeAssistant size={24} />
          AI Explanation
        </h4>
        <span className="explanation-panel__badge">Powered by Watsonx</span>
      </div>
      <div className="explanation-panel__content">
        <p>{explanation}</p>
      </div>
    </Tile>
  );
}
