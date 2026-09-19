import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecordingRow } from "@/components/recording-row";
import { ScreenContainer } from "@/components/screen-container";
import { useRecordings } from "@/lib/recordings-store";

type Filter = "all" | "favorites";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const { recordings, playingId, togglePlayback, toggleFavorite, removeRecording } = useRecordings();

  const filteredRecordings = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ar");
    return recordings.filter((recording) => {
      const matchesFilter = filter === "all" || recording.favorite;
      const matchesQuery = !normalized || `${recording.title} ${recording.contact}`.toLocaleLowerCase("ar").includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, recordings]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#0B1324]" className="px-5">
      <FlatList
        data={filteredRecordings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 28, 34) }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.kicker}>مكتبتك الخاصة</Text>
                <Text style={styles.title}>سجل المكالمات</Text>
              </View>
              <View style={styles.headerIcon}><MaterialIcons name="history" size={24} color="#C9F08C" /></View>
            </View>
            <Text style={styles.subtitle}>كل ملفاتك الصوتية محفوظة محليًا ولا تغادر جهازك.</Text>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={21} color="#8391A7" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="ابحث في التسجيلات"
                placeholderTextColor="#718099"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => setQuery("")} style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.6 }]}>
                  <MaterialIcons name="close" size={18} color="#8391A7" />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.filters}>
              <FilterChip label="كل التسجيلات" active={filter === "all"} onPress={() => setFilter("all")} />
              <FilterChip label="المفضلة" active={filter === "favorites"} onPress={() => setFilter("favorites")} icon="star" />
              <View style={styles.resultCount}><Text style={styles.resultCountText}>{filteredRecordings.length} نتيجة</Text></View>
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
              onDelete={() => removeRecording(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name={query || filter === "favorites" ? "search-off" : "library-music"} size={30} color="#C9F08C" />
            <Text style={styles.emptyTitle}>{query || filter === "favorites" ? "لا توجد نتائج" : "مكتبتك فارغة"}</Text>
            <Text style={styles.emptyText}>{query || filter === "favorites" ? "جرّب كلمة بحث مختلفة أو أزل الفلتر." : "بعد إنهاء أول تسجيل، ستتمكن من تشغيله وإضافته للمفضلة."}</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function FilterChip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: "star" }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && { opacity: 0.72 }]}>
      {icon ? <MaterialIcons name={icon} size={15} color={active ? "#0B1324" : "#9BA8BA"} /> : null}
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14 },
  header: { gap: 14 },
  titleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  kicker: { color: "#8A96AB", fontSize: 12, marginBottom: 5, textAlign: "right" },
  title: { color: "#F5F7FB", fontSize: 28, fontWeight: "800", textAlign: "right" },
  headerIcon: { alignItems: "center", backgroundColor: "#17243E", borderColor: "#2B4166", borderRadius: 18, borderWidth: 1, height: 48, justifyContent: "center", width: 48 },
  subtitle: { color: "#8A96AB", fontSize: 12, lineHeight: 20, textAlign: "right" },
  searchBox: { alignItems: "center", backgroundColor: "#111B31", borderColor: "#263650", borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 52, paddingHorizontal: 14 },
  searchInput: { color: "#F5F7FB", flex: 1, fontSize: 13, textAlign: "right" },
  clearButton: { alignItems: "center", height: 28, justifyContent: "center", width: 28 },
  filters: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  filterChip: { alignItems: "center", backgroundColor: "#111B31", borderColor: "#263650", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 5, paddingHorizontal: 12, paddingVertical: 8 },
  filterChipActive: { backgroundColor: "#C9F08C", borderColor: "#C9F08C" },
  filterText: { color: "#9BA8BA", fontSize: 11, fontWeight: "700" },
  filterTextActive: { color: "#0B1324" },
  resultCount: { flex: 1 },
  resultCountText: { color: "#718099", fontSize: 11, textAlign: "left" },
  rowWrap: { marginTop: 10 },
  emptyState: { alignItems: "center", backgroundColor: "#111B31", borderColor: "#1D2942", borderRadius: 22, borderWidth: 1, gap: 10, marginTop: 18, paddingHorizontal: 22, paddingVertical: 32 },
  emptyTitle: { color: "#F5F7FB", fontSize: 15, fontWeight: "800" },
  emptyText: { color: "#8A96AB", fontSize: 12, lineHeight: 19, textAlign: "center" },
});
