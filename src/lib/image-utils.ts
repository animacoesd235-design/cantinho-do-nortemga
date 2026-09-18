/**
 * Utilitário de compressão e conversão de fotos para upload no cardápio.
 * Redimensiona a imagem via HTML5 Canvas para dimensões otimizadas (max 800x800),
 * gerando Base64 (WebP ou JPEG) leve (~30KB-80KB) que evita estourar o limite de 5MB do localStorage.
 */
export function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WEBP)."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Preserva o aspect-ratio perfeito
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(event.target?.result || ""));
          return;
        }

        // Fundo limpo
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Gera Base64 em formato leve
        const format = file.type === "image/png" ? "image/webp" : "image/jpeg";
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Não foi possível processar a imagem selecionada."));
      img.src = String(event.target?.result || "");
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo selecionado."));
    reader.readAsDataURL(file);
  });
}
