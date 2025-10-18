# Hướng dẫn Sidebar với phân quyền

## 🎯 Nguyên tắc hoạt động

**1 Sidebar duy nhất** với logic phân quyền thông minh:
- Mỗi menu item có `permission` hoặc `role` 
- Sidebar tự động ẩn/hiện menu theo quyền của user
- Không cần tạo nhiều Sidebar khác nhau

## 📋 Cấu trúc Menu Item

```javascript
{
    key: "/path",
    icon: <Icon />,
    label: "Tên menu",
    permission: PERMISSIONS.VIEW_PERMISSION,  // Hoặc
    role: ROLES.ADMINISTRATOR,               // Hoặc
    children: [...]                          // Submenu
}
```

## 🔧 Cách hoạt động

### 1. Kiểm tra quyền:
- **`permission`**: Kiểm tra user có quyền này không
- **`role`**: Kiểm tra user có role này không
- **`children`**: Lọc submenu theo quyền

### 2. Logic lọc menu:
```javascript
const filterMenuItems = (items) => {
    return items.filter(item => {
        // Kiểm tra role
        if (item.role && !userRoles.includes(item.role)) {
            return false;
        }
        
        // Kiểm tra permission
        if (item.permission) {
            if (Array.isArray(item.permission)) {
                // Cần có ít nhất 1 permission
                if (!item.permission.some(p => hasPermission(p))) {
                    return false;
                }
            } else {
                // Cần có permission này
                if (!hasPermission(item.permission)) {
                    return false;
                }
            }
        }
        
        // Lọc children
        if (item.children) {
            const filteredChildren = filterMenuItems(item.children);
            if (filteredChildren.length === 0) {
                return false; // Ẩn menu cha nếu không có children nào
            }
            item.children = filteredChildren;
        }
        
        return true;
    });
};
```

## 📊 Kết quả theo Role

### Administrator
- ✅ Tất cả menu (có tất cả quyền)

### Business Owner  
- ✅ Tất cả menu (có tất cả quyền)

### Sale Manager
- ✅ Dashboard, Danh mục, Đơn vị, Hàng hóa, Đối tác, Báo cáo
- ❌ Quản lý tài khoản, Quản lý kho, Cài đặt

### Sales Representative
- ✅ Dashboard, Danh mục, Đơn vị, Hàng hóa (chỉ xem), Đối tác (chỉ xem), Báo cáo
- ❌ Quản lý tài khoản, Quản lý kho, Cài đặt

### Warehouse Manager
- ✅ Dashboard, Hàng hóa (xem/sửa), Đối tác (xem), Quản lý kho, Lô hàng, Báo cáo
- ❌ Quản lý tài khoản, Danh mục, Đơn vị, Cài đặt

### Warehouse Staff
- ✅ Dashboard, Hàng hóa (xem), Đối tác (xem), Quản lý kho (xem), Lô hàng (xem), Báo cáo
- ❌ Quản lý tài khoản, Danh mục, Đơn vị, Cài đặt

## 🚀 Ưu điểm

1. **1 Sidebar duy nhất** - Dễ maintain
2. **Phân quyền tự động** - Không cần code thủ công
3. **Linh hoạt** - Dễ thêm/sửa menu
4. **Hiệu quả** - Chỉ render menu cần thiết
5. **Nhất quán** - UI giống nhau cho tất cả role

## 💡 Cách thêm menu mới

```javascript
{
    key: "/new-feature",
    icon: <NewIcon />,
    label: "Tính năng mới",
    permission: PERMISSIONS.NEW_FEATURE_VIEW  // Thêm vào permissions.js
}
```

Hệ thống sẽ tự động:
- Ẩn menu nếu user không có quyền
- Hiển thị menu nếu user có quyền
- Lọc submenu nếu có
