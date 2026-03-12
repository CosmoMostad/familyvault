/**
 * FamilyBotanical — My Accounts screen background
 * Style: sweeping tropical leaves
 * Layout: TOP-LEFT + BOTTOM-RIGHT (large) + BOTTOM-LEFT (accent)
 * ⚠️  Top-right corner intentionally clear — header bell + 3-dot icons live there
 */
import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface Props { width: number; height: number; }

const DARK  = '#1B4332';
const MID   = '#2D6A4F';
const LIGHT = '#40916C';
const PALE  = '#52B788';

const LEAF_A = 'M 0 0 C 28 -10 52 -62 42 -128 C 32 -166 4 -182 -7 -164 C -22 -138 -18 -58 0 0 Z';
const LEAF_B = 'M 0 0 C 50 -4 82 -46 76 -108 C 68 -152 28 -170 0 -166 C -28 -170 -68 -152 -76 -108 C -82 -46 -50 -4 0 0 Z';
const LEAF_C = 'M 0 0 C 14 -5 22 -34 16 -68 C 10 -88 -3 -92 -8 -80 C -14 -62 -10 -26 0 0 Z';
const LEAF_D = 'M 0 0 C 20 -8 34 -50 26 -100 C 18 -132 2 -142 -5 -128 C -16 -104 -13 -44 0 0 Z';
const LEAF_E = 'M 0 0 C 36 -14 68 -78 56 -168 C 44 -220 8 -240 -8 -216 C -28 -182 -24 -72 0 0 Z';

export default function FamilyBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w} height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* ── TOP-LEFT CLUSTER (safe — no UI elements here) ── */}
      <G opacity={0.20} transform="translate(-10, 90) rotate(-40)">
        <Path d={LEAF_E} fill={DARK} />
      </G>
      <G opacity={0.22} transform="translate(50, 55) rotate(-55)">
        <Path d={LEAF_A} fill={MID} />
        <Path d="M 0 0 Q 4 -72 -2 -158" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" fill="none" />
      </G>
      <G opacity={0.18} transform="translate(15, 30) rotate(-25)">
        <Path d={LEAF_D} fill={DARK} />
      </G>
      <G opacity={0.16} transform="translate(80, 120) rotate(-65)">
        <Path d={LEAF_B} fill={LIGHT} />
      </G>
      <G opacity={0.20} transform="translate(-5, 170) rotate(-10)">
        <Path d={LEAF_C} fill={MID} />
      </G>
      <G opacity={0.14} transform="translate(110, 62) rotate(-75)">
        <Path d={LEAF_C} fill={PALE} />
      </G>

      {/* ── BOTTOM-RIGHT CLUSTER (same density as top-left) ── */}
      <G opacity={0.20} transform={`translate(${w + 10}, ${h - 90}) rotate(150)`}>
        <Path d={LEAF_E} fill={DARK} />
      </G>
      <G opacity={0.22} transform={`translate(${w - 45}, ${h - 50}) rotate(135)`}>
        <Path d={LEAF_A} fill={MID} />
        <Path d="M 0 0 Q 4 -72 -2 -158" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" fill="none" />
      </G>
      <G opacity={0.18} transform={`translate(${w - 10}, ${h - 30}) rotate(158)`}>
        <Path d={LEAF_D} fill={DARK} />
      </G>
      <G opacity={0.16} transform={`translate(${w - 80}, ${h - 120}) rotate(140)`}>
        <Path d={LEAF_B} fill={LIGHT} />
      </G>
      <G opacity={0.20} transform={`translate(${w + 5}, ${h - 175}) rotate(172)`}>
        <Path d={LEAF_C} fill={MID} />
      </G>
      <G opacity={0.14} transform={`translate(${w - 115}, ${h - 62}) rotate(125)`}>
        <Path d={LEAF_C} fill={PALE} />
      </G>

      {/* ── BOTTOM-LEFT ACCENT ── */}
      <G opacity={0.16} transform={`translate(20, ${h - 55}) rotate(-15)`}>
        <Path d={LEAF_D} fill={MID} />
      </G>
      <G opacity={0.14} transform={`translate(55, ${h - 30}) rotate(-30)`}>
        <Path d={LEAF_C} fill={DARK} />
      </G>
      <G opacity={0.12} transform={`translate(-5, ${h - 100}) rotate(-5)`}>
        <Path d={LEAF_C} fill={LIGHT} />
      </G>
    </Svg>
  );
}
