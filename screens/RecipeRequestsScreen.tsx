import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllPrescriptionRequests, updatePrescriptionRequestChecks } from '../services/prescriptionRequestService';
import type { PrescriptionRequest } from '../types';
import { showAlert } from '../utils/alert';

export default function RecipeRequestsScreen() {
  const [requests, setRequests] = useState<PrescriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const data = await getAllPrescriptionRequests();
      setRequests(data);
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar as solicitações de receita');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const visibleRequests = useMemo(
    () => requests.filter((r) => !(r.recipeCreated && r.recipeDelivered)),
    [requests]
  );

  const handleToggleCheck = useCallback(
    (item: PrescriptionRequest, field: 'recipeCreated' | 'recipeDelivered', value: boolean) => {
      const newCreated = field === 'recipeCreated' ? value : item.recipeCreated ?? false;
      const newDelivered = field === 'recipeDelivered' ? value : item.recipeDelivered ?? false;
      const bothChecked = newCreated && newDelivered;

      if (bothChecked) {
        showAlert(
          'Receita entregue',
          'Confirmar que a receita foi entregue? Ela será removida da listagem.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar',
              onPress: async () => {
                try {
                  await updatePrescriptionRequestChecks(item.id, newCreated, newDelivered);
                  await loadRequests();
                } catch (error) {
                  showAlert('Erro', 'Não foi possível atualizar a solicitação');
                }
              },
            },
          ]
        );
        return;
      }

      (async () => {
        try {
          await updatePrescriptionRequestChecks(item.id, newCreated, newDelivered);
          await loadRequests();
        } catch (error) {
          showAlert('Erro', 'Não foi possível atualizar a solicitação');
        }
      })();
    },
    [loadRequests]
  );

  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      loadRequests();
    }, [loadRequests])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const renderItem = ({ item }: { item: PrescriptionRequest }) => {
    const recipeCreated = item.recipeCreated ?? false;
    const recipeDelivered = item.recipeDelivered ?? false;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>{item.patientName}</Text>
        </View>
        {item.observations ? (
          <Text style={styles.observations}>
            Observações: {item.observations}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          Solicitado por {item.requestedByName}
        </Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>Receita criada</Text>
          <Switch
            value={recipeCreated}
            onValueChange={(value) => handleToggleCheck(item, 'recipeCreated', value)}
            trackColor={{ false: '#ddd', true: '#4A90E2' }}
            thumbColor="#fff"
          />
        </View>
        <View style={[styles.checkRow, !recipeCreated && styles.checkRowDisabled]}>
          <Text style={[styles.checkLabel, !recipeCreated && styles.checkLabelDisabled]}>
            Receita entregue
          </Text>
          <Switch
            value={recipeDelivered}
            onValueChange={(value) => handleToggleCheck(item, 'recipeDelivered', value)}
            trackColor={{ false: '#ddd', true: '#4A90E2' }}
            thumbColor="#fff"
            disabled={!recipeCreated}
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando solicitações...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleRequests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhuma solicitação de receita no momento.
            </Text>
            <Text style={styles.emptyHint}>
              As solicitações aparecem aqui quando você clica em um paciente e usa o botão "Solicitar receita".
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusFulfilled: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  meta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  observations: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  checkLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  checkRowDisabled: {
    opacity: 0.6,
  },
  checkLabelDisabled: {
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 12,
  },
});
