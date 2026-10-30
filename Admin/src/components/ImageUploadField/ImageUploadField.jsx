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
  required = false,
  dimensionRule = null
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const [dimensionError, setDimensionError] = useState("");
  const fileInputRef = useRef(null);
  const toast = useToast();

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    setDimensionError("");
    const file = files[0];
    const isImage = (file.type && (file.type.startsWith("image/") || file.type.includes("jfif") || file.type.includes("jpeg"))) ||
      /\.(jfif|jpe?g|png|webp|gif|svg)$/i.test(file.name || "");
    if (!isImage) {
      toast.error("Please select a valid image file (JPG, JPEG, JFIF, PNG, WEBP, or GIF).");
      return;
    }

    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image under ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Dimension Rule Validation (Enforce exact/recommended banner dimensions)
    if (dimensionRule) {
      try {
        const dimensions = await new Promise((resolve, reject) => {
          const img = new Image();
          const tempUrl = URL.createObjectURL(file);
          img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            URL.revokeObjectURL(tempUrl);
            resolve({ width: w, height: h });
          };
          img.onerror = () => {
            URL.revokeObjectURL(tempUrl);
            reject(new Error("Unable to read image dimensions"));
          };
          img.src = tempUrl;
        });

        const { width, height } = dimensions;
        const ratio = width / (height || 1);

        let violation = "";
        if (dimensionRule.exactWidth && dimensionRule.exactHeight) {
          if (width !== dimensionRule.exactWidth || height !== dimensionRule.exactHeight) {
            violation = `Image size must be exactly ${dimensionRule.exactWidth} × ${dimensionRule.exactHeight}px. (Your image is ${width} × ${height}px).`;
          }
        } else {
          if (dimensionRule.minWidth && width < dimensionRule.minWidth) {
            violation = `Image width must be at least ${dimensionRule.minWidth}px. (Your image is ${width}px wide).`;
          } else if (dimensionRule.minHeight && height < dimensionRule.minHeight) {
            violation = `Image height must be at least ${dimensionRule.minHeight}px. (Your image is ${height}px high).`;
          } else if (dimensionRule.minRatio && ratio < dimensionRule.minRatio) {
            violation = `Image is too tall for this banner (aspect ratio is ${ratio.toFixed(2)}:1, expected at least ${dimensionRule.minRatio.toFixed(2)}:1). Required size: ${dimensionRule.label || "Landscape banner"} (Your image is ${width} × ${height}px).`;
          } else if (dimensionRule.maxRatio && ratio > dimensionRule.maxRatio) {
            violation = `Image is too wide for this banner (aspect ratio is ${ratio.toFixed(2)}:1, expected at most ${dimensionRule.maxRatio.toFixed(2)}:1). Required size: ${dimensionRule.label || "Banner"} (Your image is ${width} × ${height}px).`;
          }
        }

        if (violation) {
          setDimensionError(violation);
          toast.error(violation);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      } catch (e) {
        toast.error("Failed to inspect image dimensions. Please try another image.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
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
        accept="image/jpeg,image/png,image/webp,image/gif,image/jfif,image/pjpeg,.jfif,.jpg,.jpeg,.png,.webp,.gif"
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
            <p>Supported formats: JPG, JFIF, PNG, WEBP, GIF (Max 10MB per image)</p>
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

      {dimensionRule?.label && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: "12px", color: "#64748b" }}>
          <span style={{ fontWeight: 600, color: "#091525" }}>Required Banner Size:</span>
          <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontWeight: 700, color: "#ff7300", border: "1px solid #e2e8f0" }}>
            {dimensionRule.label}
          </span>
        </div>
      )}
      {hint && <span className="image-upload-hint">{hint}</span>}
      {dimensionError && (
        <span className="image-upload-error" style={{ display: "block", marginTop: 4, color: "#dc2626", fontWeight: 600 }}>
          ⚠️ {dimensionError}
        </span>
      )}
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
