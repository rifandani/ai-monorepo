import { ImageCard } from '@/app/search/image-card';
import { Searchbar } from '@/app/search/searchbar';
import { getImagesAction } from '@/core/actions/image';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query: string }>;
}) {
  const { query } = await searchParams;
  const result = await getImagesAction({ query });

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-2 font-bold text-2xl">Semantic Search</h1>
      <Searchbar />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(result?.data?.data ?? []).map((image) => (
          <div key={image.id}>
            <ImageCard image={image} />
          </div>
        ))}
      </div>
    </div>
  );
}
