import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface Props {
  width: number;
  height: number;
}

const DARK  = '#1B4332';  // deepest forest green
const MID   = '#2D6A4F';  // dark forest green
const LIGHT = '#40916C';  // mid forest green (no mint)

// ── Reusable leaf paths (all pointing "up" from origin at base) ──────────────

// Elongated tropical leaf
const LEAF_A = 'M 0 0 C 28 -10 52 -62 42 -128 C 32 -166 4 -182 -7 -164 C -22 -138 -18 -58 0 0 Z';

// Wider oval leaf
const LEAF_B = 'M 0 0 C 50 -4 82 -46 76 -108 C 68 -152 28 -170 0 -166 C -28 -170 -68 -152 -76 -108 C -82 -46 -50 -4 0 0 Z';

// Small slim leaf
const LEAF_C = 'M 0 0 C 14 -5 22 -34 16 -68 C 10 -88 -3 -92 -8 -80 C -14 -62 -10 -26 0 0 Z';

// Sweeping narrow leaf (slightly curved)
const LEAF_D = 'M 0 0 C 20 -8 34 -50 26 -100 C 18 -132 2 -142 -5 -128 C -16 -104 -13 -44 0 0 Z';

export default function ProfileBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* ══════════════════════════════════════
          TOP-RIGHT CLUSTER
          Leaves radiate INTO the screen from top-right corner
      ══════════════════════════════════════ */}

      {/* Back leaf — wide oval, sweeping left */}
      <G opacity={0.16} transform={`translate(${w - 20}, 110) rotate(145)`}>
        <Path d={LEAF_B} fill={MID} />
      </G>

      {/* Main leaf — elongated, angled toward center */}
      <G opacity={0.22} transform={`translate(${w - 50}, 55) rotate(130)`}>
        <Path d={LEAF_A} fill={DARK} />
        {/* subtle midrib */}
        <Path d="M 0 0 Q 4 -72 -2 -158" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" fill="none" />
      </G>

      {/* Front leaf — narrow, pointing more steeply */}
      <G opacity={0.2} transform={`translate(${w - 15}, 40) rotate(158)`}>
        <Path d={LEAF_D} fill={DARK} />
      </G>

      {/* Small accent leaf — sits at corner, pointing in */}
      <G opacity={0.18} transform={`translate(${w - 35}, 15) rotate(120)`}>
        <Path d={LEAF_C} fill={LIGHT} />
      </G>

      {/* Extra small leaf — far right, low */}
      <G opacity={0.2} transform={`translate(${w - 5}, 160) rotate(170)`}>
        <Path d={LEAF_C} fill={MID} />
      </G>


      {/* ══════════════════════════════════════
          BOTTOM-LEFT CLUSTER
          Leaves radiate INTO the screen from bottom-left corner
      ══════════════════════════════════════ */}

      {/* Back leaf — wide oval, sweeping right */}
      <G opacity={0.16} transform={`translate(15, ${h - 100}) rotate(-32)`}>
        <Path d={LEAF_B} fill={MID} />
      </G>

      {/* Main leaf — elongated, angled toward center */}
      <G opacity={0.22} transform={`translate(55, ${h - 55}) rotate(-50)`}>
        <Path d={LEAF_A} fill={DARK} />
        <Path d="M 0 0 Q 4 -72 -2 -158" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" fill="none" />
      </G>

      {/* Front narrow leaf */}
      <G opacity={0.2} transform={`translate(20, ${h - 35}) rotate(-22)`}>
        <Path d={LEAF_D} fill={DARK} />
      </G>

      {/* Small accent */}
      <G opacity={0.18} transform={`translate(100, ${h - 40}) rotate(-65)`}>
        <Path d={LEAF_C} fill={LIGHT} />
      </G>

      {/* Extra slim leaf poking in from bottom */}
      <G opacity={0.15} transform={`translate(155, ${h - 20}) rotate(-80)`}>
        <Path d={LEAF_D} fill={MID} />
      </G>
    </Svg>
  );
}
