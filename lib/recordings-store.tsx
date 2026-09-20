import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import {
  createAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

import { formatDuration, formatRecordingDate } from "@/lib/recording-utils";

export { formatDuration, formatRecordingDate } from "@/lib/recording-utils";

export type CallRecording = {
  id: string;
  title: string;
  contact: string;
  duration: number;
  recordedAt: string;
  uri?: string;
  favorite: boolean;
};

type RecordingsContextValue = {
  recordings: CallRecording[];
  isHydrated: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  playingId: string | null;
  storageDirectory: string;
  storageReady: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  togglePlayback: (recording: CallRecording) => void;
  toggleFavorite: (id: string) => void;
  removeRecording: (id: string) => void;
  clearAll: () => void;
};

const STORAGE_KEY = "@sawt/recordings/v1";
const DOWNLOADS_URI_KEY = "@sawt/downloads-folder-uri/v1";
const STORAGE_FOLDER = "CallMeRecordings";
const STORAGE_LABEL = "Downloads/CallMeRecordings";
const RecordingsContext = createContext<RecordingsContextValue | null>(null);

async function getSavedDownloadsFolder() {
  if (Platform.OS !== "android") return null;
  const uri = await AsyncStorage.getItem(DOWNLOADS_URI_KEY);
  if (!uri) return null;
  try {
    await FileSystem.StorageAccessFramework.readDirectoryAsync(uri);
    return uri;
  } catch {
    await AsyncStorage.removeItem(DOWNLOADS_URI_KEY).catch(() => undefined);
    return null;
  }
}

async function ensureDownloadsFolder(requestPermission: boolean) {
  if (Platform.OS !== "android") return null;
  const saved = await getSavedDownloadsFolder();
  if (saved) return saved;
  if (!requestPermission) return null;

  const initialUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Download");
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
  if (!permission.granted) return null;

  const parentUri = permission.directoryUri;
  let folderUri: string | null = null;
  try {
    folderUri = await FileSystem.StorageAccessFramework.makeDirectoryAsync(parentUri, STORAGE_FOLDER);
  } catch {
    const children = await FileSystem.StorageAccessFramework.readDirectoryAsync(parentUri);
    folderUri = children.find((uri) => decodeURIComponent(uri).endsWith(`/${STORAGE_FOLDER}`)) ?? null;
  }
  if (!folderUri) throw new Error("DOWNLOADS_FOLDER_CREATE_FAILED");
  await AsyncStorage.setItem(DOWNLOADS_URI_KEY, folderUri);
  return folderUri;
}

async function copyIntoDownloads(uri: string | undefined, id: string) {
  if (!uri || Platform.OS !== "android") return uri;
  const folderUri = await ensureDownloadsFolder(true);
  if (!folderUri) throw new Error("DOWNLOADS_PERMISSION_REQUIRED");
  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
    folderUri,
    `call-${id}.m4a`,
    "audio/mp4"
  );
  await FileSystem.copyAsync({ from: uri, to: fileUri });
  await FileSystem.deleteAsync(uri, { idempotent: true });
  return fileUri;
}

async function deleteRecordingFile(uri?: string) {
  if (!uri || Platform.OS === "web") return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // The metadata remains useful even if the user already removed the file.
  }
}

