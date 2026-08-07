import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Case, subscribeToCases } from "../src/entities/case.entity";
import { Client, subscribeToClients } from "../src/entities/client.entity";
import { Disease, subscribeToDiseases } from "../src/entities/disease.entity";
import { Fertilizer, subscribeToFertilizers } from "../src/entities/fertilizer.entity";
import { Pesticide, subscribeToPesticides } from "../src/entities/pesticide.entity";
import { Plant, subscribeToPlants } from "../src/entities/plant.entity";

export default function DashboardScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [pesticides, setPesticides] = useState<Pesticide[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const todayCases = cases.filter(
    (c) => c.case_date === today
  );

  useEffect(() => {
    const unsubClients = subscribeToClients(setClients);
    const unsubPlants = subscribeToPlants(setPlants);
    const unsubDiseases = subscribeToDiseases(setDiseases);
    const unsubFertilizers = subscribeToFertilizers(setFertilizers);
    const unsubPesticides = subscribeToPesticides(setPesticides);
    const unsubCases = subscribeToCases((casesList) => {
      setCases(casesList);
      setLoading(false);
    });

    return () => {
      unsubClients();
      unsubPlants();
      unsubDiseases();
      unsubFertilizers();
      unsubPesticides();
      unsubCases();
    };
  }, []);

  // Helper resolvers
  const getClientName = (id: number) => {
    const client = clients.find((c) => c.id === id);
    return client ? `${client.first_name} ${client.last_name}`.trim() : "לקוח לא מוכר";
  };

  const getPlantName = (id: number) => {
    const plant = plants.find((p) => p.id === id);
    return plant ? plant.name : "גידול לא מוכר";
  };

  const getDiseaseName = (id: number | null) => {
    const disease = diseases.find((d) => d.id === id);
    return disease ? disease.name : "ללא מחלה";
  };

  const getClientPhone = (id: number) => {
    const client = clients.find((c) => c.id === id);
    return client?.phone_number;
  };

  const getClientVillage = (id: number) => {
    const client = clients.find((c) => c.id === id);
    return client?.village;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>טוען נתונים...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>אמא אדמה</Text>
          <Text style={styles.subGreeting}>
            ניהול טיפולים, פתרונות ולקוחות במקום אחד.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Cases */}
          <TouchableOpacity style={styles.statCard} onPress={() => router.push("/cases" as any)}>
            <View style={[styles.iconWrapper, { backgroundColor: "#e8f5e9" }]}>
              <Ionicons name="journal-outline" size={24} color="#2e7d32" />
            </View>
            <Text style={styles.statNumber}>{cases.length}</Text>
            <Text style={styles.statLabel}>{'סה"כ טיפולים'}</Text>
          </TouchableOpacity>

          {/* Total Clients */}
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => router.push({ pathname: "/directory" as any, params: { tab: "clients" } })}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#e3f2fd" }]}>
              <Ionicons name="people-outline" size={24} color="#1565c0" />
            </View>
            <Text style={styles.statNumber}>{clients.length}</Text>
            <Text style={styles.statLabel}>לקוחות</Text>
          </TouchableOpacity>

          {/* Plants */}
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => router.push({ pathname: "/directory" as any, params: { tab: "plants" } })}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#fff8e1" }]}>
              <Ionicons name="flower-outline" size={24} color="#ffb300" />
            </View>
            <Text style={styles.statNumber}>{plants.length}</Text>
            <Text style={styles.statLabel}>גידולים</Text>
          </TouchableOpacity>

          {/* Fertilizers */}
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => router.push({ pathname: "/directory" as any, params: { tab: "fertilizers" } })}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#e8f5ff" }]}> 
              <Ionicons name="leaf-outline" size={24} color="#2e7d32" />
            </View>
            <Text style={styles.statNumber}>{fertilizers.length}</Text>
            <Text style={styles.statLabel}>דשנים</Text>
          </TouchableOpacity>

          {/* Diseases */}
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => router.push({ pathname: "/directory" as any, params: { tab: "diseases" } })}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#fff8e1" }]}> 
              <Ionicons name="bug-outline" size={24} color="#ffb300" />
            </View>
            <Text style={styles.statNumber}>{diseases.length}</Text>
            <Text style={styles.statLabel}>מחלות</Text>
          </TouchableOpacity>

          {/* Pesticides */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push({ pathname: "/directory" as any, params: { tab: "pesticides" } })}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#fff3e0" }]}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#e65100" />
            </View>
            <Text style={styles.statNumber}>{pesticides.length}</Text>
            <Text style={styles.statLabel}>חומרי הדברה</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>פעולות זריזות</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: "#2e7d32" } ]}
            onPress={() => router.push({ pathname: "/cases" as any, params: { triggerAdd: "true" } })}
          >
            <Ionicons name="add-circle" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>טיפול חדש</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: "#37474f" } ]}
            onPress={() => router.push({ pathname: "/directory" as any, params: { tab: "clients" } })}
          >
            <Ionicons name="people-outline" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>לקוחות</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>טיפולים להיום</Text>
        {todayCases.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={32} color="#78909c" />
            <Text style={styles.emptyText}>{'עדיין לא נוספו טיפולים. לחץ על "טיפול חדש" כדי להתחיל.'}</Text>
          </View>
        ) : (
          <View style={styles.caseList}>
            {todayCases.slice(0, 4).map((c) => {
              const clientName = getClientName(c.client_id);
              const plantName = getPlantName(c.plant_id);
              const diseaseName = getDiseaseName(c.disease_id);

              return (
                <TouchableOpacity 
                  key={c.id} 
                  style={styles.caseCard}
                  onPress={() => router.push("/cases" as any)}
                >
                  <View style={styles.caseCardHeader}>
                    <View style={styles.caseClientInfo}>
                      <Text style={styles.clientText}>{clientName}</Text>
                      {getClientVillage(c.client_id) ? (
                        <Text style={styles.clientDetailText}>ישוב: {getClientVillage(c.client_id)}</Text>
                      ) : null}
                      {getClientPhone(c.client_id) ? (
                        <Text style={styles.clientDetailText}>טלפון: {getClientPhone(c.client_id)}</Text>
                      ) : null}
                    </View>
                    <View style={styles.caseMeta}>
                      <View style={styles.caseMetaRow}>
                        <Text style={styles.caseDate}>
                          {c.case_date
                            ? new Date(c.case_date).toLocaleDateString()
                            : "Today"}
                        </Text>
                        <Ionicons name="chevron-back" size={16} color="#bbb" />
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoPillGreen}>
                      <Text style={styles.infoPillTextGreen}>{plantName}</Text>
                    </View>
                    <View style={c.disease_id === null ? styles.infoPillNeutral : styles.infoPillRed}>
                      <Text style={c.disease_id === null ? styles.infoPillTextNeutral : styles.infoPillTextRed}>
                        {diseaseName}
                      </Text>
                    </View>
                  </View>

                  {c.solution ? (
                    <View style={styles.solutionBox}>
                      <Text style={styles.solutionTitle}>פתרון שהוצע:</Text>
                      <Text style={styles.solutionText} numberOfLines={2}>
                        {c.solution}
                      </Text>
                    </View>
                  ) : null}

                  {c.next_treatment_recommendations ? (
                    <View style={styles.solutionBox}>
                      <Text style={styles.solutionTitle}>טיפול הבא / המלצות:</Text>
                      <Text style={styles.solutionText} numberOfLines={2}>
                        {c.next_treatment_recommendations}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  subGreeting: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    lineHeight: 20,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flexBasis: "30%",
    flexGrow: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  statLabel: {
    fontSize: 11,
    color: "#777",
    marginTop: 4,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
    marginTop: 8,
    textAlign: "right",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 4,
    elevation: 1,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: {
    marginTop: 16,
    padding: 24,
    backgroundColor: "#d0eaf4",
    borderRadius: 16,
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyText: {
    color: "#666",
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  caseList: {
    marginBottom: 16,
  },
  caseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  caseCardHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  caseClientInfo: {
    flex: 1,
  },
  clientText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "right",
  },
  clientDetailText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    textAlign: "right",
  },
  caseMeta: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  caseMetaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  infoRow: {
    flexDirection: "row-reverse",
    marginBottom: 8,
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
  infoPillNeutral: {
    backgroundColor: "#eceff1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoPillTextNeutral: {
    color: "#607d8b",
    fontSize: 12,
    fontWeight: "600",
  },
  solutionBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2e7d32",
  },
  solutionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "right",
  },
  solutionText: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
    textAlign: "right",
  },
  caseDate: {
    fontSize: 11,
    color: "#999",
    textAlign: "right",
  },
});
