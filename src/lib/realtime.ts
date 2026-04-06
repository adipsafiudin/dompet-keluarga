import { createClient } from "@/lib/supabase/client";

/**
 * Kirim sinyal refresh ke seluruh member keluarga yang sedang aktif.
 * Menggunakan Supabase Broadcast — tidak butuh publication tabel dan tidak diblokir RLS.
 */
export function notifyFamilyRefresh(familyId: string) {
  if (!familyId) return;
  const supabase = createClient();
  const channel = supabase.channel(`family:${familyId}:broadcast`);
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      channel
        .send({ type: "broadcast", event: "refresh", payload: {} })
        .finally(() => {
          supabase.removeChannel(channel);
        });
    }
  });
}

/**
 * Buat subscription broadcast untuk menerima sinyal refresh dari member lain.
 * Kembalikan fungsi cleanup (untuk dipanggil di return useEffect).
 */
export function subscribeFamilyRefresh(
  familyId: string,
  onRefresh: () => void,
) {
  if (!familyId) return () => {};
  const supabase = createClient();
  const channel = supabase
    .channel(`family:${familyId}:broadcast`)
    .on("broadcast", { event: "refresh" }, () => {
      onRefresh();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
