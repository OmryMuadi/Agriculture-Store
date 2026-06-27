import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Client, subscribeToClients, addClient, updateClient, deleteClient } from "../src/entities/client.entity";
import { Plant, subscribeToPlants, addPlant, deletePlant } from "../src/entities/plant.entity"
import { Disease, subscribeToDiseases, addDisease, deleteDisease } from "../src/entities/disease.entity"

type ActiveTab = "clients" | "plants" | "diseases";

export default function DirectoryScreen() {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>("clients");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Lists
  const [clients, setClients] = useState<Client[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);

  // Add/Edit Client Modal
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Simple Quick Add Inputs for Plants / Diseases
  const [newItemName, setNewItemName] = useState("");

  const [itemModalVisible, setItemModalVisible] = useState(false);

  useEffect(() => {
    // Listen for real-time updates on all directories
    const unsubClients = subscribeToClients(setClients);
    const unsubPlants = subscribeToPlants(setPlants);
    const unsubDiseases = subscribeToDiseases((diseasesList) => {
      setDiseases(diseasesList);
      setLoading(false);
    });

    return () => {
      unsubClients();
      unsubPlants();
      unsubDiseases();
    };
  }, []);

  // Listen to router params to switch tab or trigger action
  useEffect(() => {
    if (params.tab === "clients" || params.tab === "plants" || params.tab === "diseases") {
      setActiveTab(params.tab as ActiveTab);
    }
    if (params.triggerAdd === "client") {
      setActiveTab("clients");
      openAddClientModal();

      router.setParams({
      triggerAdd: undefined,
    });
    }
  }, [params, params.triggerAdd]);

  const openAddClientModal = () => {
    setEditingClient(null);
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setClientModalVisible(true);
  };

  const openEditClientModal = (client: Client) => {
    setEditingClient(client);
    setFirstName(client.first_name);
    setLastName(client.last_name);
    setPhoneNumber(client.phone_number);
    setClientModalVisible(true);
  };

  const handleSaveClient = async () => {
    if (!firstName.trim()) {
      Alert.alert("שגיאה", "יש להזין שם פרטי.");
      return;
    }

    const clientData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim(),
    };

    try {
      if (editingClient) {
        await updateClient(editingClient.id, clientData);
      } else {
        await addClient(clientData);
      }
      setClientModalVisible(false);
    } catch (error) {
      Alert.alert("שגיאה", "שמירת הלקוח נכשלה.");
    }
  };

  const handleDeleteClient = (client: Client) => {
    Alert.alert(
      "מחיקת לקוח",
      `האם אתה בטוח שברצונך למחוק את הלקוח "${client.first_name} ${client.last_name}"?
כל הרשומות המשויכות אליו יימחקו.`,
      [
        { text: "ביטול", style: "cancel" },
        { 
          text: "מחק", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteClient(client.id);
            } catch (error) {
              Alert.alert("שגיאה", "מחיקת הלקוח נכשלה.");
            }
          }
        }
      ]
    );
  };

  const handleAddItemDirect = async () => {
    if (!newItemName.trim()) return;

    try {
      if (activeTab === "plants") {
        await addPlant({ name: newItemName.trim() });
      } else if (activeTab === "diseases") {
        await addDisease({ name: newItemName.trim() });
      }
      setNewItemName("");
    } catch (error) {
      Alert.alert(
        "שגיאה",
        activeTab === "plants"
          ? "הוספת הגידול נכשלה. ייתכן שהוא כבר קיים."
          : "הוספת המחלה נכשלה. ייתכן שהיא כבר קיימת."
      );
    }
  };

  const handleDeleteItem = (id: string, name: string, type: "plant" | "disease") => {
    Alert.alert(
      `מחיקת ${type === "plant" ? "גידול" : "מחלה"}`,
      `האם אתה בטוח שברצונך למחוק את "${name}"?`,
      [
        { text: "ביטול", style: "cancel" },
        { 
          text: "מחק", 
          style: "destructive", 
          onPress: async () => {
            try {
              if (type === "plant") {
                await deletePlant(Number(id));
              } else {
                await deleteDisease(Number(id));
              }
            } catch (error) {
              Alert.alert("שגיאה", "המחיקה נכשלה.");
            }
          }
        }
      ]
    );
  };

  // Searching filter
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();
    if (activeTab === "clients") {
      return clients.filter(c => 
        c.first_name.toLowerCase().includes(query) || 
        c.last_name.toLowerCase().includes(query) ||
        c.phone_number.includes(query)
      );
    }
    if (activeTab === "plants") {
      return plants.filter(p => p.name.toLowerCase().includes(query));
    }
    if (activeTab === "diseases") {
      return diseases.filter(d => d.name.toLowerCase().includes(query));
    }
    return [];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>טוען נתונים</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Segmented Control / Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "clients" && styles.activeTab]}
          onPress={() => { setActiveTab("clients"); setSearchQuery(""); }}
        >
          <Text style={[styles.tabText, activeTab === "clients" && styles.activeTabText]}>לקוחות</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "plants" && styles.activeTab]}
          onPress={() => { setActiveTab("plants"); setSearchQuery(""); }}
        >
          <Text style={[styles.tabText, activeTab === "plants" && styles.activeTabText]}>גידולים</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "diseases" && styles.activeTab]}
          onPress={() => { setActiveTab("diseases"); setSearchQuery(""); }}
        >
          <Text style={[styles.tabText, activeTab === "diseases" && styles.activeTabText]}>מחלות</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`חפש ${activeTab === "clients"
            ? "לקוח"
            : activeTab === "plants"
            ? "גידול"
            : "מחלה"}...`}
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

      {/* Main List */}
      {getFilteredData().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={activeTab === "clients" ? "people-outline" : activeTab === "plants" ? "flower-outline" : "bug-outline"} 
            size={64} 
            color="#ccc" 
          />
          <Text style={styles.emptyText}>לא נמצאו {
            activeTab === "clients"
              ? "לקוחות"
              : activeTab === "plants"
              ? "גידולים"
              : "מחלות"
          }.</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredData()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            if (activeTab === "clients") {
              const client = item as Client;
              return (
                <View style={styles.clientCard}>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.first_name} {client.last_name}</Text>
                      <Text style={styles.clientPhone}>{client.phone_number}טלפון:</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openEditClientModal(client)}>
                      <Ionicons name="pencil" size={18} color="#2e7d32" style={styles.actionIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteClient(client)}>
                      <Ionicons name="trash-outline" size={18} color="#c62828" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            } else {
              const label = (item as Plant | Disease).name;
              return (
                <View style={styles.itemRow}>
                  <Text style={styles.itemRowText}>{label}</Text>
                  <TouchableOpacity onPress={() => handleDeleteItem(item.id, label, activeTab === "plants" ? "plant" : "disease")}>
                    <Ionicons name="trash-outline" size={18} color="#c62828" />
                  </TouchableOpacity>
                </View>
              );
            }
          }}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === "clients") {
            openAddClientModal();
          } else {
            setNewItemName("");
            setItemModalVisible(true);
          }
        }}
      >
        <Ionicons
          name={activeTab === "clients" ? "person-add" : "add"}
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Add/Edit Client Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={clientModalVisible}
        onRequestClose={() => setClientModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingClient ? "עריכת לקוח" : "הוספת לקוח"}
              </Text>
              <TouchableOpacity onPress={() => setClientModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>שם פרטי</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
              />

              <Text style={styles.label}>שם משפחה</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
              />

              <Text style={styles.label}>מספר טלפון</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveClient}>
                <Text style={styles.saveBtnText}>שמור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={itemModalVisible}
        onRequestClose={() => setItemModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === "plants" ? "הוספת גידול" : "הוספת מחלה"}
              </Text>

              <TouchableOpacity onPress={() => setItemModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>
                {activeTab === "plants" ? "שם הגידול" : "שם המחלה"}
              </Text>

              <TextInput
                style={styles.input}
                value={newItemName}
                onChangeText={setNewItemName}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  await handleAddItemDirect();
                  setItemModalVisible(false);
                }}
              >
                <Text style={styles.saveBtnText}>שמור</Text>
              </TouchableOpacity>
            </View>
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#2e7d32",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  activeTabText: {
    color: "#2e7d32",
  },
  searchContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    textAlign: "right",
    writingDirection: "rtl",
    paddingVertical: 0,
  },
  searchIcon: {
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  clientCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  clientPhone: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },
  clientPhoneNoVal: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    marginRight: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemRowText: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
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
    maxHeight: "80%",
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
    textAlign: "right",
  },
  formContainer: {
    padding: 16,
    paddingBottom: 32,
    textAlign: "right",
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
    height: 48,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "#fafafa",
    color: "#333",
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
