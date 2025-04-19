'use client';

import { Badge } from '@/core/components/ui/badge';
import { Card } from '@/core/components/ui/card';
import type { ImageTable } from '@/core/db/schema';
import Image from 'next/image';

export function ImageCard({
  image,
}: {
  image: ImageTable & { similarity: number };
}) {
  return (
    <Card
      key={image.id}
      className="group relative h-[250px] overflow-hidden rounded-lg md:h-[450px]"
    >
      <div className="absolute inset-0 z-10">
        <span className="sr-only">View image</span>
      </div>
      <Image
        src={image.path}
        alt={image.description}
        title={image.title}
        width={300}
        height={450}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/70 p-6 text-center text-white opacity-0 transition-opacity group-hover:opacity-100">
        <h3 className="font-semibold text-xl">{image.title}</h3>
        <p className="mt-2 hidden overflow-y-hidden text-sm md:block">
          {image.description}
        </p>
      </div>
      {image.similarity ? (
        <div className="absolute bottom-2 left-2 z-10 py-2">
          {image.similarity !== 1 ? (
            <>
              <Badge className="block bg-green-100 text-green-700 sm:hidden">
                Similarity: {image.similarity?.toFixed(3)}
              </Badge>
              <Badge className="hidden bg-green-100 text-green-700 sm:block">
                Semantic Match: {image.similarity?.toFixed(3)}
              </Badge>
            </>
          ) : (
            <Badge intent={'secondary'}>Direct Match</Badge>
          )}
        </div>
      ) : null}
    </Card>
  );
}
