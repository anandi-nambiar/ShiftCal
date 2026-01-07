import { supabase } from "./supabase";

export async function getTodayShift() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time");

    if (error) throw error;
    return data;
}


export async function getWeekShifts() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) throw new Error("Not logged in");

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", startOfWeek.toISOString())
        .lte("start_time", endOfWeek.toISOString())
        .order("start_time");

    if (error) throw error;
    return data || [];
}
