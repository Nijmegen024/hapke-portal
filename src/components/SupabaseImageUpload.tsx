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
      const token = localStorage.getItem('vendor_token');
      const apiBase = import.meta.env.VITE_API_BASE as string;
      if (!apiBase) {
        throw new Error('API base ontbreekt');
      }

      // Vraag signed upload URL aan bij backend
      const signRes = await fetch(`${apiBase}/media/sign-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!signRes.ok) {
        const text = await signRes.text();
        throw new Error(text || 'Kon upload-URL niet ophalen');
      }

      const signData = await signRes.json();
      const uploadUrl = signData.uploadUrl as string;
      const publicUrl = signData.publicUrl as string;

      if (!uploadUrl || !publicUrl) {
        throw new Error('Ongeldige upload respons');
      }

      // Upload het bestand naar de signed URL
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });

      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(text || 'Upload mislukt');
      }

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
