import { ImageResponse } from 'next/og';
import { getPublicWordData } from '@/lib/db/public-queries';

export const runtime = 'edge';
export const alt = 'WordZoo — Learn with mnemonics';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ wordId: string }> }) {
  const { wordId } = await params;
  const data = await getPublicWordData(wordId);

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a1628 0%, #1e293b 100%)',
            color: 'white',
            fontSize: 64,
            fontWeight: 'bold',
          }}
        >
          WordZoo
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #0a1628 0%, #1e293b 100%)',
          color: 'white',
        }}
      >
        {/* Left: Image or word */}
        <div
          style={{
            display: 'flex',
            width: '50%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {data.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.image_url}
              alt=""
              width={600}
              height={630}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            <div style={{ display: 'flex', fontSize: 96, fontWeight: 'bold' }}>
              {data.word_text}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            height: '100%',
            padding: '48px 40px',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', fontSize: 20, opacity: 0.5, fontWeight: 'bold' }}>
            WordZoo
          </div>
          <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold' }}>
            {data.word_text}
          </div>
          {data.romanization && (
            <div style={{ display: 'flex', fontSize: 24, opacity: 0.6 }}>
              {data.romanization}
            </div>
          )}
          <div style={{ display: 'flex', fontSize: 28, opacity: 0.8 }}>
            &ldquo;{data.meaning_en}&rdquo; in {data.language_name}
          </div>
          {data.keyword_text && (
            <div style={{ display: 'flex', fontSize: 22, color: '#F97316', marginTop: 8 }}>
              Sounds like &ldquo;{data.keyword_text}&rdquo;
            </div>
          )}
          <div
            style={{
              display: 'flex',
              marginTop: 16,
              fontSize: 18,
              opacity: 0.4,
            }}
          >
            Learn with memorable mnemonics
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
