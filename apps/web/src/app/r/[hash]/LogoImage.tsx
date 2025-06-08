'use client';

import { useState } from 'react';

interface LogoImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function LogoImage({ src, alt, className }: LogoImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null; // Non mostrare nulla se l'immagine non carica
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}