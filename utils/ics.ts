import ICAL from "ical.js";
import { supabase } from "./supabase";

/**
 * Parses an ICS feed and returns an array of shift objects
 */
export async function parseICS(url: string, provider: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch ICS feed");
    const text = await res.text();

    const jcalData = ICAL.parse(text);
    const comp = new ICAL.Component(jcalData);
    const events = comp.getAllSubcomponents("vevent");

    const shifts = events.map((event) => {
        const e = new ICAL.Event(event);
        return {
            provider,           // e.g., "deputy", "humanforce"
            external_id: e.uid, // ICS UID, used for unique index
            start_time: e.startDate.toJSDate(),
            end_time: e.endDate.toJSDate(),
            title: e.summary || "",
            description: e.description || "",
            location: e.location || "",
        };
    });

    console.log(`Parsed ${shifts.length} shifts from ${provider}:`, shifts);
    return shifts;
}

/**
 * Syncs all calendar feeds for the logged-in user into the shifts table
 */
export async function syncShiftsForUser() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) throw new Error("Not logged in");

    const { data: feeds, error: feedsError } = await supabase
        .from("calendar_feeds")
        .select("*")
        .eq("user_id", user.id);

    if (feedsError) throw feedsError;
    if (!feeds || feeds.length === 0) return 0;

    let totalInserted = 0;

    for (const feed of feeds) {
        try {
            const shifts = await parseICS(feed.ics_url, feed.provider);

            let insertedCount = 0;

            for (const shift of shifts) {
                const { error } = await supabase.from("shifts").upsert(
                    {
                        user_id: user.id,
                        provider: shift.provider,
                        external_id: shift.external_id,
                        start_time: shift.start_time,
                        end_time: shift.end_time,
                        title: shift.title,
                        location: shift.location,
                    },
                    {
                        onConflict: "user_id,provider,external_id", // ✅ as a single string
                    }
                );


                if (!error) {
                    insertedCount++;
                    totalInserted++;
                }
                else console.error(`Failed to insert shift ${shift.external_id}:`, error.message);
            }

            console.log(`Synced ${insertedCount}/${shifts.length} shifts from ${feed.provider}`);
        } catch (err: any) {
            console.error(`Failed to sync feed ${feed.ics_url}:`, err.message);
        }
    }
    return totalInserted;
}
