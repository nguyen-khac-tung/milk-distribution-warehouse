# Hướng dẫn bảo vệ Route với phân quyền

## 🎯 Tổng quan

Hệ thống đã được cấu hình để **tự động kiểm tra quyền** khi user truy cập các route. Nếu không có quyền → **redirect đến trang UnauthorizedPage**.

## 🔧 Cách hoạt động

### 1. ProtectedRoute Component
```javascript
<ProtectedRoute requiredPermission={PERMISSIONS.ACCOUNT_VIEW}>
    <Layout>
        <Accounts />
    </Layout>
</ProtectedRoute>
```

### 2. Logic kiểm tra quyền
- **`requiredPermission`**: Kiểm tra user có quyền này không
- **`requiredRole`**: Kiểm tra user có role này không  
- **`requiredPermissions`**: Kiểm tra nhiều quyền (có thể dùng `requireAll`)
- **`fallback`**: Component hiển thị khi không có quyền (mặc định: redirect `/unauthorized`)

### 3. Kết quả
- ✅ **Có quyền**: Hiển thị trang bình thường
- ❌ **Không có quyền**: Redirect đến `/unauthorized`

## 📋 Danh sách Route được bảo vệ

| Route | Permission Required | Mô tả |
|-------|-------------------|-------|
| `/dashboard` | `GOODS_VIEW` | Trang tổng quan |
| `/accounts` | `ACCOUNT_VIEW` | Quản lý tài khoản |
| `/categories` | `CATEGORY_VIEW` | Quản lý danh mục |
| `/unit-measures` | `UNIT_MEASURE_VIEW` | Quản lý đơn vị |
| `/goods` | `GOODS_VIEW` | Quản lý hàng hóa |
| `/batches` | `BATCH_VIEW` | Quản lý lô hàng |
| `/suppliers` | `SUPPLIER_VIEW` | Quản lý nhà cung cấp |
| `/retailers` | `RETAILER_VIEW` | Quản lý nhà bán lẻ |
| `/areas` | `AREA_VIEW` | Quản lý khu vực |
| `/locations` | `LOCATION_VIEW` | Quản lý vị trí |
| `/storage-conditions` | `STORAGE_CONDITION_VIEW` | Quản lý điều kiện bảo quản |
| `/reports` | `REPORT_VIEW` | Báo cáo |
| `/settings` | `SETTINGS_VIEW` | Cài đặt |

## 🚫 Route không cần đăng nhập

| Route | Mô tả |
|-------|-------|
| `/login` | Trang đăng nhập |
| `/forgot-password` | Quên mật khẩu |
| `/verify-otp` | Xác thực OTP |
| `/reset-password` | Đặt lại mật khẩu |
| `/unauthorized` | Trang không có quyền |
| `/` | Redirect logic |

## 🎭 Kết quả theo Role

### Administrator & Business Owner
- ✅ Truy cập được **TẤT CẢ** route
- ✅ Có đầy đủ quyền

### Sale Manager
- ✅ `/dashboard`, `/categories`, `/unit-measures`, `/goods`, `/suppliers`, `/retailers`, `/reports`
- ❌ `/accounts`, `/areas`, `/locations`, `/storage-conditions`, `/batches`, `/settings`

### Sales Representative
- ✅ `/dashboard`, `/categories`, `/unit-measures`, `/goods`, `/suppliers`, `/retailers`, `/reports` (chỉ xem)
- ❌ `/accounts`, `/areas`, `/locations`, `/storage-conditions`, `/batches`, `/settings`

### Warehouse Manager
- ✅ `/dashboard`, `/goods`, `/suppliers`, `/retailers`, `/areas`, `/locations`, `/storage-conditions`, `/batches`, `/reports`
- ❌ `/accounts`, `/categories`, `/unit-measures`, `/settings`

### Warehouse Staff
- ✅ `/dashboard`, `/goods`, `/suppliers`, `/retailers`, `/areas`, `/locations`, `/storage-conditions`, `/batches`, `/reports` (chỉ xem)
- ❌ `/accounts`, `/categories`, `/unit-measures`, `/settings`

## 🔄 Luồng hoạt động

1. **User truy cập route** (ví dụ: `/accounts`)
2. **ProtectedRoute kiểm tra quyền** (`ACCOUNT_VIEW`)
3. **Có quyền**: Hiển thị trang Accounts
4. **Không có quyền**: Redirect đến `/unauthorized`
5. **UnauthorizedPage**: Hiển thị thông báo + nút "Về trang chủ"

## 💡 Lợi ích

1. **Bảo mật**: Không thể truy cập trái phép
2. **UX tốt**: Thông báo rõ ràng khi không có quyền
3. **Tự động**: Không cần code kiểm tra thủ công
4. **Nhất quán**: Tất cả route đều được bảo vệ
5. **Linh hoạt**: Dễ thay đổi quyền cho từng route

## 🛠️ Cách thêm route mới

```javascript
{
    path: "/new-feature",
    page: () => (
        <ProtectedRoute requiredPermission={PERMISSIONS.NEW_FEATURE_VIEW}>
            <Layout>
                <NewFeature />
            </Layout>
        </ProtectedRoute>
    ),
}
```

Hệ thống sẽ tự động:
- Kiểm tra quyền `NEW_FEATURE_VIEW`
- Hiển thị trang nếu có quyền
- Redirect `/unauthorized` nếu không có quyền
