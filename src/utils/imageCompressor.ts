import { ImageCompressionResult } from '../types';

/**
 * RNF-1 (Compresión de Imagen):
 * La aplicación móvil/web debe comprimir obligatoriamente las imágenes
 * (ej. calidad al 50-60%) antes de subirlas al Storage para optimizar recursos.
 */
export async function compressImage(
  file: File,
  quality: number = 0.55,
  maxDimension: number = 1400
): Promise<ImageCompressionResult> {
  const originalSizeKB = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al cargar la imagen en memoria'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Escalar manteniendo proporción si excede dimensión máxima
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D de canvas'));
          return;
        }

        // Dibujar con suavizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob JPEG con calidad 50-60% (por defecto 0.55)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Fallo la compresión de la imagen'));
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const compressedSizeKB = Math.round(blob.size / 1024);
            const ratio = originalSizeKB > 0
              ? Math.max(0, Math.round(((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100))
              : 0;

            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

            resolve({
              file: compressedFile,
              dataUrl: compressedDataUrl,
              originalSizeKB,
              compressedSizeKB,
              compressionRatioPercent: ratio,
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
