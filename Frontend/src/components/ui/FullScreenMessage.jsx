// Centred one-line status filling the screen (auth loading states).
export default function FullScreenMessage({ children }) {
  return (
    <div className="min-h-screen bg-soft flex items-center justify-center text-secondary text-sm">
      {children}
    </div>
  );
}
