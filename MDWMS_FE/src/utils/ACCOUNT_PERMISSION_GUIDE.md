# Hướng dẫn phân quyền trang Account

## 🎯 Tổng quan

Trang Account đã được cập nhật để sử dụng **PermissionGate** để ẩn/hiện các chức năng theo quyền của user.

## 🔧 Các chức năng được phân quyền

### 1. Nút "Thêm người dùng"
```javascript
<PermissionGate permission={PERMISSIONS.ACCOUNT_CREATE}>
  <Button onClick={() => setIsCreateModalOpen(true)}>
    <Plus className="mr-2 h-4 w-4 text-white" />
    Thêm người dùng
  </Button>
</PermissionGate>
```
- **Hiển thị khi**: User có quyền `ACCOUNT_CREATE`
- **Ẩn khi**: User không có quyền `ACCOUNT_CREATE`

### 2. Nút "Xem chi tiết" (Eye icon)
```javascript
<PermissionGate permission={PERMISSIONS.ACCOUNT_VIEW}>
  <button onClick={() => setSelectedUserId(employee.userId)}>
    <Eye className="h-4 w-4 text-orange-500" />
  </button>
</PermissionGate>
```
- **Hiển thị khi**: User có quyền `ACCOUNT_VIEW`
- **Ẩn khi**: User không có quyền `ACCOUNT_VIEW`

### 3. Nút "Chỉnh sửa" (Edit icon)
```javascript
<PermissionGate permission={PERMISSIONS.ACCOUNT_UPDATE}>
  <button onClick={() => handleUpdateClick(employee)}>
    <Edit className="h-4 w-4 text-orange-500" />
  </button>
</PermissionGate>
```
- **Hiển thị khi**: User có quyền `ACCOUNT_UPDATE`
- **Ẩn khi**: User không có quyền `ACCOUNT_UPDATE`

### 4. Nút "Xóa" (Trash icon)
```javascript
<PermissionGate permission={PERMISSIONS.ACCOUNT_DELETE}>
  <button onClick={() => handleDeleteClick(employee)}>
    <Trash2 className="h-4 w-4 text-red-500" />
  </button>
</PermissionGate>
```
- **Hiển thị khi**: User có quyền `ACCOUNT_DELETE`
- **Ẩn khi**: User không có quyền `ACCOUNT_DELETE`

### 5. Status Toggle (Bật/tắt trạng thái)
```javascript
<PermissionGate 
  permission={PERMISSIONS.ACCOUNT_UPDATE}
  fallback={
    <span className="status-badge">
      {employee.status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
    </span>
  }
>
  <StatusToggle
    status={employee.status}
    onStatusChange={handleStatusChange}
    // ... other props
  />
</PermissionGate>
```
- **Hiển thị toggle khi**: User có quyền `ACCOUNT_UPDATE`
- **Hiển thị badge tĩnh khi**: User không có quyền `ACCOUNT_UPDATE`

### 6. Các Modal
```javascript
{/* Create Modal */}
<PermissionGate permission={PERMISSIONS.ACCOUNT_CREATE}>
  <CreateAccountModal isOpen={isCreateModalOpen} />
</PermissionGate>

{/* Update Modal */}
<PermissionGate permission={PERMISSIONS.ACCOUNT_UPDATE}>
  <UpdateAccountModal isOpen={isUpdateModalOpen} />
</PermissionGate>

{/* View Modal */}
<PermissionGate permission={PERMISSIONS.ACCOUNT_VIEW}>
  <AccountDetail userId={selectedUserId} />
</PermissionGate>

{/* Delete Modal */}
<PermissionGate permission={PERMISSIONS.ACCOUNT_DELETE}>
  <DeleteModal isOpen={showDeleteModal} />
</PermissionGate>
```

## 📊 Kết quả theo Role

### Administrator
- ✅ **Tất cả chức năng**: Tạo, xem, sửa, xóa, bật/tắt trạng thái
- ✅ **Tất cả modal**: Create, Update, View, Delete

### Business Owner
- ✅ **Tất cả chức năng**: Tạo, xem, sửa, xóa, bật/tắt trạng thái
- ✅ **Tất cả modal**: Create, Update, View, Delete

### Sale Manager
- ❌ **Không có quyền**: Không thể truy cập trang Account
- ❌ **Redirect**: Sẽ bị chuyển đến `/unauthorized`

### Sales Representative
- ❌ **Không có quyền**: Không thể truy cập trang Account
- ❌ **Redirect**: Sẽ bị chuyển đến `/unauthorized`

### Warehouse Manager
- ❌ **Không có quyền**: Không thể truy cập trang Account
- ❌ **Redirect**: Sẽ bị chuyển đến `/unauthorized`

### Warehouse Staff
- ❌ **Không có quyền**: Không thể truy cập trang Account
- ❌ **Redirect**: Sẽ bị chuyển đến `/unauthorized`

## 🎨 UI/UX Improvements

### 1. Status Display
- **Có quyền UPDATE**: Hiển thị toggle để bật/tắt
- **Không có quyền UPDATE**: Hiển thị badge tĩnh với màu sắc phù hợp

### 2. Action Buttons
- **Có quyền**: Hiển thị nút hành động tương ứng
- **Không có quyền**: Ẩn hoàn toàn nút hành động

### 3. Modals
- **Có quyền**: Modal hoạt động bình thường
- **Không có quyền**: Modal không được render

## 🔄 Luồng hoạt động

1. **User truy cập `/accounts`**
2. **ProtectedRoute kiểm tra** quyền `ACCOUNT_VIEW`
3. **Có quyền**: Hiển thị trang Account
4. **Không có quyền**: Redirect `/unauthorized`
5. **Trong trang**: PermissionGate ẩn/hiện chức năng theo quyền

## 💡 Lợi ích

1. **Bảo mật**: Không thể thực hiện hành động trái phép
2. **UX tốt**: UI thích ứng theo quyền user
3. **Nhất quán**: Tất cả chức năng đều được bảo vệ
4. **Linh hoạt**: Dễ thay đổi quyền cho từng chức năng
5. **Trực quan**: User biết rõ mình có thể làm gì

## 🛠️ Cách thêm phân quyền mới

```javascript
// Thêm permission mới vào permissions.js
export const PERMISSIONS = {
  ACCOUNT_EXPORT: 'Account.Export',
  // ... other permissions
};

// Sử dụng trong component
<PermissionGate permission={PERMISSIONS.ACCOUNT_EXPORT}>
  <Button onClick={handleExport}>
    Xuất Excel
  </Button>
</PermissionGate>
```

## ⚠️ Lưu ý quan trọng

1. **Route Protection**: Trang được bảo vệ bởi `ProtectedRoute`
2. **Component Protection**: Từng chức năng được bảo vệ bởi `PermissionGate`
3. **Fallback UI**: Có fallback UI khi không có quyền (ví dụ: status badge)
4. **Modal Protection**: Modal cũng được bảo vệ để tránh truy cập trái phép
5. **Consistent UX**: UI nhất quán cho tất cả user
