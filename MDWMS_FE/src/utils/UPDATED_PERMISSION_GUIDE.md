# Hướng dẫn phân quyền cập nhật (Theo yêu cầu thực tế)

## 📋 Tổng quan

Hệ thống phân quyền đã được cập nhật theo yêu cầu thực tế: **Administrator** và **Business Owner** chỉ có quyền quản lý **Account**, **Location**, **Areas** và **Storage Condition**.

## 🎯 Phân quyền theo Role (Cập nhật)

### Administrator
- ✅ **Quản lý tài khoản** - CRUD đầy đủ
- ✅ **Quản lý khu vực** - CRUD đầy đủ
- ✅ **Quản lý vị trí** - CRUD đầy đủ
- ✅ **Quản lý điều kiện bảo quản** - CRUD đầy đủ
- ✅ **Dashboard** - Xem tổng quan
- ❌ **Không có quyền**: Hàng hóa, đối tác, lô hàng, báo cáo, cài đặt

### Business Owner (Chủ doanh nghiệp)
- ✅ **Quản lý tài khoản** - CRUD đầy đủ
- ✅ **Quản lý khu vực** - CRUD đầy đủ
- ✅ **Quản lý vị trí** - CRUD đầy đủ
- ✅ **Quản lý điều kiện bảo quản** - CRUD đầy đủ
- ✅ **Dashboard** - Xem tổng quan
- ❌ **Không có quyền**: Hàng hóa, đối tác, lô hàng, báo cáo, cài đặt

### Sale Manager (Quản lý kinh doanh)
- ✅ **Quản lý hàng hóa** - CRUD đầy đủ
- ✅ **Quản lý đối tác** - CRUD đầy đủ
- ✅ **Báo cáo** - Xem và xuất báo cáo
- ❌ **Không có quyền**: Tài khoản, kho, lô hàng, cài đặt

### Sales Representative (Nhân viên kinh doanh)
- ✅ **Chỉ xem** hàng hóa, danh mục, đối tác
- ✅ **Xem báo cáo**
- ❌ **Không tạo/sửa/xóa**
- ❌ **Không quản lý tài khoản**

### Warehouse Manager (Quản lý kho)
- ✅ **Xem và cập nhật** hàng hóa
- ✅ **Quản lý kho** - CRUD đầy đủ
- ✅ **Quản lý lô hàng** - CRUD đầy đủ
- ✅ **Báo cáo** - Xem và xuất báo cáo
- ❌ **Không quản lý tài khoản**

### Warehouse Staff (Nhân viên kho)
- ✅ **Chỉ xem** thông tin kho
- ✅ **Xem báo cáo**
- ❌ **Không tạo/sửa/xóa**
- ❌ **Không quản lý tài khoản**

## 🔧 Các thay đổi chính

### 1. Administrator & Business Owner giới hạn quyền:
- **Chỉ quản lý**: Account, Areas, Locations, Storage Conditions
- **Không quản lý**: Goods, Categories, Unit Measures, Suppliers, Retailers, Batches, Reports, Settings

### 2. Sidebar sẽ cập nhật:
- **Administrator & Business Owner**: Chỉ thấy menu Account, Areas, Locations, Storage Conditions, Dashboard
- **Các role khác**: Thấy menu theo quyền của họ

### 3. Routes được bảo vệ:
- **`/accounts`**: Chỉ Administrator & Business Owner
- **`/areas`**: Chỉ Administrator & Business Owner
- **`/locations`**: Chỉ Administrator & Business Owner
- **`/storage-conditions`**: Chỉ Administrator & Business Owner
- **Các route khác**: Theo quyền của từng role

## 📊 Bảng phân quyền chi tiết

