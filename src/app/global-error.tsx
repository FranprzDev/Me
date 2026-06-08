"use client";

/**
 * Error boundary global. Reemplaza la página interna `/_global-error` de Next,
 * cuya prerenderización por defecto dispara un invariant en Next 16.2.x
 * ("Expected workStore to be initialized") y rompe el build.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#050817",
          color: "#f4f4f8",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", margin: 0 }}>Algo salió mal</h1>
        <p style={{ color: "#c2c2da", maxWidth: 420, margin: 0 }}>
          Ocurrió un error inesperado. Probá de nuevo.
        </p>
        <button
          onClick={() => reset()}
          style={{
            cursor: "pointer",
            padding: "0.7rem 1.4rem",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.06)",
            color: "#f4f4f8",
            fontSize: "0.95rem",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
