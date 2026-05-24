import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';
import HexagramDisplay from '../components/HexagramDisplay';
import type { Hexagram, RootStackParamList } from '../types';

type Props = StackScreenProps<RootStackParamList, 'Result'>;

// ─── Ink-wash watermark ───────────────────────────────────────────────────────
function InkWatermark({
  hexagram,
  opacity,
}: {
  hexagram: Hexagram;
  opacity: Animated.Value;
}) {
  const displayOrder = [...hexagram.lines].reverse();
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.watermarkContainer, { opacity }]}
      pointerEvents="none"
    >
      {displayOrder.map((bit, i) => (
        <View key={i} style={[styles.wmRow, i > 0 && { marginTop: 18 }]}>
          {bit === 1 ? (
            <View style={styles.wmYang} />
          ) : (
            <View style={styles.wmYin}>
              <View style={styles.wmSeg} />
              <View style={{ width: 28 }} />
              <View style={styles.wmSeg} />
            </View>
          )}
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Debug overlay modal ──────────────────────────────────────────────────────
function DebugModal({
  visible,
  debugText,
  onClose,
}: {
  visible: boolean;
  debugText: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(debugText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={debugStyles.overlay}>
        <View style={debugStyles.panel}>
          {/* Header */}
          <View style={debugStyles.header}>
            <Text style={debugStyles.title}>{'> DEBUG'}</Text>
            <View style={debugStyles.headerActions}>
              <TouchableOpacity
                style={debugStyles.copyBtn}
                onPress={handleCopy}
                activeOpacity={0.7}
              >
                <Text style={debugStyles.copyText}>{copied ? '已复制 ✓' : '复制'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={debugStyles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={debugStyles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable debug text */}
          <ScrollView
            style={debugStyles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={debugStyles.scrollContent}
          >
            <Text style={debugStyles.debugText} selectable>
              {debugText}
            </Text>
          </ScrollView>

          {/* Terminal cursor blink hint */}
          <View style={debugStyles.footer}>
            <Text style={debugStyles.footerText}>{'█'}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ResultScreen({ route, navigation }: Props) {
  const { result } = route.params;
  const {
    originalHexagram,
    changedHexagram,
    changingLine,
    upperTrigram,
    lowerTrigram,
    shichenIndex,
    shichenName,
    totalStrokes,
    a,
    b,
    aMapped,
    bMapped,
    debug,
  } = result;

  const sum = totalStrokes + shichenIndex;
  const rawRemainder = sum % 6;
  const displayRemainder = rawRemainder === 0 ? 6 : rawRemainder;

  // ── Animations ──────────────────────────────────────────────────────────────
  const fades = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0)),
  ).current;
  const arrowY = useRef(new Animated.Value(0)).current;
  const wmOpacity = useRef(new Animated.Value(0.03)).current;

  useEffect(() => {
    Animated.stagger(
      150,
      fades.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowY, { toValue: 7, duration: 900, useNativeDriver: true }),
        Animated.timing(arrowY, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(wmOpacity, { toValue: 0.07, duration: 4000, useNativeDriver: true }),
        Animated.timing(wmOpacity, { toValue: 0.03, duration: 4000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);

  function handleReset() {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Write' }] }),
    );
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ① 时辰 badge ──────────────────────────────────────────────────── */}
        <Animated.View style={[styles.shichenRow, { opacity: fades[0] }]}>
          <View style={styles.shichenBadge}>
            <Text style={styles.shichenText}>{shichenName}</Text>
          </View>
        </Animated.View>

        {/* ② 原卦 — long press triggers debug overlay ─────────────────────── */}
        <Animated.View style={[styles.hexBlock, { opacity: fades[0] }]}>
          <Text style={styles.sectionLabel}>原卦</Text>

          <TouchableWithoutFeedback
            onLongPress={() => setDebugVisible(true)}
            delayLongPress={500}
          >
            <View style={styles.hexCard}>
              <InkWatermark hexagram={originalHexagram} opacity={wmOpacity} />
              <HexagramDisplay
                hexagram={originalHexagram}
                highlightLine={changingLine.position}
              />
            </View>
          </TouchableWithoutFeedback>

          <Text style={styles.hexName}>{originalHexagram.name}</Text>
          <Text style={styles.hexPinyin}>{originalHexagram.pinyin}</Text>
          <Text style={styles.changingLineLabel}>
            变爻：{changingLine.traditionalName}（第 {changingLine.position} 爻）
          </Text>
        </Animated.View>

        {/* ③ Flowing arrow ──────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.arrowWrapper,
            { opacity: fades[1], transform: [{ translateY: arrowY }] },
          ]}
        >
          <Text style={styles.arrow}>↓</Text>
        </Animated.View>

        {/* ④ 变卦 ───────────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.hexBlock, { opacity: fades[2] }]}>
          <Text style={styles.sectionLabel}>变卦</Text>

          <View style={styles.hexCard}>
            <InkWatermark hexagram={changedHexagram} opacity={wmOpacity} />
            <HexagramDisplay hexagram={changedHexagram} />
          </View>

          <Text style={styles.hexName}>{changedHexagram.name}</Text>
          <Text style={styles.hexPinyin}>{changedHexagram.pinyin}</Text>
        </Animated.View>

        {/* ⑤ 计算详情 (collapsible) ─────────────────────────────────────────── */}
        <Animated.View style={[styles.detailsBlock, { opacity: fades[3] }]}>
          <TouchableOpacity
            style={styles.detailsHeader}
            onPress={() => setDetailsOpen((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsTitle}>计算详情</Text>
            <Text style={styles.detailsChevron}>{detailsOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {detailsOpen && (
            <View style={styles.detailsBody}>
              <Text style={styles.detailLine}>
                笔画 a = {a}　→　映射 = {aMapped}　→　{upperTrigram.name} 卦（上卦）
              </Text>
              <Text style={styles.detailLine}>
                笔画 b = {b}　→　映射 = {bMapped}　→　{lowerTrigram.name} 卦（下卦）
              </Text>
              <Text style={styles.detailLine}>
                总笔画 {totalStrokes} + 时辰序数 {shichenIndex} = {sum}，余数{' '}
                {displayRemainder}，变爻为{changingLine.traditionalName}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ⑥ 重新占卜 ───────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.resetWrapper, { opacity: fades[4] }]}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={styles.resetText}>重新占卜</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Debug modal — rendered outside ScrollView to float above everything */}
      <DebugModal
        visible={debugVisible}
        debugText={debug}
        onClose={() => setDebugVisible(false)}
      />
    </>
  );
}

// ─── Main styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0D0D0D' },
  content: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  shichenRow: { width: '100%', alignItems: 'flex-end', marginBottom: 4 },
  shichenBadge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C8A96E',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  shichenText: { color: '#C8A96E', fontSize: 13, letterSpacing: 3 },
  hexBlock: { width: '100%', alignItems: 'center', marginTop: 24 },
  sectionLabel: {
    fontSize: 11,
    color: '#8A7560',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  hexCard: { width: '100%', paddingVertical: 24, overflow: 'hidden' },
  hexName: { marginTop: 16, fontSize: 32, color: '#C8A96E', letterSpacing: 4, fontWeight: '300' },
  hexPinyin: { marginTop: 6, fontSize: 14, color: '#8A7560', letterSpacing: 2 },
  changingLineLabel: { marginTop: 12, fontSize: 13, color: '#8A7560', letterSpacing: 1 },
  arrowWrapper: { marginTop: 8, alignItems: 'center' },
  arrow: { fontSize: 22, color: '#C8A96E', opacity: 0.6 },
  detailsBlock: {
    width: '100%',
    marginTop: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C8A96E22',
    paddingTop: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailsTitle: { fontSize: 13, color: '#8A7560', letterSpacing: 3 },
  detailsChevron: { fontSize: 11, color: '#8A7560' },
  detailsBody: { marginTop: 14, gap: 10 },
  detailLine: { fontSize: 12, color: '#6A5E50', lineHeight: 20, letterSpacing: 0.5 },
  resetWrapper: { marginTop: 40, alignItems: 'center' },
  resetBtn: {
    borderWidth: 1,
    borderColor: '#C8A96E55',
    paddingVertical: 12,
    paddingHorizontal: 44,
  },
  resetText: { color: '#E8DCC8', fontSize: 16, letterSpacing: 4, opacity: 0.7 },
  watermarkContainer: { alignItems: 'center', justifyContent: 'center' },
  wmRow: { width: 260, alignItems: 'center' },
  wmYang: { width: '100%', height: 9, backgroundColor: '#C8A96E', borderRadius: 4 },
  wmYin: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  wmSeg: { flex: 1, height: 9, backgroundColor: '#C8A96E', borderRadius: 4 },
});

// ─── Debug modal styles ───────────────────────────────────────────────────────
const debugStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#001A00',
    borderWidth: 1,
    borderColor: '#00FF4133',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00FF4133',
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#00FF41',
    letterSpacing: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  copyBtn: { paddingVertical: 2, paddingHorizontal: 4 },
  copyText: { fontFamily: 'monospace', fontSize: 12, color: '#00FF41', letterSpacing: 1 },
  closeBtn: { paddingVertical: 2, paddingHorizontal: 4 },
  closeText: { fontFamily: 'monospace', fontSize: 14, color: '#00FF4188' },
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#00FF41',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00FF4122',
  },
  footerText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#00FF4166',
  },
});
