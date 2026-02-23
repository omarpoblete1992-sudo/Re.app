// Esta es la orden más importante. Le dice a Next.js:
// "No intentes pre-construir esta página. Déjala en paz".
export const dynamic = 'force-dynamic';

// Un componente simple que no importa NADA más.
export default function NotFound() {
  return (
    <div style={{
      fontFamily: 'sans-serif',
      height: '100vh',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div>
        <h1 style={{
          display: 'inline-block',
          borderRight: '1px solid rgba(0, 0, 0, 0.3)',
          margin: 0,
          marginRight: '20px',
          padding: '10px 23px 10px 0',
          fontSize: '24px',
          fontWeight: 500,
          verticalAlign: 'top'
        }}>
          404
        </h1>
        <div style={{
          display: 'inline-block',
          textAlign: 'left',
          lineHeight: '49px',
          height: '49px',
          verticalAlign: 'middle'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '28px',
            margin: 0
          }}>
            Esta página no ha sido encontrada.
          </h2>
        </div>
      </div>
      <a href="/" style={{ marginTop: '20px', color: '#0070f3', textDecoration: 'none' }}>
        Volver al inicio
      </a>
    </div>
  );
}
