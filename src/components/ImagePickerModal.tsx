import { useRef } from 'react';
import { Upload, Camera, X } from 'lucide-react';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (file: File) => void;
  title?: string;
  subtitle?: string;
  // What kind of image is expected (for accept attribute)
  accept?: string; // default "image/*"
}

export default function ImagePickerModal({
  isOpen,
  onClose,
  onImageSelected,
  title = "Add Image",
  subtitle = "Choose how to add your image",
  accept = "image/*",
}: ImagePickerModalProps) {

  // TWO separate hidden inputs:
  // 1. Gallery/Files — NO capture attribute
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 2. Camera — WITH capture="environment"
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
      onClose();
    }
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden gallery input — NO capture */}
      <input
        ref={galleryInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Hidden camera input — WITH capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Bottom sheet modal */}
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center md:items-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Panel */}
        <div
          className="relative bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 pb-8 space-y-4 shadow-2xl z-10 animate-slideUp"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle bar (mobile) */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto md:hidden" />

          {/* Title */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">
              {title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          </div>

          {/* THREE OPTIONS */}
          <div className="space-y-3 pt-2">

            {/* Option 1: Upload from Gallery */}
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-2xl transition-all active:scale-[0.98] text-left group"
            >
              <div className="w-12 h-12 bg-violet-100 group-hover:bg-violet-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                <Upload className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  Upload from Gallery
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Choose a photo from your phone gallery or files
                </div>
              </div>
            </button>

            {/* Option 2: Take Photo */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl transition-all active:scale-[0.98] text-left group"
            >
              <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  Take a Photo
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Open camera and capture a new photo
                </div>
              </div>
            </button>

            {/* Option 3: Cancel */}
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all active:scale-[0.98] text-gray-500 font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
