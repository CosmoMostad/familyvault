/**
 * SettingsBotanical — Settings screen background
 * Style: seed pods + small leaves — more architectural/minimal than other screens
 * Layout: 4 clear corner clusters, each with enough density to look intentional
 * ⚠️  Top-right corner clear — header icons live there
 */
import React from 'react';
import Svg, { Path, G, Circle, Ellipse } from 'react-native-svg';

interface Props { width: number; height: number; }

const DARK  = '#1B4332';
const MID   = '#2D6A4F';
const LIGHT = '#40916C';
const PALE  = '#52B788';

// Seed pod — narrow oval with pointed tip
const POD   = 'M 0 0 C 5 -3 8 -12 6 -22 C 4 -30 -1 -32 -3 -26 C -6 -18 -3 -8 0 0 Z';
// Small leaf
const LEAF  = 'M 0 0 C 10 -4 17 -26 13 -52 C 9 -68 -2 -72 -6 -62 C -11 -48 -7 -18 0 0 Z';
// Medium leaf
const LEAFM = 'M 0 0 C 16 -6 28 -40 22 -82 C 16 -108 -3 -114 -9 -98 C -16 -74 -11 -28 0 0 Z';

export default function SettingsBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w} height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* ── BOTTOM-LEFT CLUSTER — largest, most prominent ── */}
      <G opacity={0.20} transform={`translate(15, ${h - 45}) rotate(-20)`}>
        <Path d={LEAFM} fill={DARK} />
      </G>
      <G opacity={0.18} transform={`translate(45, ${h - 30}) rotate(-35)`}>
        <Path d={LEAFM} fill={MID} />
      </G>
      <G opacity={0.22} transform={`translate(-5, ${h - 90}) rotate(-10)`}>
        <Path d={LEAF} fill={DARK} />
      </G>
      <G opacity={0.16} transform={`translate(70, ${h - 55}) rotate(-50)`}>
        <Path d={LEAF} fill={LIGHT} />
      </G>
      <G opacity={0.18} transform={`translate(25, ${h - 110}) rotate(-25)`}>
        <Path d={POD} fill={MID} />
      </G>
      <G opacity={0.16} transform={`translate(55, ${h - 90}) rotate(-40)`}>
        <Path d={POD} fill={PALE} />
      </G>
      <G opacity={0.14} transform={`translate(85, ${h - 75}) rotate(-60)`}>
        <Path d={POD} fill={DARK} />
      </G>
      <Circle cx={18} cy={h - 115} r={5} fill={LIGHT} opacity={0.18} />
      <Circle cx={50} cy={h - 130} r={4} fill={MID}   opacity={0.15} />
      <Ellipse cx={80} cy={h - 110} rx={7} ry={5} fill={PALE} opacity={0.14} />

      {/* ── BOTTOM-RIGHT CLUSTER ── */}
      <G opacity={0.20} transform={`translate(${w - 15}, ${h - 45}) rotate(160)`}>
        <Path d={LEAFM} fill={DARK} />
      </G>
      <G opacity={0.18} transform={`translate(${w - 45}, ${h - 30}) rotate(145)`}>
        <Path d={LEAFM} fill={MID} />
      </G>
      <G opacity={0.22} transform={`translate(${w + 5}, ${h - 90}) rotate(170)`}>
        <Path d={LEAF} fill={DARK} />
      </G>
      <G opacity={0.16} transform={`translate(${w - 70}, ${h - 55}) rotate(130)`}>
        <Path d={LEAF} fill={LIGHT} />
      </G>
      <G opacity={0.18} transform={`translate(${w - 25}, ${h - 110}) rotate(155)`}>
        <Path d={POD} fill={MID} />
      </G>
      <G opacity={0.16} transform={`translate(${w - 55}, ${h - 90}) rotate(140)`}>
        <Path d={POD} fill={PALE} />
      </G>
      <G opacity={0.14} transform={`translate(${w - 85}, ${h - 75}) rotate(120)`}>
        <Path d={POD} fill={DARK} />
      </G>
      <Circle cx={w - 18} cy={h - 115} r={5} fill={LIGHT} opacity={0.18} />
      <Circle cx={w - 50} cy={h - 130} r={4} fill={MID}   opacity={0.15} />
      <Ellipse cx={w - 80} cy={h - 110} rx={7} ry={5} fill={PALE} opacity={0.14} />

      {/* ── TOP-LEFT CLUSTER (pushed down ~90px to clear status bar + nav) ── */}
      <G opacity={0.18} transform="translate(-5, 140) rotate(-30)">
        <Path d={LEAFM} fill={MID} />
      </G>
      <G opacity={0.16} transform="translate(28, 110) rotate(-45)">
        <Path d={LEAF} fill={DARK} />
      </G>
      <G opacity={0.20} transform="translate(10, 185) rotate(-15)">
        <Path d={LEAF} fill={MID} />
      </G>
      <G opacity={0.16} transform="translate(55, 130) rotate(-60)">
        <Path d={POD} fill={LIGHT} />
      </G>
      <G opacity={0.14} transform="translate(38, 170) rotate(-35)">
        <Path d={POD} fill={PALE} />
      </G>
      <Circle cx={22} cy={100} r={4.5} fill={LIGHT} opacity={0.16} />
      <Circle cx={60} cy={155} r={3.5} fill={MID}   opacity={0.14} />
      <Ellipse cx={40} cy={200} rx={6} ry={4} fill={DARK} opacity={0.12} />

      {/* ── TOP — shifted LEFT, well away from header icons ── */}
      <G opacity={0.16} transform={`translate(${w - 170}, 120) rotate(150)`}>
        <Path d={LEAFM} fill={MID} />
      </G>
      <G opacity={0.14} transform={`translate(${w - 140}, 95) rotate(135)`}>
        <Path d={LEAF} fill={DARK} />
      </G>
      <G opacity={0.18} transform={`translate(${w - 165}, 175) rotate(165)`}>
        <Path d={LEAF} fill={MID} />
      </G>
      <G opacity={0.14} transform={`translate(${w - 120}, 140) rotate(120)`}>
        <Path d={POD} fill={LIGHT} />
      </G>
      <G opacity={0.12} transform={`translate(${w - 145}, 165) rotate(145)`}>
        <Path d={POD} fill={PALE} />
      </G>
      <Circle cx={w - 155} cy={90}  r={4.5} fill={LIGHT} opacity={0.15} />
      <Circle cx={w - 115} cy={155} r={3.5} fill={MID}   opacity={0.13} />
    </Svg>
  );
}
