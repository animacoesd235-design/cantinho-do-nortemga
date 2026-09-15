import { Camera, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SavedMedia = { tipo: "image" | "video"; data: string };

const key = (id: string) => `cdn-midia:${id}`;

export function ProductMedia({
  id,
  fallback,
  alt,
  priority = false,
}: {
  id: string;
  fallback: string;
  alt: string;
  priority?: boolean;
}) {
  const [media, setMedia] = useState<SavedMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key(id));
      if (raw) setMedia(JSON.parse(raw) as SavedMedia);
    } catch {
      /* ignora mídia inválida */
    }
  }, [id]);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const tipo = file.type.startsWith("video") ? "video" : "image";
    if (file.size > 4.5 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "Escolha uma foto ou vídeo de até 4,5 MB.",
      });
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const novo: SavedMedia = { tipo, data: String(reader.result) };
      try {
        localStorage.setItem(key(id), JSON.stringify(novo));
        setMedia(novo);
        toast.success("Mídia atualizada!");
      } catch {
        toast.error("Espaço insuficiente no navegador", {
          description: "Remova outra mídia ou use um arquivo menor.",
        });
      }
      setLoading(false);
    };
    reader.onerror = () => {
      setLoading(false);
      toast.error("Não foi possível ler o arquivo.");
    };
    reader.readAsDataURL(file);
  };

  const restaurar = () => {
    localStorage.removeItem(key(id));
    setMedia(null);
    toast("Foto original restaurada");
  };

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-sand-deep">
      {media?.tipo === "video" ? (
        <video
          src={media.data}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          src={media?.data ?? fallback}
          alt={alt}
          width={1024}
          height={768}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}

      <div className="absolute right-2 top-2 flex gap-2">
        {media && (
          <button
            type="button"
            onClick={restaurar}
            aria-label="Restaurar mídia original"
            className="tap grid h-9 w-9 place-items-center rounded-full bg-background/70 text-forest backdrop-blur-md"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Trocar foto ou vídeo do produto"
          className="tap grid h-9 w-9 place-items-center rounded-full bg-background/70 text-forest backdrop-blur-md"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
