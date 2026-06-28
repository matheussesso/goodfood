import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('NotFound');
  return (
    <html>
      <head>
        <title>{t('title')}</title>
      </head>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>{t('title')}</h2>
          <p>{t('description')}</p>
          <Link href="/">{t('back_home')}</Link>
        </div>
      </body>
    </html>
  );
}
