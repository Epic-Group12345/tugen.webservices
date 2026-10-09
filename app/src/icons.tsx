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

/** Discord — связь с разработчиком: залитый силуэт, чтобы значок читался и в 16 px */
export const DiscordIcon: Glyph = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M19.3 5.3A17 17 0 0 0 15 4l-.5 1a15.5 15.5 0 0 0-5 0L9 4a17 17 0 0 0-4.3 1.3C2 9.4 1.3 13.4 1.6 17.3A17 17 0 0 0 6.9 20l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.2 12.2 0 0 0 10.6 0l.4.3a11 11 0 0 1-1.7.8l1.1 1.8a17 17 0 0 0 5.3-2.7c.4-4.5-.7-8.5-3.1-12zM8.5 11.1a1.8 1.9 0 1 0 0 3.8 1.8 1.9 0 1 0 0-3.8zm7 0a1.8 1.9 0 1 0 0 3.8 1.8 1.9 0 1 0 0-3.8z"
    />
  </svg>
);

export const PlusIcon = glyph(<path d="M12 5v14M5 12h14" />);
export const TrashIcon = glyph(
  <>
    <path d="M4 7h16M9 7V4.5h6V7" />
    <path d="M6.5 7l1 12.5h9l1-12.5" />
  </>,
);
export const ArrowLeftIcon = glyph(<path d="M15 5l-7 7 7 7" />);
export const ArrowRightIcon = glyph(<path d="M9 5l7 7-7 7" />);
export const ArrowUpIcon = glyph(<path d="M5 15l7-7 7 7" />);
export const ArrowDownIcon = glyph(<path d="M5 9l7 7 7-7" />);
