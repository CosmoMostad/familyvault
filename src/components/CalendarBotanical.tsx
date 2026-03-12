/**
 * CalendarBotanical — Calendar screen background
 * Style: lily pads, rounded stones, overlapping circles/ovals
 * Layout: 4 clusters — bottom-left, bottom-right, top-left, + left-mid accent
 * ⚠️  Top-right corner clear — header icons live there
 */
import React from 'react';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

interface Props { width: number; height: number; }

const DARK  = '#1B4332';
const MID   = '#2D6A4F';
const LIGHT = '#40916C';
const PALE  = '#52B788';

export default function CalendarBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w} height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* ── BOTTOM-RIGHT CLUSTER ── */}
      <Circle cx={w - 25}  cy={h - 90}  r={60}  fill={DARK}  opacity={0.17} />
      <Circle cx={w - 65}  cy={h - 50}  r={44}  fill={MID}   opacity={0.19} />
      <Ellipse cx={w - 5}  cy={h - 45}  rx={38} ry={28} fill={LIGHT} opacity={0.15} />
      <Circle cx={w - 45}  cy={h - 150} r={26}  fill={PALE}  opacity={0.14} />
      <Ellipse cx={w - 105} cy={h - 75} rx={32} ry={22} fill={MID} opacity={0.13} />
      <Circle cx={w - 130} cy={h - 40}  r={16}  fill={LIGHT} opacity={0.12} />
      <Circle cx={w + 10}  cy={h - 170} r={18}  fill={DARK}  opacity={0.11} />

      {/* ── BOTTOM-LEFT CLUSTER ── */}
      <Circle cx={30}  cy={h - 80}  r={55}  fill={DARK}  opacity={0.16} />
      <Circle cx={75}  cy={h - 45}  r={40}  fill={MID}   opacity={0.18} />
      <Ellipse cx={5}  cy={h - 40}  rx={32} ry={24} fill={LIGHT} opacity={0.14} />
      <Circle cx={55}  cy={h - 145} r={24}  fill={PALE}  opacity={0.13} />
      <Ellipse cx={105} cy={h - 70} rx={28} ry={18} fill={MID} opacity={0.12} />
      <Circle cx={120} cy={h - 35}  r={15}  fill={LIGHT} opacity={0.11} />

      {/* ── TOP-LEFT CLUSTER (pushed down ~80px to clear status bar) ── */}
      <Circle cx={35}  cy={120}  r={50}  fill={DARK}  opacity={0.15} />
      <Circle cx={80}  cy={85}   r={36}  fill={MID}   opacity={0.17} />
      <Ellipse cx={10} cy={100}  rx={28} ry={20} fill={LIGHT} opacity={0.14} />
      <Circle cx={95}  cy={150}  r={22}  fill={PALE}  opacity={0.13} />
      <Ellipse cx={-8} cy={155}  rx={22} ry={16} fill={MID} opacity={0.11} />
      <Circle cx={60}  cy={175}  r={14}  fill={DARK}  opacity={0.10} />

      {/* ── TOP-RIGHT — shifted well LEFT of the header icons ── */}
      <Circle cx={w - 110} cy={95}  r={34} fill={MID}   opacity={0.14} />
      <Ellipse cx={w - 150} cy={70} rx={26} ry={18} fill={DARK} opacity={0.13} />
      <Circle cx={w - 90}  cy={145} r={20} fill={LIGHT} opacity={0.12} />
      <Circle cx={w - 160} cy={120} r={16} fill={PALE}  opacity={0.11} />
    </Svg>
  );
}
