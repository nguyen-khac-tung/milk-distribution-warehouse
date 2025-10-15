"use client"

// React imports
import { useState, useEffect } from "react"

// UI Components
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Card } from "../../components/ui/card"

// Custom Components
import SearchFilterToggle from "../../components/Common/SearchFilterToggle"
import Loading from "../../components/Common/Loading"
import AccountStatsChart from "../../components/AccountComponents/AccountStatsChart"
import Pagination from "../../components/Common/Pagination"
import EmptyState from "../../components/Common/EmptyState"
import { StatusToggle } from "../../components/Common/SwitchToggle/StatusToggle"

// Services
import { getUserList, updateUserStatus } from "../../services/AccountService"

// Icons
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

// Constants
const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40]

// Helper Functions
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
  const inactiveUsers = employees.filter(emp => emp.status === 0).length
  
  // Define all possible roles
  const allRoles = [
    "Warehouse Manager",
    "Warehouse Staff", 
    "Administrator",
    "Business Owner",
    "Sales Representative",
    "Sale Manager"
  ]
  
  // Calculate count for each role
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
  // ===== STATE MANAGEMENT =====
  
  // Data states
  const [allEmployees, setAllEmployees] = useState([])
  const [allUsersForStats, setAllUsersForStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [roleFilter, setRoleFilter] = useState("")
  const [showRoleFilter, setShowRoleFilter] = useState(false)
  const [availableRoles, setAvailableRoles] = useState([])
  const [showPageSizeFilter, setShowPageSizeFilter] = useState(false)

  // Sort states
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")

  // Pagination states
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0
  })

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // ===== EVENT HANDLERS =====
  
  // Filter handlers
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

  // Page size handler
  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, pageNumber: 1 }))
    setShowPageSizeFilter(false)
  }

  // Role filter handlers
  const handleRoleFilter = (value) => {
    setRoleFilter(value)
    setShowRoleFilter(false)
  }

  const clearRoleFilter = () => {
    setRoleFilter("")
  }

  // Sort handler
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Status change handler
  const handleStatusChange = async (id, newStatus, name) => {
    try {
      console.log(`Updating user ${id} (${name}) status to ${newStatus}`)
      
      // Call API to update user status
      const response = await updateUserStatus(id, newStatus)
      
      if (response && response.success !== false) {
        // Update only the specific user in allEmployees (table data)
        setAllEmployees(prev => 
          prev.map(emp => 
            (emp.userId === id || emp.id === id) 
              ? { ...emp, status: newStatus }
              : emp
          )
        )
        
        // Update only the specific user in allUsersForStats (stats data)
        setAllUsersForStats(prev => 
          prev.map(emp => 
            (emp.userId === id || emp.id === id) 
              ? { ...emp, status: newStatus }
              : emp
          )
        )
        
        console.log(`Successfully updated user ${name} status to ${newStatus}`)
      } else {
        console.error(`Failed to update user ${name} status:`, response?.message)
      }
    } catch (error) {
      console.error("Error updating user status:", error)
    }
  }



  // ===== DATA FETCHING =====
  
  // Fetch all users for statistics (without pagination)
  useEffect(() => {
    const fetchAllUsersForStats = async () => {
      try {
        const response = await getUserList({
          pageNumber: 1,
          pageSize: 1000, // Get all users for stats
          search: "",
          sortField: "",
          sortAscending: true
        })

        if (response?.data?.items) {
          setAllUsersForStats(response.data.items)
          
          // Extract unique roles for filter
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

    fetchAllUsersForStats()
  }, [])

  // Fetch paginated users for table
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await getUserList({
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          search: searchQuery,
          sortField: sortColumn || "",
          sortAscending: sortDirection === "asc"
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
      }
    }

    fetchUsers()
  }, [searchQuery, sortColumn, sortDirection, statusFilter, pagination.pageNumber, pagination.pageSize])

  // ===== DATA PROCESSING =====
  
  const filterAndSortEmployees = () => {
    if (!Array.isArray(allEmployees)) return []

    return allEmployees
      .filter((employee) => {
        // Search filter (backup for client-side filtering)
        const roles = employee.roles || []
        const rolesString = roles.join(" ").toLowerCase()
        const fullName = employee.fullName || ""
        const email = employee.email || ""

        const matchesSearch =
          fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rolesString.includes(searchQuery.toLowerCase())

        // Status filter
        let matchesStatus = true
        if (statusFilter) {
          if (statusFilter === "1") {
            matchesStatus = employee.status === 1
          } else if (statusFilter === "0") {
            matchesStatus = employee.status === 0
          }
        }

        // Role filter
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

        // Handle roles array sorting
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

  // ===== COMPUTED VALUES =====
  
  const filteredEmployees = filterAndSortEmployees()
  const employeeStats = getEmployeeStats(allUsersForStats)


  // ===== RENDER HELPERS =====
  
  const renderLoadingState = () => (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải danh sách người dùng...</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderErrorState = () => (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
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
      </div>
    </div>
  )

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
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )

  // ===== MAIN RENDER =====
  
  if (loading) return renderLoadingState()
  if (error) return renderErrorState()

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ===== HEADER SECTION ===== */}
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

        {/* ===== STATISTICS SECTION ===== */}
        <AccountStatsChart
          userStats={employeeStats}
        />

        {/* ===== SEARCH AND TABLE SECTION ===== */}
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
              { value: "0", label: "Ngừng hoạt động" }
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

          {/* Table */}
          <div className="w-full">
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
    </div>
  )
}
