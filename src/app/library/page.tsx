import { requireProfile } from "@/lib/data";
import { LibraryBrowse, type LibraryItem } from "@/components/library/LibraryBrowse";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ pick?: string }>;
}) {
  const { pick } = await searchParams;
  const { supabase, profile } = await requireProfile();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, slug, name, muscle_groups, equipment, difficulty, demo_keyframes, adaptations")
    .order("name");

  const limitations: string[] = profile.limitations ?? [];
  const items: LibraryItem[] = (exercises ?? []).map((e) => {
    const adaptations = (e.adaptations ?? {}) as Record<string, { note: string; avoid: boolean }>;
    const hit = limitations.map((t) => adaptations[t.toLowerCase()]).find(Boolean);
    return {
      id: e.id,
      slug: e.slug,
      name: e.name,
      muscles: e.muscle_groups,
      equipment: e.equipment,
      difficulty: e.difficulty,
      pattern: (e.demo_keyframes as { pattern?: string })?.pattern ?? "squat",
      warns: !!hit,
      unsafe: hit?.avoid === true,
    };
  });

  return <LibraryBrowse items={items} pickDayId={pick ?? null} userEquipment={profile.equipment} />;
}
