/**
 * TutorialOverlay
 *
 * Hybrid A+B tutorial system:
 *  - INTRO steps  : beautiful bottom-sheet card slides up, screen dimmed behind it
 *  - SPOTLIGHT steps : cut-out overlay with green border around the highlighted element,
 *                      tooltip card above or below, tap anywhere to advance
 *
 * All transitions are cross-faded (200ms). Progress dots always visible.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { COLORS, FONTS } from '../lib/design';

// ─── Types ───────────────────────────────────────────────────────────────────

export type IntroStep = {
  type: 'intro';
  badge: string;
  title: string;
  body: string;
};

export type SpotlightStep = {
  type: 'spotlight';
  /** Y position of spotlight as fraction of screen height (0–1) */
  spotYFrac: number;
  /** Height of spotlight as fraction of screen height (0–1) */
  spotHFrac: number;
  /** Pixels from left edge where spotlight starts (default 16) */
  spotXLeft?: number;
  /** Pixels from right edge where spotlight starts (default 16) */
  spotXRight?: number;
  /** Tooltip card position relative to spotlight */
  tooltipSide: 'above' | 'below';
  title: string;
  body: string;
};

export type TutorialStep = IntroStep | SpotlightStep;

interface Props {
  steps: TutorialStep[];
  onComplete: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TutorialOverlay({ steps, onComplete }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(0);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  const step = steps[stepIndex];

  // ── Animate in whenever step changes ──
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(step.type === 'intro' ? 50 : 30);

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 75, friction: 11, useNativeDriver: true }),
    ]).start();

    // Pulse the spotlight border
    if (step.type === 'spotlight') {
      glowAnim.setValue(0.6);
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.6, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
    }
  }, [stepIndex]);

  // ── Advance or complete ──
  const advance = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      if (stepIndex < steps.length - 1) {
        setStepIndex(i => i + 1);
      } else {
        onComplete();
      }
    });
  }, [stepIndex, steps.length, onComplete]);

  // ── Progress dots ──
  const Dots = ({ light }: { light?: boolean }) => (
    <View style={s.dots}>
      {steps.map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            light ? s.dotLight : s.dotDark,
            i === stepIndex && (light ? s.dotActiveLi : s.dotActiveDk),
          ]}
        />
      ))}
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // INTRO STEP
  // ─────────────────────────────────────────────────────────────────────────
  if (step.type === 'intro') {
    return (
      <TouchableWithoutFeedback onPress={advance}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, zIndex: 9999 }]}>
          {/* Dimmed backdrop — screen remains visible behind */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,25,20,0.60)' }]} />

          {/* Bottom sheet card */}
          <Animated.View
            style={[s.introCard, { transform: [{ translateY: slideAnim }] }]}
          >
            {/* Drag handle */}
            <View style={s.handle} />

            {/* Badge */}
            <View style={s.badge}>
              <Text style={s.badgeText}>{step.badge.toUpperCase()}</Text>
            </View>

            {/* Wren bird accent */}
            <View style={s.birdRow}>
              <View style={s.birdDot}>
                <View style={s.birdDotInner} />
              </View>
            </View>

            <Text style={s.introTitle}>{step.title}</Text>
            <Text style={s.introBody}>{step.body}</Text>

            <Dots />

            <Text style={s.tapHint}>Tap anywhere to continue</Text>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SPOTLIGHT STEP
  // ─────────────────────────────────────────────────────────────────────────
  const xLeft   = step.spotXLeft  ?? 16;
  const xRight  = step.spotXRight ?? 16;
  const spotY   = step.spotYFrac * H;
  const spotH   = step.spotHFrac * H;
  const above   = step.tooltipSide === 'above';

  // Tooltip sits 12px above or below spotlight
  const TOOLTIP_H = 110; // approximate card height
  const tooltipTop = above
    ? Math.max(8, spotY - 12 - TOOLTIP_H)
    : spotY + spotH + 12;

  // Arrow tip position
  const arrowTop = above ? spotY - 14 : spotY + spotH + 2;

  const OVERLAY = 'rgba(10,20,15,0.74)';

  return (
    <TouchableWithoutFeedback onPress={advance}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, zIndex: 9999 }]}>

        {/* ── Four dark panels that frame the spotlight "hole" ── */}
        {/* Top */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: spotY, backgroundColor: OVERLAY }} />
        {/* Bottom */}
        <View style={{ position: 'absolute', top: spotY + spotH, left: 0, right: 0, bottom: 0, backgroundColor: OVERLAY }} />
        {/* Left sliver */}
        <View style={{ position: 'absolute', top: spotY, left: 0, width: xLeft, height: spotH, backgroundColor: OVERLAY }} />
        {/* Right sliver */}
        <View style={{ position: 'absolute', top: spotY, right: 0, width: xRight, height: spotH, backgroundColor: OVERLAY }} />

        {/* ── Animated spotlight border ── */}
        <Animated.View
          style={{
            position: 'absolute',
            top:    spotY  - 3,
            left:   xLeft  - 3,
            right:  xRight - 3,
            height: spotH  + 6,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: '#52B788',
            opacity: glowAnim,
          }}
        />

        {/* ── Tooltip card ── */}
        <Animated.View
          style={[
            s.tooltip,
            { top: tooltipTop, left: 16, right: 16 },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={s.tooltipAccent} />
          <View style={s.tooltipContent}>
            <Text style={s.tooltipTitle}>{step.title}</Text>
            <Text style={s.tooltipBody}>{step.body}</Text>
          </View>
        </Animated.View>

        {/* ── Arrow pointing from tooltip to spotlight ── */}
        <View
          style={{
            position: 'absolute',
            left: W / 2 - 8,
            top: arrowTop,
            width: 0, height: 0,
            borderLeftWidth: 8,
            borderRightWidth: 8,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            ...(above
              ? { borderTopWidth: 10, borderTopColor: '#FFFFFF' }
              : { borderBottomWidth: 10, borderBottomColor: '#FFFFFF' }
            ),
          }}
        />

        {/* ── Progress dots at bottom ── */}
        <View style={s.dotsBottom}>
          <Dots light />
        </View>

      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Intro ──
  introCard: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 24,
  },
  handle: {
    width: 38, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryMuted,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 18,
  },
  badgeText: {
    ...FONTS.label,
    color: COLORS.primary,
  },
  birdRow: {
    marginBottom: 16,
  },
  birdDot: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birdDotInner: {
    width: 20, height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 10,
  },
  introBody: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 23,
    marginBottom: 24,
  },
  tapHint: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 10,
  },

  // ── Dots ──
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dotsBottom: {
    position: 'absolute',
    bottom: 44,
    left: 0, right: 0,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotDark: {
    width: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dotLight: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActiveDk: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  dotActiveLi: {
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },

  // ── Tooltip ──
  tooltip: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 14,
  },
  tooltipAccent: {
    width: 5,
    backgroundColor: COLORS.primary,
  },
  tooltipContent: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  tooltipBody: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
