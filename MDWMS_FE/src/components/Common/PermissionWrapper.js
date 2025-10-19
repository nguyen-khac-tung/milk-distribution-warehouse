import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';


///Check quyền để hiển thị Button
/**
 * Component wrapper để ẩn/hiện các element dựa trên quyền
 * @param {string|string[]} requiredPermission - Quyền cần thiết (có thể là string hoặc array)
 * @param {boolean} requireAll - Nếu true, cần tất cả quyền trong array. Nếu false, chỉ cần 1 quyền
 * @param {React.ReactNode} children - Nội dung cần hiển thị
 * @param {React.ReactNode} fallback - Nội dung hiển thị khi không có quyền (optional)
 * @param {boolean} hide - Nếu true, ẩn hoàn toàn. Nếu false, hiển thị fallback
 */
const PermissionWrapper = ({ 
  requiredPermission, 
  requireAll = false, 
  children, 
  fallback = null, 
  hide = true 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Nếu không có quyền yêu cầu, hiển thị children
  if (!requiredPermission) {
    return children;
  }

  let hasAccess = false;

  if (Array.isArray(requiredPermission)) {
    // Nếu là array quyền
    if (requireAll) {
      hasAccess = hasAllPermissions(requiredPermission);
    } else {
      hasAccess = hasAnyPermission(requiredPermission);
    }
  } else {
    // Nếu là string quyền đơn
    hasAccess = hasPermission(requiredPermission);
  }

  // Nếu có quyền, hiển thị children
  if (hasAccess) {
    return children;
  }

  // Nếu không có quyền
  if (hide) {
    return null; // Ẩn hoàn toàn
  } else {
    return fallback; // Hiển thị fallback
  }
};

export default PermissionWrapper;
