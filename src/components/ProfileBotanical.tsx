import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface Props {
  width: number;
  height: number;
}

const DARK  = '#2D6A4F';  // primary — dark forest green
const MID   = '#40916C';  // mid green
const LIGHT = '#52B788';  // lighter green

export default function ProfileBotanical({ width: w, height: h }: Props) {
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* ══════════════════════════════════════
          TOP-RIGHT — large sweeping cluster
      ══════════════════════════════════════ */}

      {/* Leaf 1 — biggest, dark green, far right */}
      <G opacity={0.45} transform={`translate(${w + 20}, -10) rotate(148)`}>
        <Path
          d="M 0 0 C 45 30, 62 115, 44 230 C 30 280, -14 290, -42 242 C -65 190, -50 90, 0 0 Z"
          stroke={DARK} strokeWidth="2" fill="rgba(45,106,79,0.08)" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 5 118, 0 255" stroke={DARK} strokeWidth="1.3" fill="none" />
        <Path d="M 1 55  Q 36 44,  48 30"  stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 100 Q 44 88,  56 73"  stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 145 Q 46 132, 56 117" stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 185 Q 43 174, 50 160" stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 218 Q 34 210, 38 200" stroke={DARK} strokeWidth="0.9" fill="none" />
        <Path d="M 1 55  Q -34 44,  -44 30"  stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 100 Q -40 88,  -52 73"  stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 145 Q -42 132, -52 117" stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 185 Q -40 174, -46 160" stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 218 Q -30 210, -36 200" stroke={DARK} strokeWidth="0.9" fill="none" />
      </G>

      {/* Leaf 2 — medium, mid green, overlapping */}
      <G opacity={0.38} transform={`translate(${w - 35}, -20) rotate(162)`}>
        <Path
          d="M 0 0 C 32 22, 44 85, 30 170 C 20 208, -10 215, -28 180 C -44 142, -34 65, 0 0 Z"
          stroke={MID} strokeWidth="1.8" fill="rgba(64,145,108,0.07)" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 3 88, 0 188" stroke={MID} strokeWidth="1.1" fill="none" />
        <Path d="M 1 42  Q 26 33, 34 22"  stroke={MID} strokeWidth="0.9" fill="none" />
        <Path d="M 1 78  Q 32 68, 38 55"  stroke={MID} strokeWidth="0.9" fill="none" />
        <Path d="M 1 114 Q 32 104, 38 92"  stroke={MID} strokeWidth="0.9" fill="none" />
        <Path d="M 1 146 Q 28 138, 32 127" stroke={MID} strokeWidth="0.9" fill="none" />
        <Path d="M 1 42  Q -24 33, -30 22"  stroke={MID} strokeWidth="0.9" fill="none" />
        <Path d="M 1 78  Q -29 68, -35 55"  stroke={MID} strokeWidth="0.9" fill="none" />
        <Path d="M 1 114 Q -30 104, -35 92"  stroke={MID} strokeWidth="0.9" fill="none" />
        <Path d="M 1 146 Q -26 138, -30 127" stroke={MID} strokeWidth="0.9" fill="none" />
      </G>

      {/* Leaf 3 — small narrow, light green, right edge */}
      <G opacity={0.42} transform={`translate(${w + 5}, 200) rotate(175)`}>
        <Path
          d="M 0 0 C 22 16, 30 65, 20 128 C 12 158, -7 163, -18 138 C -28 108, -22 48, 0 0 Z"
          stroke={LIGHT} strokeWidth="1.5" fill="none" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 2 65, 0 142" stroke={LIGHT} strokeWidth="1" fill="none" />
        <Path d="M 1 32  Q 18 25, 22 17"  stroke={LIGHT} strokeWidth="0.8" fill="none" />
        <Path d="M 1 62  Q 20 55, 24 46"  stroke={LIGHT} strokeWidth="0.8" fill="none" />
        <Path d="M 1 92  Q 18 86, 22 77"  stroke={LIGHT} strokeWidth="0.8" fill="none" />
        <Path d="M 1 116 Q 14 111, 17 104" stroke={LIGHT} strokeWidth="0.7" fill="none" />
        <Path d="M 1 32  Q -16 25, -20 17"  stroke={LIGHT} strokeWidth="0.8" fill="none" />
        <Path d="M 1 62  Q -18 55, -22 46"  stroke={LIGHT} strokeWidth="0.8" fill="none" />
        <Path d="M 1 92  Q -16 86, -20 77"  stroke={LIGHT} strokeWidth="0.8" fill="none" />
        <Path d="M 1 116 Q -12 111, -15 104" stroke={LIGHT} strokeWidth="0.7" fill="none" />
      </G>

      {/* ══════════════════════════════════════
          BOTTOM-LEFT — large upward cluster
      ══════════════════════════════════════ */}

      {/* Leaf 4 — large, dark green */}
      <G opacity={0.42} transform={`translate(-18, ${h + 25}) rotate(-38)`}>
        <Path
          d="M 0 0 C 44 -30, 62 -110, 44 -225 C 30 -272, -14 -282, -40 -236 C -62 -184, -50 -88, 0 0 Z"
          stroke={DARK} strokeWidth="2" fill="rgba(45,106,79,0.08)" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 5 -115, 0 -248" stroke={DARK} strokeWidth="1.3" fill="none" />
        <Path d="M 1 -52  Q 34 -42,  46 -28"  stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 -96  Q 42 -85,  52 -70"  stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 -138 Q 44 -127, 52 -112" stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 -178 Q 40 -168, 46 -155" stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 -210 Q 30 -202, 36 -194" stroke={DARK} strokeWidth="0.9" fill="none" />
        <Path d="M 1 -52  Q -32 -42,  -42 -28"  stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 -96  Q -38 -85,  -48 -70"  stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 -138 Q -40 -127, -48 -112" stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 -178 Q -37 -168, -43 -155" stroke={DARK} strokeWidth="1" fill="none" />
        <Path d="M 2 -210 Q -28 -202, -33 -194" stroke={DARK} strokeWidth="0.9" fill="none" />
      </G>

      {/* Leaf 5 — medium, light green, offset left */}
      <G opacity={0.36} transform={`translate(55, ${h + 15}) rotate(-52)`}>
        <Path
          d="M 0 0 C 30 -24, 42 -90, 28 -172 C 18 -210, -9 -217, -24 -183 C -38 -144, -30 -66, 0 0 Z"
          stroke={LIGHT} strokeWidth="1.7" fill="rgba(82,183,136,0.06)" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 2 -90, 0 -190" stroke={LIGHT} strokeWidth="1.1" fill="none" />
        <Path d="M 1 -44  Q 24 -35, 30 -24"  stroke={LIGHT} strokeWidth="0.9" fill="none" />
        <Path d="M 1 -80  Q 28 -71, 34 -59"  stroke={LIGHT} strokeWidth="0.9" fill="none" />
        <Path d="M 1 -116 Q 28 -107, 32 -96"  stroke={LIGHT} strokeWidth="0.9" fill="none" />
        <Path d="M 1 -148 Q 22 -141, 26 -131" stroke={LIGHT} strokeWidth="0.8" fill="none" />
        <Path d="M 1 -44  Q -22 -35, -27 -24"  stroke={LIGHT} strokeWidth="0.9" fill="none" />
        <Path d="M 1 -80  Q -25 -71, -30 -59"  stroke={LIGHT} strokeWidth="0.9" fill="none" />
        <Path d="M 1 -116 Q -25 -107, -29 -96"  stroke={LIGHT} strokeWidth="0.9" fill="none" />
        <Path d="M 1 -148 Q -20 -141, -23 -131" stroke={LIGHT} strokeWidth="0.8" fill="none" />
      </G>

      {/* Leaf 6 — slim tall, mid green, peeking from bottom */}
      <G opacity={0.32} transform={`translate(130, ${h + 10}) rotate(-22)`}>
        <Path
          d="M 0 0 C 18 -14, 26 -58, 16 -115 C 9 -140, -6 -144, -14 -122 C -22 -94, -16 -44, 0 0 Z"
          stroke={MID} strokeWidth="1.4" fill="none" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 1 -60, 0 -126" stroke={MID} strokeWidth="0.9" fill="none" />
        <Path d="M 0 -28 Q 14 -22, 18 -14" stroke={MID} strokeWidth="0.7" fill="none" />
        <Path d="M 0 -54 Q 16 -48, 20 -40" stroke={MID} strokeWidth="0.7" fill="none" />
        <Path d="M 0 -80 Q 14 -75, 16 -68" stroke={MID} strokeWidth="0.7" fill="none" />
        <Path d="M 0 -28 Q -12 -22, -16 -14" stroke={MID} strokeWidth="0.7" fill="none" />
        <Path d="M 0 -54 Q -14 -48, -18 -40" stroke={MID} strokeWidth="0.7" fill="none" />
        <Path d="M 0 -80 Q -12 -75, -14 -68" stroke={MID} strokeWidth="0.7" fill="none" />
      </G>

      {/* ══════════════════════════════════════
          RIGHT EDGE — mid-screen accent
      ══════════════════════════════════════ */}

      {/* Leaf 7 — curved, light green, right mid */}
      <G opacity={0.38} transform={`translate(${w + 8}, ${h * 0.48}) rotate(185)`}>
        <Path
          d="M 0 0 C 26 18, 34 70, 22 130 C 14 158, -8 162, -20 138 C -30 108, -24 50, 0 0 Z"
          stroke={MID} strokeWidth="1.5" fill="rgba(64,145,108,0.06)" strokeLinejoin="round"
        />
        <Path d="M 0 0 Q 2 68, 0 144" stroke={MID} strokeWidth="1" fill="none" />
        <Path d="M 1 34  Q 20 27, 26 18"  stroke={MID} strokeWidth="0.8" fill="none" />
        <Path d="M 1 64  Q 22 56, 28 46"  stroke={MID} strokeWidth="0.8" fill="none" />
        <Path d="M 1 94  Q 20 87, 24 78"  stroke={MID} strokeWidth="0.8" fill="none" />
        <Path d="M 1 118 Q 16 113, 18 105" stroke={MID} strokeWidth="0.7" fill="none" />
        <Path d="M 1 34  Q -18 27, -22 18"  stroke={MID} strokeWidth="0.8" fill="none" />
        <Path d="M 1 64  Q -20 56, -24 46"  stroke={MID} strokeWidth="0.8" fill="none" />
        <Path d="M 1 94  Q -18 87, -22 78"  stroke={MID} strokeWidth="0.8" fill="none" />
        <Path d="M 1 118 Q -14 113, -16 105" stroke={MID} strokeWidth="0.7" fill="none" />
      </G>
    </Svg>
  );
}
