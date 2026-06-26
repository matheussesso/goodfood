import Link from 'next/link';

export default function NotFound() {
  return (
    <html>
      <head>
        <title>Not Found</title>
      </head>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Página não encontrada</h2>
          <p>Desculpe, não conseguimos encontrar a página solicitada.</p>
          <Link href="/">Voltar ao início</Link>
        </div>
      </body>
    </html>
  );
}
