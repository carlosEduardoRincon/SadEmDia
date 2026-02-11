import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  getPatientById,
  registerVisit,
  requestVisitFromProfessional,
  deletePatient,
} from '../services/patientService';
import { getCurrentUser } from '../services/authService';
import { Patient, User, ProfessionalType } from '../types';
import { calculatePatientPriority } from '../services/priorityService';
import { PROFESSIONAL_TYPE_OPTIONS, getProfessionalTypeLabel } from '../utils/professionalType';

export default function PatientDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { patientId } = route.params as { patientId: string };

  const [patient, setPatient] = useState<Patient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitNotes, setVisitNotes] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestProfessionalType, setRequestProfessionalType] = useState<ProfessionalType>('Cardiologista');
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      const [patientData, currentUser] = await Promise.all([
        getPatientById(patientId),
        getCurrentUser(),
      ]);
      setPatient(patientData);
      setUser(currentUser);
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar os dados do paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVisit = async () => {
    if (!user || !patient) return;

    setSubmitting(true);
    try {
      await registerVisit(patient.id, user.id, user.professionalType, visitNotes);
      showAlert('Sucesso', 'Visita registrada com sucesso!');
      setVisitNotes('');
      setShowVisitForm(false);
      loadData();
      navigation.goBack();
    } catch (error) {
      showAlert('Erro', 'Não foi possível registrar a visita');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestVisit = async () => {
    if (!user || !patient || !requestReason.trim()) {
      showAlert('Erro', 'Por favor, informe o motivo da solicitação');
      return;
    }

    if (requestProfessionalType === user.professionalType) {
      showAlert('Erro', 'Você não pode solicitar uma visita para o mesmo tipo de profissional');
      return;
    }

    setSubmitting(true);
    try {
      await requestVisitFromProfessional(
        patient.id,
        user.id,
        user.professionalType,
        requestProfessionalType,
        requestReason
      );
      showAlert('Sucesso', 'Solicitação de visita criada com sucesso!');
      setRequestReason('');
      setShowRequestForm(false);
      loadData();
    } catch (error) {
      showAlert('Erro', 'Não foi possível criar a solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePatient = () => {
    if (!patient) return;
    showAlert(
      'Remover paciente',
      `Deseja realmente remover ${patient.name}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await deletePatient(patient.id);
              showAlert('Sucesso', 'Paciente removido com sucesso');
              navigation.goBack();
            } catch (error) {
              showAlert('Erro', 'Não foi possível remover o paciente');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !patient) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  const priority = calculatePatientPriority(patient);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Paciente</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>{patient.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Idade:</Text>
            <Text style={styles.value}>{patient.age} anos</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Prioridade:</Text>
            <View style={[styles.priorityBadge, { backgroundColor: priority.priorityScore >= 50 ? '#F44336' : priority.priorityScore >= 25 ? '#FF9800' : '#4CAF50' }]}>
              <Text style={styles.priorityText}>{priority.priorityScore}</Text>
            </View>
          </View>
        </View>

        {patient.comorbidities && patient.comorbidities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comorbidades</Text>
            {patient.comorbidities.map((comorbidity, index) => (
              <Text key={index} style={styles.comorbidityItem}>
                • {comorbidity}
              </Text>
            ))}
          </View>
        )}

        {patient.needsPrescription && (
          <View style={styles.section}>
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>📋 Precisa de receita médica</Text>
            </View>
          </View>
        )}

        {patient.lastVisit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Última Visita</Text>
            <Text style={styles.value}>
              {new Date(patient.lastVisit).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {patient.lastVisitBy && (
              <Text style={styles.subValue}>
                Por: {getProfessionalTypeLabel(patient.lastVisitBy)}
              </Text>
            )}
          </View>
        )}

        {priority.reasons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Motivos de Prioridade</Text>
            {priority.reasons.map((reason, index) => (
              <Text key={index} style={styles.reasonItem}>
                • {reason}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>

          {!showVisitForm ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowVisitForm(true)}
            >
              <Text style={styles.actionButtonText}>✓ Registrar Visita Realizada</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Observações da visita (opcional)"
                value={visitNotes}
                onChangeText={setVisitNotes}
                multiline
                numberOfLines={4}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowVisitForm(false);
                    setVisitNotes('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.submitButton]}
                  onPress={handleRegisterVisit}
                  disabled={submitting}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Salvando...' : 'Confirmar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!showRequestForm ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.requestButton]}
              onPress={() => setShowRequestForm(true)}
            >
              <Text style={styles.actionButtonText}>⚠ Solicitar Visita de Outro Profissional</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Tipo de Profissional:</Text>
              <View style={styles.pickerRow}>
                {PROFESSIONAL_TYPE_OPTIONS.filter(
                  (type) => type !== user?.professionalType
                ).map((type) => {
                  const isSelected = requestProfessionalType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.pickerOption,
                        isSelected && styles.pickerOptionSelected,
                      ]}
                      onPress={() => setRequestProfessionalType(type)}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          isSelected && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {getProfessionalTypeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={styles.textArea}
                placeholder="Motivo da solicitação"
                value={requestReason}
                onChangeText={setRequestReason}
                multiline
                numberOfLines={4}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowRequestForm(false);
                    setRequestReason('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.submitButton]}
                  onPress={handleRequestVisit}
                  disabled={submitting}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Salvando...' : 'Solicitar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={handleRemovePatient}
            disabled={submitting}
          >
            <Text style={styles.removeButtonText}>Remover paciente</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 15,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  subValue: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  priorityBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priorityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comorbidityItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  alertBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
  },
  alertText: {
    color: '#E65100',
    fontSize: 16,
    fontWeight: '600',
  },
  reasonItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  requestButton: {
    backgroundColor: '#FF9800',
  },
  removeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E53935',
    marginTop: 10,
  },
  removeButtonText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 10,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  pickerOptionSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#666',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  formButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
