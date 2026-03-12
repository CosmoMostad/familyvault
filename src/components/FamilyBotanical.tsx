import React from 'react';
import Svg, { Path, G, Ellipse } from 'react-native-svg';

interface Props {
  width: number;
  height: number;
}

const DARK = '#1B4332';
const MID = '#2D6A4F';
const LIGHT = '#40916C';
const ACCENT = '#52B788';

// Leaf paths — same family as ProfileBotanical for visual consistency
const LEAF_A = 'M 0 0 C 28 -10 52 -62 42 -128 C 32 -166 4 -182 -7 -164 C -22 -138 -18 -58 0 0 Z';
const LEAF_B = 'M 0 0 C 50 -4 82 -46 76 -108 C 68 -152 28 -170 0 -166 C -28 -170 -68 -152 -76 -108 C -82 -46 -50 -4 0 0 Z';
const LEAF_C = 'M 0 0 C 14 -5 22 -34 16 -68 C 10 -88 -3 -92 -8 -80 C -14 -62 -10 -26 0 0 Z';
const LEAF_D = 'M 0 0 C 20 -8 34 -50 26 -100 C 18 -132 2 -142 -5 -128 C -16 -104 -13 -44 0 0 Z';
// Large sweeping frond
const LEAF_E = 'M 0 0 C 36 -14 68 -78 56 -168 C 44 -220 8 -240 -8 -216 C -28 -182 -24 -72 0 0 Z';

export default function FamilyBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* TOP-RIGHT CLUSTER — large sweeping leaf clusters */}
      <G opacity={0.15} transform={`translate(${w - 10}, 80) rotate(150)`}>
        <Path d={LEAF_E} fill={DARK} />
      </G>
      <G opacity={0.20} transform={`translate(${w - 40}, 40) rotate(135)`}>
        <Path d={LEAF_A} fill={MID} />
        <Path d="M 0 0 Q 4 -72 -2 -158" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2" fill="none" />
      </G>
      <G opacity={0.18} transform={`translate(${w - 15}, 30) rotate(160)`}>
        <Path d={LEAF_D} fill={DARK} />
      </G>
      <G opacity={0.16} transform={`translate(${w - 60}, 120) rotate(140)`}>
        <Path d={LEAF_B} fill={LIGHT} />
      </G>
      <G opacity={0.22} transform={`translate(${w + 5}, 170) rotate(175)`}>
        <Path d={LEAF_C} fill={MID} />
      </G>
      <G opacity={0.14} transform={`translate(${w - 30}, 200) rotate(155)`}>
        <Path d={LEAF_C} fill={ACCENT} />
      </G>

      {/* BOTTOM-LEFT CLUSTER — mirrored sweeping leaf cluster */}
      <G opacity={0.15} transform={`translate(10, ${h - 80}) rotate(-30)`}>
        <Path d={LEAF_E} fill={DARK} />
      </G>
      <G opacity={0.20} transform={`translate(45, ${h - 40}) rotate(-45)`}>
        <Path d={LEAF_A} fill={MID} />
        <Path d="M 0 0 Q 4 -72 -2 -158" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2" fill="none" />
      </G>
      <G opacity={0.18} transform={`translate(15, ${h - 25}) rotate(-20)`}>
        <Path d={LEAF_D} fill={DARK} />
      </G>
      <G opacity={0.16} transform={`translate(70, ${h - 110}) rotate(-55)`}>
        <Path d={LEAF_B} fill={LIGHT} />
      </G>
      <G opacity={0.22} transform={`translate(-5, ${h - 160}) rotate(-5)`}>
        <Path d={LEAF_C} fill={MID} />
      </G>
      <G opacity={0.14} transform={`translate(110, ${h - 50}) rotate(-70)`}>
        <Path d={LEAF_C} fill={ACCENT} />
      </G>

      {/* Subtle terracotta accent — small ellipse top-left */}
      <Ellipse cx={30} cy={60} rx={18} ry={12} fill="rgba(201,97,74,0.10)" opacity={0.8} />
    </Svg>
  );
}
