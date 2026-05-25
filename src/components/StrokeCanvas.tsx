import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, {
  Defs,
  FeColorMatrix,
  FeTurbulence,
  Filter,
  Path,
  Rect,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import type { StrokeEvent } from '../types';

interface Props {
  onComplete: (events: StrokeEvent[]) => void;
}

const FRAME_MS = 16; // ~60 fps throttle gate

function toPathD(pts: StrokeEvent[]): string {
  if (pts.length === 0) return '';
  return pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

export default function StrokeCanvas({ onComplete }: Props) {
  const [completedStrokes, setCompletedStrokes] = useState<StrokeEvent[][]>([]);
  const [livePoints, setLivePoints] = useState<StrokeEvent[]>([]);
  const currentRef = useRef<StrokeEvent[]>([]);
  const lastUpdateTs = useRef(0);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const toastOpacity = useRef(new Animated.Value(0)).current;

  function showToast() {
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }

  // ── Gesture ────────────────────────────────────────────────────────────────
  const pan = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => {
      const pt: StrokeEvent = { x: e.x, y: e.y, timestamp: Date.now(), isLifted: false };
      currentRef.current = [pt];
      lastUpdateTs.current = pt.timestamp;
      setLivePoints([pt]);
    })
    .onUpdate((e) => {
      const now = Date.now();
      if (now - lastUpdateTs.current < FRAME_MS) return; // throttle to ~60 fps
      lastUpdateTs.current = now;
      const pt: StrokeEvent = { x: e.x, y: e.y, timestamp: now, isLifted: false };
      currentRef.current.push(pt);
      setLivePoints([...currentRef.current]);
    })
    .onEnd((e) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const pt: StrokeEvent = { x: e.x, y: e.y, timestamp: Date.now(), isLifted: true };
      const stroke = [...currentRef.current, pt];
      setCompletedStrokes((prev) => [...prev, stroke]);
      setLivePoints([]);
      currentRef.current = [];
    });

  // ── Actions ────────────────────────────────────────────────────────────────
  function handleComplete() {
    if (completedStrokes.length === 0) {
      showToast();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete(completedStrokes.flat());
  }

  function handleClear() {
    setCompletedStrokes([]);
    setLivePoints([]);
    currentRef.current = [];
  }

  return (
    <View style={styles.container}>
      {/* ── Drawing area ───────────────────────────────── */}
      <View style={styles.drawArea}>
        {/* Rice-paper noise texture */}
        <Svg
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          pointerEvents="none"
        >
          <Defs>
            <Filter id="paper" x="0%" y="0%" width="100%" height="100%">
              <FeTurbulence
                type="fractalNoise"
                baseFrequency={0.85}
                numOctaves={4}
                stitchTiles="stitch"
                result="noiseOut"
              />
              <FeColorMatrix type="saturate" values="0" in="noiseOut" />
            </Filter>
          </Defs>
          <Rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            filter="url(#paper)"
            opacity={0.06}
            fill="white"
          />
        </Svg>

        {/* Gesture capture layer */}
        <GestureDetector gesture={pan}>
          <View style={StyleSheet.absoluteFill} />
        </GestureDetector>

        {/* Ink stroke rendering */}
        <Svg
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          pointerEvents="none"
        >
          {completedStrokes.map((stroke, i) => (
            <Path
              key={i}
              d={toPathD(stroke)}
              stroke="#C8A96E"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {livePoints.length > 1 && (
            <Path
              d={toPathD(livePoints)}
              stroke="#C8A96E"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.8}
            />
          )}
        </Svg>

        {/* Stroke counter */}
        <View style={styles.counter} pointerEvents="none">
          <Text style={styles.counterText}>笔画：{completedStrokes.length}</Text>
        </View>

        {/* Toast — "请先书写" */}
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Text style={styles.toastText}>请先书写</Text>
        </Animated.View>
      </View>

      {/* ── Divider ────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── Buttons ────────────────────────────────────── */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.btnSecondary} onPress={handleClear}>
          <Text style={styles.btnSecondaryText}>重写</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, completedStrokes.length === 0 && styles.btnDisabled]}
          onPress={handleComplete}
        >
          <Text style={styles.btnPrimaryText}>完成</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#0D0D0D',
  },
  drawArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  counter: {
    position: 'absolute',
    top: 14,
    right: 16,
  },
  counterText: {
    color: '#E8DCC8',
    fontSize: 13,
    opacity: 0.6,
    letterSpacing: 1,
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C8A96E44',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  toastText: {
    color: '#E8DCC8',
    fontSize: 14,
    letterSpacing: 2,
    opacity: 0.9,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C8A96E',
    opacity: 0.2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 22,
  },
  btnPrimary: {
    borderWidth: 1,
    borderColor: '#C8A96E',
    paddingVertical: 11,
    paddingHorizontal: 38,
    backgroundColor: 'transparent',
  },
  btnPrimaryText: {
    color: '#C8A96E',
    fontSize: 18,
    letterSpacing: 4,
  },
  btnSecondary: {
    paddingVertical: 11,
    paddingHorizontal: 24,
  },
  btnSecondaryText: {
    color: '#E8DCC8',
    fontSize: 16,
    opacity: 0.45,
    letterSpacing: 3,
  },
  btnDisabled: {
    opacity: 0.25,
  },
});
