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
import { Plant, subscribeToPlants } from "../src/entities/plant.entity";

export default function DashboardScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ;

    const unsubClients = subscribeToClients(setClients);
    const unsubPlants = subscribeToPlants(setPlants);
    const unsubDiseases = subscribeToDiseases(setDiseases);
    const unsubCases = subscribeToCases((casesList) => {
      setCases(casesList);
      setLoading(false);
    });

    return () => {
      unsubClients();
      unsubPlants();
      unsubDiseases();
      unsubCases();
    };
  }, []);

  // Helper resolvers
  const getClientName = (id: number) => {
    const client = clients.find((c) => c.id === id);
    return client ? `${client.first_name} ${client.last_name || ""}`.trim() : "לקוח לא מוכר";
  };

  const getPlantName = (id: number) => {
    const plant = plants.find((p) => p.id === id);
    return plant ? plant.name : "גידול לא מוכר";
  };

  const getDiseaseName = (id: number) => {
    const disease = diseases.find((d) => d.id === id);
    return disease ? disease.name : "מחלה לא מוכרת";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading store dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>AgriStore Dashboard</Text>
          <Text style={styles.subGreeting}>
            Track cases, recommend solutions, and manage client consultations.
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
            <Text style={styles.statLabel}>Total Cases</Text>
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
            <Text style={styles.statLabel}>Clients</Text>
          </TouchableOpacity>

          {/* Plants & Diseases */}
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => router.push({ pathname: "/directory" as any, params: { tab: "plants" } })}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#fff8e1" }]}>
              <Ionicons name="flower-outline" size={24} color="#ffb300" />
            </View>
            <Text style={styles.statNumber}>{plants.length + diseases.length}</Text>
            <Text style={styles.statLabel}>Plants & Diseases</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: "#2e7d32" }]}
            onPress={() => router.push({ pathname: "/cases" as any, params: { triggerAdd: "true" } })}
          >
            <Ionicons name="add-circle" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>New Case</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: "#37474f" }]}
            onPress={() => router.push({ pathname: "/directory" as any, params: { triggerAdd: "client" } })}
          >
            <Ionicons name="person-add" size={18} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Add Client</Text>
          </TouchableOpacity>
        </View>

        {/* Recent consultations list */}
        <Text style={styles.sectionTitle}>Recent Case Activity</Text>
        {cases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={32} color="#78909c" />
            <Text style={styles.emptyText}>No cases recorded yet. Click "New Case" to start.</Text>
          </View>
        ) : (
          <View style={styles.caseList}>
            {cases.slice(0, 4).map((c) => {
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
                    <View>
                      <Text style={styles.clientText}>{clientName}</Text>
                      <Text style={styles.issueText}>
                        {plantName} • <Text style={styles.diseaseHighlight}>{diseaseName}</Text>
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#bbb" />
                  </View>
                  {c.solution ? (
                    <Text style={styles.solutionText} numberOfLines={2}>
                      <Text style={{ fontWeight: "600" }}>Solution: </Text>
                      {c.solution}
                    </Text>
                  ) : null}
                  <Text style={styles.caseDate}>
                    {c.case_date
                      ? new Date(c.case_date).toLocaleDateString()
                      : "Today"}
                  </Text>
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
  },
  subGreeting: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
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
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  caseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clientText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  issueText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  diseaseHighlight: {
    color: "#c62828",
    fontWeight: "500",
  },
  solutionText: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  caseDate: {
    fontSize: 11,
    color: "#999",
    marginTop: 10,
    textAlign: "right",
  },
});
