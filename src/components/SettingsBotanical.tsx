import React from 'react';
import Svg, { Path, G, Circle, Ellipse } from 'react-native-svg';

interface Props {
  width: number;
  height: number;
}

const DARK = '#1B4332';
const MID = '#2D6A4F';
const LIGHT = '#40916C';
const ACCENT = '#52B788';

// Small leaf for scattered seed pods
const SMALL_LEAF = 'M 0 0 C 6 -3 10 -14 7 -26 C 4 -34 -2 -36 -4 -30 C -6 -22 -4 -10 0 0 Z';
// Seed pod shape
const SEED = 'M 0 0 C 4 -2 7 -10 5 -18 C 3 -24 -1 -25 -3 -20 C -5 -14 -3 -6 0 0 Z';

export default function SettingsBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* TOP-LEFT CORNER — scattered seeds and small leaves */}
      <G opacity={0.18} transform="translate(25, 50) rotate(-15)">
        <Path d={SMALL_LEAF} fill={DARK} />
      </G>
      <G opacity={0.15} transform="translate(60, 30) rotate(25)">
        <Path d={SEED} fill={MID} />
      </G>
      <Circle cx={15} cy={85} r={4} fill={LIGHT} opacity={0.20} />
      <G opacity={0.14} transform="translate(45, 90) rotate(-40)">
        <Path d={SEED} fill={ACCENT} />
      </G>

      {/* TOP-RIGHT CORNER — sparse elements */}
      <G opacity={0.16} transform={`translate(${w - 35}, 45) rotate(140)`}>
        <Path d={SMALL_LEAF} fill={MID} />
      </G>
      <G opacity={0.14} transform={`translate(${w - 60}, 70) rotate(165)`}>
        <Path d={SEED} fill={DARK} />
      </G>
      <Circle cx={w - 20} cy={30} r={3.5} fill={LIGHT} opacity={0.18} />
      <Ellipse cx={w - 50} cy={35} rx={5} ry={3.5} fill={ACCENT} opacity={0.14} />

      {/* BOTTOM-LEFT CORNER — scattered seeds */}
      <G opacity={0.16} transform={`translate(30, ${h - 60}) rotate(20)`}>
        <Path d={SMALL_LEAF} fill={LIGHT} />
      </G>
      <G opacity={0.14} transform={`translate(65, ${h - 40}) rotate(-10)`}>
        <Path d={SEED} fill={DARK} />
      </G>
      <Circle cx={18} cy={h - 35} r={3.5} fill={MID} opacity={0.18} />
      <G opacity={0.12} transform={`translate(50, ${h - 80}) rotate(35)`}>
        <Path d={SEED} fill={MID} />
      </G>

      {/* BOTTOM-RIGHT CORNER — sparse elements */}
      <G opacity={0.18} transform={`translate(${w - 40}, ${h - 55}) rotate(195)`}>
        <Path d={SMALL_LEAF} fill={DARK} />
      </G>
      <G opacity={0.14} transform={`translate(${w - 65}, ${h - 75}) rotate(210)`}>
        <Path d={SEED} fill={LIGHT} />
      </G>
      <Circle cx={w - 25} cy={h - 35} r={4} fill={ACCENT} opacity={0.16} />
      <Ellipse cx={w - 55} cy={h - 40} rx={5} ry={3} fill={MID} opacity={0.12} />

      {/* Center-scattered tiny dots for texture (very subtle) */}
      <Circle cx={w * 0.3} cy={h * 0.35} r={2.5} fill={LIGHT} opacity={0.10} />
      <Circle cx={w * 0.7} cy={h * 0.6} r={2} fill={MID} opacity={0.08} />
      <Circle cx={w * 0.5} cy={h * 0.8} r={2.5} fill={DARK} opacity={0.08} />
    </Svg>
  );
}
