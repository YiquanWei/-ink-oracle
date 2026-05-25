import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';
import HexagramDisplay from '../components/HexagramDisplay';
import type { Hexagram, RootStackParamList } from '../types';

type Props = StackScreenProps<RootStackParamList, 'Result'>;

type WebScrollStyle = ViewStyle & {
  overflowY?: 'auto';
  overflowX?: 'hidden';
  WebkitOverflowScrolling?: 'touch';
  touchAction?: 'pan-y';
};

const webScrollStyle: WebScrollStyle | undefined =
  Platform.OS === 'web'
    ? {
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }
    : undefined;

type WebElement = {
  style: {
    height: string;
    minHeight: string;
    overflow?: string;
    overflowX?: string;
    overflowY?: string;
  };
};

type WebDocument = {
  body?: WebElement;
  documentElement?: WebElement;
  getElementById?: (id: string) => WebElement | null;
};

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

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const doc = (globalThis as { document?: WebDocument }).document;
    const body = doc?.body;
    const html = doc?.documentElement;
    const root = doc?.getElementById?.('root') ?? null;

    if (!body || !html) return;

    const previous = {
      bodyHeight: body.style.height,
      bodyMinHeight: body.style.minHeight,
      bodyOverflowX: body.style.overflowX,
      bodyOverflowY: body.style.overflowY,
      htmlHeight: html.style.height,
      htmlMinHeight: html.style.minHeight,
      htmlOverflowY: html.style.overflowY,
      rootHeight: root?.style.height,
      rootMinHeight: root?.style.minHeight,
      rootOverflow: root?.style.overflow,
    };

    html.style.height = 'auto';
    html.style.minHeight = '100%';
    html.style.overflowY = 'auto';
    body.style.height = 'auto';
    body.style.minHeight = '100%';
    body.style.overflowX = 'hidden';
    body.style.overflowY = 'auto';

    if (root) {
      root.style.height = 'auto';
      root.style.minHeight = '100vh';
      root.style.overflow = 'visible';
    }

    return () => {
      html.style.height = previous.htmlHeight;
      html.style.minHeight = previous.htmlMinHeight;
      html.style.overflowY = previous.htmlOverflowY;
      body.style.height = previous.bodyHeight;
      body.style.minHeight = previous.bodyMinHeight;
      body.style.overflowX = previous.bodyOverflowX;
      body.style.overflowY = previous.bodyOverflowY;

      if (root) {
        root.style.height = previous.rootHeight ?? '';
        root.style.minHeight = previous.rootMinHeight ?? '';
        root.style.overflow = previous.rootOverflow ?? '';
      }
    };
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
    <View style={styles.screen}>
      <ScrollView
        style={[styles.scroll, webScrollStyle]}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        {/* ① 时辰 badge ──────────────────────────────────────────────────── */}
        <Animated.View style={[styles.shichenRow, { opacity: fades[0] }]}>
          <View style={styles.shichenBadge}>
            <Text style={styles.shichenText}>{shichenName}</Text>
          </View>
        </Animated.View>

        {/* ② 原卦 — long press triggers debug overlay ─────────────────────── */}
        <Animated.View style={[styles.hexBlock, { opacity: fades[0] }]}>
          <TouchableOpacity
            onLongPress={() => setDebugVisible(true)}
            delayLongPress={500}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionLabel}>原卦</Text>
          </TouchableOpacity>

          <View style={styles.hexCard}>
            <InkWatermark hexagram={originalHexagram} opacity={wmOpacity} />
            <HexagramDisplay
              hexagram={originalHexagram}
              highlightLine={changingLine.position}
            />
          </View>

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

        {/* ⑤ 起卦痕迹 (collapsible) ─────────────────────────────────────────── */}
        <Animated.View style={[styles.detailsBlock, { opacity: fades[3] }]}>
          <TouchableOpacity
            style={styles.detailsHeader}
            onPress={() => setDetailsOpen((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsTitle}>起卦痕迹</Text>
            <Text style={styles.detailsChevron}>{detailsOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {detailsOpen && (
            <View style={styles.detailsBody}>
              <Text style={styles.traceIntro}>
                此卦由书写笔画、停顿分割、当前时辰共同生成。
              </Text>
              <Text style={styles.traceMetaTitle}>计算详情</Text>
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
    </View>
  );
}

// ─── Main styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#0D0D0D',
  },
  content: {
    flexGrow: 1,
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
  traceIntro: {
    fontSize: 13,
    color: '#8A7560',
    lineHeight: 22,
    letterSpacing: 1,
  },
  traceMetaTitle: {
    marginTop: 8,
    fontSize: 10,
    color: '#C8A96E66',
    letterSpacing: 3,
  },
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
