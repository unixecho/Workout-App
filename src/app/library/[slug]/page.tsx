import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/data";
import { adaptationNote, type ExerciseRow } from "@/lib/plan/exercises";
import { LibraryDetail } from "@/components/library/LibraryDetail";

export default async function LibraryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pick?: string }>;
}) {
  const { slug } = await params;
  const { pick } = await searchParams;
  const { supabase, profile } = await requireProfile();

  const { data: ex } = await supabase
    .from("exercises")
    .select("id, slug, name, muscle_groups, equipment, difficulty, demo_keyframes, form_cues, common_mistakes, adaptations")
    .eq("slug", slug)
    .single();
  if (!ex) notFound();

  const note = adaptationNote(ex as unknown as ExerciseRow, profile.limitations ?? []);

  return (
    <LibraryDetail
      exercise={{
        id: ex.id,
        name: ex.name,
        muscles: ex.muscle_groups,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        pattern: (ex.demo_keyframes as { pattern?: string })?.pattern ?? "squat",
        formCues: ex.form_cues,
        mistakes: ex.common_mistakes ?? [],
        adaptation: note,
      }}
      pickDayId={pick ?? null}
    />
  );
}
