import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DAY_LABELS_COMPACT = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const DAY_LABELS_EXPANDED = ['2ª', '3ª', '4ª', '5ª', '6ª', 'Sáb', 'Dom'];

export type WeekVisitsIndicatorVariant = 'compact' | 'expanded';

/** visitsByDay: dia da semana 0 = Segunda, 6 = Domingo; valor = quantidade de visitas. */
/** rows: número de fileiras de bolinhas (ex.: 2 para recém-admitidos = 2 visitas/dia). */
export interface WeekVisitsIndicatorProps {
  visitsByDay: Record<number, number>;
  variant?: WeekVisitsIndicatorVariant;
  rows?: number;
}

export default function WeekVisitsIndicator({
  visitsByDay,
  variant = 'compact',
  rows = 1,
}: WeekVisitsIndicatorProps) {
  const labels = variant === 'compact' ? DAY_LABELS_COMPACT : DAY_LABELS_EXPANDED;
  const isCompact = variant === 'compact';

  const renderDotsRow = (minCount: number) => (
    <View key={minCount} style={[styles.dotsRow, isCompact && styles.dotsRowCompact]}>
      {[0, 1, 2, 3, 4, 5, 6].map((day) => {
        const count = visitsByDay[day] ?? 0;
        const filled = count >= minCount;
        return (
          <View key={day} style={[styles.dayCell, isCompact && styles.dayCellCompact]}>
            <View
              style={[
                styles.dot,
                isCompact ? styles.dotCompact : styles.dotExpanded,
                filled ? styles.dotFilled : styles.dotEmpty,
              ]}
            />
            {!isCompact && filled && minCount === 1 && count > 1 && (
              <Text style={styles.countText}>{count}</Text>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <View style={[styles.labelsRow, isCompact && styles.labelsRowCompact]}>
        {labels.map((label, index) => (
          <View key={index} style={[styles.dayCell, isCompact && styles.dayCellCompact]}>
            <Text style={[styles.label, isCompact && styles.labelCompact]}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.dotsContainer}>
        {Array.from({ length: rows }, (_, i) => renderDotsRow(i + 1))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelsRowCompact: {
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellCompact: {
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  labelCompact: {
    fontSize: 11,
    color: '#888',
  },
  dotsContainer: {
    gap: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotsRowCompact: {},
  dot: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#ccc',
  },
  dotCompact: {
    width: 10,
    height: 10,
  },
  dotExpanded: {
    width: 18,
    height: 18,
  },
  dotFilled: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  dotEmpty: {
    backgroundColor: 'transparent',
  },
  countText: {
    fontSize: 10,
    color: '#4A90E2',
    marginTop: 2,
    fontWeight: '600',
  },
});
