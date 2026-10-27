export const VISITOR_STORAGE_KEY = "hd_visitor_details";

export function readVisitorDetails() {
  try {
    const details = JSON.parse(window.localStorage.getItem(VISITOR_STORAGE_KEY) || "null");
    return details && /^[6-9]\d{9}$/.test(details.phone) && /^[1-9]\d{5}$/.test(details.pincode) ? details : null;
  } catch {
    return null;
  }
}

export function saveVisitorDetails(details) {
  try {
    window.localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(details));
    window.dispatchEvent(new Event("hd:visitor-updated"));
    return true;
  } catch {
    // A successful server submission still allows the current visit when
    // browser privacy settings prevent persistent storage.
    return false;
  }
}

export function hasDeliveryAddress(details) {
  return Boolean(details?.fullName?.trim() && details?.address?.trim() &&
    details?.city?.trim() && details?.state?.trim() && /^[1-9]\d{5}$/.test(details?.pincode));
}

export function checkoutVisitorFields(details = readVisitorDetails()) {
  return {
    fullName: details?.fullName || "", address: details?.address || "",
    apartment: details?.apartment || "", city: details?.city || details?.district || "",
    state: details?.state || "", postalCode: details?.pincode || "",
    phone: details?.phone || ""
  };
}
