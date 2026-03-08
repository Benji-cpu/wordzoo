export default async function LearnPage({
  params,
}: {
  params: Promise<{ sceneId: string }>;
}) {
  const { sceneId } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Learn</h1>
      <p className="mt-2 text-gray-600">Scene {sceneId} learning view will appear here.</p>
    </div>
  );
}
