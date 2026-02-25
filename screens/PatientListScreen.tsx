import React, { useState, useCallback, useMemo } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showAlert } from '../utils/alert';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  getAllPatientsOrderedByPriority,
  createPatient,
  getVisitsInPeriod,
  getStartOfWeek,
  getEndOfWeek,
} from '../services/patientService';
import { calculatePatientPriority, getAdmissionPhase } from '../services/priorityService';
import { PatientPriority } from '../types';
import type { Visit } from '../types';
import WeekVisitsIndicator from '../components/WeekVisitsIndicator';
import { ZONE_OPTIONS } from '../utils/zone';
import type { Zone } from '../types';

const COMORBIDITY_OPTIONS = [
  'Terminal',
  'Oncológico',
  'Ventilação Mecânica',
];

export default function PatientListScreen() {
  const navigation = useNavigation();
  const [patients, setPatients] = useState<PatientPriority[]>([]);
  const [visitsThisWeek, setVisitsThisWeek] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formComorbidities, setFormComorbidities] = useState<string[]>([]);
  const [formNeedsPrescription, setFormNeedsPrescription] = useState(false);
  const [formAddress, setFormAddress] = useState('');
  const [formZone, setFormZone] = useState<Zone | null>(null);
  const [formDate, setFormDate] = useState<Date | null>(null);
  const [formDateStr, setFormDateStr] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterComorbidity, setFilterComorbidity] = useState<string | null>(null);
  const [filterZone, setFilterZone] = useState<Zone | null>(null);
  const [filterAdmission, setFilterAdmission] = useState<'recent' | 'second_week' | 'after_two_weeks' | null>(null);

  /** Agrupa visitas da semana por patientId e dia (0=Seg .. 6=Dom). */
  const visitsByPatientId = useMemo(() => {
    const map = new Map<string, Record<number, number>>();
    const now = new Date();
    const start = getStartOfWeek(now);
    const end = getEndOfWeek(now);
    visitsThisWeek.forEach((v) => {
      const d = v.date instanceof Date ? v.date : new Date(v.date);
      if (d < start || d > end) return;
      const dayIndex = (d.getDay() + 6) % 7;
      const pid = v.patientId;
      if (!map.has(pid)) {
        map.set(pid, { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
      }
      const row = map.get(pid)!;
      row[dayIndex] = (row[dayIndex] ?? 0) + 1;
    });
    return map;
  }, [visitsThisWeek]);

  /** Contagem de visitas hoje e esta semana por paciente (para regras de admissão). */
  const visitCountsByPatientId = useMemo(() => {
    const map = new Map<string, { visitsToday: number; visitsThisWeek: number }>();
    const now = new Date();
    const todayIndex = (now.getDay() + 6) % 7;
    visitsByPatientId.forEach((byDay, patientId) => {
      const visitsToday = byDay[todayIndex] ?? 0;
      const visitsThisWeek = Object.values(byDay).reduce((a, b) => a + b, 0);
      map.set(patientId, { visitsToday, visitsThisWeek });
    });
    return map;
  }, [visitsByPatientId]);

  /** Prioridades recalculadas com regras de visita por fase de admissão. */
  const enrichedPatients = useMemo(() => {
    return patients
      .map(({ patient }) => {
        const counts = visitCountsByPatientId.get(patient.id) ?? { visitsToday: 0, visitsThisWeek: 0 };
        return calculatePatientPriority(patient, new Date(), counts);
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [patients, visitCountsByPatientId]);

  const filteredPatients = useMemo(() => {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    return enrichedPatients.filter(({ patient }) => {
      if (filterComorbidity != null) {
        if (!patient.comorbidities?.includes(filterComorbidity)) return false;
      }
      if (filterZone != null) {
        if (patient.zone !== filterZone) return false;
      }
      const admissionRef = patient.admissionDate ?? patient.createdAt;
      if (filterAdmission != null && admissionRef) {
        const refTime = admissionRef instanceof Date
          ? admissionRef.getTime()
          : new Date(admissionRef).getTime();
        const daysSinceCreation = (now - refTime) / msPerDay;
        if (filterAdmission === 'recent' && daysSinceCreation >= 7) return false;
        if (filterAdmission === 'second_week' && (daysSinceCreation < 7 || daysSinceCreation >= 14)) return false;
        if (filterAdmission === 'after_two_weeks' && daysSinceCreation < 14) return false;
      }
      return true;
    });
  }, [enrichedPatients, filterComorbidity, filterZone, filterAdmission]);

  const hasActiveFilters =
    filterComorbidity != null ||
    filterZone != null ||
    filterAdmission != null;

  const clearFilters = () => {
    setFilterComorbidity(null);
    setFilterZone(null);
    setFilterAdmission(null);
  };

  const ADMISSION_OPTIONS: { value: 'recent' | 'second_week' | 'after_two_weeks'; label: string }[] = [
    { value: 'recent', label: 'Recém-admitido' },
    { value: 'second_week', label: 'Segunda semana' },
    { value: 'after_two_weeks', label: 'Após duas semanas' },
  ];

  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      loadPatients();
    }, [])
  );

  const loadPatients = async () => {
    try {
      const now = new Date();
      const [data, visits] = await Promise.all([
        getAllPatientsOrderedByPriority(),
        getVisitsInPeriod(getStartOfWeek(now), getEndOfWeek(now)),
      ]);
      setPatients(data);
      setVisitsThisWeek(visits);
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
    setFormComorbidities([]);
    setFormNeedsPrescription(false);
    setFormAddress('');
    setFormZone(null);
    setFormDate(null);
    setFormDateStr('');
    setShowDatePicker(false);
  };

  const handleDateStrChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let masked = '';
    if (digits.length > 0) masked = digits.slice(0, 2);
    if (digits.length > 2) masked += '/' + digits.slice(2, 4);
    if (digits.length > 4) masked += '/' + digits.slice(4, 8);
    setFormDateStr(masked);
    if (masked.length === 10) {
      const parsed = parse(masked, 'dd/MM/yyyy', new Date(), { locale: ptBR });
      if (isValid(parsed)) setFormDate(parsed);
      else setFormDate(null);
    } else {
      setFormDate(null);
    }
  };

  const handleDatePickerSelect = (date: Date) => {
    setFormDate(date);
    setFormDateStr(format(date, 'dd/MM/yyyy', { locale: ptBR }));
  };

  const openCalendar = () => {
    setTimeout(() => setShowDatePicker(true), 50);
  };

  const toggleComorbidity = (item: string) => {
    setFormComorbidities((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
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
    setSubmitting(true);
    try {
      if (!formZone) {
      showAlert('Erro', 'Selecione a zona do paciente');
      return;
    }
      await createPatient({
        name,
        age: ageNum,
        address: formAddress.trim() || undefined,
        zone: formZone,
        comorbidities: formComorbidities,
        needsPrescription: formNeedsPrescription,
        admissionDate: formDate || undefined,
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

  const renderPatientItem = ({ item }: { item: PatientPriority }) => {
    const { patient, priorityScore, reasons } = item;

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
            {(patient.address || patient.zone) && (
              <Text style={styles.patientAddress}>
                {[patient.address, patient.zone].filter(Boolean).join(' • ')}
              </Text>
            )}
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityScore}>{priorityScore}</Text>
          </View>
        </View>

        {patient.comorbidities && patient.comorbidities.length > 0 && (
          <View style={styles.comorbiditiesContainer}>
            <Text style={styles.comorbiditiesLabel}>Comorbidades:</Text>
            <Text style={styles.comorbiditiesText}>
              {patient.comorbidities.join(', ')}
            </Text>
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

        <View style={styles.weekVisitsWrap}>
          <WeekVisitsIndicator
            variant="compact"
            visitsByDay={visitsByPatientId.get(patient.id) ?? {}}
            rows={getAdmissionPhase(patient.admissionDate ?? patient.createdAt) === 'recent' ? 2 : 1}
          />
        </View>
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
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Filtros</Text>
        <Text style={styles.filterLabel}>Comorbidade</Text>
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterComorbidity === null && styles.filterChipSelected]}
            onPress={() => setFilterComorbidity(null)}
          >
            <Text style={[styles.filterChipText, filterComorbidity === null && styles.filterChipTextSelected]}>
              Todas
            </Text>
          </TouchableOpacity>
          {COMORBIDITY_OPTIONS.map((opt) => {
            const isSelected = filterComorbidity === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setFilterComorbidity(opt)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.filterLabel}>Zona</Text>
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterZone === null && styles.filterChipSelected]}
            onPress={() => setFilterZone(null)}
          >
            <Text style={[styles.filterChipText, filterZone === null && styles.filterChipTextSelected]}>
              Todas
            </Text>
          </TouchableOpacity>
          {ZONE_OPTIONS.map((zone) => {
            const isSelected = filterZone === zone;
            return (
              <TouchableOpacity
                key={zone}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setFilterZone(zone)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {zone.replace('Zona ', '')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.filterLabel}>Tempo de admissão</Text>
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterAdmission === null && styles.filterChipSelected]}
            onPress={() => setFilterAdmission(null)}
          >
            <Text style={[styles.filterChipText, filterAdmission === null && styles.filterChipTextSelected]}>
              Todas
            </Text>
          </TouchableOpacity>
          {ADMISSION_OPTIONS.map(({ value, label }) => {
            const isSelected = filterAdmission === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setFilterAdmission(value)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Limpar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredPatients}
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
            <Text style={styles.emptyText}>
              {hasActiveFilters
                ? 'Nenhum paciente encontrado com os filtros aplicados'
                : 'Nenhum paciente cadastrado'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFiltersButtonEmpty} onPress={clearFilters}>
                <Text style={styles.clearFiltersTextEmpty}>Limpar filtros</Text>
              </TouchableOpacity>
            )}
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
              <Text style={styles.formLabel}>Endereço</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Rua, número, bairro..."
                value={formAddress}
                onChangeText={setFormAddress}
                autoCapitalize="words"
              />
              <Text style={styles.formLabel}>Data de admissão</Text>
              <View style={styles.dateFieldRow}>
                <TextInput
                  style={[styles.formInput, styles.dateInput]}
                  placeholder="dd/mm/aaaa"
                  value={formDateStr}
                  onChangeText={handleDateStrChange}
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={10}
                />
                {Platform.OS === 'web' ? (
                  <View style={styles.dateIconWrap}>
                    <input
                      id="add-patient-date-input"
                      type="date"
                      value={formDate ? format(formDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) handleDatePickerSelect(new Date(val + 'T12:00:00'));
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 1,
                      }}
                    />
                    <Ionicons name="calendar-outline" size={22} color="#666" />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.dateIconWrap}
                    onPress={openCalendar}
                    activeOpacity={0.7}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  >
                    <Ionicons name="calendar-outline" size={22} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
              {Platform.OS !== 'web' && showDatePicker && (
                <View style={styles.datePickerWrap}>
                  <DateTimePicker
                    value={formDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, selectedDate) => {
                      if (selectedDate) {
                        handleDatePickerSelect(selectedDate);
                        if (Platform.OS === 'android') setShowDatePicker(false);
                      }
                    }}
                    locale="pt-BR"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.dateConfirmBtn}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.dateConfirmBtnText}>Confirmar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <Text style={styles.formLabel}>Zona *</Text>
              <View style={styles.zoneToggles}>
                {ZONE_OPTIONS.map((zone) => {
                  const isSelected = formZone === zone;
                  return (
                    <TouchableOpacity
                      key={zone}
                      style={[
                        styles.zoneToggle,
                        isSelected && styles.zoneToggleSelected,
                      ]}
                      onPress={() => setFormZone(zone)}
                    >
                      <Text
                        style={[
                          styles.zoneToggleText,
                          isSelected && styles.zoneToggleTextSelected,
                        ]}
                      >
                        {zone}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.formLabel}>Comorbidades</Text>
              <View style={styles.comorbidityToggles}>
                {COMORBIDITY_OPTIONS.map((item) => {
                  const isSelected = formComorbidities.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.comorbidityToggle,
                        isSelected && styles.comorbidityToggleSelected,
                      ]}
                      onPress={() => toggleComorbidity(item)}
                    >
                      <Text
                        style={[
                          styles.comorbidityToggleText,
                          isSelected && styles.comorbidityToggleTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
  filterSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    marginTop: 4,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  filterChipSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterChipText: {
    fontSize: 13,
    color: '#333',
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  clearFiltersButtonEmpty: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
  },
  clearFiltersTextEmpty: {
    fontSize: 14,
    color: '#fff',
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
  dateFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 14,
    paddingRight: 8,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  dateIconWrap: {
    position: 'relative',
    minWidth: 44,
    minHeight: 44,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerWrap: {
    marginBottom: 14,
  },
  dateConfirmBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  dateConfirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  comorbidityToggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  comorbidityToggle: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  comorbidityToggleSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  comorbidityToggleText: {
    fontSize: 14,
    color: '#333',
  },
  comorbidityToggleTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  zoneToggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  zoneToggle: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  zoneToggleSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  zoneToggleText: {
    fontSize: 14,
    color: '#333',
  },
  zoneToggleTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
  patientAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
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
  weekVisitsWrap: {
    marginTop: 10,
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
