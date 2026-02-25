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
import { showAlert } from '../utils/alert';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAllPatientsOrderedByPriority, createPatient } from '../services/patientService';
import { PatientPriority } from '../types';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formComorbidities, setFormComorbidities] = useState<string[]>([]);
  const [formNeedsPrescription, setFormNeedsPrescription] = useState(false);
  const [formAddress, setFormAddress] = useState('');
  const [formZone, setFormZone] = useState<Zone | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterComorbidity, setFilterComorbidity] = useState<string | null>(null);
  const [filterZone, setFilterZone] = useState<Zone | null>(null);
  const [filterAdmission, setFilterAdmission] = useState<'recent' | 'second_week' | 'after_two_weeks' | null>(null);

  const filteredPatients = useMemo(() => {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    return patients.filter(({ patient }) => {
      if (filterComorbidity != null) {
        if (!patient.comorbidities?.includes(filterComorbidity)) return false;
      }
      if (filterZone != null) {
        if (patient.zone !== filterZone) return false;
      }
      if (filterAdmission != null && patient.createdAt) {
        const created = patient.createdAt instanceof Date
          ? patient.createdAt.getTime()
          : new Date(patient.createdAt).getTime();
        const daysSinceCreation = (now - created) / msPerDay;
        if (filterAdmission === 'recent' && daysSinceCreation >= 7) return false;
        if (filterAdmission === 'second_week' && (daysSinceCreation < 7 || daysSinceCreation >= 14)) return false;
        if (filterAdmission === 'after_two_weeks' && daysSinceCreation < 14) return false;
      }
      return true;
    });
  }, [patients, filterComorbidity, filterZone, filterAdmission]);

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
    setFormComorbidities([]);
    setFormNeedsPrescription(false);
    setFormAddress('');
    setFormZone(null);
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
