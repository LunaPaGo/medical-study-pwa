export type ProcessedImage = {
  width: number | null;
  height: number | null;
  thumbnail?: Blob;
};

function isImage(file: File) {
  return file.type.startsWith('image/');
}

async function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.78) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo procesar la imagen.'));
    }, type, quality);
  });
}

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!isImage(file)) {
    return { width: null, height: null };
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' as ImageOrientation });
  const thumbnailMax = 420;
  const scale = Math.min(1, thumbnailMax / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return { width: bitmap.width, height: bitmap.height };
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return {
    width: bitmap.width,
    height: bitmap.height,
    thumbnail: await canvasToBlob(canvas)
  };
}
