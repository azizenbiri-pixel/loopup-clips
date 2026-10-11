import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Envoie la vidéo dans le stockage puis l'ajoute au fil, liée au compte. Retourne l'id. */
export async function publishVideo(file: Blob, description: string, userId: string, avatar: string | null) {
  const type = file.type || "video/mp4";
  const ext = type.includes("webm") ? "webm" : type.includes("quicktime") ? "mov" : "mp4";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
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
    user_id: userId,
    video_url: signed.signedUrl,
    description: description.trim() || null,
    profile_pic: avatar,
  });
  if (insertError) throw insertError;
  return id;
}

/** Envoie une photo de profil et renvoie son lien. */
export async function uploadAvatar(file: File, userId: string) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("videos")
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw error;
  const { data: signed, error: signError } = await supabase.storage
    .from("videos")
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !signed) throw signError ?? new Error("URL indisponible");
  return signed.signedUrl;
}
