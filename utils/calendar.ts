import { supabase } from "./supabase";
import { detectProvider } from "./provider";

export async function saveCalendarFeed(icsUrl: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("Not logged in");

    const provider = detectProvider(icsUrl);

    const { error } = await supabase.from("calendar_feeds").upsert({
        user_id: user.id,
        provider,
        ics_url: icsUrl
    });

    if (error) throw error;
}
