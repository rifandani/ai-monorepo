import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/core/utils/i18n.ts');

// eslint-disable-next-line import/no-mutable-exports
let config: NextConfig = withNextIntl({
  output: 'standalone', // for deploying
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    '@workspace/core',
    '@t3-oss/env-nextjs',
    '@t3-oss/env-core',
  ],
  serverExternalPackages: ['pino', 'pino-pretty'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // testProxy: true, // need to enable for e2e testing
    optimizePackageImports: ['@workspace/core'],
  },
});

function withAnalyzer(sourceConfig: NextConfig): NextConfig {
  return withBundleAnalyzer()(sourceConfig);
}

if (process.env.ANALYZE === 'true') {
  config = withAnalyzer(withNextIntl(config));
}

export default config;
