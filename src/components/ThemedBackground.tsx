/**
 * AppBackground — simple warm cream fill.
 * No blobs, no dramatic gradients. Clean base for the parent-friendly palette.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../lib/design';

export default function ThemedBackground() {
  return <View style={StyleSheet.absoluteFill} pointerEvents="none" />;
}
