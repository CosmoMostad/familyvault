import React from 'react';
import Svg, { Path, Circle, G, Ellipse } from 'react-native-svg';

interface Props {
  width: number;
  height: number;
}

/**
 * Decorative botanical SVG illustration for auth screen green headers/hero areas.
 * Organic leaf clusters, small blossoms, and scattered dots in white at low opacity.
 * pointerEvents="none" — completely non-interactive.
 */
export default function AuthBotanical({ width, height }: Props) {
  const w = width;
  const h = height;

  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* ── Large leaf cluster — top-right corner ── */}
      <G opacity={0.11}>
        {/* Leaf 1 — primary */}
        <Path
          d={`M ${w - 30} -5 C ${w - 75} 15, ${w - 65} 65, ${w - 28} 85 C ${w - 5} 60, ${w - 10} 20, ${w - 30} -5 Z`}
          fill="white"
        />
        {/* Leaf 2 — secondary, slightly behind */}
        <Path
          d={`M ${w - 65} 5 C ${w - 110} 20, ${w - 100} 65, ${w - 62} 80 C ${w - 38} 58, ${w - 45} 22, ${w - 65} 5 Z`}
          fill="white"
          opacity={0.8}
        />
        {/* Leaf 3 — tertiary, smaller */}
        <Path
          d={`M ${w - 100} 20 C ${w - 135} 32, ${w - 128} 62, ${w - 95} 72 C ${w - 73} 54, ${w - 78} 32, ${w - 100} 20 Z`}
          fill="white"
          opacity={0.6}
        />
        {/* Main stem */}
        <Path
          d={`M ${w - 28} 88 Q ${w - 15} 115, ${w - 5} 145`}
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          opacity={0.5}
        />
      </G>

      {/* ── Branch with leaves — bottom-left ── */}
      <G opacity={0.08}>
        {/* Stem line going diagonally */}
        <Path
          d={`M -10 ${h + 5} Q 30 ${h * 0.75}, 55 ${h * 0.55}`}
          stroke="white"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Leaf off stem — right side */}
        <Path
          d={`M 25 ${h * 0.72} C 48 ${h * 0.65}, 58 ${h * 0.5}, 42 ${h * 0.44} C 24 ${h * 0.5}, 18 ${h * 0.64}, 25 ${h * 0.72} Z`}
          fill="white"
        />
        {/* Leaf off stem — left side */}
        <Path
          d={`M 18 ${h * 0.82} C -8 ${h * 0.74}, -18 ${h * 0.58}, -4 ${h * 0.52} C 12 ${h * 0.58}, 16 ${h * 0.74}, 18 ${h * 0.82} Z`}
          fill="white"
          opacity={0.8}
        />
        {/* Small leaf at tip */}
        <Path
          d={`M 52 ${h * 0.57} C 62 ${h * 0.5}, 68 ${h * 0.42}, 60 ${h * 0.38} C 50 ${h * 0.42}, 48 ${h * 0.5}, 52 ${h * 0.57} Z`}
          fill="white"
          opacity={0.6}
        />
      </G>

      {/* ── 5-petal flower rosette — top-left ── */}
      <G opacity={0.1} transform={`translate(42, 28)`}>
        {([0, 72, 144, 216, 288] as number[]).map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = Math.cos(rad) * 11;
          const cy = Math.sin(rad) * 11;
          return (
            <Ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={5}
              ry={9}
              fill="white"
              transform={`rotate(${angle}, ${cx}, ${cy})`}
            />
          );
        })}
        <Circle cx={0} cy={0} r={5} fill="white" />
      </G>

      {/* ── Small 6-petal blossom — right side, mid ── */}
      <G opacity={0.08} transform={`translate(${w * 0.78}, ${h * 0.52})`}>
        {([0, 60, 120, 180, 240, 300] as number[]).map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = Math.cos(rad) * 9;
          const cy = Math.sin(rad) * 9;
          return (
            <Ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={4}
              ry={7}
              fill="white"
              transform={`rotate(${angle}, ${cx}, ${cy})`}
            />
          );
        })}
        <Circle cx={0} cy={0} r={3.5} fill="white" />
      </G>

      {/* ── Small oval leaves — left edge, upper-mid ── */}
      <G opacity={0.07} transform={`translate(-8, ${h * 0.35})`}>
        <Path
          d={`M 0 0 C 22 -18, 50 -8, 42 20 C 20 12, 4 8, 0 0 Z`}
          fill="white"
        />
        <Path
          d={`M 4 6 C 22 24, 36 46, 20 58 C 6 44, 2 22, 4 6 Z`}
          fill="white"
          opacity={0.8}
        />
      </G>

      {/* ── Curved vine line across middle ── */}
      <Path
        d={`M ${w * 0.08} ${h * 0.88} Q ${w * 0.35} ${h * 0.58}, ${w * 0.62} ${h * 0.72}`}
        stroke="white"
        strokeWidth="1"
        fill="none"
        opacity={0.07}
      />

      {/* ── Tiny leaf on vine ── */}
      <G opacity={0.07} transform={`translate(${w * 0.38}, ${h * 0.65}) rotate(-30)`}>
        <Path d="M 0 0 C 10 -8, 22 -4, 18 10 C 8 6, 2 3, 0 0 Z" fill="white" />
      </G>

      {/* ── Scattered dots for texture ── */}
      <Circle cx={w * 0.28} cy={h * 0.12} r={2.5} fill="white" opacity={0.13} />
      <Circle cx={w * 0.52} cy={h * 0.08} r={1.5} fill="white" opacity={0.09} />
      <Circle cx={w * 0.7}  cy={h * 0.25} r={2}   fill="white" opacity={0.1}  />
      <Circle cx={w * 0.15} cy={h * 0.55} r={1.5} fill="white" opacity={0.08} />
      <Circle cx={w * 0.42} cy={h * 0.78} r={2}   fill="white" opacity={0.07} />
      <Circle cx={w * 0.83} cy={h * 0.82} r={1.5} fill="white" opacity={0.09} />
      <Circle cx={w * 0.6}  cy={h * 0.45} r={1}   fill="white" opacity={0.11} />
    </Svg>
  );
}
