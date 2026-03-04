import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { COLORS } from '../lib/design';

const ITEM_H = 48;
const VISIBLE = 5; // odd number so middle is clearly selected

const HOURS = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function WheelColumn({
  items,
  selectedIndex,
  onSelect,
  width,
}: {
  items: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  width: number;
}) {
  const ref = useRef<ScrollView>(null);

  // Scroll to initial position on mount
  useEffect(() => {
    setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
    }, 60);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function snap(offsetY: number) {
    const idx = Math.max(0, Math.min(Math.round(offsetY / ITEM_H), items.length - 1));
    onSelect(idx);
  }

  return (
    <View style={{ width, height: ITEM_H * VISIBLE, overflow: 'hidden' }}>
      {/* Centre selection bar */}
      <View pointerEvents="none" style={s.bar} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onMomentumScrollEnd={e => snap(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={e => snap(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {items.map((label, i) => (
          <View key={i} style={s.cell}>
            <Text style={[s.label, i === selectedIndex && s.labelSelected]}>
              {label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export interface TimePickerWheelProps {
  hour12: number;      // 1–12
  minute: number;      // 0–59
  ampm: 'AM' | 'PM';
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  onAmPmChange: (v: 'AM' | 'PM') => void;
}

export function TimePickerWheel({
  hour12, minute, ampm, onHourChange, onMinuteChange, onAmPmChange,
}: TimePickerWheelProps) {
  return (
    <View style={s.container}>
      <WheelColumn
        items={HOURS}
        selectedIndex={hour12 - 1}
        onSelect={i => onHourChange(i + 1)}
        width={64}
      />
      <Text style={s.colon}>:</Text>
      <WheelColumn
        items={MINUTES}
        selectedIndex={minute}
        onSelect={i => onMinuteChange(i)}
        width={64}
      />
      <View style={s.ampmCol}>
        {(['AM', 'PM'] as const).map(v => (
          <TouchableOpacity
            key={v}
            onPress={() => onAmPmChange(v)}
            style={[s.ampmBtn, ampm === v && s.ampmActive]}
            activeOpacity={0.75}
          >
            <Text style={[s.ampmText, ampm === v && s.ampmTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/** Convert 12-hour + ampm to 24-hour */
export function to24Hour(h12: number, ampm: 'AM' | 'PM'): number {
  if (ampm === 'AM') return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

/** Format for display button */
export function formatTime12(h12: number, minute: number, ampm: 'AM' | 'PM'): string {
  return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  bar: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 0, right: 0,
    height: ITEM_H,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: COLORS.primary,
    zIndex: 10,
  },
  cell: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 20,
    color: COLORS.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  labelSelected: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  colon: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginHorizontal: 2,
    marginBottom: 4,
  },
  ampmCol: {
    marginLeft: 20,
    gap: 10,
  },
  ampmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  ampmActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ampmText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  ampmTextActive: {
    color: '#fff',
  },
});
