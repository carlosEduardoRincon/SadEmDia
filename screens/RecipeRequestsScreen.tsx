import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllPrescriptionRequests, fulfillPrescriptionRequest } from '../services/prescriptionRequestService';
import type { PrescriptionRequest } from '../types';
import { showAlert } from '../utils/alert';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  fulfilled: 'Atendida',
  cancelled: 'Cancelada',
};

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

  const handleFulfill = (item: PrescriptionRequest) => {
    if (item.status !== 'pending') return;
    showAlert(
      'Atender solicitação',
      `Marcar a solicitação de receita de ${item.patientName} como atendida?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Atender',
          onPress: async () => {
            try {
              await fulfillPrescriptionRequest(item.id);
              await loadRequests();
              showAlert('Sucesso', 'Solicitação marcada como atendida');
            } catch (error) {
              showAlert('Erro', 'Não foi possível atualizar a solicitação');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: PrescriptionRequest }) => {
    const isPending = item.status === 'pending';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <View style={[styles.statusBadge, isPending ? styles.statusPending : styles.statusFulfilled]}>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
          </View>
        </View>
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
        {isPending && (
          <TouchableOpacity
            style={styles.fulfillButton}
            onPress={() => handleFulfill(item)}
          >
            <Text style={styles.fulfillButtonText}>Marcar como atendida</Text>
          </TouchableOpacity>
        )}
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
        data={requests}
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
  fulfillButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  fulfillButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
