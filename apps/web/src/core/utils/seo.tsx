import type { Metadata } from 'next';
import { assign } from 'radashi';
import type { Thing, WithContext } from 'schema-dts';

type MetadataGenerator = Omit<Metadata, 'description' | 'title'> & {
  title: string;
  description: string;
  image?: string;
};

const applicationName = '@workspace/web';
const author = {
  name: 'Rizeki Rifandani',
  url: 'https://github.com/rifandani',
};
const publisher = 'Rizeki Rifandani';
const twitterHandle = '@tri_rizeki';

/**
 * Creates metadata for SEO optimization and social sharing.
 *
 * @returns {Metadata} The complete metadata object
 *
 * @example
 * const metadata = createMetadata({
 *   title: 'Home Page',
 *   description: 'Welcome to our site',
 *   image: '/images/og-image.jpg'
 * })
 */
export function createMetadata({
  title,
  description,
  image,
  ...properties
}: MetadataGenerator) {
  const parsedTitle = `${title} | ${applicationName}`;
  const defaultMetadata: Metadata = {
    title: parsedTitle,
    description,
    applicationName,
    authors: author,
    creator: author.name,
    formatDetection: {
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: parsedTitle,
    },
    openGraph: {
      title: parsedTitle,
      description,
      type: 'website',
      siteName: applicationName,
      locale: 'en_US',
      images: [`/api/og?title=${encodeURIComponent(title)}`],
    },
    publisher,
    twitter: {
      card: 'summary_large_image',
      creator: twitterHandle,
    },
    icons: '/favicon.ico',
  };

  // Merge the default metadata with any additional properties passed in
  const metadata = assign(defaultMetadata, properties);

  // If an image URL was provided and OpenGraph metadata exists,
  // override the default OG image with the provided image details
  if (image && metadata.openGraph) {
    metadata.openGraph.images = [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: title,
      },
    ];
  }

  // Return the final merged metadata object
  return metadata;
}

interface JsonLdProps {
  code: WithContext<Thing>;
}

/**
 * designed to create fully validated Google structured data, making your content more likely to be featured in Google Search results
 */
export function JsonLd({ code }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
      dangerouslySetInnerHTML={{ __html: JSON.stringify(code) }}
    />
  );
}

export * from 'schema-dts';
