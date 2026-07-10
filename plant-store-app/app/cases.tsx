import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { addCase, Case, deleteCase, subscribeToCases, updateCase } from "../src/entities/case.entity";
import { Client, subscribeToClients } from "../src/entities/client.entity";
import { Disease, subscribeToDiseases } from "../src/entities/disease.entity";
import { Fertilizer, subscribeToFertilizers } from "../src/entities/fertilizer.entity";
import { Plant, subscribeToPlants } from "../src/entities/plant.entity";

export default function CasesScreen() {
  const params = useLocalSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Case Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  
  // Selected IDs for Form
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<number | null>(null);
  const [selectedFertilizerIds, setSelectedFertilizerIds] = useState<number[]>([]);
  const [solution, setSolution] = useState("");
  const [cost, setCost] = useState("");

  // Selector Modal States (Nested)
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorType, setSelectorType] = useState<"client" | "plant" | "disease" | "fertilizer">("client");
  const [selectorSearch, setSelectorSearch] = useState("");

  // Common base type for selector list items
  type SelectorItem = { id: number; label: string };

  useEffect(() => {
    // Listen for real-time updates
    const unsubClients = subscribeToClients(setClients);
    const unsubPlants = subscribeToPlants(setPlants);
    const unsubDiseases = subscribeToDiseases(setDiseases);
    const unsubFertilizers = subscribeToFertilizers(setFertilizers);
    const unsubCases = subscribeToCases((casesList) => {
      setCases(casesList);
      setLoading(false);
    });

    return () => {
      unsubClients();
      unsubPlants();
      unsubDiseases();
      unsubFertilizers();
      unsubCases();
    };
  }, []);

  // Listen to deep links to add a case
  useEffect(() => {
    if (params.triggerAdd === "true") {
      openAddModal();

      router.setParams({
        triggerAdd: undefined,
      });
    }
  }, [params.triggerAdd]);

  const openAddModal = () => {
    setEditingCase(null);
    setSelectedClientId(null);
    setSelectedPlantId(null);
    setSelectedDiseaseId(null);
    setSelectedFertilizerIds([]);
    setSolution("");
    setCost("");
    setModalVisible(true);
  };

  const openEditModal = (c: Case) => {
    setEditingCase(c);
    setSelectedClientId(c.client_id);
    setSelectedPlantId(c.plant_id);
    setSelectedDiseaseId(c.disease_id);
    setSelectedFertilizerIds(c.fertilizer_ids ?? []);
    setSolution(c.solution || "");
    setCost(c.cost.toString() || "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedClientId || !selectedPlantId || !selectedDiseaseId) {
      Alert.alert("שגיאה", "יש לבחור לקוח, גידול ומחלה.");
      return;
    }

    const caseData = {
      client_id: selectedClientId,
      plant_id: selectedPlantId,
      disease_id: selectedDiseaseId,
      // always send the array (may be empty) so updateCase can remove existing fertilizers
      fertilizer_ids: selectedFertilizerIds,
      solution: solution.trim(),
      case_date: new Date().toISOString().split("T")[0],
      cost: Number(cost) || 0,
    };

    try {
      if (editingCase) {
        await updateCase(editingCase.id, caseData);
      } else {
        await addCase(caseData);
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert("שגיאה", "שמירת הרשומה נכשלה.");
    }
  };

  const handleDelete = (c: Case) => {
    Alert.alert(
      "מחיקת רשומה",
      "האם אתה בטוח שברצונך למחוק את הרשומה?",
      [
        { text: "ביטול", style: "cancel" },
        { 
          text: "מחק", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteCase(c.id);
            } catch (error) {
              Alert.alert("שגיאה", "מחיקת הרשומה נכשלה.");
            }
          }
        }
      ]
    );
  };

  const formatCaseDate = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);

    // Remove the time portion
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffDays =
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 0) return "היום";
    if (diffDays === 1) return "אתמול";

    return date.toLocaleDateString("he-IL");
  };

  const getClientName = (id: number) => {
    const client = clients.find((c) => c.id === id);
    return client ? `${client.first_name} ${client.last_name || ""}`.trim() : "לקוח לא ידוע";
  };

  const getClientPhone = (id: number) => {
    const client = clients.find((c) => c.id === id);
    return client?.phone_number;
  };

  const getClientVillage = (id: number) => {
    const client = clients.find((c) => c.id === id);
    return client?.village;
  };

  const getPlantName = (id: number) => {
    const plant = plants.find((p) => p.id === id);
    return plant ? plant.name : "גידול לא ידוע";
  };

  const getDiseaseName = (id: number) => {
    const disease = diseases.find((d) => d.id === id);
    return disease ? disease.name : "מחלה לא ידועה";
  };

  const getFertilizerName = (id: number) => {
    const fertilizer = fertilizers.find((f) => f.id === id);
    return fertilizer ? fertilizer.name : "דשן לא ידוע";
  };

  // Selector helpers
  const openSelector = (type: "client" | "plant" | "disease" | "fertilizer") => {
    setSelectorType(type);
    setSelectorSearch("");
    setSelectorVisible(true);
  };

  const handleSelectValue = (id: number) => {
    if (selectorType === "client") setSelectedClientId(id);
    if (selectorType === "plant") setSelectedPlantId(id);
    if (selectorType === "disease") setSelectedDiseaseId(id);
    if (selectorType === "fertilizer") {
      // toggle selection
      setSelectedFertilizerIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      return;
    }
    setSelectorVisible(false);
  };

  // Filter cases for the main screen search
  const filteredCases = cases.filter((c) => {
    const clientName = getClientName(c.client_id).toLowerCase();
    const plantName = getPlantName(c.plant_id).toLowerCase();
    const diseaseName = getDiseaseName(c.disease_id).toLowerCase();
    const fertilizerName = c.fertilizer_ids && c.fertilizer_ids.length > 0 ? c.fertilizer_ids.map(getFertilizerName).join(" ").toLowerCase() : "";
    const query = searchQuery.toLowerCase();
    return (
      clientName.includes(query) ||
      plantName.includes(query) ||
      diseaseName.includes(query) ||
      fertilizerName.includes(query)
    );
  });

  // Build normalized selector items
  const getFilteredSelectorData = (): SelectorItem[] => {
    const query = selectorSearch.toLowerCase();
    if (selectorType === "client") {
      return clients
        .filter(c =>
          c.first_name.toLowerCase().includes(query) ||
          (c.last_name?.toLowerCase().includes(query) ?? false)
        )
        .map(c => ({ id: c.id, label: `${c.first_name} ${c.last_name || ""}`.trim() }));
    }
    if (selectorType === "plant") {
      return plants
        .filter(p => p.name.toLowerCase().includes(query))
        .map(p => ({ id: p.id, label: p.name }));
    }
    if (selectorType === "disease") {
      return diseases
        .filter(d => d.name.toLowerCase().includes(query))
        .map(d => ({ id: d.id, label: d.name }));
    }
    if (selectorType === "fertilizer") {
      return fertilizers
        .filter(f => f.name.toLowerCase().includes(query))
        .map(f => ({ id: f.id, label: f.name }));
    }
    return [];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>טוען רשומות...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="חפש לפי לקוח, גידול או מחלה..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Cases Feed */}
      {filteredCases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="journal-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>לא נמצאו רשומות.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCases}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.caseCard}>
              <View style={styles.caseHeader}>
                <View>
                  <Text style={styles.clientTitle}>{getClientName(item.client_id)}</Text>
                  {getClientVillage(item.client_id) ? (
                    <Text style={styles.clientPhone}>ישוב: {getClientVillage(item.client_id)}</Text>
                  ) : null}
                  {getClientPhone(item.client_id) ? (
                    <Text style={styles.clientPhone}>טלפון: {getClientPhone(item.client_id)}</Text>
                  ) : null}
                </View>
                <Text style={styles.dateText}>
                  {formatCaseDate(item.case_date)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoPillGreen}>
                  <Text style={styles.infoPillTextGreen}>{getPlantName(item.plant_id)}</Text>
                </View>
                <View style={styles.infoPillRed}>
                  <Text style={styles.infoPillTextRed}>{getDiseaseName(item.disease_id)}</Text>
                </View>
              </View>

              {item.fertilizer_ids && item.fertilizer_ids.length > 0 ? (
                <View style={styles.fertilizerRow}>
                  <View style={styles.fertilizerChipsContainer}>
                    {item.fertilizer_ids.map((fid) => (
                      <View key={fid} style={styles.fertilizerChip}>
                        <Text style={styles.fertilizerChipText}>{getFertilizerName(fid)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.solutionBox}>
                <Text style={styles.solutionTitle}>פתרון שהוצע:</Text>
                <Text style={styles.solutionBody}>{item.solution}</Text>
              </View>

              <Text style={styles.costText}>
                עלות: ₪{item.cost}
              </Text>

              {/* Actions row */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                  <Ionicons name="pencil" size={15} color="#2e7d32" />
                  <Text style={[styles.actionBtnText, { color: "#2e7d32" }]}>ערוך</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={15} color="#c62828" />
                  <Text style={[styles.actionBtnText, { color: "#c62828" }]}>מחק</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Floating Add Case Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Case Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCase ? "עריכת רשומה" : "הוספת רשומה חדשה"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
              {/* Client Selection */}
              <Text style={styles.label}>לקוח</Text>
              <TouchableOpacity 
                style={styles.selectButton} 
                onPress={() => openSelector("client")}
              >
                <Text style={[
                  styles.selectButtonText, 
                  selectedClientId ? { color: "#333" } : { color: "#999" }
                ]}>
                  {selectedClientId ? getClientName(selectedClientId) : "תבחר לקוח..."}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>

              {/* Plant Selection */}
              <Text style={styles.label}>גידול</Text>
              <TouchableOpacity 
                style={styles.selectButton} 
                onPress={() => openSelector("plant")}
              >
                <Text style={[
                  styles.selectButtonText, 
                  selectedPlantId ? { color: "#333" } : { color: "#999" }
                ]}>
                  {selectedPlantId ? getPlantName(selectedPlantId) : "תבחר גידול..."}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>

              <Text style={styles.label}>דשן (אופציונלי)</Text>
              <TouchableOpacity 
                style={styles.selectButton} 
                onPress={() => openSelector("fertilizer")}
              >
                <Text style={[
                  styles.selectButtonText, 
                  selectedFertilizerIds.length > 0 ? { color: "#333" } : { color: "#999" }
                ]}>
                  {selectedFertilizerIds.length > 0 ? selectedFertilizerIds.map(getFertilizerName).join(", ") : "תבחר דשן..."}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>

              {/* Disease Selection */}
              <Text style={styles.label}>מחלה</Text>
              <TouchableOpacity 
                style={styles.selectButton} 
                onPress={() => openSelector("disease")}
              >
                <Text style={[
                  styles.selectButtonText, 
                  selectedDiseaseId ? { color: "#333" } : { color: "#999" }
                ]}>
                  {selectedDiseaseId ? getDiseaseName(selectedDiseaseId) : "תבחר מחלה..."}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>

              {/* Solution Text */}
              <Text style={styles.label}>תיאור לפתרון</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="רשום את הפתרון שהצעת ללקוח..."
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={4}
                value={solution}
                onChangeText={setSolution}
              />

              <Text style={styles.label}>עלות</Text>
              <TextInput
                style={[styles.input, styles.costInput]}
                placeholder="רשום עלות הטיפול..."
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={cost}
                onChangeText={setCost}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>שמור</Text>
              </TouchableOpacity>
            </ScrollView>

            {selectorVisible ? (
              <View style={styles.selectorOverlay}>
                <View style={styles.selectorContent}>
                  <View style={styles.selectorHeader}>
                    <Text style={styles.selectorTitle}>
                      {selectorType === "client"
                        ? "בחר לקוח"
                        : selectorType === "plant"
                        ? "בחר גידול"
                        : selectorType === "fertilizer"
                        ? "בחר דשן"
                        : "בחר מחלה"}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                      <Ionicons name="close" size={22} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.selectorSearch}
                    placeholder={
                      selectorType === "client"
                        ? "חפש לקוח..."
                        : selectorType === "plant"
                        ? "חפש גידול..."
                        : selectorType === "fertilizer"
                        ? "חפש דשן..."
                        : "חפש מחלה..."
                    }
                    value={selectorSearch}
                    onChangeText={setSelectorSearch}
                  />

                  {getFilteredSelectorData().length === 0 ? (
                    <View style={styles.selectorEmpty}>
                      <Text style={styles.selectorEmptyText}>לא נמצאו פריטים.</Text>
                      <Text style={styles.selectorEmptySub}>הוסף אותם קודם בלשונית למאגר נתונים.</Text>
                    </View>
                  ) : (
                    <FlatList<SelectorItem>
                      data={getFilteredSelectorData()}
                      keyExtractor={(item) => item.id.toString()}
                      style={styles.selectorList}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          style={styles.selectorItem}
                          onPress={() => handleSelectValue(item.id)}
                        >
                          <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={styles.selectorItemText}>{item.label}</Text>
                            {selectorType === "fertilizer" && selectedFertilizerIds.includes(item.id) ? (
                              <Ionicons name="checkmark" size={18} color="#2e7d32" />
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      )}
                    />
                  )}
                </View>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    textAlign: "right", // Align text to the right for Hebrew
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  caseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  caseHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  clientTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "right",
  },
  clientPhone: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    textAlign: "right",
  },
  dateText: {
    fontSize: 11,
    color: "#999",
    textAlign: "right",
  },
  infoRow: {
    flexDirection: "row-reverse",
    marginBottom: 12,
  },
  infoPillGreen: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  infoPillTextGreen: {
    color: "#2e7d32",
    fontSize: 12,
    fontWeight: "600",
  },
  infoPillBlue: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  infoPillTextBlue: {
    color: "#1565c0",
    fontSize: 12,
    fontWeight: "600",
  },
  infoPillRed: {
    backgroundColor: "#ffebee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoPillTextRed: {
    color: "#c62828",
    fontSize: 12,
    fontWeight: "600",
  },
  solutionBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#2e7d32",
  },
  solutionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    textAlign: "right",
  },
  solutionBody: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
    textAlign: "right",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 20,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 64,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    marginTop: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "right", // Align text to the right for Hebrew
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "#fafafa",
    color: "#333",
    textAlign: "right",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
  },
  selectButtonText: {
    flex: 1,
    fontSize: 15,
    textAlign: "right",
  },
  saveBtn: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
    zIndex: 20,
  },
  selectorContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "80%",
  },
  selectorHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
    textAlign: "right",
  },
  selectorSearch: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
    textAlign: "right",
    marginBottom: 12,
  },
  selectorList: {
    maxHeight: 300,
  },
  selectorItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectorItemText: {
    fontSize: 15,
    color: "#333",
    textAlign: "right",
  },
  selectorEmpty: {
    paddingVertical: 20,
    alignItems: "center",
  },
  selectorEmptyText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    textAlign: "right",
  },
  selectorEmptySub: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "right",
  },
  fertilizerChipsContainer: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    alignItems: "center",
    width: "100%",
  },
  fertilizerChip: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    marginBottom: 4,
  },
  fertilizerChipText: {
    color: "#1565c0",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  fertilizerMoreChip: {
    backgroundColor: "#cfd8dc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    marginBottom: 4,
  },
  fertilizerRow: {
    marginTop: 8,
    marginBottom: 8,
    width: "100%",
  },
  costInput: {
    fontSize: 15,
    paddingVertical: 10,
    textAlign: "right",
    height: 56,
  },
  costText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    textAlign: "right",
  },
});
