/**
 * ThemedBackground — renders the full-screen gradient + decorative blobs.
 * Drop this as the first child of any screen root View.
 * Dark mode: deep forest atmosphere with green glow.
 * Light mode: vivid mint gradient with layered organic blobs.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemedBackground() {
  const { isDark, gradients } = useTheme();

  return (
    <>
      {/* Base gradient */}
      <LinearGradient colors={gradients.background as any} style={StyleSheet.absoluteFill} />

      {/* Top atmospheric glow */}
      <LinearGradient
        colors={gradients.topGlow as any}
        locations={[0, 0.35, 0.7]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Light mode: decorative organic blobs for depth + visual interest */}
      {!isDark && (
        <>
          {/* Large blob — top right */}
          <View style={blobs.topRight} pointerEvents="none" />
          {/* Medium blob — bottom left */}
          <View style={blobs.bottomLeft} pointerEvents="none" />
          {/* Small accent — mid right */}
          <View style={blobs.midRight} pointerEvents="none" />
          {/* Tiny accent — top left */}
          <View style={blobs.topLeft} pointerEvents="none" />
        </>
      )}
    </>
  );
}

const blobs = StyleSheet.create({
  // On light mode (deep forest green bg): blobs are darker/medium green for depth
  topRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(13,30,21,0.55)',   // very dark forest — deep shadow
  },
  bottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(45,106,79,0.50)',  // medium forest — no mint
  },
  midRight: {
    position: 'absolute',
    top: '42%',
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(13,30,21,0.40)',   // dark shadow blob
  },
  topLeft: {
    position: 'absolute',
    top: 140,
    left: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(64,145,108,0.28)', // medium green accent — no mint
  },
});
