export type Provider = "deputy" | "humanforce" | "foundu";

export function detectProvider(url: string): Provider {
    const u = url.toLowerCase();

    if (u.includes("deputy.com")) return "deputy";
    if (u.includes("humanforce") || u.includes("keypay")) return "humanforce";
    if (u.includes("foundu")) return "foundu";

    throw new Error(
        "Unsupported roster link. Please paste a calendar link from Deputy, Humanforce or FoundU."
    );
}
