export function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="loading-screen" aria-live="polite">
      <div className="spinner" />
      <p>{message}</p>
    </main>
  );
}
