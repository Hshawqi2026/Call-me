import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatDuration, formatRecordingDate, type CallRecording } from "@/lib/recordings-store";

export function RecordingRow({
  recording,
  isPlaying,
  onPlay,
  onFavorite,
  onDelete,
}: {
  recording: CallRecording;
  isPlaying: boolean;
  onPlay: () => void;
  onFavorite: () => void;
  onDelete?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? "إيقاف التشغيل" : "تشغيل التسجيل"}
        onPress={onPlay}
        style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
      >
        <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={22} color="#0B1324" />
      </Pressable>

      <View style={styles.details}>
        <View style={styles.titleLine}>
          <Text numberOfLines={1} style={styles.title}>{recording.title}</Text>
          <Text style={styles.duration}>{formatDuration(recording.duration)}</Text>
        </View>
        <View style={styles.metaLine}>
          <MaterialIcons name="phone-in-talk" size={14} color="#8A96AB" />
          <Text style={styles.meta}>{recording.contact}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>{formatRecordingDate(recording.recordedAt)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={recording.favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          onPress={onFavorite}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <MaterialIcons name={recording.favorite ? "star" : "star-border"} size={21} color={recording.favorite ? "#E2B75A" : "#8A96AB"} />
        </Pressable>
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="حذف التسجيل"
            onPress={onDelete}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="delete-outline" size={20} color="#8A96AB" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: "#111B31",
    borderColor: "#1D2942",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 76,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  playButton: {
    alignItems: "center",
    backgroundColor: "#C9F08C",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  details: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  titleLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  title: {
    color: "#F5F7FB",
    flex: 1,
    fontFamily: "System",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  duration: {
    color: "#C9F08C",
    fontSize: 12,
    fontWeight: "700",
  },
  metaLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "flex-end",
  },
  meta: {
    color: "#8A96AB",
    fontSize: 11,
    textAlign: "right",
  },
  dot: {
    color: "#52617C",
    fontSize: 12,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
});
