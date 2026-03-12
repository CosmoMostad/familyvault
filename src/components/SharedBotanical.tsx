/**
 * SharedBotanical — Shared With Me screen background
 * Style: arching branches with full leaf clusters — more substantial than just vine lines
 * Layout: 4 areas — bottom-left (large), bottom-right (large), top-left (mid), top-right-ish (mid)
 * ⚠️  Top-right corner clear — header icons live there
 */
import React from 'react';
import Svg, { Path, G, Circle } from 'react-native-svg';

interface Props { width: number; height: number; }

const DARK  = '#1B4332';
const MID   = '#2D6A4F';
const LIGHT = '#40916C';
const PALE  = '#52B788';

// Leaf bud on a branch — small, directional
const BUD   = 'M 0 0 C 7 -4 12 -18 9 -34 C 6 -44 -2 -46 -5 -38 C -8 -26 -5 -12 0 0 Z';
// Larger leaf
const LEAF  = 'M 0 0 C 14 -6 24 -36 18 -72 C 12 -94 -3 -98 -8 -84 C -15 -64 -10 -26 0 0 Z';
// Wide leaf
const WIDE  = 'M 0 0 C 28 -10 52 -62 42 -128 C 32 -166 4 -182 -7 -164 C -22 -138 -18 -58 0 0 Z';

export default function SharedBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w} height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* ── BOTTOM-LEFT — arching branch with full leaf cluster ── */}
      {/* Main arching branch */}
      <G opacity={0.18}>
        <Path
          d={`M -5 ${h} Q 30 ${h - 80} 20 ${h - 160} Q 12 ${h - 210} 55 ${h - 180}`}
          stroke={MID} strokeWidth={2.5} fill="none"
        />
      </G>
      {/* Leaves off the branch */}
      <G opacity={0.22} transform={`translate(8, ${h - 100}) rotate(-45)`}>
        <Path d={WIDE} fill={DARK} />
      </G>
      <G opacity={0.18} transform={`translate(25, ${h - 155}) rotate(-30)`}>
        <Path d={LEAF} fill={MID} />
      </G>
      <G opacity={0.20} transform={`translate(-5, ${h - 60}) rotate(-15)`}>
        <Path d={LEAF} fill={DARK} />
      </G>
      <G opacity={0.16} transform={`translate(50, ${h - 130}) rotate(-60)`}>
        <Path d={BUD} fill={LIGHT} />
      </G>
      <G opacity={0.18} transform={`translate(15, ${h - 200}) rotate(-20)`}>
        <Path d={BUD} fill={PALE} />
      </G>
      <Circle cx={22} cy={h - 160} r={4} fill={LIGHT} opacity={0.22} />
      <Circle cx={8}  cy={h - 100} r={3} fill={MID}   opacity={0.20} />

      {/* ── BOTTOM-RIGHT — arching branch with full leaf cluster ── */}
      <G opacity={0.18}>
        <Path
          d={`M ${w + 5} ${h} Q ${w - 30} ${h - 80} ${w - 20} ${h - 160} Q ${w - 12} ${h - 210} ${w - 55} ${h - 180}`}
          stroke={MID} strokeWidth={2.5} fill="none"
        />
      </G>
      <G opacity={0.22} transform={`translate(${w - 8}, ${h - 100}) rotate(135)`}>
        <Path d={WIDE} fill={DARK} />
      </G>
      <G opacity={0.18} transform={`translate(${w - 25}, ${h - 155}) rotate(150)`}>
        <Path d={LEAF} fill={MID} />
      </G>
      <G opacity={0.20} transform={`translate(${w + 5}, ${h - 60}) rotate(165)`}>
        <Path d={LEAF} fill={DARK} />
      </G>
      <G opacity={0.16} transform={`translate(${w - 50}, ${h - 130}) rotate(120)`}>
        <Path d={BUD} fill={LIGHT} />
      </G>
      <G opacity={0.18} transform={`translate(${w - 15}, ${h - 200}) rotate(160)`}>
        <Path d={BUD} fill={PALE} />
      </G>
      <Circle cx={w - 22} cy={h - 160} r={4} fill={LIGHT} opacity={0.22} />
      <Circle cx={w - 8}  cy={h - 100} r={3} fill={MID}   opacity={0.20} />

      {/* ── TOP-LEFT — branch cluster (pushed down to clear status bar) ── */}
      <G opacity={0.18}>
        <Path
          d={`M -5 80 Q 25 120 15 190 Q 8 230 50 210`}
          stroke={MID} strokeWidth={2} fill="none"
        />
      </G>
      <G opacity={0.20} transform="translate(10, 130) rotate(-50)">
        <Path d={LEAF} fill={DARK} />
      </G>
      <G opacity={0.16} transform="translate(30, 185) rotate(-35)">
        <Path d={BUD} fill={MID} />
      </G>
      <G opacity={0.18} transform="translate(-5, 85) rotate(-20)">
        <Path d={BUD} fill={LIGHT} />
      </G>
      <G opacity={0.14} transform="translate(55, 160) rotate(-65)">
        <Path d={BUD} fill={PALE} />
      </G>
      <Circle cx={15} cy={130} r={3.5} fill={MID}  opacity={0.20} />
      <Circle cx={50} cy={210} r={3}   fill={LIGHT} opacity={0.18} />

      {/* ── TOP — shifted well left so it doesn't cover top-right header icons ── */}
      <G opacity={0.16}>
        <Path
          d={`M ${w * 0.35} 75 Q ${w * 0.52} 45 ${w * 0.68} 80 Q ${w * 0.75} 100 ${w * 0.72} 130`}
          stroke={DARK} strokeWidth={2} fill="none"
        />
      </G>
      <G opacity={0.18} transform={`translate(${w * 0.45}, 55) rotate(10)`}>
        <Path d={BUD} fill={MID} />
      </G>
      <G opacity={0.16} transform={`translate(${w * 0.65}, 75) rotate(-15)`}>
        <Path d={BUD} fill={DARK} />
      </G>
      <G opacity={0.14} transform={`translate(${w * 0.72}, 120) rotate(5)`}>
        <Path d={LEAF} fill={LIGHT} />
      </G>
      <Circle cx={w * 0.52} cy={45} r={3} fill={LIGHT} opacity={0.18} />
      <Circle cx={w * 0.68} cy={80} r={3} fill={MID}   opacity={0.16} />
    </Svg>
  );
}
