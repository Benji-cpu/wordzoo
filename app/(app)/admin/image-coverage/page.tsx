import { getImageCoverageStats } from '@/lib/db/admin-queries';
import { ImageCoverageClient } from './ImageCoverageClient';

export default async function ImageCoveragePage() {
  const stats = await getImageCoverageStats();
  return <ImageCoverageClient stats={stats} />;
}