export function RecordingsProvider({ children }: { children: React.ReactNode }) {
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(Platform.OS !== "android");
  const recordingStartedAt = useRef<number | null>(null);
  const activePlayer = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    getSavedDownloadsFolder().then((uri) => setStorageReady(Boolean(uri))).catch(() => setStorageReady(false));
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) {
          const parsed = JSON.parse(value) as CallRecording[];
          setRecordings(parsed.filter((item) => item && typeof item.id === "string"));
        }
      })
      .catch(() => undefined)
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recordings)).catch(() => undefined);
  }, [isHydrated, recordings]);

  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }
    const startedAt = recordingStartedAt.current ?? Date.now();
    const timer = setInterval(() => {
      setRecordingSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 500);
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => () => activePlayer.current?.remove(), []);

  const startRecording = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("نحتاج إلى إذن الميكروفون", "فعّل إذن الميكروفون من إعدادات الجهاز لبدء التسجيل.");
        return;
      }
      if (Platform.OS === "android" && !(await ensureDownloadsFolder(true))) {
        Alert.alert("يلزم اختيار مجلد التنزيلات", "اختر مجلد Downloads، وسيُنشئ التطبيق داخله مجلد CallMeRecordings.");
        return;
      }
      setStorageReady(true);
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingStartedAt.current = Date.now();
      setRecordingSeconds(0);
      setIsRecording(true);
    } catch {
      Alert.alert("تعذّر بدء التسجيل", "تحقق من الأذونات ثم حاول مرة أخرى.");
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    try {
      const startedAt = recordingStartedAt.current ?? Date.now();
      await recorder.stop();
      const duration = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      const recordedAt = new Date().toISOString();
      const id = `${Date.now()}`;
      const publicUri = await copyIntoDownloads(recorder.uri ?? undefined, id);
      const recording: CallRecording = {
        id,
        title: `تسجيل ${new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short" }).format(new Date(recordedAt))}`,
        contact: "تسجيل محلي",
        duration,
        recordedAt,
        uri: publicUri,
        favorite: false,
      };
      setRecordings((current) => [recording, ...current]);
      recordingStartedAt.current = null;
      setIsRecording(false);
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      Alert.alert("تم الحفظ في التنزيلات", `تم حفظ الملف داخل:\n${STORAGE_LABEL}`);
    } catch {
      setIsRecording(false);
      Alert.alert("تعذّر حفظ التسجيل", "تأكد من بقاء صلاحية مجلد Downloads ثم حاول مرة أخرى.");
    }
  }, [recorder]);

  const togglePlayback = useCallback((recording: CallRecording) => {
    if (!recording.uri) {
      Alert.alert("لا يوجد ملف صوتي", "ابدأ تسجيلًا وأنهِه حتى يتم إنشاء ملف داخل Downloads.");
      return;
    }
    try {
      if (playingId === recording.id) {
        activePlayer.current?.pause();
        setPlayingId(null);
        return;
      }
      activePlayer.current?.remove();
      const player = createAudioPlayer({ uri: recording.uri });
      activePlayer.current = player;
      player.play();
      setPlayingId(recording.id);
    } catch {
      Alert.alert("تعذّر تشغيل التسجيل", "الملف الصوتي غير متاح حاليًا.");
    }
  }, [playingId]);

  const toggleFavorite = useCallback((id: string) => {
    setRecordings((current) => current.map((recording) => recording.id === id ? { ...recording, favorite: !recording.favorite } : recording));
  }, []);

  const removeRecording = useCallback((id: string) => {
    const target = recordings.find((recording) => recording.id === id);
    if (playingId === id) {
      activePlayer.current?.remove();
      setPlayingId(null);
    }
    void deleteRecordingFile(target?.uri);
    setRecordings((current) => current.filter((recording) => recording.id !== id));
  }, [playingId, recordings]);

  const clearAll = useCallback(() => {
    if (recordings.length === 0) return;
    activePlayer.current?.remove();
    setPlayingId(null);
    void Promise.all(recordings.map((recording) => deleteRecordingFile(recording.uri)));
    setRecordings([]);
  }, [recordings]);

  const value = useMemo(() => ({
    recordings, isHydrated, isRecording, recordingSeconds, playingId,
    storageDirectory: STORAGE_LABEL, storageReady,
    startRecording, stopRecording, togglePlayback, toggleFavorite, removeRecording, clearAll,
  }), [clearAll, isHydrated, isRecording, playingId, recordings, recordingSeconds, removeRecording, startRecording, stopRecording, storageReady, toggleFavorite, togglePlayback]);

  return <RecordingsContext.Provider value={value}>{children}</RecordingsContext.Provider>;
}

export function useRecordings() {
  const value = useContext(RecordingsContext);
  if (!value) throw new Error("useRecordings must be used inside RecordingsProvider");
  return value;
}
