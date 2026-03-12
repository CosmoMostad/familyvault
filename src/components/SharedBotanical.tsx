import React from 'react';
import Svg, { Path, G, Circle } from 'react-native-svg';

interface Props {
  width: number;
  height: number;
}

const DARK = '#1B4332';
const MID = '#2D6A4F';
const LIGHT = '#40916C';
const ACCENT = '#52B788';

export default function SharedBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* TOP EDGE — flowing vine/branch patterns with small leaf buds */}
      {/* Main vine curve across top */}
      <G opacity={0.18}>
        <Path
          d={`M -10 60 Q ${w * 0.15} 20, ${w * 0.3} 45 Q ${w * 0.45} 70, ${w * 0.6} 35 Q ${w * 0.75} 5, ${w * 0.9} 50 Q ${w * 0.95} 65, ${w + 10} 40`}
          stroke={MID}
          strokeWidth={2}
          fill="none"
        />
      </G>
      {/* Secondary thinner vine */}
      <G opacity={0.14}>
        <Path
          d={`M -10 90 Q ${w * 0.2} 55, ${w * 0.35} 80 Q ${w * 0.5} 100, ${w * 0.7} 70`}
          stroke={LIGHT}
          strokeWidth={1.5}
          fill="none"
        />
      </G>
      {/* Leaf buds along top vine */}
      <G opacity={0.20}>
        <Path d="M 0 0 C 6 -3 10 -14 7 -26 C 4 -34 -2 -36 -4 -30 C -6 -22 -4 -10 0 0 Z" fill={DARK} transform={`translate(${w * 0.15}, 25) rotate(-20)`} />
      </G>
      <G opacity={0.16}>
        <Path d="M 0 0 C 6 -3 10 -14 7 -26 C 4 -34 -2 -36 -4 -30 C -6 -22 -4 -10 0 0 Z" fill={MID} transform={`translate(${w * 0.45}, 65) rotate(15)`} />
      </G>
      <G opacity={0.18}>
        <Path d="M 0 0 C 6 -3 10 -14 7 -26 C 4 -34 -2 -36 -4 -30 C -6 -22 -4 -10 0 0 Z" fill={ACCENT} transform={`translate(${w * 0.75}, 10) rotate(-30)`} />
      </G>
      {/* Small circles at branch joints */}
      <Circle cx={w * 0.3} cy={45} r={3} fill={LIGHT} opacity={0.22} />
      <Circle cx={w * 0.6} cy={35} r={2.5} fill={MID} opacity={0.20} />
      <Circle cx={w * 0.9} cy={50} r={3} fill={DARK} opacity={0.18} />

      {/* BOTTOM EDGE — flowing vine/branch patterns */}
      <G opacity={0.18}>
        <Path
          d={`M -10 ${h - 50} Q ${w * 0.1} ${h - 80}, ${w * 0.25} ${h - 55} Q ${w * 0.4} ${h - 30}, ${w * 0.55} ${h - 60} Q ${w * 0.7} ${h - 85}, ${w * 0.85} ${h - 45} Q ${w * 0.95} ${h - 25}, ${w + 10} ${h - 55}`}
          stroke={DARK}
          strokeWidth={2}
          fill="none"
        />
      </G>
      {/* Secondary thinner vine */}
      <G opacity={0.14}>
        <Path
          d={`M ${w * 0.3} ${h - 25} Q ${w * 0.5} ${h - 50}, ${w * 0.65} ${h - 30} Q ${w * 0.8} ${h - 15}, ${w + 10} ${h - 35}`}
          stroke={MID}
          strokeWidth={1.5}
          fill="none"
        />
      </G>
      {/* Leaf buds along bottom vine */}
      <G opacity={0.20}>
        <Path d="M 0 0 C 6 -3 10 -14 7 -26 C 4 -34 -2 -36 -4 -30 C -6 -22 -4 -10 0 0 Z" fill={LIGHT} transform={`translate(${w * 0.25}, ${h - 55}) rotate(160)`} />
      </G>
      <G opacity={0.16}>
        <Path d="M 0 0 C 6 -3 10 -14 7 -26 C 4 -34 -2 -36 -4 -30 C -6 -22 -4 -10 0 0 Z" fill={DARK} transform={`translate(${w * 0.55}, ${h - 60}) rotate(195)`} />
      </G>
      <G opacity={0.18}>
        <Path d="M 0 0 C 6 -3 10 -14 7 -26 C 4 -34 -2 -36 -4 -30 C -6 -22 -4 -10 0 0 Z" fill={ACCENT} transform={`translate(${w * 0.85}, ${h - 45}) rotate(175)`} />
      </G>
      {/* Small circles at branch joints */}
      <Circle cx={w * 0.25} cy={h - 55} r={3} fill={MID} opacity={0.20} />
      <Circle cx={w * 0.55} cy={h - 60} r={2.5} fill={LIGHT} opacity={0.18} />
      <Circle cx={w * 0.85} cy={h - 45} r={3} fill={DARK} opacity={0.16} />
    </Svg>
  );
}
