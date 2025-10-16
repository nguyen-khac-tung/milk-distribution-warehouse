"use client"
import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Card } from "../../components/ui/card"
import SearchFilterToggle from "../../components/Common/SearchFilterToggle"
import Loading from "../../components/Common/Loading"
import AccountStatsChart from "../../components/AccountComponents/AccountStatsChart"
import Pagination from "../../components/Common/Pagination"
import EmptyState from "../../components/Common/EmptyState"
import { StatusToggle } from "../../components/Common/SwitchToggle/StatusToggle"
import { getUserList, updateUserStatus, deleteUser } from "../../services/AccountService"
import CreateAccountModal from "./CreateAccountModal"
import { AccountDetail } from "./ViewAccountModal"
import DeleteModal from "../../components/Common/DeleteModal"
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
} from "lucide-react"
const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40]

const SortIcon = ({ column, activeColumn, direction }) => {
  if (activeColumn !== column) {
    return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />
  }
  return direction === "asc" ? (
    <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary" />
  )
}

const getEmployeeStats = (employees) => {
  if (!Array.isArray(employees)) return {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    roleStats: []
  }

  const totalUsers = employees.length
  const activeUsers = employees.filter(emp => emp.status === 1).length
  const inactiveUsers = employees.filter(emp => emp.status === 2).length

  const allRoles = [
    "Warehouse Manager",
    "Warehouse Staff",
    "Administrator",
    "Business Owner",
    "Sales Representative",
    "Sale Manager"
  ]

  const roleStats = allRoles.map(roleName => {
    const count = employees.filter(emp =>
      emp.roles && emp.roles.some(role => role.includes(roleName))
    ).length

    return {
      roleName,
      count,
      percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
    }
  })

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    roleStats
  }
}

