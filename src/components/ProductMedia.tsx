import { Camera, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SavedMedia = { tipo: "image" | "video"; data: string };

const key = (id: string) => `cdn-midia:${id}`;

export function ProductMedia({
  id,
  image,
  imagem,
  fallback = "",
  alt,
  priority = false,
}: {
  id?: string;
  image?: string;
  imagem?: string;
  fallback?: string;
  alt: string;
  priority?: boolean | undefined;
}) {
  const [media, setMedia] = useState<SavedMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const carregar = () => {
      try {
        const raw = localStorage.getItem(key(id));
        if (raw) setMedia(JSON.parse(raw) as SavedMedia);
        else setMedia(null);
      } catch {
        setMedia(null);
      }
    };
    carregar();
    window.addEventListener("cdn:products_updated", carregar);
    return () => window.removeEventListener("cdn:products_updated", carregar);
  }, [id, fallback]);

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
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-3xl bg-sand-deep/40 flex items-center justify-center">
      {media?.tipo === "video" ? (
        <video
          src={media.data}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <img
          src={media?.data || image || imagem || fallback}
          alt={alt}
          width={1024}
          height={768}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-105"
        />
      )}

      <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 z-10">
        {media && (
          <button
            type="button"
            onClick={restaurar}
            aria-label="Restaurar mídia original"
            title="Restaurar foto original"
            className="tap grid h-8 w-8 place-items-center rounded-full bg-black/45 hover:bg-black/70 text-white shadow-sm backdrop-blur-md transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Trocar foto ou vídeo do produto"
          title="Carregar foto ou vídeo próprio"
          className="tap grid h-8 w-8 place-items-center rounded-full bg-black/45 hover:bg-black/70 text-white shadow-sm backdrop-blur-md transition-colors"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
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
