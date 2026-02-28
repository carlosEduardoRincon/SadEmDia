import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getPendingVisitRequestsForProfessional,
  registerVisit,
  getPatientById,
} from '../services/patientService';
import { getCurrentUser } from '../services/authService';
import type { VisitRequest } from '../types';
import { showAlert } from '../utils/alert';
import { getProfessionalTypeLabel } from '../utils/professionalType';

export default function ReferralsScreen() {
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalRequest, setModalRequest] = useState<VisitRequest | null>(null);
  const [observation, setObservation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setRequests([]);
        setPatientNames({});
        return;
      }
      const data = await getPendingVisitRequestsForProfessional(user.professionalType);
      setRequests(data);

      const ids = [...new Set(data.map((r) => r.patientId))];
      const names: Record<string, string> = {};
      await Promise.all(
        ids.map(async (id) => {
          const p = await getPatientById(id);
          names[id] = p?.name ?? 'Paciente';
        })
      );
      setPatientNames(names);
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar os encaminhamentos');
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

  const openRegisterModal = useCallback((request: VisitRequest) => {
    setModalRequest(request);
    setObservation('');
  }, []);

  const closeRegisterModal = useCallback(() => {
    setModalRequest(null);
    setObservation('');
  }, []);

  const handleRegisterVisit = useCallback(async () => {
    if (!modalRequest) return;
    const user = await getCurrentUser();
    if (!user) {
      showAlert('Erro', 'Sessão inválida. Faça login novamente.');
      return;
    }
    setSubmitting(true);
    try {
      await registerVisit(
        modalRequest.patientId,
        user.id,
        user.professionalType,
        observation.trim() || undefined,
        modalRequest.id
      );
      showAlert('Sucesso', 'Visita registrada com sucesso!');
      closeRegisterModal();
      await loadRequests();
    } catch (error) {
      showAlert('Erro', 'Não foi possível registrar a visita');
    } finally {
      setSubmitting(false);
    }
  }, [modalRequest, observation, closeRegisterModal, loadRequests]);

  const renderItem = ({ item }: { item: VisitRequest }) => {
    const patientName = patientNames[item.patientId] ?? 'Paciente';
    const requestedByLabel = item.requestedByName ?? getProfessionalTypeLabel(item.requestedByType);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>{patientName}</Text>
        </View>
        <Text style={styles.reason}>{item.reason}</Text>
        <Text style={styles.meta}>
          Solicitado por {requestedByLabel}
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
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => openRegisterModal(item)}
        >
          <Text style={styles.registerButtonText}>Registrar visita</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando encaminhamentos...</Text>
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
              Nenhum encaminhamento no momento.
            </Text>
            <Text style={styles.emptyHint}>
              Os encaminhamentos para sua especialidade aparecem aqui quando outro profissional solicita "Visita de Outro Profissional" no perfil do paciente.
            </Text>
          </View>
        }
      />

      <Modal
        visible={!!modalRequest}
        transparent
        animationType="fade"
        onRequestClose={closeRegisterModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Registrar visita</Text>
            {modalRequest && (
              <Text style={styles.modalPatient}>
                Paciente: {patientNames[modalRequest.patientId] ?? 'Paciente'}
              </Text>
            )}
            <Text style={styles.modalLabel}>Observação</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Observação da visita (opcional)"
              value={observation}
              onChangeText={setObservation}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeRegisterModal}
                disabled={submitting}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleRegisterVisit}
                disabled={submitting}
              >
                <Text style={styles.modalButtonSaveText}>
                  {submitting ? 'Salvando...' : 'Registrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  reason: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
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
  registerButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalPatient: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonCancel: {
    backgroundColor: '#eee',
  },
  modalButtonCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalButtonSave: {
    backgroundColor: '#4A90E2',
  },
  modalButtonSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
});
