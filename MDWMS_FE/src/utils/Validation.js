/**
 * Category validation utilities
 * Tái sử dụng logic validation cho category trong CreateCategory và UpdateCategory
 */

// Regex để kiểm tra tên phân loại hợp lệ (chữ cái, số, khoảng trắng, ký tự tiếng Việt)
const VALID_NAME_REGEX = /^[a-zA-Z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]+$/

/**
 * Validate category name
 * @param {string} categoryName - Tên phân loại cần validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateCategoryName = (categoryName) => {
  const trimmedName = categoryName.trim()

  // Kiểm tra độ dài tối thiểu
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: "Tên phân loại phải có ít nhất 2 ký tự"
    }
  }

  // Kiểm tra ký tự hợp lệ
  if (!VALID_NAME_REGEX.test(trimmedName)) {
    return {
      isValid: false,
      message: "Tên phân loại chỉ được chứa chữ cái, số và khoảng trắng"
    }
  }

  return {
    isValid: true,
    message: ""
  }
}

/**
 * Validate category form data
 * @param {Object} formData - Dữ liệu form cần validate
 * @param {string} formData.categoryName - Tên phân loại
 * @param {string} formData.description - Mô tả
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateCategoryForm = (formData) => {
  // Kiểm tra trường bắt buộc (chỉ tên phân loại)
  if (!formData.categoryName?.trim()) {
    return {
      isValid: false,
      message: "Tên phân loại là bắt buộc"
    }
  }

  // Validate tên phân loại
  const nameValidation = validateCategoryName(formData.categoryName)
  if (!nameValidation.isValid) {
    return nameValidation
  }

  return {
    isValid: true,
    message: ""
  }
}

/**
 * Validate unit measure form data
 * @param {Object} formData - Dữ liệu form cần validate
 * @param {string} formData.name - Tên đơn vị đo
 * @param {string} formData.description - Mô tả
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateUnitMeasureForm = (formData) => {
  // Kiểm tra các trường bắt buộc
  if (!formData.name?.trim() || !formData.description?.trim()) {
    return {
      isValid: false,
      message: "Vui lòng điền đầy đủ thông tin"
    }
  }

  // Validate tên đơn vị
  const nameValidation = validateCategoryName(formData.name)
  if (!nameValidation.isValid) {
    return nameValidation
  }

  return {
    isValid: true,
    message: ""
  }
}

/**
 * Show validation error toast
 * @param {string} message - Thông báo lỗi
 */
export const showValidationError = (message) => {
  if (window.showToast) {
    window.showToast(message, "error")
  } else {
    console.error("Validation error:", message)
  }
}

/**
 * Clean error message by removing array brackets and extra whitespace
 * @param {string} errorMsg - Error message to clean
 * @returns {string} - Cleaned error message
 */
export const cleanErrorMessage = (errorMsg) => {
  if (!errorMsg) return ""

  // Remove various bracket patterns and clean up
  let cleaned = errorMsg
    .replace(/^\[[^\]]*\]\s*/, "") // Remove [User] at start
    .replace(/\[[^\]]*\]/g, "") // Remove any [brackets] anywhere
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/^[:\s-]+/, "") // Remove leading colons, spaces, or dashes
    .replace(/[:\s-]+$/, "") // Remove trailing colons, spaces, or dashes
    .trim()

  return cleaned
}

/**
 * Extract and clean error message from API error response
 * @param {Object} error - Error object from API call
 * @param {string} fallbackMessage - Fallback message if no error message found
 * @returns {string} - Cleaned error message
 */
export const extractErrorMessage = (error, fallbackMessage = "Có lỗi xảy ra, vui lòng thử lại!") => {
  const errorMsg =
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage

  return cleanErrorMessage(errorMsg)
}

/**
 * Validate and show error if invalid
 * @param {Object} formData - Dữ liệu form
 * @returns {boolean} - true nếu hợp lệ, false nếu không hợp lệ
 */
export const validateAndShowError = (formData) => {
  // Auto-detect form type based on field names
  let validation
  if (formData.categoryName !== undefined) {
    // Category form
    validation = validateCategoryForm(formData)
  } else if (formData.name !== undefined) {
    // Unit measure form
    validation = validateUnitMeasureForm(formData)
  } else {
    // Fallback - check for required fields
    const hasRequiredFields = (formData.name?.trim() || formData.categoryName?.trim()) && formData.description?.trim()
    if (!hasRequiredFields) {
      showValidationError("Vui lòng điền đầy đủ thông tin")
      return false
    }
    return true
  }

  if (!validation.isValid) {
    showValidationError(validation.message)
    return false
  }
  return true
}

// Xử lý mọi kiểu Content - Disposition từ BE
// Cắt các phần thừa
// Lấy đúng tên file cuối cùng
// Giải mã UTF - 8 nếu tên file có dấu(tiếng Việt)

export const getFileNameFromHeader = (contentDisposition) => {
  if (!contentDisposition) return null;

  // 1) filename* (RFC 5987) e.g. filename*=UTF-8''%E1%BA%A3nh.docx
  const filenameStar = contentDisposition.match(/filename\*\s*=\s*(?:UTF-8''|(?:'')?)([^;]+)/i);
  if (filenameStar && filenameStar[1]) {
    try {
      let encoded = filenameStar[1].trim().replace(/^"|"$/g, '');
      // strip optional prefix if still there
      encoded = encoded.replace(/^UTF-8''/i, '');
      return decodeURIComponent(encoded);
    } catch {
      return filenameStar[1].trim().replace(/^"|"$/g, '');
    }
  }

  // 2) regular filename= (quoted or unquoted)
  const filename = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);
  if (filename && filename[1]) {
    return filename[1].trim();
  }

  // 3) malformed servers: filename_ or filename*= but using underscore
  const filenameUnderscore = contentDisposition.match(/filename_?\s*=\s*(?:UTF-8''|(?:'')?)([^;]+)/i);
  if (filenameUnderscore && filenameUnderscore[1]) {
    try {
      let v = filenameUnderscore[1].trim().replace(/^"|"$/g, '');
      v = v.replace(/^UTF-8''/i, '');
      return decodeURIComponent(v);
    } catch {
      return filenameUnderscore[1].trim().replace(/^"|"$/g, '');
    }
  }

  // 4) fallback: try to find a .docx-like token
  const anyName = contentDisposition.match(/([\w\-\u00C0-\u017F\s%]+\.docx)/i);
  if (anyName && anyName[1]) {
    try { return decodeURIComponent(anyName[1]); } catch { return anyName[1]; }
  }

  return null;
};