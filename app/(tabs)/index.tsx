import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecordingRow } from "@/components/recording-row";
import { ScreenContainer } from "@/components/screen-container";
import { formatDuration, useRecordings } from "@/lib/recordings-store";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    recordings,
    isHydrated,
    isRecording,
    recordingSeconds,
    playingId,
    startRecording,
    stopRecording,
    togglePlayback,
    toggleFavorite,
  } = useRecordings();

  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    []
  );
  const totalDuration = recordings.reduce((total, recording) => total + recording.duration, 0);
  const recentRecordings = recordings.slice(0, 3);

  useFocusEffect(
    useCallback(() => {
      return () => undefined;
    }, [])
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#0B1324]" className="px-5">
      <FlatList
        data={recentRecordings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 28, 34) }]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <View style={styles.logo}>
                  <MaterialIcons name="graphic-eq" size={22} color="#0B1324" />
                </View>
                <View>
                  <Text style={styles.brand}>صوت</Text>
                  <Text style={styles.eyebrow}>مسجل المكالمات</Text>
                </View>
              </View>
              <View style={styles.localBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.localBadgeText}>محلي بالكامل</Text>
              </View>
            </View>

            <View style={styles.greeting}>
              <Text style={styles.date}>{dateLabel}</Text>
              <Text style={styles.title}>مساحة صوتك،<Text style={styles.titleAccent}> تحت سيطرتك.</Text></Text>
              <Text style={styles.subtitle}>سجّل، راجع، واحتفظ بمكالماتك على جهازك فقط.</Text>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordCardHeader}>
                <View style={styles.recordingStatus}>
                  <View style={[styles.statusDot, isRecording && styles.statusDotActive]} />
                  <Text style={styles.statusText}>{isRecording ? "جارٍ التسجيل الآن" : "جاهز للتسجيل"}</Text>
                </View>
                <View style={styles.shieldIcon}>
                  <MaterialIcons name="shield" size={19} color="#C9F08C" />
                </View>
              </View>
              <View style={styles.recordMain}>
                <View style={styles.timerBox}>
                  <Text style={styles.timer}>{formatDuration(recordingSeconds)}</Text>
                  <Text style={styles.timerLabel}>{isRecording ? "مدة التسجيل" : "ابدأ جلسة جديدة"}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isRecording ? "إيقاف التسجيل" : "بدء تسجيل جديد"}
                  onPress={isRecording ? stopRecording : startRecording}
                  style={({ pressed }) => [styles.recordButton, isRecording && styles.recordButtonActive, pressed && styles.recordPressed]}
                >
                  <MaterialIcons name={isRecording ? "stop" : "mic"} size={30} color="#0B1324" />
                </Pressable>
              </View>
              <Text style={styles.recordHint}>{isRecording ? "اضغط لإيقاف التسجيل وحفظه محليًا" : "اضغط لبدء تسجيل صوتي جديد"}</Text>
            </View>

            <View style={styles.statsRow}>
              <Stat label="التسجيلات" value={String(recordings.length)} />
              <View style={styles.statDivider} />
              <Stat label="المفضلة" value={String(recordings.filter((item) => item.favorite).length)} />
              <View style={styles.statDivider} />
              <Stat label="المدة الكلية" value={formatDuration(totalDuration)} />
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>آخر التسجيلات</Text>
                <Text style={styles.sectionSubtitle}>{isHydrated ? "محفوظة على هذا الجهاز" : "جارٍ تحميل التسجيلات"}</Text>
              </View>
              <View style={styles.countPill}><Text style={styles.countText}>{recordings.length}</Text></View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.rowWrap}>
            <RecordingRow
              recording={item}
              isPlaying={playingId === item.id}
              onPlay={() => togglePlayback(item)}
              onFavorite={() => toggleFavorite(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><MaterialIcons name="multitrack-audio" size={28} color="#C9F08C" /></View>
            <Text style={styles.emptyTitle}>لا توجد تسجيلات بعد</Text>
            <Text style={styles.emptyText}>ابدأ أول تسجيل لك، وستظهر هنا مرتبة من الأحدث إلى الأقدم.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14 },
  headerBlock: { gap: 22 },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  logo: { alignItems: "center", backgroundColor: "#C9F08C", borderRadius: 14, height: 42, justifyContent: "center", width: 42 },
  brand: { color: "#F5F7FB", fontSize: 20, fontWeight: "800", textAlign: "right" },
  eyebrow: { color: "#8A96AB", fontSize: 10, marginTop: 2, textAlign: "right" },
  localBadge: { alignItems: "center", backgroundColor: "#14213B", borderColor: "#233354", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 7 },
  onlineDot: { backgroundColor: "#62DDB5", borderRadius: 4, height: 7, width: 7 },
  localBadgeText: { color: "#C2CCDC", fontSize: 10, fontWeight: "700" },
  greeting: { gap: 7 },
  date: { color: "#8A96AB", fontSize: 12, textAlign: "right" },
  title: { color: "#F5F7FB", fontSize: 28, fontWeight: "800", lineHeight: 35, textAlign: "right" },
  titleAccent: { color: "#C9F08C" },
  subtitle: { color: "#8A96AB", fontSize: 13, lineHeight: 21, textAlign: "right" },
  recordCard: { backgroundColor: "#17243E", borderColor: "#2B4166", borderRadius: 25, borderWidth: 1, gap: 16, padding: 18 },
  recordCardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  recordingStatus: { alignItems: "center", flexDirection: "row", gap: 7 },
  statusDot: { backgroundColor: "#62718A", borderRadius: 5, height: 9, width: 9 },
  statusDotActive: { backgroundColor: "#F27A7A" },
  statusText: { color: "#D6DEEA", fontSize: 12, fontWeight: "700" },
  shieldIcon: { alignItems: "center", backgroundColor: "#223655", borderRadius: 14, height: 30, justifyContent: "center", width: 30 },
  recordMain: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  timerBox: { gap: 3 },
  timer: { color: "#F5F7FB", fontSize: 39, fontVariant: ["tabular-nums"], fontWeight: "700", letterSpacing: 1, textAlign: "right" },
  timerLabel: { color: "#8A96AB", fontSize: 11, textAlign: "right" },
  recordButton: { alignItems: "center", backgroundColor: "#C9F08C", borderRadius: 31, elevation: 3, height: 62, justifyContent: "center", shadowColor: "#C9F08C", shadowOpacity: 0.22, shadowRadius: 12, width: 62 },
  recordButtonActive: { backgroundColor: "#F27A7A", shadowColor: "#F27A7A" },
  recordPressed: { opacity: 0.78, transform: [{ scale: 0.95 }] },
  recordHint: { color: "#9FACBF", fontSize: 11, textAlign: "right" },
  statsRow: { alignItems: "center", backgroundColor: "#111B31", borderColor: "#1D2942", borderRadius: 20, borderWidth: 1, flexDirection: "row", justifyContent: "space-around", minHeight: 80, paddingHorizontal: 8 },
  stat: { alignItems: "center", flex: 1, gap: 5 },
  statValue: { color: "#F5F7FB", fontSize: 17, fontWeight: "800" },
  statLabel: { color: "#8A96AB", fontSize: 10 },
  statDivider: { backgroundColor: "#283751", height: 32, width: 1 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  sectionTitle: { color: "#F5F7FB", fontSize: 18, fontWeight: "800", textAlign: "right" },
  sectionSubtitle: { color: "#77869D", fontSize: 11, marginTop: 3, textAlign: "right" },
  countPill: { alignItems: "center", backgroundColor: "#243554", borderRadius: 14, height: 28, justifyContent: "center", width: 28 },
  countText: { color: "#C9F08C", fontSize: 12, fontWeight: "800" },
  rowWrap: { marginTop: 10 },
  emptyState: { alignItems: "center", backgroundColor: "#111B31", borderColor: "#1D2942", borderRadius: 22, borderWidth: 1, gap: 9, marginTop: 10, paddingHorizontal: 24, paddingVertical: 28 },
  emptyIcon: { alignItems: "center", backgroundColor: "#243554", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  emptyTitle: { color: "#F5F7FB", fontSize: 15, fontWeight: "800" },
  emptyText: { color: "#8A96AB", fontSize: 12, lineHeight: 19, textAlign: "center" },
});
