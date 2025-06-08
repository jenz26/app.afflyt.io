'use client';

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors hover:underline"
    >
      ← Torna indietro
    </button>
  );
}