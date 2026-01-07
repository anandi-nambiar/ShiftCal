import React, { useState, useEffect, JSX } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { supabase } from "../utils/supabase";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Feather } from "@expo/vector-icons";
import { Calendar, DateData } from "react-native-calendars";

const TIMEZONE = "Australia/Melbourne";

type LocalShift = {
  id: string;
  user_id: string;
  provider: string;
  external_id: string;
  start_time: string;
  end_time: string;
  title?: string | null;
  location?: string | null;
  start_time_local: Date;
  end_time_local: Date;
  status?: string;
};

export default function Shifts() {
  const [shifts, setShifts] = useState<LocalShift[]>([]);
  const [monthShifts, setMonthShifts] = useState<LocalShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});

  // Fetch shifts for week/day view (static, only depends on selectedDate)
  useEffect(() => {
    const fetchWeekDayShifts = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) throw new Error("Not logged in");

        let start: Date, end: Date;
        if (view === "day") {
          start = startOfDay(selectedDate);
          end = endOfDay(selectedDate);
        } else if (view === "week") {
          start = startOfWeek(new Date(), { weekStartsOn: 1 }); // always current week
          end = endOfWeek(new Date(), { weekStartsOn: 1 });
        } else {
          return; // month view handled separately
        }

        const { data, error } = await supabase
          .from<"shifts", LocalShift>("shifts")
          .select("*")
          .gte("start_time", start.toISOString())
          .lte("start_time", end.toISOString())
          .order("start_time");

        if (error) throw error;

        const localShifts = (data || []).map((shift) => ({
          ...shift,
          start_time_local: toZonedTime(new Date(shift.start_time), TIMEZONE),
          end_time_local: toZonedTime(new Date(shift.end_time), TIMEZONE),
          status: shift.status || "Confirmed",
        }));

        setShifts(localShifts);

        const total = localShifts.reduce((acc, s) => acc + differenceInMinutes(s.end_time_local, s.start_time_local), 0);
        setTotalMinutes(total);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekDayShifts();
  }, [view, selectedDate]);

  // Fetch shifts for calendar month (dynamic, depends on calendarMonth)
  useEffect(() => {
    const fetchMonthShifts = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) throw new Error("Not logged in");

        const start = startOfMonth(calendarMonth);
        const end = endOfMonth(calendarMonth);

        const { data, error } = await supabase
          .from<"shifts", LocalShift>("shifts")
          .select("*")
          .gte("start_time", start.toISOString())
          .lte("start_time", end.toISOString())
          .order("start_time");

        if (error) throw error;

        const localShifts = (data || []).map((shift) => ({
          ...shift,
          start_time_local: toZonedTime(new Date(shift.start_time), TIMEZONE),
          end_time_local: toZonedTime(new Date(shift.end_time), TIMEZONE),
          status: shift.status || "Confirmed",
        }));

        setMonthShifts(localShifts);

        // mark dates on calendar
        const marks: { [key: string]: any } = {};
        localShifts.forEach((shift) => {
          const dateStr = format(shift.start_time_local, "yyyy-MM-dd");
          if (!marks[dateStr]) marks[dateStr] = { marked: true, dots: [{ color: "#4F46E5" }] };
        });
        setMarkedDates(marks);

      } catch (err) {
        console.error(err);
      }
    };

    if (view === "month") fetchMonthShifts();
  }, [calendarMonth, view]);

  const formatTotalHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const formatShiftDate = (date: Date) => {
    const daySuffix = (d: number) => {
      if (d > 3 && d < 21) return "th";
      switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };
    return format(date, "EEE, ") + format(date, "d") + daySuffix(date.getDate()) + format(date, " MMM");
  };

  // Select which shifts to display: week/day vs month
  const displayShifts = view === "month" ? monthShifts : shifts;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Shifts</Text>

      {/* Time period selector */}
      <View style={styles.selectorContainer}>
        {["day", "week", "month"].map((v, i) => {
          const isSelected = view === v;
          return (
            <TouchableOpacity
              key={v}
              onPress={() => setView(v as "day" | "week" | "month")}
              style={[
                styles.segment,
                isSelected && styles.segmentSelected,
                i === 0 && { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
                i === 2 && { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
              ]}
            >
              <Text style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>
                {v === "day" ? "Today" : v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>HOURS</Text>
            <Text style={styles.summaryValue}>{formatTotalHours(totalMinutes)}</Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>EST. EARN</Text>
            <Text style={styles.summaryValue}>$320</Text>
          </View>
        </View>

        {view === "week" && (
          <View style={styles.weekSection}>
            <View style={{ height: 8 }} />
            <View style={styles.weekLabels}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, idx) => {
                const todayIndex = new Date().getDay();
                const normalizedIndex = todayIndex === 0 ? 6 : todayIndex - 1;
                return (
                  <Text key={day} style={[styles.weekLabel, idx === normalizedIndex && styles.weekLabelActive]}>
                    {day}
                  </Text>
                );
              })}
            </View>
            <View style={styles.weekTrack}>
              <View style={[styles.weekFill, { width: `${((new Date().getDay() || 7)/7) * 100}%` }]} />
            </View>
          </View>
        )}
      </View>

      

      {/* Month calendar */}
      {view === "month" && (
        <View style={{ marginTop: 20, marginBottom: 20 }}>
          <Calendar
            current={format(calendarMonth, "yyyy-MM-dd")}
            onDayPress={(day: DateData) => setSelectedDate(new Date(day.dateString))}
            onMonthChange={(month: DateData) => setCalendarMonth(new Date(month.dateString))}
            markedDates={markedDates}
            markingType="multi-dot"
            theme={{
              todayTextColor: "#4F46E5",
              selectedDayBackgroundColor: "#4F46E5",
              selectedDayTextColor: "#FFFFFF",
              dotColor: "#4F46E5",
              arrowColor: "#4F46E5",
              monthTextColor: "#111827",
              textDayFontWeight: "500",
              textMonthFontWeight: "600",
              textDayHeaderFontWeight: "600",
            }}
            enableSwipeMonths={true}
          />
        </View>
      )}

      {/* Shifts list */}
     
{loading ? (
  <ActivityIndicator size="large" color="#4F46E5" />
) : (
  <>
    {displayShifts.length === 0 && (
      <Text style={{ textAlign: "center", marginTop: 20 }}>No shifts scheduled.</Text>
    )}

    {displayShifts.reduce((acc: JSX.Element[], shift, index) => {
      const prevDate = index > 0 ? displayShifts[index - 1].start_time_local : null;
      const showDate = !prevDate || format(prevDate, "yyyy-MM-dd") !== format(shift.start_time_local, "yyyy-MM-dd");

      // Add date header if needed
      if (showDate) {
        acc.push(
          <Text key={`date-${shift.id}`} style={styles.shiftDate}>
            {formatShiftDate(shift.start_time_local)}
          </Text>
        );
      }

      acc.push(
        <View key={shift.id} style={styles.shiftItem}>
          <View
            style={[
              styles.statusBar,
              { backgroundColor: shift.status === "Confirmed" ? "#10B981" : "#F59E0B" },
            ]}
          />
          <View style={styles.shiftContent}>
            <Text style={styles.shiftTitle}>{shift.title || "Shift"}</Text>

            <View style={styles.infoRow}>
              <Feather name="clock" size={14} color="#4F46E5" style={{ marginRight: 8, marginTop: 5 }} />
              <Text style={styles.shiftInfo}>
                {format(shift.start_time_local, "HH:mm")} - {format(shift.end_time_local, "HH:mm")}
              </Text>
            </View>

            {shift.location && (
              <Text style={{ flexDirection: "row", alignItems: "center", fontSize: 14, color: "#6B7280", marginTop: 4 }}>
                <Feather name="map-pin" size={14} color="#9CA3AF" />
                <Text>  {shift.location}</Text>
              </Text>
            )}
          </View>
        </View>
      );

      return acc;
    }, [] as JSX.Element[])}
  </>
)}

    </ScrollView>
  );
}

// Styles remain the same (unchanged)
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#F7F9FC" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  selectorContainer: { flexDirection: "row", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 20 },
  segment: { flex: 1, paddingVertical: 12, alignItems: "center", backgroundColor: "#F3F4F6" },
  segmentSelected: { backgroundColor: "#FFF", borderRadius: 10, overflow: "hidden" },
  segmentText: { color: "#6B7280", fontWeight: "600" },
  segmentTextSelected: { color: "#4F46E5" },

  shiftDate: { fontSize: 16, fontWeight: "600", color: "#4B5563", marginBottom: 8, marginTop: 16 },
  shiftItem: { flexDirection: "row", padding: 16, borderRadius: 16, backgroundColor: "#FFF", marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 4 },
  statusBar: { width: 4, borderRadius: 2 },
  shiftContent: { flex: 1, paddingLeft: 14 },
  shiftTitle: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  shiftInfo: { fontSize: 14, color: "#4F46E5", marginTop: 5 },

  summaryCard: { padding: 20, borderRadius: 16, backgroundColor: "#6c65eb", marginBottom: 24, flexDirection: "column" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryBlock: { flex: 1 },
  summaryLabel: { color: "#D1D5DB", fontSize: 12, fontWeight: "600" },
  summaryValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 4 },

  weekSection: { width: "100%", marginTop: 12 },
  weekLabels: { flexDirection: "row", marginBottom: 8 },
  weekLabel: { flex: 1, textAlign: "center", fontSize: 11, color: "#D1D5DB", fontWeight: "500" },
  weekLabelActive: { color: "#FFFFFF", fontWeight: "700" },
  weekTrack: { height: 6, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 3, overflow: "hidden" },
  weekFill: { height: 6, backgroundColor: "#FFFFFF", borderRadius: 3 },
  monthSection: {
  width: "100%",
  marginTop: 12,
},

monthLabel: {
  fontSize: 12,
  fontWeight: "600",
  color: "#D1D5DB",
  marginBottom: 4,
  textAlign: "center",
},

monthTrack: {
  height: 6,
  backgroundColor: "rgba(255,255,255,0.3)",
  borderRadius: 3,
  overflow: "hidden",
},

monthFill: {
  height: 6,
  backgroundColor: "#FFFFFF",
  borderRadius: 3,
},

});
