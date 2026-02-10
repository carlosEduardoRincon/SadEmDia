import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { useNavigation } from '@react-navigation/native';
import { getAllPatientsOrderedByPriority, createPatient } from '../services/patientService';
import { PatientPriority } from '../types';
import { getCurrentUser, logoutUser } from '../services/authService';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { getProfessionalTypeLabel } from '../utils/professionalType';

export default function PatientListScreen() {
  const navigation = useNavigation();
  const { setUser } = useAuth();
  const [patients, setPatients] = useState<PatientPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUserLocal] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formComorbidities, setFormComorbidities] = useState('');
  const [formNeedsPrescription, setFormNeedsPrescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
    loadPatients();
  }, []);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUserLocal(currentUser);
  };

  const loadPatients = async () => {
    try {
      const data = await getAllPatientsOrderedByPriority();
      setPatients(data);
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar a lista de pacientes');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPatients();
  }, []);

  const closeAddForm = () => {
    setShowAddForm(false);
    setFormName('');
    setFormAge('');
    setFormComorbidities('');
    setFormNeedsPrescription(false);
  };

  const handleSavePatient = async () => {
    const name = formName.trim();
    if (!name) {
      showAlert('Erro', 'Informe o nome do paciente');
      return;
    }
    const ageNum = parseInt(formAge, 10);
    if (!formAge || isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      showAlert('Erro', 'Informe uma idade válida (0 a 150)');
      return;
    }
    const comorbidities = formComorbidities
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setSubmitting(true);
    try {
      await createPatient({
        name,
        age: ageNum,
        comorbidities,
        needsPrescription: formNeedsPrescription,
      });
      showAlert('Sucesso', 'Paciente cadastrado com sucesso');
      closeAddForm();
      await loadPatients();
    } catch (error) {
      showAlert('Erro', 'Não foi possível cadastrar o paciente');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    showAlert(
      'Confirmar saída',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
              setUser(null);
            } catch (error) {
              showAlert('Erro', 'Não foi possível fazer logout');
            }
          },
        },
      ]
    );
  };

  const renderPatientItem = ({ item }: { item: PatientPriority }) => {
    const { patient, priorityScore, reasons } = item;
    const hasRequests = patient.visitRequests && patient.visitRequests.length > 0;

    let priorityColor = '#4CAF50';
    if (priorityScore >= 50) {
      priorityColor = '#F44336';
    } else if (priorityScore >= 25) {
      priorityColor = '#FF9800';
    }

    return (
      <TouchableOpacity
        style={styles.patientCard}
        onPress={() => navigation.navigate('PatientDetail' as never, { patientId: patient.id } as never)}
      >
        <View style={styles.patientHeader}>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientAge}>Idade: {patient.age} anos</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityScore}>{priorityScore}</Text>
          </View>
        </View>

        {hasRequests && (
          <View style={styles.requestBadge}>
            <Text style={styles.requestText}>
              ⚠️ {patient.visitRequests.length} solicitação(ões) pendente(s)
            </Text>
          </View>
        )}

        {patient.comorbidities && patient.comorbidities.length > 0 && (
          <View style={styles.comorbiditiesContainer}>
            <Text style={styles.comorbiditiesLabel}>Comorbidades:</Text>
            <Text style={styles.comorbiditiesText}>
              {patient.comorbidities.join(', ')}
            </Text>
          </View>
        )}

        {patient.needsPrescription && (
          <View style={styles.prescriptionBadge}>
            <Text style={styles.prescriptionText}>📋 Precisa de receita médica</Text>
          </View>
        )}

        {reasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            <Text style={styles.reasonsLabel}>Motivos de prioridade:</Text>
            {reasons.map((reason, index) => (
              <Text key={index} style={styles.reasonText}>
                • {reason}
              </Text>
            ))}
          </View>
        )}

        {patient.lastVisit && (
          <Text style={styles.lastVisit}>
            Última visita: {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando pacientes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userText}>
            Olá, {user.name} ({getProfessionalTypeLabel(user.professionalType)})
          </Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item.patient.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addPatientButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addPatientButtonText}>+ Cadastrar paciente</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum paciente cadastrado</Text>
          </View>
        }
      />

      <Modal
        visible={showAddForm}
        animationType="slide"
        transparent
        onRequestClose={closeAddForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo paciente</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Nome *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nome completo"
                value={formName}
                onChangeText={setFormName}
                autoCapitalize="words"
              />
              <Text style={styles.formLabel}>Idade *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ex: 70"
                value={formAge}
                onChangeText={setFormAge}
                keyboardType="number-pad"
              />
              <Text style={styles.formLabel}>Comorbidades</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ex: Diabetes, Hipertensão (separadas por vírgula)"
                value={formComorbidities}
                onChangeText={setFormComorbidities}
              />
              <View style={styles.formSwitchRow}>
                <Text style={styles.formLabel}>Precisa de receita médica</Text>
                <Switch
                  value={formNeedsPrescription}
                  onValueChange={setFormNeedsPrescription}
                  trackColor={{ false: '#ccc', true: '#4A90E2' }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeAddForm}
                disabled={submitting}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSavePatient}
                disabled={submitting}
              >
                <Text style={styles.modalButtonSaveText}>
                  {submitting ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userInfo: {
    backgroundColor: '#4A90E2',
    padding: 15,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addPatientButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 15,
  },
  addPatientButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
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
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 14,
    backgroundColor: '#f9f9f9',
  },
  formSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#e0e0e0',
  },
  modalButtonSave: {
    backgroundColor: '#4A90E2',
  },
  modalButtonCancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  patientCard: {
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
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  patientAge: {
    fontSize: 14,
    color: '#666',
  },
  priorityBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  priorityScore: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestBadge: {
    backgroundColor: '#FFE0B2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  requestText: {
    color: '#E65100',
    fontSize: 13,
    fontWeight: '600',
  },
  comorbiditiesContainer: {
    marginBottom: 8,
  },
  comorbiditiesLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  comorbiditiesText: {
    fontSize: 14,
    color: '#333',
  },
  prescriptionBadge: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  prescriptionText: {
    color: '#E65100',
    fontSize: 13,
    fontWeight: '600',
  },
  reasonsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reasonsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  lastVisit: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
