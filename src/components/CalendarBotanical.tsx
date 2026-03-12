import React from 'react';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

interface Props {
  width: number;
  height: number;
}

const DARK = '#1B4332';
const MID = '#2D6A4F';
const LIGHT = '#40916C';
const ACCENT = '#52B788';

export default function CalendarBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* BOTTOM-RIGHT CLUSTER — lily pads, rounded stones, overlapping circles */}
      <Circle cx={w - 30} cy={h - 100} r={55} fill={DARK} opacity={0.16} />
      <Circle cx={w - 70} cy={h - 60} r={40} fill={MID} opacity={0.18} />
      <Ellipse cx={w - 10} cy={h - 50} rx={35} ry={28} fill={LIGHT} opacity={0.15} />
      <Circle cx={w - 50} cy={h - 140} r={22} fill={ACCENT} opacity={0.14} />
      <Ellipse cx={w - 100} cy={h - 80} rx={30} ry={20} fill={MID} opacity={0.12} />
      <Circle cx={w + 10} cy={h - 160} r={16} fill={DARK} opacity={0.10} />
      {/* Small floating stone */}
      <Ellipse cx={w - 130} cy={h - 40} rx={14} ry={10} fill={LIGHT} opacity={0.12} />

      {/* TOP-LEFT CLUSTER — overlapping circles and ovals */}
      <Circle cx={40} cy={80} r={48} fill={DARK} opacity={0.15} />
      <Circle cx={80} cy={50} r={32} fill={MID} opacity={0.17} />
      <Ellipse cx={20} cy={40} rx={28} ry={22} fill={LIGHT} opacity={0.14} />
      <Circle cx={90} cy={110} r={20} fill={ACCENT} opacity={0.13} />
      <Ellipse cx={-5} cy={110} rx={24} ry={18} fill={MID} opacity={0.11} />
      <Circle cx={55} cy={130} r={14} fill={DARK} opacity={0.10} />

      {/* Subtle terracotta accent */}
      <G opacity={0.8}>
        <Ellipse cx={w - 90} cy={h - 150} rx={10} ry={8} fill="rgba(201,97,74,0.12)" />
      </G>
    </Svg>
  );
}
