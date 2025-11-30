import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClickableTile } from '@carbon/react';
import { Search as SearchIcon, Close, Warning, Dashboard, ArrowRight } from '@carbon/icons-react';
import { alertService } from '../../services';
import type { Alert } from '../../models';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * GlobalSearch - IBM-style header search bar
 * When activated, it replaces the header content with a full-width search input
 * @see https://www.ibm.com search pattern - expands within the header bar
 */
export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const alerts = await alertService.fetchAlerts({ search: searchQuery });
      setResults(alerts.slice(0, 5));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleResultClick = (alertId: string) => {
    onClose();
    navigate(`/alerts/${alertId}`);
  };

  const handleViewAllAlerts = () => {
    onClose();
    navigate('/alerts', { state: { search: query } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleViewAllAlerts();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - click to close */}
      <div className="global-search__overlay" onClick={onClose} />

      {/* Search bar that appears below the header */}
      <div className="global-search">
        <form className="global-search__form" onSubmit={handleSubmit}>
          <SearchIcon size={20} className="global-search__icon" />
          <input
            ref={searchRef}
            id="global-search-input"
            type="text"
            placeholder="Search all of IBM watsonx Alerts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            className="global-search__input"
          />
          <button
            type="button"
            className="global-search__action"
            onClick={onClose}
            aria-label="Close search"
          >
            <Close size={20} />
          </button>
        </form>

        {/* Results dropdown */}
        {query && (
          <div className="global-search__dropdown">
            {loading ? (
              <p className="global-search__loading">Searching...</p>
            ) : results.length > 0 ? (
              <>
                <div className="global-search__section">
                  <h3 className="global-search__section-title">Alerts</h3>
                  {results.map((alert) => (
                    <ClickableTile
                      key={alert.id}
                      className="global-search__result"
                      onClick={() => handleResultClick(alert.id)}
                    >
                      <Warning size={16} className="global-search__result-icon" />
                      <div className="global-search__result-content">
                        <span className="global-search__result-title">
                          {alert.device.hostname}
                        </span>
                        <span className="global-search__result-subtitle">
                          {alert.explanation.slice(0, 60)}...
                        </span>
                      </div>
                      <ArrowRight size={16} className="global-search__result-arrow" />
                    </ClickableTile>
                  ))}
                </div>
                <button
                  type="button"
                  className="global-search__view-all"
                  onClick={handleViewAllAlerts}
                >
                  View all results for "{query}"
                  <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <div className="global-search__empty">
                <p>No results found for "{query}"</p>
              </div>
            )}

            {/* Quick Links */}
            <div className="global-search__quick-links">
              <h3 className="global-search__section-title">Quick Links</h3>
              <ClickableTile
                className="global-search__result"
                onClick={() => { onClose(); navigate('/dashboard'); }}
              >
                <Dashboard size={16} className="global-search__result-icon" />
                <span className="global-search__result-title">Dashboard</span>
                <ArrowRight size={16} className="global-search__result-arrow" />
              </ClickableTile>
              <ClickableTile
                className="global-search__result"
                onClick={() => { onClose(); navigate('/alerts'); }}
              >
                <Warning size={16} className="global-search__result-icon" />
                <span className="global-search__result-title">All Alerts</span>
                <ArrowRight size={16} className="global-search__result-arrow" />
              </ClickableTile>
            </div>
          </div>
        )}
      </div>

    </>
  );
}
