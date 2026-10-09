import { supabase } from "@/integrations/supabase/client";
import { addMyVideo } from "@/lib/local-profile";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Envoie la vidéo dans le stockage puis l'ajoute au fil. Retourne l'id de la vidéo. */
export async function publishVideo(file: Blob, description: string, avatar: string) {
  const type = file.type || "video/mp4";
  const ext = type.includes("webm") ? "webm" : type.includes("quicktime") ? "mov" : "mp4";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("videos")
    .upload(path, file, { contentType: type, upsert: false });
  if (uploadError) throw uploadError;

  const { data: signed, error: signError } = await supabase.storage
    .from("videos")
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !signed) throw signError ?? new Error("URL indisponible");

  const id = crypto.randomUUID();
  const { error: insertError } = await supabase.from("videos").insert({
    id,
    video_url: signed.signedUrl,
    description: description.trim() || null,
    profile_pic: avatar,
  });
  if (insertError) throw insertError;
  addMyVideo(id);
  return id;
}
