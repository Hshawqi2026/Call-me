import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useRecordings } from "@/lib/recordings-store";

const SETTINGS_KEY = "@sawt/settings/v1";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { recordings, clearAll, storageDirectory, storageReady } = useRecordings();
  const [notifyAfterRecording, setNotifyAfterRecording] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((value) => {
      if (!value) return;
      const saved = JSON.parse(value) as { notifyAfterRecording?: boolean; biometricLock?: boolean };
      setNotifyAfterRecording(saved.notifyAfterRecording ?? true);
      setBiometricLock(saved.biometricLock ?? false);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ notifyAfterRecording, biometricLock })).catch(() => undefined);
  }, [biometricLock, notifyAfterRecording]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#0B1324]" className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 28, 40) }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.kicker}>تخصيص التجربة</Text>
            <Text style={styles.title}>الإعدادات</Text>
          </View>
          <View style={styles.headerIcon}><MaterialIcons name="tune" size={24} color="#C9F08C" /></View>
        </View>

        <View style={styles.privacyBanner}>
          <View style={styles.bannerIcon}><MaterialIcons name="lock" size={20} color="#0B1324" /></View>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>خصوصيتك أولًا</Text>
            <Text style={styles.bannerText}>لا نستخدم خادمًا ولا نرفع أي تسجيل. الملفات والبيانات تبقى داخل مساحة التطبيق على جهازك.</Text>
          </View>
        </View>

        <SectionTitle label="التسجيل" />
        <View style={styles.card}>
          <SettingRow
            icon="notifications-none"
            title="تنبيه بعد التسجيل"
            description="أظهر تأكيدًا عند حفظ ملف جديد"
            right={
              <Switch
                value={notifyAfterRecording}
                onValueChange={setNotifyAfterRecording}
                trackColor={{ false: "#2B3A56", true: "#8DB866" }}
                thumbColor={notifyAfterRecording ? "#C9F08C" : "#94A1B5"}
              />
            }
          />
          <Divider />
          <SettingRow icon="mic-none" title="جودة الصوت" description="تسجيل واضح ومتوازن للاستخدام اليومي" right={<Text style={styles.valueText}>عالية</Text>} />
        </View>

        <SectionTitle label="الحماية" />
        <View style={styles.card}>
          <SettingRow
            icon="fingerprint"
            title="قفل ببصمة الجهاز"
            description="يتطلب دعم البصمة في إصدار أندرويد"
            right={
              <Switch
                value={biometricLock}
                onValueChange={setBiometricLock}
                trackColor={{ false: "#2B3A56", true: "#8DB866" }}
                thumbColor={biometricLock ? "#C9F08C" : "#94A1B5"}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="folder-special"
            title="مجلد التسجيلات"
            description={storageReady ? `مجلد عام يمكن الوصول إليه · ${storageDirectory}` : "سيُطلب اختيار مجلد Downloads عند بدء أول تسجيل"}
            right={<Text style={styles.valueText}>{storageReady ? "جاهز" : "..."}</Text>}
          />
          <Divider />
          <SettingRow
            icon="phone-disabled"
            title="التسجيل التلقائي للمكالمات"
            description="يتطلب دعم النظام أو تطبيق الاتصال الافتراضي؛ تسجيل الميكروفون العادي متاح من الرئيسية"
            right={<Text style={styles.warningText}>مقيّد</Text>}
          />
        </View>

        <SectionTitle label="إدارة البيانات" />
        <View style={styles.card}>
          <Pressable
            onPress={() => Alert.alert("حذف كل التسجيلات؟", `سيتم حذف ${recordings.length} تسجيل محليًا ولا يمكن التراجع.`, [
              { text: "إلغاء", style: "cancel" },
              { text: "متابعة", style: "destructive", onPress: clearAll },
            ])}
            style={({ pressed }) => [styles.dangerRow, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.rowIconDanger}><MaterialIcons name="delete-sweep" size={20} color="#F27A7A" /></View>
            <View style={styles.rowCopy}><Text style={styles.dangerTitle}>حذف كل التسجيلات</Text><Text style={styles.rowDescription}>{recordings.length ? `${recordings.length} تسجيل محفوظ على الجهاز` : "لا توجد تسجيلات محفوظة"}</Text></View>
            <MaterialIcons name="chevron-left" size={21} color="#718099" />
          </Pressable>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerMark}><MaterialIcons name="graphic-eq" size={18} color="#C9F08C" /></View>
          <Text style={styles.footerText}>صوت · إصدار 1.0.0</Text>
          <Text style={styles.footerNote}>مصمم للعمل محليًا بدون حساب أو اتصال.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionTitle({ label }: { label: string }) { return <Text style={styles.sectionTitle}>{label}</Text>; }

function Divider() { return <View style={styles.divider} />; }

function SettingRow({ icon, title, description, right }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; description: string; right: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.rowIcon}><MaterialIcons name={icon} size={20} color="#C9F08C" /></View>
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDescription}>{description}</Text></View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 14 },
  titleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  kicker: { color: "#8A96AB", fontSize: 12, marginBottom: 5, textAlign: "right" },
  title: { color: "#F5F7FB", fontSize: 28, fontWeight: "800", textAlign: "right" },
  headerIcon: { alignItems: "center", backgroundColor: "#17243E", borderColor: "#2B4166", borderRadius: 18, borderWidth: 1, height: 48, justifyContent: "center", width: 48 },
  privacyBanner: { alignItems: "center", backgroundColor: "#1C3144", borderColor: "#31556A", borderRadius: 21, borderWidth: 1, flexDirection: "row", gap: 12, padding: 15 },
  bannerIcon: { alignItems: "center", backgroundColor: "#C9F08C", borderRadius: 16, height: 34, justifyContent: "center", width: 34 },
  bannerCopy: { flex: 1, gap: 4 },
  bannerTitle: { color: "#E8F5DD", fontSize: 13, fontWeight: "800", textAlign: "right" },
  bannerText: { color: "#AEC6C8", fontSize: 11, lineHeight: 18, textAlign: "right" },
  sectionTitle: { color: "#8A96AB", fontSize: 12, fontWeight: "700", marginTop: 8, textAlign: "right" },
  card: { backgroundColor: "#111B31", borderColor: "#1D2942", borderRadius: 20, borderWidth: 1, paddingHorizontal: 14 },
  settingRow: { alignItems: "center", flexDirection: "row", gap: 11, minHeight: 72, paddingVertical: 11 },
  rowIcon: { alignItems: "center", backgroundColor: "#1D2D49", borderRadius: 14, height: 35, justifyContent: "center", width: 35 },
  rowIconDanger: { alignItems: "center", backgroundColor: "#3A2738", borderRadius: 14, height: 35, justifyContent: "center", width: 35 },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { color: "#F5F7FB", fontSize: 13, fontWeight: "700", textAlign: "right" },
  dangerTitle: { color: "#F27A7A", fontSize: 13, fontWeight: "700", textAlign: "right" },
  rowDescription: { color: "#7F8EA6", fontSize: 10, lineHeight: 16, textAlign: "right" },
  valueText: { color: "#C9F08C", fontSize: 12, fontWeight: "700" },
  warningText: { color: "#F8C66D", fontSize: 11, fontWeight: "700" },
  divider: { backgroundColor: "#202E47", height: 1, marginLeft: 46 },
  dangerRow: { alignItems: "center", flexDirection: "row", gap: 11, minHeight: 72 },
  footer: { alignItems: "center", gap: 7, paddingTop: 12 },
  footerMark: { alignItems: "center", backgroundColor: "#17243E", borderRadius: 14, height: 32, justifyContent: "center", width: 32 },
  footerText: { color: "#9BA8BA", fontSize: 11, fontWeight: "700" },
  footerNote: { color: "#5F6D85", fontSize: 10 },
});