| Module | Administrator | Business Owner | Sale Manager | Sales Rep | Warehouse Manager | Warehouse Staff |
|--------|---------------|----------------|--------------|-----------|-------------------|-----------------|
| **Account** | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| **Areas** | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ✅ CRUD | ✅ View |
| **Locations** | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ✅ CRUD | ✅ View |
| **Storage Conditions** | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ✅ CRUD | ✅ View |
| **Goods** | ❌ | ❌ | ✅ CRUD | ✅ View | ✅ View/Update | ✅ View |
| **Categories** | ❌ | ❌ | ✅ CRUD | ✅ View | ❌ | ❌ |
| **Unit Measures** | ❌ | ❌ | ✅ CRUD | ✅ View | ❌ | ❌ |
| **Suppliers** | ❌ | ❌ | ✅ CRUD | ✅ View | ❌ | ❌ |
| **Retailers** | ❌ | ❌ | ✅ CRUD | ✅ View | ❌ | ❌ |
| **Batches** | ❌ | ❌ | ❌ | ❌ | ✅ CRUD | ✅ View |
| **Reports** | ❌ | ❌ | ✅ View/Export | ✅ View | ✅ View/Export | ✅ View |
| **Settings** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 🎨 Sidebar sẽ hiển thị

### Administrator & Business Owner
```
📊 Dashboard
👥 Quản lý tài khoản
📍 Quản lý vị trí và khu vực
  ├── 🏢 Quản lý khu vực
  ├── 🏗️ Quản lý vị trí
  └── 🌡️ Quản lý điều kiện bảo quản
```

### Sale Manager
```
📊 Dashboard
🏷️ Quản lý danh mục
📏 Quản lý đơn vị
📦 Quản lý hàng hóa
🤝 Quản lý đối tác
  ├── 🚚 Quản lý nhà cung cấp
  └── 🛒 Quản lý nhà bán lẻ
📊 Báo cáo
```

### Sales Representative
```
📊 Dashboard
🏷️ Quản lý danh mục (xem)
📏 Quản lý đơn vị (xem)
📦 Quản lý hàng hóa (xem)
🤝 Quản lý đối tác (xem)
  ├── 🚚 Quản lý nhà cung cấp (xem)
  └── 🛒 Quản lý nhà bán lẻ (xem)
📊 Báo cáo (xem)
```

### Warehouse Manager
```
📊 Dashboard
📦 Quản lý hàng hóa (xem/sửa)
🤝 Quản lý đối tác (xem)
📍 Quản lý vị trí và khu vực
  ├── 🏢 Quản lý khu vực
  ├── 🏗️ Quản lý vị trí
  └── 🌡️ Quản lý điều kiện bảo quản
📦 Quản lý lô hàng
📊 Báo cáo
```

### Warehouse Staff
```
📊 Dashboard
📦 Quản lý hàng hóa (xem)
🤝 Quản lý đối tác (xem)
📍 Quản lý vị trí và khu vực (xem)
  ├── 🏢 Quản lý khu vực (xem)
  ├── 🏗️ Quản lý vị trí (xem)
  └── 🌡️ Quản lý điều kiện bảo quản (xem)
📦 Quản lý lô hàng (xem)
📊 Báo cáo (xem)
```

## 🚀 Lợi ích của phân quyền mới

1. **Phù hợp thực tế**: Phân quyền theo chức năng thực tế của từng role
2. **Bảo mật tốt hơn**: Giới hạn quyền truy cập theo nhu cầu công việc
3. **Dễ quản lý**: Mỗi role có trách nhiệm rõ ràng
4. **UI sạch sẽ**: Chỉ hiển thị menu cần thiết
5. **Hiệu quả**: User tập trung vào công việc của mình

## ⚠️ Lưu ý quan trọng

1. **Administrator** không còn có tất cả quyền
2. **Business Owner** chỉ quản lý tài khoản và kho
3. **Sale Manager** chịu trách nhiệm về hàng hóa và đối tác
4. **Warehouse Manager** chịu trách nhiệm về kho và lô hàng
5. **Tất cả role** đều có thể xem Dashboard và báo cáo (theo quyền)
