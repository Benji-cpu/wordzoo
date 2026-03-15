import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { ShareImageQuerySchema } from '@/types/api';
import { getMnemonicForShare } from '@/lib/db/community-queries';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mnemonicId: string }> }
) {
  const { mnemonicId } = await params;

  const { searchParams } = request.nextUrl;
  const parsed = ShareImageQuerySchema.safeParse({
    format: searchParams.get('format') ?? undefined,
  });
  const format = parsed.success ? parsed.data.format : 'square';

  const data = await getMnemonicForShare(mnemonicId);

  if (!data) {
    // Fallback: simple branded image
    const width = format === 'story' ? 1080 : 1200;
    const height = format === 'story' ? 1920 : 1200;

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
      { width, height }
    );
  }

  if (format === 'story') {
    // Story format: 1080x1920
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #0a1628 0%, #1e293b 50%, #0a1628 100%)',
            color: 'white',
            padding: 60,
          }}
        >
          {/* Branding top */}
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 'bold', opacity: 0.8 }}>
            WordZoo
          </div>

          {/* Image center */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 40,
              marginBottom: 40,
            }}
          >
            {data.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.image_url}
                alt=""
                width={960}
                height={720}
                style={{ borderRadius: 24, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 960,
                  height: 720,
                  borderRadius: 24,
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 120,
                }}
              >
                {data.word_text}
              </div>
            )}
          </div>

          {/* Word + keyword + CTA bottom */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', fontSize: 64, fontWeight: 'bold' }}>
              {data.word_text}
            </div>
            <div style={{ display: 'flex', fontSize: 36, opacity: 0.7 }}>
              &ldquo;{data.meaning_en}&rdquo; in {data.language_name}
            </div>
            <div style={{ display: 'flex', fontSize: 32, color: '#F97316' }}>
              Sounds like &ldquo;{data.keyword_text}&rdquo;
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 40,
                fontSize: 28,
                background: '#F97316',
                padding: '16px 48px',
                borderRadius: 16,
                fontWeight: 'bold',
              }}
            >
              Try WordZoo Free
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1920 }
    );
  }

  // Square format: 1200x1200
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a1628 0%, #1e293b 100%)',
          color: 'white',
        }}
      >
        {/* Image top 60% */}
        <div
          style={{
            display: 'flex',
            height: '60%',
            width: '100%',
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
              width={1200}
              height={720}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            <div style={{ display: 'flex', fontSize: 120, fontWeight: 'bold' }}>
              {data.word_text}
            </div>
          )}
        </div>

        {/* Info bottom 40% */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '40%',
            padding: '32px 48px',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 56, fontWeight: 'bold' }}>{data.word_text}</span>
            {data.romanization && (
              <span style={{ fontSize: 32, opacity: 0.6 }}>{data.romanization}</span>
            )}
          </div>
          <div style={{ display: 'flex', fontSize: 32, opacity: 0.7 }}>
            &ldquo;{data.meaning_en}&rdquo; in {data.language_name}
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#F97316' }}>
            Sounds like &ldquo;{data.keyword_text}&rdquo;
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 8,
              fontSize: 24,
              opacity: 0.5,
              fontWeight: 'bold',
            }}
          >
            WordZoo — Learn with mnemonics
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}
