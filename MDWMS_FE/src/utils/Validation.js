/**
 * Category validation utilities
 * Tái sử dụng logic validation cho category trong CreateCategory và UpdateCategory
 */

// Regex để kiểm tra tên danh mục hợp lệ (chữ cái, số, khoảng trắng, ký tự tiếng Việt)
const VALID_NAME_REGEX = /^[a-zA-Z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]+$/

/**
 * Validate category name
 * @param {string} categoryName - Tên danh mục cần validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateCategoryName = (categoryName) => {
  const trimmedName = categoryName.trim()
  
  // Kiểm tra độ dài tối thiểu
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: "Tên danh mục phải có ít nhất 2 ký tự"
    }
  }
  
  // Kiểm tra ký tự hợp lệ
  if (!VALID_NAME_REGEX.test(trimmedName)) {
    return {
      isValid: false,
      message: "Tên danh mục chỉ được chứa chữ cái, số và khoảng trắng"
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
 * @param {string} formData.categoryName - Tên danh mục
 * @param {string} formData.description - Mô tả
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateCategoryForm = (formData) => {
  // Kiểm tra các trường bắt buộc
  if (!formData.categoryName?.trim() || !formData.description?.trim()) {
    return {
      isValid: false,
      message: "Vui lòng điền đầy đủ thông tin"
    }
  }
  
  // Validate tên danh mục
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
  
  // Validate tên đơn vị đo
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
  
  // Remove array brackets and extra whitespace
  return errorMsg.replace(/^\[[^\]]*\]\s*/, "").trim()
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
