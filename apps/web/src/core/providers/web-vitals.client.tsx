'use client';

import { loggerBrowser } from '@workspace/core/utils/logger';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // we could send to analytics here if the rating is not "good"
    loggerBrowser.info(metric, `[web-vitals]: ${metric.name}`);
  });

  return null;
}
