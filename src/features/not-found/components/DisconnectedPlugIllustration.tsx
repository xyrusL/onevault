import React from 'react';

interface DisconnectedPlugIllustrationProps {
  isDark?: boolean;
  className?: string;
}

export const DisconnectedPlugIllustration: React.FC<DisconnectedPlugIllustrationProps> = ({
  isDark = false,
  className = '',
}) => {
  const strokeColor = isDark ? '#f4f4f5' : '#09090b';
  const fillColor = isDark ? '#121215' : '#ffffff';
  // Vivid electric color: cyan in dark mode, vibrant amber/electric blue in light mode
  const sparkColor = isDark ? '#38bdf8' : '#0284c7';
  const sparkCoreColor = isDark ? '#e0f2fe' : '#38bdf8';
  const glowFilter = isDark ? 'url(#electric-glow)' : 'url(#subtle-glow)';

  return (
    <svg
      viewBox="0 0 920 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto select-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Electric neon glow filter for dark mode */}
        <filter id="electric-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle glow filter for light mode */}
        <filter id="subtle-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Electric Spark Keyframe Animations */}
        <style>{`
          @keyframes electric-zap-1 {
            0%, 100% { opacity: 0; }
            2% { opacity: 1; }
            5% { opacity: 0.15; }
            8% { opacity: 0.95; }
            12% { opacity: 0; }
            28% { opacity: 0; }
            30% { opacity: 1; }
            34% { opacity: 0.1; }
            37% { opacity: 0.9; }
            41% { opacity: 0; }
            64% { opacity: 0; }
            66% { opacity: 1; }
            70% { opacity: 0.2; }
            73% { opacity: 0.95; }
            78% { opacity: 0; }
            89% { opacity: 0; }
            91% { opacity: 0.85; }
            94% { opacity: 0; }
          }

          @keyframes electric-zap-2 {
            0%, 100% { opacity: 0; }
            14% { opacity: 0; }
            16% { opacity: 1; }
            20% { opacity: 0.2; }
            23% { opacity: 0.9; }
            27% { opacity: 0; }
            48% { opacity: 0; }
            50% { opacity: 1; }
            54% { opacity: 0.1; }
            57% { opacity: 0.95; }
            61% { opacity: 0; }
            80% { opacity: 0; }
            82% { opacity: 1; }
            86% { opacity: 0.2; }
            89% { opacity: 0.9; }
            93% { opacity: 0; }
          }

          @keyframes electric-zap-3 {
            0%, 100% { opacity: 0; }
            7% { opacity: 0; }
            9% { opacity: 1; }
            13% { opacity: 0; }
            39% { opacity: 0; }
            41% { opacity: 1; }
            45% { opacity: 0; }
            72% { opacity: 0; }
            74% { opacity: 1; }
            77% { opacity: 0; }
          }

          @keyframes spark-burst-pulse {
            0%, 100% {
              opacity: 0.45;
              transform: scale(0.92);
            }
            7% {
              opacity: 1;
              transform: scale(1.1);
            }
            12% {
              opacity: 0.4;
              transform: scale(0.94);
            }
            32% {
              opacity: 1;
              transform: scale(1.14);
            }
            38% {
              opacity: 0.35;
              transform: scale(0.92);
            }
            67% {
              opacity: 1;
              transform: scale(1.16);
            }
            74% {
              opacity: 0.4;
              transform: scale(0.95);
            }
            90% {
              opacity: 0.95;
              transform: scale(1.08);
            }
            95% {
              opacity: 0.4;
              transform: scale(0.92);
            }
          }

          @keyframes spark-stars-pop {
            0%, 100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            8% {
              opacity: 1;
              transform: scale(1.3);
            }
            14% {
              opacity: 0.35;
              transform: scale(0.85);
            }
            33% {
              opacity: 1;
              transform: scale(1.4);
            }
            40% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            68% {
              opacity: 1;
              transform: scale(1.35);
            }
            75% {
              opacity: 0.35;
              transform: scale(0.85);
            }
          }

          .electric-arc-1 {
            animation: electric-zap-1 2.2s ease-in-out infinite;
          }

          .electric-arc-2 {
            animation: electric-zap-2 2.6s ease-in-out infinite;
          }

          .electric-arc-3 {
            animation: electric-zap-3 1.9s ease-in-out infinite;
          }

          .spark-burst-group {
            transform-origin: 445px 113.5px;
            animation: spark-burst-pulse 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
          }

          .spark-stars-group {
            transform-origin: 445px 113.5px;
            animation: spark-stars-pop 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
          }
        `}</style>
      </defs>

      {/* ================= LEFT CABLE (Double-line with fill) ================= */}
      <path
        d="M 0 105 C 100 88, 220 128, 320 108 L 320 118 C 220 138, 100 98, 0 115 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Left Cable Strain Relief (segmented collar) */}
      <rect
        x="320"
        y="103"
        width="16"
        height="20"
        rx="2"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      <line x1="326" y1="105" x2="326" y2="121" stroke={strokeColor} strokeWidth="2" />
      <line x1="331" y1="105" x2="331" y2="121" stroke={strokeColor} strokeWidth="2" />

      {/* ================= LEFT FEMALE CONNECTOR (Socket) ================= */}
      <path
        d="M 336 100 C 342 100, 348 94, 355 94 L 360 94 L 360 132 L 355 132 C 348 132, 342 126, 336 126 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect
        x="360"
        y="92"
        width="44"
        height="42"
        rx="4"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      {/* Grip ribs on socket */}
      <line x1="371" y1="99" x2="371" y2="127" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="377" y1="99" x2="377" y2="127" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="383" y1="99" x2="383" y2="127" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      {/* Front rim */}
      <rect
        x="404"
        y="88"
        width="10"
        height="50"
        rx="3"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />

      {/* ================= RIGHT MALE CONNECTOR (Plug with Prongs) ================= */}
      <rect
        x="476"
        y="88"
        width="10"
        height="50"
        rx="3"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      <rect
        x="486"
        y="92"
        width="44"
        height="42"
        rx="4"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      {/* Grip ribs on plug */}
      <line x1="497" y1="99" x2="497" y2="127" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="503" y1="99" x2="503" y2="127" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="509" y1="99" x2="509" y2="127" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M 530 94 L 535 94 C 542 94, 548 100, 554 100 L 554 126 C 548 126, 542 132, 535 132 L 530 132 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Right Cable Strain Relief */}
      <rect
        x="554"
        y="103"
        width="16"
        height="20"
        rx="2"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      <line x1="560" y1="105" x2="560" y2="121" stroke={strokeColor} strokeWidth="2" />
      <line x1="565" y1="105" x2="565" y2="121" stroke={strokeColor} strokeWidth="2" />

      {/* ================= RIGHT CABLE (Double-line with fill) ================= */}
      <path
        d="M 570 108 C 670 128, 790 88, 920 105 L 920 115 C 790 98, 670 138, 570 118 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* ================= MALE PRONGS (Extending Leftward) ================= */}
      {/* Top prong */}
      <rect
        x="442"
        y="99"
        width="34"
        height="9"
        rx="3"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      <circle cx="451" cy="103.5" r="1.6" fill={strokeColor} />

      {/* Bottom prong */}
      <rect
        x="442"
        y="118"
        width="34"
        height="9"
        rx="3"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      <circle cx="451" cy="122.5" r="1.6" fill={strokeColor} />

      {/* ================= DYNAMIC ELECTRIC ARCS (Zapping between socket & prongs) ================= */}
      {/* Arc 1: Upper lightning zap */}
      <path
        d="M 414 103 L 421 98 L 425 106 L 431 100 L 436 107 L 442 103.5"
        fill="none"
        stroke={sparkCoreColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glowFilter}
        className="electric-arc-1"
      />

      {/* Arc 2: Lower lightning zap */}
      <path
        d="M 414 123 L 422 128 L 426 120 L 432 126 L 437 119 L 442 122.5"
        fill="none"
        stroke={sparkCoreColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glowFilter}
        className="electric-arc-2"
      />

      {/* Arc 3: Center dynamic electric bridge */}
      <path
        d="M 414 113 L 420 108 L 424 117 L 430 110 L 436 118 L 442 113.5"
        fill="none"
        stroke={sparkColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glowFilter}
        className="electric-arc-3"
      />

      {/* ================= RADIATING SPARK RAYS (Animated Pulse & Micro-Flicker) ================= */}
      <g
        className="spark-burst-group"
        stroke={sparkColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        filter={glowFilter}
      >
        {/* Top spark rays */}
        <line x1="445" y1="68" x2="445" y2="44" />
        <line x1="428" y1="74" x2="415" y2="52" />
        <line x1="462" y1="74" x2="475" y2="52" />
        <line x1="412" y1="84" x2="394" y2="69" />
        <line x1="478" y1="84" x2="496" y2="69" />

        {/* Bottom spark rays */}
        <line x1="445" y1="158" x2="445" y2="182" />
        <line x1="428" y1="152" x2="415" y2="174" />
        <line x1="462" y1="152" x2="475" y2="174" />
        <line x1="412" y1="142" x2="394" y2="157" />
        <line x1="478" y1="142" x2="496" y2="157" />
      </g>

      {/* ================= SPARK STARS / DIAMONDS (Animated Pop) ================= */}
      <g className="spark-stars-group" fill={sparkColor} filter={glowFilter}>
        {/* Top spark diamond */}
        <path d="M 445 32 L 447.5 37 L 452.5 39.5 L 447.5 42 L 445 47 L 442.5 42 L 437.5 39.5 L 442.5 37 Z" />
        {/* Bottom spark diamond */}
        <path d="M 445 189 L 447.5 194 L 452.5 196.5 L 447.5 199 L 445 204 L 442.5 199 L 437.5 196.5 L 442.5 194 Z" />
        {/* Left and right micro spark diamonds */}
        <path d="M 405 113 L 406.5 115.5 L 409 116.5 L 406.5 117.5 L 405 120 L 403.5 117.5 L 401 116.5 L 403.5 115.5 Z" />
        <path d="M 485 113 L 486.5 115.5 L 489 116.5 L 486.5 117.5 L 485 120 L 483.5 117.5 L 481 116.5 L 483.5 115.5 Z" />
      </g>
    </svg>
  );
};
