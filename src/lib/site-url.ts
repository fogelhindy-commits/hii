export function getAppOrigin(fallback?: string) {
  const configured = process.env.APP_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return (fallback || "http://localhost:3000").replace(/\/$/, "");
}
