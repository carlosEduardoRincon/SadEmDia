import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
  Platform,
  Modal,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showAlert } from '../utils/alert';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  getPatientById,
  registerVisit,
  requestVisitFromProfessional,
  deletePatient,
  getVisitsInPeriod,
  getStartOfWeek,
  getEndOfWeek,
} from '../services/patientService';
import { createPrescriptionRequest } from '../services/prescriptionRequestService';
import { getCurrentUser } from '../services/authService';
import { Patient, User, ProfessionalType } from '../types';
import type { Visit } from '../types';
import WeekVisitsIndicator from '../components/WeekVisitsIndicator';
import { calculatePatientPriority, getAdmissionPhase } from '../services/priorityService';
import { PROFESSIONAL_TYPE_OPTIONS, getProfessionalTypeLabel } from '../utils/professionalType';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PatientDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { patientId } = route.params as { patientId: string };

  const [patient, setPatient] = useState<Patient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitNotes, setVisitNotes] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestProfessionalType, setRequestProfessionalType] = useState<ProfessionalType>('Medico');
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prescriptionDelivered, setPrescriptionDelivered] = useState(false);
  const [nextPrescriptionDue, setNextPrescriptionDue] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionObservations, setPrescriptionObservations] = useState('');
  const [visitsInPeriod, setVisitsInPeriod] = useState<Visit[]>([]);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      const now = new Date();
      const [patientData, currentUser, visits] = await Promise.all([
        getPatientById(patientId),
        getCurrentUser(),
        getVisitsInPeriod(getStartOfWeek(now), getEndOfWeek(now)),
      ]);
      setPatient(patientData);
      setUser(currentUser);
      setVisitsInPeriod(visits.filter((v) => v.patientId === patientId));
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar os dados do paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVisit = async () => {
    if (!user || !patient) return;

    let nextPrescriptionDueDate: Date | undefined;
    if (prescriptionDelivered) {
      if (nextPrescriptionDue) {
        nextPrescriptionDueDate = nextPrescriptionDue;
      } else {
        showAlert('Erro', 'Selecione a próxima data da receita quando marcar que foi entregue');
        return;
      }
    }

    setSubmitting(true);
    try {
      await registerVisit(
        patient.id,
        user.id,
        user.professionalType,
        visitNotes,
        undefined,
        prescriptionDelivered ? true : undefined,
        nextPrescriptionDueDate
      );
      showAlert('Sucesso', 'Visita registrada com sucesso!');
      setVisitNotes('');
      setPrescriptionDelivered(false);
      setNextPrescriptionDue(null);
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

  const openPrescriptionModal = () => setShowPrescriptionModal(true);
  const closePrescriptionModal = () => {
    setShowPrescriptionModal(false);
    setPrescriptionObservations('');
  };

  const handleRequestPrescription = async () => {
    if (!user || !patient) return;
    setSubmitting(true);
    try {
      await createPrescriptionRequest(
        patient.id,
        patient.name,
        user.id,
        user.name,
        prescriptionObservations.trim() || undefined
      );
      showAlert(
        'Sucesso',
        'Solicitação de receita registrada. Ela aparecerá em "Solicitações de Receitas" no menu.'
      );
      closePrescriptionModal();
      loadData();
    } catch (error) {
      showAlert('Erro', 'Não foi possível registrar a solicitação de receita');
      console.error(error);
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

  const visitsByDay: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  visitsInPeriod.forEach((v) => {
    const d = v.date instanceof Date ? v.date : new Date(v.date);
    const dayIndex = (d.getDay() + 6) % 7;
    visitsByDay[dayIndex] = (visitsByDay[dayIndex] ?? 0) + 1;
  });

  const visitsSection = (
    <View style={[styles.section, isDesktop && styles.sectionDesktopRightLast]}>
      <Text style={styles.sectionTitle}>Visitas na semana</Text>
      <WeekVisitsIndicator
        variant="expanded"
        visitsByDay={visitsByDay}
        rows={getAdmissionPhase(patient.admissionDate ?? patient.createdAt) === 'recent' ? 2 : 1}
      />
      {visitsInPeriod.length > 0 ? (
        <View style={styles.visitList}>
          {[...visitsInPeriod]
            .sort((a, b) => {
              const da = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
              const db = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
              return db - da;
            })
            .slice(0, 10)
            .map((visit) => (
              <View key={visit.id} style={styles.visitListItem}>
                <Text style={styles.value}>
                  {format(visit.date instanceof Date ? visit.date : new Date(visit.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {' — '}
                  {getProfessionalTypeLabel(visit.professionalType)}
                </Text>
                {visit.notes ? (
                  <Text style={styles.visitNotes}>{visit.notes}</Text>
                ) : null}
              </View>
            ))}
        </View>
      ) : null}
    </View>
  );

  const infoSection = (
    <View style={[styles.section, isDesktop && styles.sectionFillHeight, isDesktop && styles.infoSectionMinHeight, styles.infoSection]}>
      <Text style={styles.sectionTitle}>Informações do Paciente</Text>
      <View style={[styles.infoContentWrap, isDesktop && styles.infoContentWrapSpread]}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nome:</Text>
          <Text style={styles.value}>{patient.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Idade:</Text>
          <Text style={styles.value}>{patient.age} anos</Text>
        </View>
        {patient.address ? (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Endereço:</Text>
            <Text style={styles.value}>{patient.address}</Text>
          </View>
        ) : null}
        {patient.zone ? (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Zona:</Text>
            <Text style={styles.value}>{patient.zone}</Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Text style={styles.label}>Prioridade:</Text>
          <View style={[styles.priorityBadge, { backgroundColor: priority.priorityScore >= 50 ? '#F44336' : priority.priorityScore >= 25 ? '#FF9800' : '#4CAF50' }]}>
            <Text style={styles.priorityText}>{priority.priorityScore}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const comorbiditiesSection = (
    <View style={[styles.section, isDesktop && styles.sectionDesktopRight]}>
      <Text style={styles.sectionTitle}>Comorbidades</Text>
      {patient.comorbidities && patient.comorbidities.length > 0 ? (
        patient.comorbidities.map((comorbidity, index) => (
          <Text key={index} style={styles.comorbidityItem}>
            • {comorbidity}
          </Text>
        ))
      ) : (
        <Text style={styles.emptySectionText}>—</Text>
      )}
    </View>
  );

  const priorityReasonsSection = (
    <View style={[styles.section, isDesktop && styles.sectionDesktopRight]}>
      <Text style={styles.sectionTitle}>Motivos de Prioridade</Text>
      {priority.reasons.length > 0 ? (
        priority.reasons.map((reason, index) => (
          <Text key={index} style={styles.reasonItem}>
            • {reason}
          </Text>
        ))
      ) : (
        <Text style={styles.emptySectionText}>—</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {isDesktop ? (
          <View style={styles.desktopRow}>
            <View style={styles.desktopCol30}>
              {infoSection}
              {comorbiditiesSection}
              {priorityReasonsSection}
            </View>
            <View style={styles.desktopCol70}>
              {visitsSection}
            </View>
          </View>
        ) : (
          <>
            {infoSection}
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
            {visitsSection}
          </>
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
              {patient.needsPrescription && (
                <View style={styles.prescriptionSection}>
                  <View style={styles.switchRow}>
                    <Text style={styles.formLabel}>Receita foi entregue?</Text>
                    <Switch
                      value={prescriptionDelivered}
                      onValueChange={setPrescriptionDelivered}
                      trackColor={{ false: '#ddd', true: '#4A90E2' }}
                      thumbColor="#fff"
                    />
                  </View>
                  {prescriptionDelivered && (
                    <View style={styles.datePickerRow}>
                      <Text style={styles.formLabel}>
                        Data para a próxima entrega de receita
                      </Text>
                      {Platform.OS === 'web' ? (
                        <View style={styles.dateInputWrapper}>
                          <input
                            type="date"
                            value={nextPrescriptionDue ? format(nextPrescriptionDue, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                setNextPrescriptionDue(new Date(val + 'T12:00:00'));
                              } else {
                                setNextPrescriptionDue(null);
                              }
                            }}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            style={{
                              width: '100%',
                              maxWidth: '100%',
                              minWidth: 0,
                              boxSizing: 'border-box',
                              padding: 15,
                              fontSize: 16,
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              backgroundColor: '#f9f9f9',
                              cursor: 'pointer',
                            } as React.CSSProperties}
                          />
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                          >
                            <Text style={styles.dateButtonText}>
                              {nextPrescriptionDue
                                ? format(nextPrescriptionDue, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                                : '📅 Selecionar data da próxima receita'}
                            </Text>
                          </TouchableOpacity>
                          {showDatePicker && (
                        <View style={styles.datePickerContainer}>
                          <DateTimePicker
                            value={nextPrescriptionDue || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(_, selectedDate) => {
                              if (selectedDate) {
                                setNextPrescriptionDue(selectedDate);
                                if (Platform.OS === 'android') {
                                  setShowDatePicker(false);
                                }
                              }
                            }}
                            minimumDate={new Date()}
                            locale="pt-BR"
                          />
                          {Platform.OS === 'ios' && (
                            <TouchableOpacity
                              style={styles.dateConfirmButton}
                              onPress={() => setShowDatePicker(false)}
                            >
                              <Text style={styles.dateConfirmButtonText}>Confirmar</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                          )}
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowVisitForm(false);
                    setVisitNotes('');
                    setPrescriptionDelivered(false);
                    setNextPrescriptionDue(null);
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

          <TouchableOpacity
            style={[styles.actionButton, styles.prescriptionButton]}
            onPress={openPrescriptionModal}
            disabled={submitting}
          >
            <Text style={styles.actionButtonText}>📋 Solicitar receita</Text>
          </TouchableOpacity>

          <Modal
            visible={showPrescriptionModal}
            transparent
            animationType="slide"
            onRequestClose={closePrescriptionModal}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalOverlay}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Solicitar receita</Text>
                <Text style={styles.formLabel}>Observações da receita (opcional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Ex.: medicamento, dosagem, orientações..."
                  value={prescriptionObservations}
                  onChangeText={setPrescriptionObservations}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={closePrescriptionModal}
                    disabled={submitting}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSave]}
                    onPress={handleRequestPrescription}
                    disabled={submitting}
                  >
                    <Text style={styles.modalButtonSaveText}>
                      {submitting ? 'Salvando...' : 'Solicitar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

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
  desktopRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
    gap: 15,
  },
  desktopCol30: {
    width: '30%',
    minWidth: 0,
    flexDirection: 'column',
  },
  desktopCol70: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
  },
  desktopColLeft: {
    flex: 1.2,
    minWidth: 0,
    minHeight: 0,
    marginRight: 8,
    flexDirection: 'column',
    alignSelf: 'stretch',
  },
  desktopColRight: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignSelf: 'stretch',
  },
  sectionFillHeight: {
    flex: 1,
    minHeight: 0,
  },
  infoSection: {
    padding: 22,
  },
  infoSectionMinHeight: {
    minHeight: 318,
  },
  infoContentWrap: {},
  infoContentWrapSpread: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 0,
  },
  sectionDesktopRight: {
    marginBottom: 8,
  },
  sectionDesktopRightLast: {
    marginBottom: 0,
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
  emptySectionText: {
    fontSize: 18,
    color: '#999',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    color: '#333',
  },
  subValue: {
    fontSize: 18,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  comorbidityItem: {
    fontSize: 18,
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
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  visitList: {
    marginTop: 12,
  },
  visitListItem: {
    marginBottom: 10,
  },
  visitNotes: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  requestButton: {
    backgroundColor: '#FF9800',
  },
  prescriptionButton: {
    backgroundColor: '#5C6BC0',
  },
  removeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E53935',
    marginTop: 4,
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
    width: '100%',
    maxWidth: '100%',
  },
  prescriptionSection: {
    marginBottom: 15,
    width: '100%',
    maxWidth: '100%',
  },
  datePickerRow: {
    marginTop: 5,
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    flexShrink: 1,
  },
  dateInputWrapper: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerContainer: {
    marginTop: 10,
  },
  dateConfirmButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  dateConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginTop: 5,
    backgroundColor: '#f9f9f9',
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
    marginBottom: 16,
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
    marginBottom: 16,
    textAlign: 'center',
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
  modalButtonCancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSave: {
    backgroundColor: '#4A90E2',
  },
  modalButtonSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
