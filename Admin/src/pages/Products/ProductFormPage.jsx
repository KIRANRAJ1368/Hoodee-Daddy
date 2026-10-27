import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  UploadCloud,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Layers,
  ZoomIn,
  Check,
  Sliders,
  Palette
} from "lucide-react";
import { productsApi, categoriesApi, uploadApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { ApiError } from "../../services/api";
import { slugify } from "../../utils/slugify";
import { resolveImageUrl } from "../../utils/imageUrl";
import { formatINR } from "../../utils/formatPrice";
import ImageLightboxModal from "../../components/ImageLightboxModal/ImageLightboxModal";
import FormField from "../../components/FormField/FormField";
import LoadingState from "../../components/LoadingState/LoadingState";
import { getAgePresetsForCategory, isBabiesCategory, BABIES_AGE_PRESETS, KIDS_AGE_PRESETS } from "../../utils/agePresets";
import "./ProductFormPage.css";

function makeColorGroup(overrides = {}, defaultPreset = "2–4 Years") {
  return {
    id: `color-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    hex: "#181715",
    sizes: overrides.sizes || [defaultPreset],
    samePriceAndStock: true,
    shared: { salePrice: "", mrp: "", stock: "0" },
    sizeValues: {},
    imageUrl: "",
    ...overrides
  };
}

const DEFAULT_SPECIFICATIONS = [
  { title: "", value: "" },
  { title: "", value: "" },
  { title: "", value: "" }
];

const BLANK_FORM = {
  name: "",
  slug: "",
  sku: "",
  category_id: "",
  product_type: "",
  description: "",
  color_name: "",
  color_code: "#181715",
  size: "2–4 Years",
  price: "",
  original_price: "",
  stock_count: 0,
  in_stock: true,
  is_best_seller: false,
  is_new_arrival: true,
  is_sale: false,
  badge_label: "",
  badge_type: "",
  is_active: true,
  images: []
};

function broadcastCatalogUpdate() {
  try {
    const channel = new BroadcastChannel("hd_catalog_channel");
    channel.postMessage({ type: "CATALOG_UPDATED", timestamp: Date.now() });
    channel.close();
  } catch {}
  try {
    localStorage.setItem("hd_catalog_updated_at", String(Date.now()));
  } catch {}
}

function isImageFile(file) {
  if (!file) return false;
  if (file.type && (file.type.startsWith("image/") || file.type.includes("jfif") || file.type.includes("jpeg"))) {
    return true;
  }
  return /\.(jfif|jpe?g|png|webp|gif|svg)$/i.test(file.name || "");
}

async function compressImageFile(file, maxDimension = 1600, quality = 0.85) {
  if (!file || !isImageFile(file) || file.size <= 300 * 1024) {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
            } else {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                type: "image/webp",
                lastModified: Date.now()
              });
              resolve(compressedFile);
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const frontFileInputRef = useRef(null);
  const backFileInputRef = useRef(null);
  const thumbnailFileInputRef = useRef(null);

  const [form, setForm] = useState(BLANK_FORM);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  // Dual Primary Views (Front & Back) + Thumbnail Gallery (Up to 10)
  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");
  const [thumbnailImages, setThumbnailImages] = useState([]);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [isUploadingThumbnails, setIsUploadingThumbnails] = useState(false);
  const [isDraggingFront, setIsDraggingFront] = useState(false);
  const [isDraggingBack, setIsDraggingBack] = useState(false);
  const [isDraggingThumbnails, setIsDraggingThumbnails] = useState(false);

  // Dynamic Specifications (Min 3, Max 10)
  const [specifications, setSpecifications] = useState(DEFAULT_SPECIFICATIONS);
  const [colorGroups, setColorGroups] = useState([makeColorGroup()]);
  const [activeColorId, setActiveColorId] = useState(null);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [additionalColorDefinitions, setAdditionalColorDefinitions] = useState([]);
  const [additionalVariants, setAdditionalVariants] = useState([]);

  const [lightboxImg, setLightboxImg] = useState(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  // ── Load Categories for Selection ──
  useEffect(() => {
    categoriesApi
      .list()
      .then(({ data }) => {
        setCategories(data || []);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load categories");
      });
  }, []);

  // ── Load Product Details if in Edit Mode ──
  useEffect(() => {
    if (!isEdit) return;
    setIsLoading(true);
    productsApi
      .getById(id)
      .then((res) => {
        const p = res?.data;
        if (!p) {
          toast.error("Product not found");
          navigate("/products");
          return;
        }

        const loadedImgs = Array.isArray(p.images) ? p.images : [];
        setFrontImage(loadedImgs[0] || "");
        setBackImage(loadedImgs[1] || "");
        setThumbnailImages(loadedImgs.slice(2) || []);

        setForm({
          name: p.name || "",
          slug: p.slug || "",
          sku: p.sku || "",
          category_id: p.categoryId ?? p.category_id ?? "",
          product_type: p.productType || p.product_type || "",
          description: p.description || "",
          price: p.price !== undefined && p.price !== null ? p.price : "",
          original_price: p.originalPrice ?? p.original_price ?? "",
          stock_count: p.stockCount ?? p.stock_count ?? 0,
          in_stock: p.inStock ?? p.in_stock ?? true,
          is_best_seller: p.isBestSeller ?? p.is_best_seller ?? false,
          is_new_arrival: p.isNewArrival ?? p.is_new_arrival ?? false,
          is_sale: p.isSale ?? p.is_sale ?? false,
          badge_label: p.badge || p.badge_label || "",
          badge_type: p.badgeType || p.badge_type || "",
          meta_title: p.metaTitle || p.meta_title || "",
          meta_description: p.metaDescription || p.meta_description || "",
          meta_keywords: p.metaKeywords || p.meta_keywords || "",
          canonical_url: p.canonicalUrl || p.canonical_url || "",
          _categorySlug: p.category || ""
        });

        if (Array.isArray(p.specifications) && p.specifications.length > 0) {
          setSpecifications(
            p.specifications.map((s) => ({
              title: s.title || "",
              value: s.value || ""
            }))
          );
        }

        const matchedCat = categories.find((c) => String(c.id) === String(p.category_id || p.categoryId));
        const defaultPreset = getAgePresetsForCategory(matchedCat)[0];
        const rawSizes = Array.isArray(p.sizes) && p.sizes.length > 0
          ? p.sizes.map((s) => typeof s === "object" && s !== null ? (s.label || s.size || s.name) : String(s)).filter(Boolean)
          : [];
        const primarySizes = rawSizes.length > 0 ? rawSizes : [defaultPreset];

        if (Array.isArray(p.colors) && p.colors.length > 0) {
          const firstColor = p.colors[0];
          setColorGroups([
            makeColorGroup({
              name: firstColor.name || "",
              hex: firstColor.hex || firstColor.hex_code || "#181715",
              sizes: primarySizes,
              shared: {
                salePrice: String(p.price || ""),
                mrp: String(p.originalPrice || p.original_price || ""),
                stock: String(p.stockCount || p.stock_count || "0")
              }
            }, defaultPreset)
          ]);
          setAdditionalColorDefinitions(
            p.colors.slice(1).map((c) => ({ name: c.name, hex: c.hex || c.hex_code }))
          );
        } else {
          setColorGroups([
            makeColorGroup({
              name: "Default",
              hex: "#181715",
              sizes: primarySizes,
              shared: {
                salePrice: String(p.price || ""),
                mrp: String(p.originalPrice || p.original_price || ""),
                stock: String(p.stockCount || p.stock_count || "0")
              }
            }, defaultPreset)
          ]);
        }

        if (Array.isArray(p.variants) && p.variants.length > 0) {
          setAdditionalVariants(p.variants);
        }
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load product details");
        navigate("/products");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, isEdit]);

  // ── Sync Category Slug to ID if Needed ──
  useEffect(() => {
    if (!form._categorySlug || categories.length === 0) return;
    const match = categories.find((c) => c.slug === form._categorySlug);
    if (match) {
      setForm((f) => ({ ...f, category_id: match.id, _categorySlug: undefined }));
    }
  }, [form._categorySlug, categories]);


  function update(field, value) {
    setForm((f) => {
      const nextForm = { ...f, [field]: value };
      return nextForm;
    });

    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function handleNameChange(value) {
    update("name", value);
    if (!slugTouched) update("slug", slugify(value));
  }

  // ── Images Management (Dual Primary + Up to 10 Thumbnails) ──
  async function handleFrontImageUpload(fileList) {
    if (!fileList || fileList.length === 0) return;
    const file = Array.from(fileList).find(isImageFile);
    if (!file) {
      toast.error("Please select a valid image file (JPG, JPEG, JFIF, PNG, or WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`"${file.name}" exceeds 10MB. Please choose an image under 10MB.`);
      return;
    }
    setIsUploadingFront(true);
    try {
      const optimizedFile = await compressImageFile(file);
      const { data } = await uploadApi.upload("products", [optimizedFile]);
      const url = data.files?.[0]?.url;
      if (url) {
        setFrontImage(url);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.frontImage;
          delete next.images;
          return next;
        });
        toast.success("Front View (Primary Cover) uploaded successfully!");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload Front View image. Please try again.");
    } finally {
      setIsUploadingFront(false);
      if (frontFileInputRef.current) frontFileInputRef.current.value = "";
    }
  }

  function handleFrontPhotoDrop(e) {
    e.preventDefault();
    setIsDraggingFront(false);
    if (isUploadingFront) return;
    if (e.dataTransfer.files?.length) {
      handleFrontImageUpload(e.dataTransfer.files);
    }
  }

  async function handleBackImageUpload(fileList) {
    if (!fileList || fileList.length === 0) return;
    const file = Array.from(fileList).find(isImageFile);
    if (!file) {
      toast.error("Please select a valid image file (JPG, JPEG, JFIF, PNG, or WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`"${file.name}" exceeds 10MB. Please choose an image under 10MB.`);
      return;
    }
    setIsUploadingBack(true);
    try {
      const optimizedFile = await compressImageFile(file);
      const { data } = await uploadApi.upload("products", [optimizedFile]);
      const url = data.files?.[0]?.url;
      if (url) {
        setBackImage(url);
        toast.success("Back View (Secondary Angle) uploaded successfully!");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload Back View image. Please try again.");
    } finally {
      setIsUploadingBack(false);
      if (backFileInputRef.current) backFileInputRef.current.value = "";
    }
  }

  function handleBackPhotoDrop(e) {
    e.preventDefault();
    setIsDraggingBack(false);
    if (isUploadingBack) return;
    if (e.dataTransfer.files?.length) {
      handleBackImageUpload(e.dataTransfer.files);
    }
  }

  async function handleThumbnailUpload(fileList) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter(isImageFile);
    if (files.length === 0) {
      toast.error("Please select valid image files (JPG, JPEG, JFIF, PNG, or WEBP).");
      return;
    }
    const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`"${oversized[0].name}" exceeds 10MB. Please choose images under 10MB.`);
      return;
    }
    const maxThumbnails = 10;
    const remainingSlots = maxThumbnails - thumbnailImages.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 10 thumbnails already uploaded.");
      return;
    }
    if (files.length > remainingSlots) {
      toast.error(`You can only add up to ${remainingSlots} more thumbnail(s). Maximum 10 thumbnails allowed.`);
      return;
    }

    setIsUploadingThumbnails(true);
    try {
      const optimizedFiles = await Promise.all(files.map((f) => compressImageFile(f)));
      const { data } = await uploadApi.upload("products", optimizedFiles);
      const newUrls = (data.files || []).map((f) => f.url);
      setThumbnailImages((prev) => [...prev, ...newUrls]);
      toast.success(`${newUrls.length} thumbnail(s) uploaded successfully!`);
    } catch (err) {
      toast.error(err.message || "Failed to upload thumbnails. Please try again.");
    } finally {
      setIsUploadingThumbnails(false);
      if (thumbnailFileInputRef.current) thumbnailFileInputRef.current.value = "";
    }
  }

  function handleThumbnailDrop(e) {
    e.preventDefault();
    setIsDraggingThumbnails(false);
    if (isUploadingThumbnails) return;
    if (e.dataTransfer.files?.length) {
      handleThumbnailUpload(e.dataTransfer.files);
    }
  }

  function removeFrontImage() {
    setFrontImage("");
    toast.delete("Front View Image removed.");
  }

  function removeBackImage() {
    setBackImage("");
    toast.delete("Back View Image removed.");
  }

  function removeThumbnail(idx) {
    setThumbnailImages((prev) => prev.filter((_, i) => i !== idx));
    toast.delete("Thumbnail photo removed.");
  }

  function promoteThumbnailToFront(idx) {
    const selected = thumbnailImages[idx];
    const rest = thumbnailImages.filter((_, i) => i !== idx);
    if (frontImage) {
      setThumbnailImages([frontImage, ...rest]);
    } else {
      setThumbnailImages(rest);
    }
    setFrontImage(selected);
    toast.success("Set as Front View Image!");
  }

  function promoteThumbnailToBack(idx) {
    const selected = thumbnailImages[idx];
    const rest = thumbnailImages.filter((_, i) => i !== idx);
    if (backImage) {
      setThumbnailImages([backImage, ...rest]);
    } else {
      setThumbnailImages(rest);
    }
    setBackImage(selected);
    toast.success("Set as Back View Image!");
  }

  // ── Dynamic Specifications Handlers (Min 3, Max 10) ──
  function handleAddSpecification() {
    if (specifications.length >= 10) {
      toast.error("Maximum 10 specifications allowed");
      return;
    }
    setSpecifications((prev) => [...prev, { title: "", value: "" }]);
  }

  function handleRemoveSpecification(idx) {
    if (specifications.length <= 3) {
      toast.error("At least 3 specifications are required (Minimum 3)");
      return;
    }
    setSpecifications((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSpecificationChange(idx, field, val) {
    setSpecifications((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s))
    );
  }

  const activeColor = colorGroups.find((group) => group.id === activeColorId) || colorGroups[0] || null;
  const variantPreviewRows = useMemo(() => colorGroups.flatMap((group) => group.sizes.map((size) => {
    const values = group.samePriceAndStock ? group.shared : (group.sizeValues[size] || group.shared);
    return {
      groupId: group.id,
      color: group.name,
      colorHex: group.hex,
      size,
      mrp: Number(values?.mrp),
      salePrice: Number(values?.salePrice),
      stock: Number(values?.stock),
      imageUrl: group.imageUrl,
      createdAt: group.sizeValues[size]?.createdAt || null,
      salesCount: Number(group.sizeValues[size]?.salesCount ?? 0)
    };
  })), [colorGroups]);
  const additionalVariantPreviewRows = useMemo(() => {
    const defaultSalePrice = variantPreviewRows[0]?.salePrice ?? Number(form.price);
    const defaultMrp = variantPreviewRows[0]?.mrp ?? Number(form.original_price);
    return additionalVariants.map((variant) => ({
      groupId: `additional-${variant.id || `${variant.color}-${variant.size}`}`,
      color: variant.color || "",
      colorHex: variant.colorHex || "#181715",
      size: variant.size || "Free Size",
      salePrice: Number(variant.priceOverride ?? defaultSalePrice),
      mrp: Number(variant.originalPriceOverride ?? defaultMrp),
      stock: Number(variant.stockCount ?? 0),
      imageUrl: variant.imageUrl || ""
    }));
  }, [additionalVariants, form.original_price, form.price, variantPreviewRows]);
  const allVariantPreviewRows = [...variantPreviewRows, ...additionalVariantPreviewRows];

  const selectedCategory = useMemo(() => {
    return categories.find((c) => String(c.id) === String(form.category_id)) || null;
  }, [categories, form.category_id]);

  const isBabies = useMemo(() => {
    return isBabiesCategory(selectedCategory);
  }, [selectedCategory]);

  const currentAgePresets = useMemo(() => {
    return getAgePresetsForCategory(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryChange = (e) => {
    const nextCatId = e.target.value;
    update("category_id", nextCatId);

    const nextCat = categories.find((c) => String(c.id) === String(nextCatId));
    const nextPresets = getAgePresetsForCategory(nextCat);

    if (!isEdit) {
      setColorGroups((prevGroups) =>
        prevGroups.map((group) => {
          const onlyHasStandardPresets = group.sizes.every((s) =>
            ["Free Size", "XS", "S", "M", "L", "XL", "XXL", "3XL", ...BABIES_AGE_PRESETS, ...KIDS_AGE_PRESETS].includes(s)
          );
          if (group.sizes.length === 0 || onlyHasStandardPresets) {
            const firstPreset = nextPresets[0];
            return {
              ...group,
              sizes: [firstPreset],
              sizeValues: {
                [firstPreset]: group.sizeValues[group.sizes[0]] || group.shared
              }
            };
          }
          return group;
        })
      );
    }
  };

  function patchColorGroup(colorId, patch) {
    setColorGroups((previous) => previous.map((group) => group.id === colorId ? { ...group, ...patch } : group));
  }

  function toggleGroupSize(colorId, size) {
    setColorGroups((previous) => previous.map((group) => {
      if (group.id !== colorId) return group;
      const sizes = group.sizes.includes(size) ? group.sizes.filter((item) => item !== size) : [...group.sizes, size];
      const sizeValues = { ...group.sizeValues };
      if (!group.sizes.includes(size)) {
        sizeValues[size] = { ...group.shared, salesCount: 0, createdAt: null };
      }
      return { ...group, sizes, sizeValues };
    }));
  }

  function addCustomSize() {
    const size = customSizeInput.trim();
    if (!size || !activeColor || activeColor.sizes.some((existing) => existing.toLowerCase() === size.toLowerCase())) return;
    toggleGroupSize(activeColor.id, size);
    setCustomSizeInput("");
  }

  function toggleSamePriceAndStock(group) {
    if (!group) return;
    const nextValue = !group.samePriceAndStock;
    if (nextValue) {
      const first = group.sizeValues[group.sizes[0]] || group.shared;
      patchColorGroup(group.id, { samePriceAndStock: true, shared: { ...first } });
    } else {
      const sizeValues = { ...group.sizeValues };
      group.sizes.forEach((size) => {
        sizeValues[size] = {
          ...group.shared,
          salesCount: group.sizeValues[size]?.salesCount ?? 0,
          createdAt: group.sizeValues[size]?.createdAt || null
        };
      });
      patchColorGroup(group.id, { samePriceAndStock: false, sizeValues });
    }
  }

  function setGroupSharedValue(group, key, value) {
    patchColorGroup(group.id, { shared: { ...group.shared, [key]: value } });
  }

  function setGroupSizeValue(group, size, key, value) {
    patchColorGroup(group.id, {
      sizeValues: { ...group.sizeValues, [size]: { ...(group.sizeValues[size] || group.shared), [key]: value } }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = {};
    if (!form.name?.trim()) validationErrors.name = "Please enter the product name";
    if (!form.slug?.trim()) validationErrors.slug = "Please enter the product URL slug";
    if (!form.category_id) validationErrors.category_id = "Please select a product category";

    const defaultColor = colorGroups[0];
    if (!defaultColor?.name.trim()) validationErrors.variants = "Enter the default product color name.";
    if (!defaultColor?.sizes.length) validationErrors.variants = "Select at least one age option for the default product color.";
    const colorsForSave = [
      { name: defaultColor?.name || "", hex: defaultColor?.hex || "#181715" },
      ...additionalColorDefinitions.map((color) => ({ name: color.name || "", hex: color.hex || "#181715" }))
    ];
    const normalizedNames = colorsForSave.map((color) => color.name.trim().toLowerCase()).filter(Boolean);
    if (new Set(normalizedNames).size !== normalizedNames.length) validationErrors.variants = "Color names must be unique. Check the default color and Variant Management colors.";

    if (!allVariantPreviewRows.length) validationErrors.variants = "Add at least one color and size combination.";
    allVariantPreviewRows.forEach((row) => {
      if (!Number.isFinite(row.salePrice) || row.salePrice <= 0) {
        validationErrors.variants = `Enter a sale price greater than zero for ${row.color} / ${row.size}.`;
      } else if (!Number.isFinite(row.mrp) || row.mrp <= row.salePrice) {
        validationErrors.variants = `MRP for ${row.color} / ${row.size} must be higher than its sale price.`;
      }
      if (!Number.isInteger(row.stock) || row.stock < 0) {
        validationErrors.variants = `Enter a valid stock quantity for ${row.color} / ${row.size}.`;
      }
    });

    if (!frontImage) validationErrors.frontImage = "Please upload the required Front View Image (Primary Cover)";
    const combinedImages = [frontImage, backImage, ...thumbnailImages].filter(Boolean);
    if (combinedImages.length < 1) validationErrors.images = "Please upload at least 1 product image (Front View).";
    else if (combinedImages.length > 12) validationErrors.images = "Maximum 12 images allowed (Front View + Back View + up to 10 thumbnails).";

    if (specifications.length < 3) validationErrors.specifications = "Please provide at least 3 specifications (Minimum 3).";
    else if (specifications.length > 10) validationErrors.specifications = "Maximum 10 specifications allowed.";
    else {
      const emptyIdx = specifications.findIndex((spec) => !spec.title?.trim() || !spec.value?.trim());
      if (emptyIdx !== -1) validationErrors.specifications = `Specification ${emptyIdx + 1} has an empty heading or value. Please fill all fields or remove the row.`;
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      const firstError = validationErrors.name || validationErrors.slug || validationErrors.category_id || validationErrors.variants || validationErrors.frontImage || validationErrors.images || validationErrors.specifications;
      toast.error(firstError || "Please fill in all required fields properly.");
      return;
    }

    setIsSaving(true);
    try {
      const firstVariant = allVariantPreviewRows[0];
      const totalStock = allVariantPreviewRows.reduce((sum, row) => sum + row.stock, 0);
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        price: firstVariant.salePrice,
        original_price: firstVariant.mrp,
        stock_count: totalStock,
        in_stock: totalStock > 0,
        badge_type: form.badge_type || null,
        images: combinedImages,
        specifications: specifications.map((spec) => ({ title: spec.title.trim(), value: spec.value.trim() })),
        colors: colorsForSave,
        sizes: [...new Set([...defaultColor.sizes, ...additionalVariantPreviewRows.map((row) => row.size)])]
      };
      delete payload._categorySlug;
      delete payload.color_name;
      delete payload.color_code;
      delete payload.size;

      const baseVariants = variantPreviewRows.map((row) => ({
        created_at: row.createdAt || undefined,
        color: row.color.trim(),
        colorHex: row.colorHex || "#181715",
        size: row.size,
        stock_count: row.stock,
        sales_count: row.salesCount,
        price_override: row.salePrice,
        original_price_override: row.mrp,
        image_url: frontImage || null,
        gallery_images: [backImage, ...thumbnailImages].filter(Boolean)
      }));
      const preservedVariants = additionalVariants.map((variant) => ({
        created_at: variant.createdAt || variant.created_at || undefined,
        color: variant.color,
        colorHex: variant.colorHex || "#181715",
        size: variant.size || (defaultColor.sizes[0] || "2–4 Years"),
        stock_count: Number(variant.stockCount ?? 0),
        sales_count: Number(variant.salesCount ?? variant.sales_count ?? 0),
        price_override: variant.priceOverride ?? null,
        original_price_override: variant.originalPriceOverride ?? null,
        image_url: frontImage || null,
        gallery_images: [backImage, ...thumbnailImages].filter(Boolean)
      }));
      payload.variants = [...baseVariants, ...preservedVariants];

      if (isEdit) {
        await productsApi.update(id, payload);
        toast.success(`Product "${payload.name}" updated successfully!`);
      } else {
        await productsApi.create(payload);
        toast.success(`Product "${payload.name}" published successfully to your store!`);
      }
      broadcastCatalogUpdate();
      navigate("/products");
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const errObj = Object.fromEntries(err.details.map((d) => [d.field, d.message]));
        setErrors(errObj);
        const firstMsg = err.details[0]?.message || err.details[0]?.msg;
        toast.error(firstMsg || "Please check the form fields and try again.");
      } else {
        toast.error(err.message || "Failed to save product. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }
  if (isLoading) return <LoadingState label="Loading product details..." />;

  return (
    <div className="product-form-page">
      {/* Top Breadcrumb & Header */}
      <div className="product-form-header">
        <Link to="/products" className="product-back-link">
          <ArrowLeft size={16} />
          <span>Back to Products</span>
        </Link>
        <div className="product-form-title-row">
          <div>
            <h1 className="page-title">
              {isEdit ? `Edit Product: ${form.name || form.sku}` : "Add New Product"}
            </h1>
            <p className="page-subtitle">
              {isEdit
                ? `SKU: ${form.sku} • Adjust pricing, photos, and product details`
                : "Create and publish a premium apparel piece to the HooDee Daddy storefront"}
            </p>
          </div>
          {isEdit && (
            <div className="sku-status-pill">
              <code>SKU: {form.sku}</code>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="product-form-layout" noValidate>
        {/* Section 1: General Info */}
        <div className="card form-section-card">
          <div className="section-card-heading">
            <div className="section-icon-wrap">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="section-title">General Product Details</h3>
              <p className="section-sub">Name, unique identifiers, and catalog placement</p>
            </div>
          </div>

          <div className="form-grid">
            <FormField label="Product Title *" htmlFor="p-name" error={errors.name}>
              <input
                id="p-name"
                placeholder="e.g. Heavyweight Minimalist Oversized Hoodie"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </FormField>

          </div>

          <div className="form-grid">
            <FormField label="URL Slug *" htmlFor="p-slug" error={errors.slug} hint="Web address path on storefront">
              <input
                id="p-slug"
                placeholder="heavyweight-minimalist-oversized-hoodie"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update("slug", e.target.value);
                }}
                required
              />
            </FormField>

            <FormField label="Product Type / Silhouette" htmlFor="p-type" hint="e.g. Hoodies, Tees, Cargos, Jackets">
              <input
                id="p-type"
                placeholder="e.g. Hoodies"
                value={form.product_type}
                onChange={(e) => update("product_type", e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Category *" htmlFor="p-category" error={errors.category_id} hint="Assign this product directly to a category">
            <select
              id="p-category"
              value={form.category_id}
              onChange={handleCategoryChange}
              required
            >
              <option value="">Select a category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Product Description" htmlFor="p-desc" hint="Fabric composition, fit, GSM weight, washing care instructions">
            <textarea
              id="p-desc"
              rows={4}
              placeholder="e.g. Cut from 450 GSM French Terry cotton for structure and warmth. Features dropped shoulders, double-layered hood, and ribbed cuffs..."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </FormField>
        </div>

        {/* Product colors and size variants */}
        <div className="card form-section-card">
          <div className="section-card-heading">
            <div className="section-icon-wrap"><Palette size={18} /></div>
            <div>
              <h3 className="section-title">Default Color &amp; Age Options</h3>
              <p className="section-sub">Set up the primary color and age ranges here. Front, back, and gallery images above belong to the whole product.</p>
            </div>
          </div>

          {activeColor && <div className="product-color-variant-editor">
            <div className="form-grid">
              <FormField label="Default color name *" error={errors.variants && !activeColor.name.trim() ? errors.variants : undefined}>
                <input value={activeColor.name} placeholder="e.g. Jet Black" onChange={(e) => patchColorGroup(activeColor.id, { name: e.target.value })} />
              </FormField>
              <FormField label="Color swatch">
                <div className="hex-picker-row">
                  <input type="color" className="color-picker-input" value={activeColor.hex || "#181715"} onChange={(e) => patchColorGroup(activeColor.id, { hex: e.target.value })} />
                  <input value={activeColor.hex || "#181715"} maxLength={7} onChange={(e) => patchColorGroup(activeColor.id, { hex: e.target.value })} />
                </div>
              </FormField>
            </div>

            <div className="form-field-group product-size-picker">
              <div className="size-picker-header-row">
                <label className="field-label-custom">
                  Available Age Options *
                  <span className="field-hint-custom">
                    {isBabies
                      ? "Choose baby age sizes (Months) for this product:"
                      : "Choose kids age sizes (Years) for this product:"}
                  </span>
                </label>
                {selectedCategory && (
                  <span className="category-age-badge">
                    Category: <strong>{selectedCategory.name}</strong> ({isBabies ? "Babies" : "Boys / Girls / Kids"})
                  </span>
                )}
              </div>
              <div className="size-presets-bar">
                {currentAgePresets.map((size) => (
                  <label key={size} className={`size-pill-btn ${activeColor.sizes.includes(size) ? "is-active" : ""}`}>
                    <input type="checkbox" checked={activeColor.sizes.includes(size)} onChange={() => toggleGroupSize(activeColor.id, size)} /> {size}
                  </label>
                ))}
              </div>
              <div className="product-custom-size-row">
                <input
                  value={customSizeInput}
                  placeholder={isBabies ? "Custom age option (e.g. 12–18 Months)" : "Custom age option (e.g. 14–16 Years)"}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }}
                />
                <button type="button" className="btn btn-secondary" onClick={addCustomSize}><Plus size={15} /> Add age option</button>
              </div>
              {!!activeColor.sizes.length && (
                <div className="product-selected-sizes">
                  {activeColor.sizes.map((size) => (
                    <button type="button" key={size} onClick={() => toggleGroupSize(activeColor.id, size)} title="Click to remove">
                      {size} <span>×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="product-same-variant-check">
              <input type="checkbox" checked={activeColor.samePriceAndStock} onChange={() => toggleSamePriceAndStock(activeColor)} />
              <span><strong>All selected age options have the same MRP / Sale / Stock</strong><small>Uncheck to enter separate values for each age option. Values copy across when you switch modes.</small></span>
            </label>

            {activeColor.samePriceAndStock ? (
              <div className="form-grid product-variant-input-grid">
                <FormField label="MRP *"><input type="number" min="0.01" step="0.01" value={activeColor.shared.mrp} onChange={(e) => setGroupSharedValue(activeColor, "mrp", e.target.value)} /></FormField>
                <FormField label="Sale price *"><input type="number" min="0.01" step="0.01" value={activeColor.shared.salePrice} onChange={(e) => setGroupSharedValue(activeColor, "salePrice", e.target.value)} /></FormField>
                <FormField label="Stock quantity *"><input type="number" min="0" step="1" value={activeColor.shared.stock} onChange={(e) => setGroupSharedValue(activeColor, "stock", e.target.value)} /></FormField>
              </div>
            ) : (
              <div className="product-variant-size-rows">
                {activeColor.sizes.map((size) => {
                  const values = activeColor.sizeValues[size] || activeColor.shared;
                  return <div className="product-variant-size-row" key={size}>
                    <strong>{size}</strong>
                    <label>MRP<input type="number" min="0.01" step="0.01" value={values.mrp} onChange={(e) => setGroupSizeValue(activeColor, size, "mrp", e.target.value)} /></label>
                    <label>Sale price<input type="number" min="0.01" step="0.01" value={values.salePrice} onChange={(e) => setGroupSizeValue(activeColor, size, "salePrice", e.target.value)} /></label>
                    <label>Stock<input type="number" min="0" step="1" value={values.stock} onChange={(e) => setGroupSizeValue(activeColor, size, "stock", e.target.value)} /></label>
                  </div>;
                })}
              </div>
            )}
          </div>}

          <div className="product-variant-preview-wrap">
            <div className="product-variant-preview-heading"><h4>Variant preview</h4><span>{allVariantPreviewRows.length} variants · {allVariantPreviewRows.reduce((sum, row) => sum + (Number.isFinite(row.stock) ? row.stock : 0), 0)} total stock</span></div>
            <div className="table-responsive"><table className="product-variant-preview-table">
              <thead><tr><th>Color</th><th>Age / Size</th><th>MRP</th><th>Sale price</th><th>Discount</th><th>Stock</th></tr></thead>
              <tbody>{allVariantPreviewRows.map((row, index) => {
                const discount = row.mrp > row.salePrice ? Math.round(((row.mrp - row.salePrice) / row.mrp) * 100) : 0;
                return <tr key={`${row.groupId}-${row.size}-${index}`}><td><span className="preview-color-dot" style={{ backgroundColor: row.colorHex }} />{row.color || "Color name required"}</td><td>{row.size}</td><td>{Number.isFinite(row.mrp) && row.mrp > 0 ? formatINR(row.mrp) : "—"}</td><td>{Number.isFinite(row.salePrice) && row.salePrice > 0 ? formatINR(row.salePrice) : "—"}</td><td>{discount}%</td><td>{Number.isFinite(row.stock) ? row.stock : "—"}</td></tr>;
              })}</tbody>
            </table></div>
            {errors.variants && <div className="field-error-text" style={{ marginTop: 10 }}>{errors.variants}</div>}
          </div>

        </div>
        {/* Section 3: Merchandising & Badges */}
        <div className="card form-section-card">
          <div className="section-card-heading">
            <div className="section-icon-wrap">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="section-title">Storefront Merchandising &amp; Highlights</h3>
              <p className="section-sub">Feature this product in home carousels, drop sections, and sale categories</p>
            </div>
          </div>

          <div className="merchandising-banner">
            <label className="checkbox-row">
              <input
                id="p-bestseller"
                type="checkbox"
                checked={form.is_best_seller}
                onChange={(e) => update("is_best_seller", e.target.checked)}
              />
              <span>Feature in <strong>Best Sellers</strong> Collection</span>
            </label>

            <label className="checkbox-row">
              <input
                id="p-newarrival"
                type="checkbox"
                checked={form.is_new_arrival}
                onChange={(e) => update("is_new_arrival", e.target.checked)}
              />
              <span>Feature in <strong>New Arrivals</strong> Drop</span>
            </label>

            <label className="checkbox-row">
              <input
                id="p-sale"
                type="checkbox"
                checked={form.is_sale}
                onChange={(e) => update("is_sale", e.target.checked)}
              />
              <span>Mark as <strong>On Sale</strong></span>
            </label>
          </div>

          <div className="form-grid">
            <FormField label="Custom Badge Text" htmlFor="p-badge" hint="e.g. 450 GSM HEAVYWEIGHT, LIMITED DROP">
              <input
                id="p-badge"
                placeholder="e.g. HEAVYWEIGHT EDITION"
                value={form.badge_label}
                onChange={(e) => update("badge_label", e.target.value)}
              />
            </FormField>

            <FormField label="Badge Color Accent" htmlFor="p-badge-type">
              <select
                id="p-badge-type"
                value={form.badge_type}
                onChange={(e) => update("badge_type", e.target.value)}
              >
                <option value="">None (Standard Monochrome)</option>
                <option value="hot">Hot (Amber Gold)</option>
                <option value="new">New Drop (Emerald Green)</option>
                <option value="sale">Sale / Discount (Crimson Red)</option>
              </select>
            </FormField>
          </div>

          <div className="checkbox-row" style={{ marginTop: 6 }}>
            <input
              id="p-active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update("is_active", e.target.checked)}
            />
            <label htmlFor="p-active">
              <strong>Active Product (Live on HooDee Daddy Storefront)</strong>
            </label>
          </div>

          <div className="variants-notice-banner">
            <div className="variants-notice-icon">+</div>
            <div className="variants-notice-text">
              <strong>Need another color?</strong>
              <p>Save this product first, then add each color / size combination in <Link to={isEdit ? `/variants?productId=${id}` : "/variants"} className="notice-link">Variant Management</Link>. Its front, back, and gallery images will reuse this product's images.</p>
            </div>
          </div>
        </div>

        {/* ── Section 5: Photography Showcase (Dual Primary Views + Thumbnail Gallery) ── */}
        <div className="card form-section-card">
          <div className="section-card-heading">
            <div className="section-icon-wrap">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="section-title">Product Photography Showcase</h3>
              <p className="section-sub">Dual primary angles (Front View &amp; Back View) plus up to 10 thumbnail gallery images</p>
            </div>
          </div>

          {/* 5A: Dual Primary Views — Front View + Back View side by side */}
          <div className="primary-views-dual-grid">
            {/* Front View Card (Compulsory) */}
            <div className={`product-image-card ${errors.frontImage || errors.images ? "has-image-error" : ""}`}>
              <div className="product-image-card-header">
                <div>
                  <h4 className="photo-title">
                    Front View <span className="required-asterisk">* (Primary Cover)</span>
                  </h4>
                  <p className="photo-tag-sub">Main storefront image shown on cards &amp; detail pages.</p>
                </div>
                {frontImage && (
                  <span className="badge-primary-cover photo-role-badge front">★ Front View</span>
                )}
              </div>

              {frontImage ? (
                <div className="main-image-preview-block">
                  <div
                    className="main-image-frame"
                    onClick={() => setLightboxImg(resolveImageUrl(frontImage))}
                    title="Click to view full image"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setLightboxImg(resolveImageUrl(frontImage))}
                  >
                    <img
                      src={resolveImageUrl(frontImage)}
                      alt="Front View Preview"
                      className="main-image-img"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fb = e.currentTarget.parentElement.querySelector(".main-image-fallback");
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                    <div className="main-image-fallback" style={{ display: "none" }}>
                      <ImageIcon size={32} />
                      <span>Preview Unavailable</span>
                    </div>
                    <div className="image-hover-zoom-overlay">
                      <ZoomIn size={20} />
                      <span>View Larger</span>
                    </div>
                  </div>
                  <div className="main-image-toolbar">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => frontFileInputRef.current?.click()}
                      disabled={isUploadingFront}
                    >
                      <UploadCloud size={14} />
                      <span>{isUploadingFront ? "Uploading..." : "Change Image"}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-delete-img"
                      onClick={removeFrontImage}
                      title="Remove front image"
                    >
                      <Trash2 size={15} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`main-image-upload-box ${isDraggingFront ? "is-dragging" : ""} ${isUploadingFront ? "is-uploading" : ""}`}
                  onClick={() => !isUploadingFront && frontFileInputRef.current?.click()}
                  onDrop={handleFrontPhotoDrop}
                  onDragOver={(e) => { e.preventDefault(); if (!isDraggingFront) setIsDraggingFront(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingFront(false); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && !isUploadingFront && frontFileInputRef.current?.click()}
                >
                  <div className="main-upload-arrow-wrap">
                    <span className="main-upload-arrow">↑</span>
                  </div>
                  <strong className="main-upload-title">
                    {isUploadingFront ? "Uploading Front View..." : "Upload Front View Image"}
                  </strong>
                  <p className="main-upload-sub">PNG, JPG, JFIF or WEBP up to 10MB</p>
                  <span className="main-compulsory-tag">Required — Primary Cover</span>
                </div>
              )}

              <input
                ref={frontFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/jfif,image/pjpeg,.jfif,.jpg,.jpeg,.png,.webp"
                hidden
                onChange={(e) => handleFrontImageUpload(e.target.files)}
                disabled={isUploadingFront}
              />
              {errors.frontImage && (
                <div className="field-error-text" style={{ marginTop: 8 }}>{errors.frontImage}</div>
              )}
            </div>

            {/* Back View Card (Optional) */}
            <div className="product-image-card">
              <div className="product-image-card-header">
                <div>
                  <h4 className="photo-title">Back View <span style={{ color: "var(--color-grey-500)", fontWeight: 400 }}>(Optional)</span></h4>
                  <p className="photo-tag-sub">Shows the reverse side of the apparel piece.</p>
                </div>
                {backImage && (
                  <span className="badge-primary-cover photo-role-badge back">Back View</span>
                )}
              </div>

              {backImage ? (
                <div className="main-image-preview-block">
                  <div
                    className="main-image-frame"
                    onClick={() => setLightboxImg(resolveImageUrl(backImage))}
                    title="Click to view full image"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setLightboxImg(resolveImageUrl(backImage))}
                  >
                    <img
                      src={resolveImageUrl(backImage)}
                      alt="Back View Preview"
                      className="main-image-img"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fb = e.currentTarget.parentElement.querySelector(".main-image-fallback");
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                    <div className="main-image-fallback" style={{ display: "none" }}>
                      <ImageIcon size={32} />
                      <span>Preview Unavailable</span>
                    </div>
                    <div className="image-hover-zoom-overlay">
                      <ZoomIn size={20} />
                      <span>View Larger</span>
                    </div>
                  </div>
                  <div className="main-image-toolbar">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => backFileInputRef.current?.click()}
                      disabled={isUploadingBack}
                    >
                      <UploadCloud size={14} />
                      <span>{isUploadingBack ? "Uploading..." : "Change Image"}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-delete-img"
                      onClick={removeBackImage}
                      title="Remove back image"
                    >
                      <Trash2 size={15} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`main-image-upload-box ${isDraggingBack ? "is-dragging" : ""} ${isUploadingBack ? "is-uploading" : ""}`}
                  onClick={() => !isUploadingBack && backFileInputRef.current?.click()}
                  onDrop={handleBackPhotoDrop}
                  onDragOver={(e) => { e.preventDefault(); if (!isDraggingBack) setIsDraggingBack(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingBack(false); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && !isUploadingBack && backFileInputRef.current?.click()}
                >
                  <div className="main-upload-arrow-wrap">
                    <span className="main-upload-arrow">↑</span>
                  </div>
                  <strong className="main-upload-title">
                    {isUploadingBack ? "Uploading Back View..." : "Upload Back View Image"}
                  </strong>
                  <p className="main-upload-sub">PNG, JPG, JFIF or WEBP up to 10MB</p>
                  <span className="main-compulsory-tag" style={{ background: "rgba(107,114,128,0.12)", color: "var(--color-grey-600)" }}>Optional — Secondary Angle</span>
                </div>
              )}

              <input
                ref={backFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/jfif,image/pjpeg,.jfif,.jpg,.jpeg,.png,.webp"
                hidden
                onChange={(e) => handleBackImageUpload(e.target.files)}
                disabled={isUploadingBack}
              />
            </div>
          </div>

          {/* 5B: Thumbnail Gallery Block (Up to 10 Optional) */}
          <div className="thumbnail-gallery-block">
            <div className="thumbnail-gallery-header">
              <div>
                <h4 className="photo-title">Thumbnail &amp; Gallery Images</h4>
                <p className="photo-tag-sub">Upload close-up shots, fabric textures, or detail views (Fully Optional)</p>
              </div>
              <span className="thumbnail-counter-pill">
                {thumbnailImages.length} / 10 (Optional)
              </span>
            </div>

            {/* Upload Drop Zone */}
            {thumbnailImages.length < 10 && (
              <div
                className={`main-image-upload-box ${isDraggingThumbnails ? "is-dragging" : ""} ${isUploadingThumbnails ? "is-uploading" : ""}`}
                style={{ minHeight: 90, marginBottom: 16 }}
                onClick={() => !isUploadingThumbnails && thumbnailFileInputRef.current?.click()}
                onDrop={handleThumbnailDrop}
                onDragOver={(e) => { e.preventDefault(); if (!isDraggingThumbnails) setIsDraggingThumbnails(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingThumbnails(false); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && !isUploadingThumbnails && thumbnailFileInputRef.current?.click()}
              >
                <div className="main-upload-arrow-wrap">
                  <span className="main-upload-arrow">↑</span>
                </div>
                <strong className="main-upload-title">
                  {isUploadingThumbnails ? "Uploading Thumbnails..." : "Upload Thumbnail Images"}
                </strong>
                <p className="main-upload-sub">Click or drag &amp; drop — Multiple files supported — Max 10 thumbnails</p>
              </div>
            )}

            <input
              ref={thumbnailFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/jfif,image/pjpeg,.jfif,.jpg,.jpeg,.png,.webp"
              multiple
              hidden
              onChange={(e) => handleThumbnailUpload(e.target.files)}
              disabled={isUploadingThumbnails || thumbnailImages.length >= 10}
            />

            {/* Thumbnail Grid */}
            {thumbnailImages.length > 0 && (
              <div className="gallery-tiles-layout">
                {thumbnailImages.map((url, idx) => {
                  const resolved = resolveImageUrl(url);
                  return (
                    <div key={idx} className="gallery-thumb-tile">
                      <div
                        className="gallery-thumb-media"
                        onClick={() => setLightboxImg(resolved)}
                        title="Click to view larger image"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && setLightboxImg(resolved)}
                      >
                        <img
                          src={resolved}
                          alt={`Thumbnail ${idx + 1}`}
                          className="gallery-thumb-img"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fb = e.currentTarget.parentElement.querySelector(".gallery-thumb-fallback");
                            if (fb) fb.style.display = "flex";
                          }}
                        />
                        <div className="gallery-thumb-fallback" style={{ display: "none" }}>
                          <ImageIcon size={20} />
                        </div>
                        <div className="image-hover-zoom-overlay">
                          <ZoomIn size={16} />
                        </div>
                        <span className="gallery-thumb-num">{idx + 1}</span>
                      </div>
                      <div className="gallery-thumb-bar">
                        <button
                          type="button"
                          className="btn-set-main"
                          onClick={() => promoteThumbnailToFront(idx)}
                          title="Set as Front View"
                        >
                          ★ Front
                        </button>
                        <button
                          type="button"
                          className="btn-set-main"
                          style={{ background: "rgba(75,85,99,0.12)", color: "var(--color-grey-700)" }}
                          onClick={() => promoteThumbnailToBack(idx)}
                          title="Set as Back View"
                        >
                          ↩ Back
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-delete-img"
                          onClick={() => removeThumbnail(idx)}
                          title="Remove thumbnail"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {thumbnailImages.length === 0 && (
              <div className="gallery-rule-alert" style={{ background: "rgba(107,114,128,0.07)", borderColor: "rgba(107,114,128,0.2)", color: "var(--color-grey-600)" }}>
                <span>ℹ️ No thumbnail images added yet. These are fully optional — you can add up to 10 extra gallery shots.</span>
              </div>
            )}

            {errors.images && (
              <div className="field-error-text" style={{ marginTop: 8 }}>{errors.images}</div>
            )}
          </div>
        </div>

        {/* ── Section 6: Dynamic Product Specifications (Min 3, Max 10) ── */}
        <div className="card form-section-card">
          <div className="section-card-heading" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="section-icon-wrap">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="section-title">Product Details &amp; Specifications</h3>
                <p className="section-sub">Min 3 required • Max 10 allowed (Displayed in luxury 2-column table on storefront)</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="spec-count-pill">{specifications.length} / 10 (Min 3)</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddSpecification}
                disabled={specifications.length >= 10}
                title="Add a new specification row"
              >
                <Plus size={14} />
                <span>Add Specification</span>
              </button>
            </div>
          </div>

          <div className="specifications-list">
            {specifications.map((spec, idx) => (
              <div key={idx} className="specification-row">
                <span className="spec-row-num">{idx + 1}</span>
                <div className="spec-field-group">
                  <label className="spec-field-label">Heading</label>
                  <input
                    type="text"
                    className="spec-input"
                    placeholder="e.g. SILHOUETTE"
                    value={spec.title}
                    onChange={(e) => handleSpecificationChange(idx, "title", e.target.value)}
                    maxLength={60}
                  />
                </div>
                <div className="spec-field-group val">
                  <label className="spec-field-label">Value</label>
                  <input
                    type="text"
                    className="spec-input"
                    placeholder="e.g. 240 GSM Pure Combed Cotton"
                    value={spec.value}
                    onChange={(e) => handleSpecificationChange(idx, "value", e.target.value)}
                    maxLength={120}
                  />
                </div>
                <button
                  type="button"
                  className="btn-trash-spec"
                  onClick={() => handleRemoveSpecification(idx)}
                  disabled={specifications.length <= 3}
                  title={specifications.length <= 3 ? "Minimum 3 specifications required" : "Remove this specification"}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {errors.specifications && (
            <div className="field-error-text" style={{ marginTop: 8 }}>{errors.specifications}</div>
          )}
        </div>



        {lightboxImg && (
          <ImageLightboxModal
            src={lightboxImg}
            alt="Product Photo Preview"
            onClose={() => setLightboxImg(null)}
          />
        )}

        {/* Sticky Footer */}
        <div className="product-form-sticky-footer">
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/products")}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent btn-lg" disabled={isSaving}>
            {isSaving ? (
              <span>Saving Product...</span>
            ) : isEdit ? (
              <>
                <Check size={18} />
                <span>Save Product Changes</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>Publish Product to Store</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
