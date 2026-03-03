import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { COLORS } from '../lib/design';

interface Props {
  width: number;
  height: number;
}

/**
 * Decorative large green leaf overlay for light-background profile screens.
 * Positioned absolute, pointerEvents none — pure decoration behind content.
 */
export default function ProfileBotanical({ width: w, height: h }: Props) {
  const c = COLORS.primary; // #2D6A4F

  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* ── Large sweeping leaf — top-right ── */}
      <G opacity={0.07}>
        <Path
          d={`M ${w + 10} -20
              C ${w - 20} 60, ${w - 100} 100, ${w - 140} 180
              C ${w - 80} 160, ${w - 30} 110, ${w + 10} -20 Z`}
          fill={c}
        />
        <Path
          d={`M ${w - 30} -10
              C ${w - 80} 50, ${w - 160} 80, ${w - 200} 150
              C ${w - 140} 130, ${w - 70} 80, ${w - 30} -10 Z`}
          fill={c}
          opacity={0.8}
        />
        <Path
          d={`M ${w - 80} 10
              C ${w - 130} 60, ${w - 200} 90, ${w - 230} 155
              C ${w - 170} 130, ${w - 110} 80, ${w - 80} 10 Z`}
          fill={c}
          opacity={0.55}
        />
      </G>

      {/* ── Wide tropical leaf — bottom-left ── */}
      <G opacity={0.065}>
        <Path
          d={`M -20 ${h + 10}
              C 40 ${h - 60}, 120 ${h - 120}, 200 ${h - 80}
              C 140 ${h - 140}, 50 ${h - 100}, -20 ${h + 10} Z`}
          fill={c}
        />
        <Path
          d={`M -10 ${h - 40}
              C 60 ${h - 110}, 150 ${h - 180}, 220 ${h - 160}
              C 160 ${h - 200}, 70 ${h - 150}, -10 ${h - 40} Z`}
          fill={c}
          opacity={0.75}
        />
        <Path
          d={`M 10 ${h - 80}
              C 70 ${h - 150}, 160 ${h - 230}, 240 ${h - 220}
              C 180 ${h - 260}, 85 ${h - 200}, 10 ${h - 80} Z`}
          fill={c}
          opacity={0.5}
        />
      </G>

      {/* ── Tall narrow leaf — left edge, upper third ── */}
      <G opacity={0.055}>
        <Path
          d={`M -15 ${h * 0.15}
              C 30 ${h * 0.1}, 60 ${h * 0.22}, 35 ${h * 0.38}
              C 10 ${h * 0.32}, -8 ${h * 0.22}, -15 ${h * 0.15} Z`}
          fill={c}
        />
        <Path
          d={`M -10 ${h * 0.28}
              C 28 ${h * 0.24}, 52 ${h * 0.38}, 30 ${h * 0.52}
              C 8 ${h * 0.46}, -5 ${h * 0.36}, -10 ${h * 0.28} Z`}
          fill={c}
          opacity={0.7}
        />
      </G>

      {/* ── Curved leaf — right mid ── */}
      <G opacity={0.05}>
        <Path
          d={`M ${w + 5} ${h * 0.45}
              C ${w - 40} ${h * 0.38}, ${w - 80} ${h * 0.5}, ${w - 60} ${h * 0.62}
              C ${w - 25} ${h * 0.58}, ${w} ${h * 0.5}, ${w + 5} ${h * 0.45} Z`}
          fill={c}
        />
        <Path
          d={`M ${w + 5} ${h * 0.56}
              C ${w - 50} ${h * 0.5}, ${w - 90} ${h * 0.64}, ${w - 70} ${h * 0.76}
              C ${w - 32} ${h * 0.72}, ${w - 5} ${h * 0.62}, ${w + 5} ${h * 0.56} Z`}
          fill={c}
          opacity={0.7}
        />
      </G>
    </Svg>
  );
}
