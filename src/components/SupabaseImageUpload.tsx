import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type SupabaseImageUploadProps = {
  ownerId: string;
  onUploaded: (url: string) => void;
};

export const SupabaseImageUpload: React.FC<SupabaseImageUploadProps> = ({
  ownerId,
  onUploaded,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const bucket = import.meta.env.VITE_SUPABASE_BUCKET as string;
      if (!bucket) {
        throw new Error("VITE_SUPABASE_BUCKET is niet gezet");
      }

      const ext = file.name.split(".").pop();
      const fileName = `${ownerId}/${Date.now()}.${ext ?? "jpg"}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError || !data) {
        throw uploadError ?? new Error("Onbekende upload fout");
      }

      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      const publicUrl = publicData.publicUrl;
      onUploaded(publicUrl);
    } catch (err) {
      console.error(err);
      setError("Uploaden mislukt, probeer het opnieuw.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600 }}>Foto uploaden</label>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {uploading && (
        <span style={{ fontSize: 12, color: "#64748b" }}>
          Bezig met uploaden...
        </span>
      )}
      {error && (
        <span style={{ fontSize: 12, color: "#ef4444" }}>
          {error}
        </span>
      )}
    </div>
  );
};
