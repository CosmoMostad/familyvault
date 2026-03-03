import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface Props {
  width: number;
  height: number;
}

const DARK = '#2D6A4F';   // primary green — outlines + midribs
const LIGHT = '#52B788';  // lighter green — secondary veins + accent leaves

/**
 * Botanical line-art leaf illustration for the member profile background.
 * Proper leaf outlines, midribs, and veins — dark + light green on cream.
 */
export default function ProfileBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* ═══════════════════════════════════════════
          CLUSTER 1 — Top-right corner
          Large leaf sweeping down-left + two smaller
      ══════════════════════════════════════════════ */}

      {/* Leaf A — large, primary, top-right */}
      <G opacity={0.22} transform={`translate(${w + 10}, 30) rotate(145)`}>
        {/* Outline */}
        <Path
          d="M 0 0 C 38 25, 52 95, 38 185 C 28 230, -10 238, -32 198 C -52 155, -42 75, 0 0 Z"
          stroke={DARK} strokeWidth="1.6" fill="rgba(45,106,79,0.06)" strokeLinejoin="round"
        />
        {/* Midrib */}
        <Path d="M 0 0 Q 4 100, 2 210" stroke={DARK} strokeWidth="1.1" fill="none" />
        {/* Right veins */}
        <Path d="M 2 45 Q 30 38, 40 28" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 3 80 Q 36 72, 46 62" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 3 115 Q 38 107, 48 96" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 3 148 Q 36 142, 44 132" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 2 175 Q 28 172, 34 164" stroke={DARK} strokeWidth="0.7" fill="none" />
        {/* Left veins */}
        <Path d="M 2 45 Q -28 38, -36 28" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 3 80 Q -33 72, -42 62" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 3 115 Q -36 107, -44 96" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 3 148 Q -32 142, -38 133" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 2 175 Q -24 172, -30 165" stroke={DARK} strokeWidth="0.7" fill="none" />
      </G>

      {/* Leaf B — medium, lighter, slightly behind */}
      <G opacity={0.16} transform={`translate(${w - 30}, -15) rotate(158)`}>
        <Path
          d="M 0 0 C 28 20, 38 75, 26 145 C 18 178, -8 184, -24 155 C -38 120, -30 55, 0 0 Z"
          stroke={LIGHT} strokeWidth="1.4" fill="rgba(82,183,136,0.05)" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 2 75, 0 160" stroke={LIGHT} strokeWidth="1" fill="none" />
        <Path d="M 1 35 Q 22 28, 30 20" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 65 Q 28 57, 34 47" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 95 Q 28 88, 32 78" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 122 Q 24 117, 26 108" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 35 Q -20 28, -26 20" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 65 Q -25 57, -30 47" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 95 Q -26 88, -30 78" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 122 Q -22 117, -24 108" stroke={LIGHT} strokeWidth="0.7" fill="none" />
      </G>

      {/* Leaf C — small accent, far right */}
      <G opacity={0.18} transform={`translate(${w - 5}, 180) rotate(170)`}>
        <Path
          d="M 0 0 C 18 14, 24 52, 16 96 C 10 118, -6 122, -16 102 C -24 78, -18 35, 0 0 Z"
          stroke={DARK} strokeWidth="1.2" fill="none" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 1 50, 0 105" stroke={DARK} strokeWidth="0.9" fill="none" />
        <Path d="M 0 28 Q 14 22, 18 15" stroke={DARK} strokeWidth="0.65" fill="none" />
        <Path d="M 0 52 Q 16 46, 20 38" stroke={DARK} strokeWidth="0.65" fill="none" />
        <Path d="M 0 75 Q 14 70, 16 62" stroke={DARK} strokeWidth="0.65" fill="none" />
        <Path d="M 0 28 Q -12 22, -16 15" stroke={DARK} strokeWidth="0.65" fill="none" />
        <Path d="M 0 52 Q -14 46, -18 38" stroke={DARK} strokeWidth="0.65" fill="none" />
        <Path d="M 0 75 Q -12 70, -14 62" stroke={DARK} strokeWidth="0.65" fill="none" />
      </G>

      {/* ═══════════════════════════════════════════
          CLUSTER 2 — Bottom-left corner
          Two large leaves curling up from the corner
      ══════════════════════════════════════════════ */}

      {/* Leaf D — large, primary, bottom-left */}
      <G opacity={0.2} transform={`translate(-15, ${h + 20}) rotate(-35)`}>
        <Path
          d="M 0 0 C 36 -28, 52 -100, 36 -192 C 24 -238, -12 -244, -34 -204 C -54 -158, -42 -78, 0 0 Z"
          stroke={DARK} strokeWidth="1.6" fill="rgba(45,106,79,0.06)" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 4 -100, 0 -215" stroke={DARK} strokeWidth="1.1" fill="none" />
        <Path d="M 1 -45 Q 30 -36, 40 -26" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 2 -82 Q 36 -73, 46 -62" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 2 -118 Q 38 -109, 46 -98" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 2 -152 Q 35 -145, 42 -135" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 1 -180 Q 26 -175, 32 -168" stroke={DARK} strokeWidth="0.7" fill="none" />
        <Path d="M 1 -45 Q -28 -36, -36 -26" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 2 -82 Q -33 -73, -42 -62" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 2 -118 Q -36 -109, -44 -98" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 2 -152 Q -32 -145, -38 -136" stroke={DARK} strokeWidth="0.8" fill="none" />
        <Path d="M 1 -180 Q -23 -175, -28 -168" stroke={DARK} strokeWidth="0.7" fill="none" />
      </G>

      {/* Leaf E — medium, lighter, beside D */}
      <G opacity={0.15} transform={`translate(50, ${h + 10}) rotate(-50)`}>
        <Path
          d="M 0 0 C 26 -22, 36 -80, 24 -150 C 15 -185, -8 -190, -22 -160 C -36 -124, -28 -58, 0 0 Z"
          stroke={LIGHT} strokeWidth="1.4" fill="rgba(82,183,136,0.05)" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 2 -78, 0 -165" stroke={LIGHT} strokeWidth="1" fill="none" />
        <Path d="M 1 -38 Q 22 -30, 28 -22" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 -68 Q 26 -60, 32 -50" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 -98 Q 26 -91, 30 -82" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 -125 Q 22 -119, 26 -111" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 -38 Q -20 -30, -24 -22" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 -68 Q -23 -60, -28 -50" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 -98 Q -23 -91, -27 -82" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 -125 Q -20 -119, -23 -111" stroke={LIGHT} strokeWidth="0.7" fill="none" />
      </G>

      {/* ═══════════════════════════════════════════
          ACCENT — single small leaf, mid-right edge
      ══════════════════════════════════════════════ */}
      <G opacity={0.14} transform={`translate(${w + 5}, ${h * 0.52}) rotate(190)`}>
        <Path
          d="M 0 0 C 22 16, 30 60, 20 110 C 12 136, -7 140, -18 118 C -28 90, -22 42, 0 0 Z"
          stroke={LIGHT} strokeWidth="1.2" fill="none" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 2 58, 0 122" stroke={LIGHT} strokeWidth="0.9" fill="none" />
        <Path d="M 1 30 Q 16 24, 22 16" stroke={LIGHT} strokeWidth="0.65" fill="none" />
        <Path d="M 1 58 Q 18 52, 24 44" stroke={LIGHT} strokeWidth="0.65" fill="none" />
        <Path d="M 1 84 Q 16 78, 18 70" stroke={LIGHT} strokeWidth="0.65" fill="none" />
        <Path d="M 1 30 Q -14 24, -18 16" stroke={LIGHT} strokeWidth="0.65" fill="none" />
        <Path d="M 1 58 Q -16 52, -20 44" stroke={LIGHT} strokeWidth="0.65" fill="none" />
        <Path d="M 1 84 Q -14 78, -16 70" stroke={LIGHT} strokeWidth="0.65" fill="none" />
      </G>
    </Svg>
  );
}
