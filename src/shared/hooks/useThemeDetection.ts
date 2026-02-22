/**
 * Copyright IBM Corp. 2026
 *
 * useThemeDetection Hook
 * Detects the current Carbon theme (white or g100) by observing the
 * data-theme-setting attribute on document.documentElement.
 * Replaces the duplicated MutationObserver pattern across dashboard views.
 */

import { useState, useEffect } from 'react';

export function useThemeDetection(): 'white' | 'g100' {
  const [theme, setTheme] = useState<'white' | 'g100'>(() => {
    const el = document.documentElement;
    const setting = el.getAttribute('data-theme-setting');
    if (setting === 'light') return 'white';
    if (setting === 'dark' || setting === 'g100') return 'g100';
    // Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'g100' : 'white';
  });

  useEffect(() => {
    const el = document.documentElement;

    const detectTheme = () => {
      const setting = el.getAttribute('data-theme-setting');
      if (setting === 'light') {
        setTheme('white');
      } else if (setting === 'dark' || setting === 'g100') {
        setTheme('g100');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'g100' : 'white');
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme-setting') {
          detectTheme();
        }
      }
    });

    observer.observe(el, { attributes: true, attributeFilter: ['data-theme-setting'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
