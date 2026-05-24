import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Hexagram } from '../types';

interface Props {
  hexagram: Hexagram;
  highlightLine?: number; // 1–6, 1=bottom
}

const LINE_H = 5;
const LINE_GAP = 10;

export default function HexagramDisplay({ hexagram, highlightLine }: Props) {
  // lines[0]=bottom … lines[5]=top; render top-to-bottom so reverse
  const displayOrder = [...hexagram.lines].reverse();
  // displayOrder[0] = line 6 (top visual), displayOrder[5] = line 1 (bottom visual)

  return (
    <View style={styles.container}>
      {displayOrder.map((bit, di) => {
        const linePos = 6 - di; // 1-indexed: 6=top row, 1=bottom row
        const isHighlit = highlightLine === linePos;

        return (
          <View
            key={di}
            style={[styles.lineRow, di > 0 && { marginTop: LINE_GAP }]}
          >
            {/* Line content — centered at 60% of lineContent width */}
            <View style={styles.lineContent}>
              {bit === 1 ? (
                <View style={[styles.yang, isHighlit && styles.lineHighlit]} />
              ) : (
                <View style={styles.yinWrapper}>
                  <View style={[styles.yinSeg, isHighlit && styles.lineHighlit]} />
                  <View style={styles.yinGap} />
                  <View style={[styles.yinSeg, isHighlit && styles.lineHighlit]} />
                </View>
              )}
            </View>

            {/* Right-side dot area — reserved width keeps balance */}
            <View style={styles.dotArea}>
              {isHighlit && <View style={styles.changingDot} />}
            </View>
          </View>
        );
      })}

      <Text style={styles.name}>{hexagram.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  // Each row: left-pad mirrors dot width so lines stay visually centred
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingLeft: 24,
  },
  lineContent: {
    flex: 1,
    alignItems: 'center',
  },
  // Yang — solid bar at 60% of lineContent
  yang: {
    width: '60%',
    height: LINE_H,
    backgroundColor: '#E8DCC8',
    borderRadius: 3,
    shadowColor: '#E8DCC8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Yin — two segments at 60% total
  yinWrapper: {
    width: '60%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  yinSeg: {
    flex: 1,
    height: LINE_H,
    backgroundColor: '#E8DCC8',
    borderRadius: 3,
    shadowColor: '#E8DCC8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  yinGap: {
    width: 14,
  },
  // Highlight: gold with glow
  lineHighlit: {
    backgroundColor: '#C8A96E',
    shadowColor: '#C8A96E',
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  // Right marker
  dotArea: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8A96E',
    shadowColor: '#C8A96E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  name: {
    marginTop: 14,
    fontSize: 13,
    color: '#8A7560',
    letterSpacing: 2,
  },
});
