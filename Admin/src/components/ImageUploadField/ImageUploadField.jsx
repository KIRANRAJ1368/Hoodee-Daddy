import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, ZoomIn, CheckCircle2 } from "lucide-react";
import { uploadApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { resolveImageUrl } from "../../utils/imageUrl";
import ImageLightboxModal from "../ImageLightboxModal/ImageLightboxModal";
import "./ImageUploadField.css";

export default function ImageUploadField({
  value,
  onChange,
  folder = "products",
  label = "Upload Image",
  hint,
  aspectRatio = "4/5",
  previewHeight = 160,
  error,
  required = false
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WEBP, or GIF).");
      return;
    }

    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image under ${MAX_SIZE_MB}MB.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setIsUploading(true);
    try {
      const res = await uploadApi.upload(folder, [file]);
      const uploadedUrl = res?.data?.files?.[0]?.url || res?.files?.[0]?.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
        setLocalPreview(null);
        toast.success("Image uploaded successfully! Preview is ready.");
      } else {
        throw new Error("No image URL returned from upload server");
      }
    } catch (err) {
      setLocalPreview(null);
      toast.error(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  const displayUrl = localPreview || value;
  const resolvedUrl = localPreview || resolveImageUrl(value);

  return (
    <div className={`image-upload-field-group ${error ? "has-error" : ""}`}>
      {label && (
        <div className="image-upload-label-row">
          <label className="image-upload-label">
            {label} {required && <span className="req-star">*</span>}
          </label>
          {displayUrl && (
            <span className="image-upload-status-pill">
              <CheckCircle2 size={12} />
              <span>{isUploading ? "Uploading..." : "Image Attached"}</span>
            </span>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={isUploading}
      />

      {displayUrl ? (
        /* Preview Card */
        <div className="image-preview-card">
          <div
            className="image-preview-thumb-wrap"
            onClick={() => setShowLightbox(true)}
            title="Click to view larger image"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setShowLightbox(true)}
          >
            <img
              src={resolvedUrl}
              alt={label}
              className="image-preview-thumb-img"
              style={{ maxHeight: previewHeight }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.parentElement.querySelector(".image-preview-fallback");
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div className="image-preview-fallback" style={{ display: "none" }}>
              <ImageIcon size={28} />
              <span>Preview Unavailable</span>
            </div>
            <div className="image-preview-hover-overlay">
              <ZoomIn size={18} />
              <span>Click to Enlarge</span>
            </div>
          </div>

          <div className="image-preview-info-col">
            <div className="image-preview-heading">
              <span className="image-preview-success-dot" />
              <strong>{isUploading ? "Uploading photo to server..." : "Image attached successfully"}</strong>
            </div>
            <p className="image-preview-sub">
              Your photo is uploaded and ready. Click the thumbnail to enlarge, or click Replace to change.
            </p>

            <div className="image-preview-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Select another image from your device"
              >
                <RefreshCw size={14} className={isUploading ? "spin" : ""} />
                <span>{isUploading ? "Uploading..." : "Replace Image"}</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-delete-img-action"
                onClick={() => {
                  setLocalPreview(null);
                  onChange("");
                  toast.delete("Image removed.");
                }}
                disabled={isUploading}
                title="Remove this image"
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone / Upload Box */
        <div
          className={`image-upload-dropzone ${isDragging ? "is-dragging" : ""} ${isUploading ? "is-uploading" : ""}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && !isUploading && fileInputRef.current?.click()}
        >
          <div className="upload-dropzone-icon">
            <UploadCloud size={28} className={isUploading ? "bounce-anim" : ""} />
          </div>
          <div className="upload-dropzone-text">
            <strong>{isUploading ? "Uploading image, please wait..." : "Click to select or drag & drop photo"}</strong>
            <p>Supported formats: JPG, PNG, WEBP, GIF (Max 10MB per image)</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm upload-dropzone-btn"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
          >
            <UploadCloud size={14} />
            <span>{isUploading ? "Uploading..." : "Browse Device Files"}</span>
          </button>
        </div>
      )}

      {hint && <span className="image-upload-hint">{hint}</span>}
      {error && <span className="image-upload-error">{error}</span>}

      {/* Clickable Lightbox */}
      {showLightbox && (
        <ImageLightboxModal
          src={resolvedUrl}
          alt={label}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
}
