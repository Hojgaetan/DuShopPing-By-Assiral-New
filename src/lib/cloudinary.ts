/**
 * Service d'upload Cloudinary (Unsigned Upload depuis le navigateur)
 * 
 * Utilise l'API REST Cloudinary pour uploader des images directement
 * depuis le client sans nécessiter de serveur backend.
 * Le upload preset doit être configuré comme "unsigned" dans le dashboard Cloudinary.
 */

const CLOUD_NAME = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload une image sur Cloudinary via unsigned upload.
 * 
 * @param file - Le fichier image à uploader (File object du navigateur)
 * @param folder - Dossier optionnel de destination sur Cloudinary (ex: "boutiques", "produits")
 * @returns L'URL sécurisée de l'image uploadée et ses métadonnées
 * @throws Error si l'upload échoue
 */
export async function uploadToCloudinary(
  file: File,
  folder?: string
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Configuration Cloudinary manquante. Vérifiez les variables VITE_CLOUDINARY_CLOUD_NAME et VITE_CLOUDINARY_UPLOAD_PRESET dans votre fichier .env'
    );
  }

  // Validation côté client
  const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
  if (file.size > MAX_SIZE) {
    throw new Error('Le fichier est trop volumineux. La taille maximale est de 5 Mo.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format de fichier non supporté. Utilisez JPG, PNG, WEBP ou GIF.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  if (folder) {
    formData.append('folder', folder);
  }

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Erreur HTTP ${response.status}`;
      throw new Error(`Échec de l'upload Cloudinary: ${errorMsg}`);
    }

    const data = await response.json();

    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Une erreur inattendue est survenue lors de l\'upload de l\'image.');
  }
}
