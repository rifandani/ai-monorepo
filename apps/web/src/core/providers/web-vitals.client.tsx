'use client';

import { logger } from '@workspace/core/utils/logger';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // we could send to analytics here if the rating is not "good"
    logger.log(`[web-vitals]: ${metric.name}`, { metric });
  });

  return null;
}
