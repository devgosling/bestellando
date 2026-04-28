import { useEffect, useState } from "react";
import { properties } from "@repo/lib";
import { appwriteAccount } from "@repo/lib";

async function fetchProofBlob(deliveryId: string): Promise<string> {
  const { jwt } = await appwriteAccount.createJWT();
  const res = await fetch(
    `${properties.apiUrl}/v1/delivery/${deliveryId}/proof`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  if (!res.ok) throw new Error("Failed to load proof");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function ProofImage({ deliveryId }: { deliveryId: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    fetchProofBlob(deliveryId)
      .then((u) => {
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        url = u;
        setSrc(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [deliveryId]);

  if (!src) return null;
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-block"
    >
      <img
        src={src}
        alt="Lieferungsnachweis"
        className="h-16 w-16 rounded-md object-cover border border-border"
      />
    </a>
  );
}
