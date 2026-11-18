import React, { useState } from 'react';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
  fallbackIcon?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackLabel,
  fallbackIcon = 'checkroom',
  ...rest
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-high text-secondary p-3 text-center ${className}`}
        role="img"
        aria-label={alt || fallbackLabel || 'Prenda Aurelle'}
      >
        <span className="material-symbols-outlined text-[28px] opacity-60">{fallbackIcon}</span>
        {fallbackLabel && (
          <span className="mt-1 text-[10px] font-medium tracking-wide uppercase opacity-75 line-clamp-2">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
