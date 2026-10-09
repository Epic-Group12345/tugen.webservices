import React from 'react';

// Значки страницы: SVG в DOM напрямую — react-native-svg вебу не нужен. Контур рисуется
// currentColor, поэтому цвет задаёт класс text-*, который передаёт элемент kit (IconComponent)

export type Glyph = React.FC<{ size?: number; className?: string }>;

const glyph =
  (paths: React.ReactNode): Glyph =>
  ({ size = 16, className }) =>
    (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
      >
        {paths}
      </svg>
    );

export const PlayIcon = glyph(
  <path d="M7 4.5v15l12-7.5z" fill="currentColor" />,
);

export const DownloadIcon = glyph(
  <>
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </>,
);

export const ServersIcon = glyph(
  <>
    <rect x="3" y="4" width="18" height="7" rx="2" />
    <rect x="3" y="13" width="18" height="7" rx="2" />
    <path d="M7 7.5h.01M7 16.5h.01" />
  </>,
);

export const ModsIcon = glyph(
  <>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </>,
);

export const FriendsIcon = glyph(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
  </>,
);

/** Знак TUGEN: зелёный квадрат «Играть» — цвет запуска игры из DESIGN.md */
export const LogoMark: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <rect width="24" height="24" rx="7" className="fill-green-600" />
    <path d="M9.5 7.5v9l7-4.5z" className="fill-mist-50" />
  </svg>
);
