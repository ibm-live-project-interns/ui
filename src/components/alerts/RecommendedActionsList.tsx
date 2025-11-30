import { useState, useEffect } from 'react';
import { StructuredListWrapper, StructuredListHead, StructuredListBody, StructuredListRow, StructuredListCell, Tag, Button, SkeletonText, Tile } from '@carbon/react';
import { CheckmarkFilled, PlayFilled, Bot } from '@carbon/icons-react';
import type { RecommendedAction } from '../../models';

interface RecommendedActionsListProps {
  actions: RecommendedAction[];
  loading?: boolean;
  onExecuteAction?: (action: RecommendedAction) => void;
}

/**
 * @description Mobile breakpoint for card layout
 * Below 500px, switch to card-based layout for better readability
 */
const MOBILE_BREAKPOINT = 500;

function getPriorityTagType(priority: number | undefined): 'red' | 'magenta' | 'gray' {
  if (priority === 1) return 'red';
  if (priority === 2) return 'magenta';
  return 'gray';
}

export function RecommendedActionsList({
  actions,
  loading = false,
  onExecuteAction,
}: RecommendedActionsListProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sortedActions = [...actions].sort((a, b) => (a.priority || 99) - (b.priority || 99));

  if (loading) {
    return (
      <div className="recommended-actions">
        <h4 className="recommended-actions__title">
          <Bot size={20} />
          Recommended Actions
        </h4>
        <div className="recommended-actions__skeleton">
          <SkeletonText heading width="60%" />
          <SkeletonText paragraph lineCount={3} />
        </div>
      </div>
    );
  }

  if (!actions.length) {
    return (
      <div className="recommended-actions">
        <h4 className="recommended-actions__title">
          <Bot size={20} />
          Recommended Actions
        </h4>
        <p className="recommended-actions__empty">No recommended actions available.</p>
      </div>
    );
  }

  // Mobile card layout for better readability on small screens
  if (isMobile) {
    return (
      <div className="recommended-actions">
        <h4 className="recommended-actions__title">
          <Bot size={20} />
          Recommended Actions
        </h4>
        <div className="recommended-actions__cards">
          {sortedActions.map(action => (
            <Tile key={action.id} className="recommended-actions__card">
              <div className="recommended-actions__card-header">
                <Tag type={getPriorityTagType(action.priority)} size="sm">
                  P{action.priority || '-'}
                </Tag>
                {action.automatable ? (
                  <Tag type="green" size="sm">
                    <PlayFilled size={12} /> Auto
                  </Tag>
                ) : (
                  <Tag type="gray" size="sm">Manual</Tag>
                )}
              </div>
              <p className="recommended-actions__card-action">{action.actionDescription}</p>
              {onExecuteAction && (
                <div className="recommended-actions__card-footer">
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={action.automatable ? PlayFilled : CheckmarkFilled}
                    onClick={() => onExecuteAction(action)}
                  >
                    {action.automatable ? 'Run' : 'Done'}
                  </Button>
                </div>
              )}
            </Tile>
          ))}
        </div>
      </div>
    );
  }

  // Desktop/Tablet table layout
  return (
    <div className="recommended-actions">
      <h4 className="recommended-actions__title">
        <Bot size={20} />
        Recommended Actions
      </h4>

      <StructuredListWrapper selection={false} className="recommended-actions__list">
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>Priority</StructuredListCell>
            <StructuredListCell head>Action</StructuredListCell>
            <StructuredListCell head>Type</StructuredListCell>
            {onExecuteAction && <StructuredListCell head>Execute</StructuredListCell>}
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {sortedActions.map(action => (
            <StructuredListRow key={action.id}>
              <StructuredListCell>
                <Tag type={getPriorityTagType(action.priority)} size="sm">
                  P{action.priority || '-'}
                </Tag>
              </StructuredListCell>
              <StructuredListCell>{action.actionDescription}</StructuredListCell>
              <StructuredListCell>
                {action.automatable ? (
                  <Tag type="green" size="sm">
                    <PlayFilled size={12} /> Automatable
                  </Tag>
                ) : (
                  <Tag type="gray" size="sm">Manual</Tag>
                )}
              </StructuredListCell>
              {onExecuteAction && (
                <StructuredListCell>
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={action.automatable ? PlayFilled : CheckmarkFilled}
                    onClick={() => onExecuteAction(action)}
                  >
                    {action.automatable ? 'Run' : 'Done'}
                  </Button>
                </StructuredListCell>
              )}
            </StructuredListRow>
          ))}
        </StructuredListBody>
      </StructuredListWrapper>
    </div>
  );
}