export default function AdminPage() {

  const [allEmployees, setAllEmployees] = useState([])
  const [allUsersForStats, setAllUsersForStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [roleFilter, setRoleFilter] = useState("")
  const [showRoleFilter, setShowRoleFilter] = useState(false)
  const [availableRoles, setAvailableRoles] = useState([])
  const [showPageSizeFilter, setShowPageSizeFilter] = useState(false)

  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")

  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0
  })

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  const handleStatusFilter = (value) => {
    setStatusFilter(value)
    setShowStatusFilter(false)
  }
  const clearStatusFilter = () => {
    setStatusFilter("")
  }
  const clearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("")
    setRoleFilter("")
  }
  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, pageNumber: 1 }))
    setShowPageSizeFilter(false)
  }
  const handleRoleFilter = (value) => {
    setRoleFilter(value)
    setShowRoleFilter(false)
  }
  const clearRoleFilter = () => {
    setRoleFilter("")
  }
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }
  const handleStatusChange = async (id, newStatus, name) => {
    try {
      console.log(`Updating user ${id} (${name}) status to ${newStatus}`)
      const response = await updateUserStatus(id, newStatus)
      if (response && response.success !== false) {
        const statusText = newStatus === 1 ? "kích hoạt" : "ngừng hoạt động"
        window.showToast(`Đã ${statusText} người dùng "${name}" thành công`, "success")
        console.log(`Successfully updated user ${name} status to ${newStatus}`)
        
        // Refresh all users for stats
        fetchAllUsersForStats()

        // Refresh data after status change
        fetchData({
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          search: searchQuery,
          sortField: sortColumn || "",
          sortAscending: sortDirection === "asc"
        })
      } else {
        console.error(`Failed to update user ${name} status:`, response?.message)
        const errorMessage = response?.message || "Có lỗi xảy ra khi cập nhật trạng thái người dùng"
        window.showToast(errorMessage, "error")
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      const errorMessage = error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái người dùng"
      window.showToast(errorMessage, "error")
    }
  }

  // Handle delete user
  const handleDeleteClick = (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  // Fetch data from API
  const fetchData = async (searchParams = {}) => {
    try {
      setLoading(true)
      setError(null)

      const response = await getUserList({
        pageNumber: searchParams.pageNumber !== undefined ? searchParams.pageNumber : pagination.pageNumber,
        pageSize: searchParams.pageSize !== undefined ? searchParams.pageSize : pagination.pageSize,
        search: searchParams.search !== undefined ? searchParams.search : searchQuery,
        sortField: searchParams.sortField || sortColumn || "",
        sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : sortDirection === "asc"
      })

      if (response?.data?.items) {
        setAllEmployees(response.data.items)
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.totalCount || 0
        }))
      } else {
        setAllEmployees([])
        setPagination(prev => ({
          ...prev,
          totalCount: 0
        }))
      }
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Không thể tải danh sách người dùng")
      setAllEmployees([])
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  // Fetch all users for stats
  const fetchAllUsersForStats = async () => {
    try {
      const response = await getUserList({
        pageNumber: 1,
        pageSize: 1000,
        search: "",
        sortField: "",
        sortAscending: true
      })

      if (response?.data?.items) {
        setAllUsersForStats(response.data.items)

        const uniqueRoles = new Set()
        response.data.items.forEach(user => {
          if (user.roles && Array.isArray(user.roles)) {
            user.roles.forEach(role => uniqueRoles.add(role))
          }
        })
        setAvailableRoles(Array.from(uniqueRoles))
      } else {
        setAllUsersForStats([])
        setAvailableRoles([])
      }
    } catch (err) {
      console.error("Error fetching all users for stats:", err)
      setAllUsersForStats([])
      setAvailableRoles([])
    }
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      console.log(`Deleting user ${userToDelete.userId || userToDelete.id} (${userToDelete.fullName})`)
      const response = await deleteUser(userToDelete.userId || userToDelete.id)
      
      if (response && response.success !== false) {
        window.showToast(`Đã xóa người dùng "${userToDelete.fullName}" thành công`, "success")
        console.log(`Successfully deleted user ${userToDelete.fullName}`)
        
        // Calculate if current page will be empty after deletion
        const currentPageItemCount = allEmployees.length
        const willPageBeEmpty = currentPageItemCount <= 1

        // If current page will be empty and we're not on page 1, go to previous page
        let targetPage = pagination.pageNumber
        if (willPageBeEmpty && pagination.pageNumber > 1) {
          targetPage = pagination.pageNumber - 1
          setPagination(prev => ({ ...prev, pageNumber: targetPage }))
        }

        // Refresh all users for stats
        fetchAllUsersForStats()

        // Refresh data after deletion, keeping current page or going to previous page if needed
        fetchData({
          pageNumber: targetPage,
          pageSize: pagination.pageSize,
          search: searchQuery,
          sortField: sortColumn || "",
          sortAscending: sortDirection === "asc"
        })
      } else {
        console.error(`Failed to delete user ${userToDelete.fullName}:`, response?.message)
        const errorMessage = response?.message || "Có lỗi xảy ra khi xóa người dùng"
        window.showToast(errorMessage, "error")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      const errorMessage = error?.response?.data?.message || "Có lỗi xảy ra khi xóa người dùng"
      window.showToast(errorMessage, "error")
    } finally {
      setShowDeleteModal(false)
      setUserToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
  }

  useEffect(() => {
    fetchAllUsersForStats()
  }, [])

  useEffect(() => {
    fetchData({
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      search: searchQuery,
      sortField: sortColumn || "",
      sortAscending: sortDirection === "asc"
    })
  }, [searchQuery, sortColumn, sortDirection, statusFilter, roleFilter, pagination.pageNumber, pagination.pageSize])

  // Handle search loading
  useEffect(() => {
    if (searchQuery || statusFilter || roleFilter) {
      setSearchLoading(true)
    }
  }, [searchQuery, statusFilter, roleFilter])

  const filterAndSortEmployees = () => {
    if (!Array.isArray(allEmployees)) return []

    return allEmployees
      .filter((employee) => {
        const roles = employee.roles || []
        const rolesString = roles.join(" ").toLowerCase()
        const fullName = employee.fullName || ""
        const email = employee.email || ""

        const matchesSearch =
          fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rolesString.includes(searchQuery.toLowerCase())

        let matchesStatus = true
        if (statusFilter) {
          if (statusFilter === "1") {
            matchesStatus = employee.status === 1
          } else if (statusFilter === "2") {
            matchesStatus = employee.status === 2
          }
        }

        let matchesRole = true
        if (roleFilter) {
          matchesRole = employee.roles && employee.roles.some(role => role.includes(roleFilter))
        }

        return matchesSearch && matchesStatus && matchesRole
      })
      .sort((a, b) => {
        if (!sortColumn) return 0

        const fieldMap = {
          email: 'email',
          name: 'fullName',
          role: 'roles',
          status: 'status'
        }

        const field = fieldMap[sortColumn] || sortColumn
        let aVal = a[field] || a[sortColumn] || ""
        let bVal = b[field] || b[sortColumn] || ""

        if (field === 'roles') {
          aVal = Array.isArray(aVal) ? aVal.join(", ") : aVal
          bVal = Array.isArray(bVal) ? bVal.join(", ") : bVal
        }

        if (sortDirection === "asc") {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
  }

  const filteredEmployees = filterAndSortEmployees()
  const employeeStats = getEmployeeStats(allUsersForStats)


  const renderTableHeader = () => (
    <TableHeader>
      <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left w-16">
          STT
        </TableHead>
        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
          <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("email")}>
            <span>Email</span>
            <SortIcon column="email" activeColumn={sortColumn} direction={sortDirection} />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
          <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("name")}>
            <span>Tên nhân viên</span>
            <SortIcon column="name" activeColumn={sortColumn} direction={sortDirection} />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
          <span>Chức vụ</span>
        </TableHead>
        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
          <span>Trạng thái</span>
        </TableHead>
        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
          Hoạt động
        </TableHead>
      </TableRow>
    </TableHeader>
  )

  const renderTableRow = (employee, index) => (
    <TableRow
      key={employee.userId || employee.id}
      className="hover:bg-slate-50 border-b border-slate-200"
    >
      <TableCell className="px-6 py-4 text-slate-600 font-medium">
        {index + 1}
      </TableCell>
      <TableCell className="px-6 py-4 text-slate-700 font-medium">
        {employee.email || "N/A"}
      </TableCell>
      <TableCell className="px-6 py-4 text-slate-700">
        {employee.fullName || "N/A"}
      </TableCell>
      <TableCell className="px-6 py-4">
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
          {employee.roles && employee.roles.length > 0 ? employee.roles.join(", ") : "N/A"}
        </span>
      </TableCell>
      <TableCell className="px-6 py-4">
        <StatusToggle
          status={employee.status}
          onStatusChange={handleStatusChange}
          supplierId={employee.userId || employee.id}
          supplierName={employee.fullName}
          entityType="người dùng"
        />
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex items-center justify-center space-x-1">
          <button
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
            title="Xem chi tiết"
            onClick={() => setSelectedUserId(employee.userId || employee.id)}
          >
            <Eye className="h-4 w-4 text-orange-500" />
          </button>
          <button
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="h-4 w-4 text-orange-500" />
          </button>
          <button
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
            title="Xóa"
            onClick={() => handleDeleteClick(employee)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary/90"
        >
          Thử lại
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600">Quản lý người dùng</h1>
            <p className="text-slate-600 mt-1">Quản lý các tài khoản người dùng trong hệ thống</p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4 text-white" />
            Thêm người dùng
          </Button>
        </div>
        <AccountStatsChart
          userStats={employeeStats}
        />
        <Card className="shadow-sm border border-slate-200 overflow-visible bg-gray-50">
          <SearchFilterToggle
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Tìm kiếm theo tên, email hoặc chức vụ..."
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            showStatusFilter={showStatusFilter}
            setShowStatusFilter={setShowStatusFilter}
            statusOptions={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "1", label: "Hoạt động" },
              { value: "2", label: "Ngừng hoạt động" }
            ]}
            onStatusFilter={handleStatusFilter}
            clearStatusFilter={clearStatusFilter}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            showRoleFilter={showRoleFilter}
            setShowRoleFilter={setShowRoleFilter}
            roles={availableRoles}
            onRoleFilter={handleRoleFilter}
            clearRoleFilter={clearRoleFilter}
            onClearAll={clearAllFilters}
            pageSize={pagination.pageSize}
            setPageSize={setPagination}
            showPageSizeFilter={showPageSizeFilter}
            setShowPageSizeFilter={setShowPageSizeFilter}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            showPageSizeButton={true}
          />

          <div className="w-full">
            {loading ? (
              <Loading size="large" text="Đang tải dữ liệu..." />
            ) : searchLoading ? (
              <Loading size="medium" text="Đang tìm kiếm..." />
            ) : (
              <div className={`overflow-x-auto overflow-y-visible ${filteredEmployees.length === 0 ? 'max-h-96' : ''}`}>
                <Table className="w-full">
                  {renderTableHeader()}
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        title="Không tìm thấy người dùng nào"
                        description={
                          searchQuery || statusFilter || roleFilter
                            ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                            : "Chưa có người dùng nào trong hệ thống"
                        }
                        actionText="Xóa bộ lọc"
                        onAction={clearAllFilters}
                        showAction={!!(searchQuery || statusFilter || roleFilter)}
                        colSpan={6}
                      />
                    ) : (
                      filteredEmployees.map((employee, index) =>
                        renderTableRow(employee, index)
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
        {!loading && pagination.totalCount > 0 && (
          <Pagination
            current={pagination.pageNumber}
            pageSize={pagination.pageSize}
            total={pagination.totalCount}
            onPageChange={(page) => setPagination(prev => ({ ...prev, pageNumber: page }))}
            onPageSizeChange={(size) => setPagination(prev => ({ ...prev, pageSize: size, pageNumber: 1 }))}
            showPageSize={true}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            className="bg-gray-50"
          />
        )}

      </div>
      
      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Refresh all users for stats
          fetchAllUsersForStats()
          
          // Reset to first page and refresh data
          setPagination(prev => ({ ...prev, pageNumber: 1 }))
          fetchData({
            pageNumber: 1,
            pageSize: pagination.pageSize,
            search: searchQuery,
            sortField: sortColumn || "",
            sortAscending: sortDirection === "asc"
          })
        }}
      />
      
      {/* View Account Modal */}
      <AccountDetail
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={userToDelete?.fullName || ""}
      />
    </div>
  )
}

