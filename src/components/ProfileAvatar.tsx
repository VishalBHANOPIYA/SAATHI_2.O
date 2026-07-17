import { useState } from 'react';
import { Camera, X, Trash2 } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatarGenerator';
import ImagePickerModal from './ImagePickerModal';

interface ProfileAvatarProps {
  userProfile: any;
  size?: number;          // px, default 40
  editable?: boolean;     // show edit button
  onPhotoChange?: (dataUrl: string | null) => void;
  className?: string;
}

export default function ProfileAvatar({
  userProfile,
  size = 40,
  editable = false,
  onPhotoChange,
  className = '',
}: ProfileAvatarProps) {

  const [showPicker, setShowPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const avatarUrl = getAvatarUrl(userProfile, size);

  const handleImageSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      // Resize to max 300x300 to save space
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 300;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = (h / w) * maxSize;
            w = maxSize;
          } else {
            w = (w / h) * maxSize;
            h = maxSize;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        // Compress to JPEG 80% quality
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        onPhotoChange?.(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    setShowPicker(false);
  };

  const handleRemovePhoto = () => {
    onPhotoChange?.(null);
    setShowOptions(false);
  };

  return (
    <>
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        {/* Avatar image */}
        <div
          className="rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer"
          style={{ width: size, height: size }}
          onClick={() => editable && setShowOptions(true)}
        >
          <img
            src={avatarUrl}
            alt={userProfile?.name || 'User'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = getAvatarUrl(
                { ...userProfile, profilePhotoUrl: null },
                size
              );
            }}
          />
        </div>

        {/* Edit badge (only if editable) */}
        {editable && (
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm cursor-pointer"
            onClick={() => setShowOptions(true)}
          >
            <Camera className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Options modal — remove or change */}
      {showOptions && editable && (
        <div
          className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
          onClick={() => setShowOptions(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 pb-8 space-y-3 z-10"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto md:hidden" />

            {/* Preview */}
            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-violet-100 shadow-lg">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-base">
                  {userProfile?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {userProfile?.gender || 'Not set'}
                  {userProfile?.age ? ` • ${userProfile.age}y` : ''}
                </p>
              </div>
            </div>

            {/* Options */}
            <button
              onClick={() => {
                setShowOptions(false);
                setTimeout(() => setShowPicker(true), 100);
              }}
              className="w-full flex items-center gap-4 p-4 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-2xl transition-all active:scale-[0.98] text-left"
            >
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Change Profile Photo
                </p>
                <p className="text-xs text-gray-500">
                  Upload from gallery or take a new photo
                </p>
              </div>
            </button>

            {/* Remove photo (only if custom photo exists) */}
            {userProfile?.profilePhotoUrl && (
              <button
                onClick={handleRemovePhoto}
                className="w-full flex items-center gap-4 p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl transition-all active:scale-[0.98] text-left"
              >
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-red-600">
                    Remove Photo
                  </p>
                  <p className="text-xs text-gray-500">
                    Use gender avatar instead
                  </p>
                </div>
              </button>
            )}

            <button
              onClick={() => setShowOptions(false)}
              className="w-full p-4 text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image picker modal */}
      <ImagePickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onImageSelected={handleImageSelected}
        title="Profile Photo"
        subtitle="Upload a photo or take a selfie"
        accept="image/*"
      />
    </>
  );
}
