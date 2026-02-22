/**
 * Copyright IBM Corp. 2026
 *
 * ComingSoonModal - Reusable modal for non-functional / placeholder features.
 * Shows a polished "Coming Soon" message with optional feature name and description.
 */

import React, { useCallback, useState } from 'react';
import { ComposedModal, ModalHeader, ModalBody, ModalFooter, Button, Tag } from '@carbon/react';
import { Development, ArrowRight } from '@carbon/icons-react';
import './ComingSoonModal.scss';

// ==========================================
// Types
// ==========================================

export interface ComingSoonFeature {
    /** Feature display name, e.g. "PDF Export" */
    name: string;
    /** Optional longer description of what the feature will do */
    description?: string;
    /** Optional route to an alternative feature that works today */
    alternativeLabel?: string;
    /** Optional callback for the alternative action */
    onAlternative?: () => void;
}

export interface ComingSoonModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Called when the modal is closed */
    onClose: () => void;
    /** Feature information */
    feature: ComingSoonFeature;
}

// ==========================================
// Hook for managing ComingSoonModal state
// ==========================================

export function useComingSoon() {
    const [open, setOpen] = useState(false);
    const [feature, setFeature] = useState<ComingSoonFeature>({ name: '' });

    const showComingSoon = useCallback((feat: ComingSoonFeature) => {
        setFeature(feat);
        setOpen(true);
    }, []);

    const hideComingSoon = useCallback(() => {
        setOpen(false);
    }, []);

    return { open, feature, showComingSoon, hideComingSoon };
}

// ==========================================
// Component
// ==========================================

export const ComingSoonModal = React.memo(function ComingSoonModal({
    open,
    onClose,
    feature,
}: ComingSoonModalProps) {
    return (
        <ComposedModal
            open={open}
            onClose={onClose}
            size="sm"
            className="coming-soon-modal"
        >
            <ModalHeader
                title="Coming Soon"
                label={feature.name}
            />
            <ModalBody>
                <div className="coming-soon-modal__body">
                    <div className="coming-soon-modal__icon-wrapper">
                        <Development size={48} />
                    </div>
                    <p className="coming-soon-modal__feature-name">
                        {feature.name}
                    </p>
                    <Tag type="blue" size="sm" className="coming-soon-modal__tag">
                        In Development
                    </Tag>
                    <p className="coming-soon-modal__description">
                        {feature.description
                            ? feature.description
                            : `This feature is currently under development and will be available in a future release.`}
                    </p>
                </div>
            </ModalBody>
            <ModalFooter>
                {feature.alternativeLabel && feature.onAlternative ? (
                    <>
                        <Button kind="secondary" onClick={onClose}>
                            Close
                        </Button>
                        <Button
                            kind="primary"
                            renderIcon={ArrowRight}
                            onClick={() => {
                                feature.onAlternative?.();
                                onClose();
                            }}
                        >
                            {feature.alternativeLabel}
                        </Button>
                    </>
                ) : (
                    <Button kind="primary" onClick={onClose}>
                        Got it
                    </Button>
                )}
            </ModalFooter>
        </ComposedModal>
    );
});
