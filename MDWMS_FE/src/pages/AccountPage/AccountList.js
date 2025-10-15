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

// Services
import { getUserList } from "../../services/AccountService"

// Icons
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
    warehouseManagers: 0,
    salesManagers: 0,
    warehouseStaff: 0,
    salesStaff: 0
  }

  const totalUsers = employees.length
  const activeUsers = employees.filter(emp => emp.status === 1).length
  const inactiveUsers = employees.filter(emp => emp.status === 0).length
  
  const warehouseManagers = employees.filter(emp => 
    emp.roles && emp.roles.some(role => role.includes("Warehouse Manager"))
  ).length
  
  const salesManagers = employees.filter(emp => 
    emp.roles && emp.roles.some(role => role.includes("Sales Manager"))
  ).length
  
  const warehouseStaff = employees.filter(emp => 
    emp.roles && emp.roles.some(role => role.includes("Warehouse Staff"))
  ).length
  
  const salesStaff = employees.filter(emp => 
    emp.roles && emp.roles.some(role => role.includes("Sales Staff"))
  ).length

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    warehouseManagers,
    salesManagers,
    warehouseStaff,
    salesStaff
  }
}

export default function AdminPage() {
  // ===== STATE MANAGEMENT =====
  
  // Data states
  const [allEmployees, setAllEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)

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



  // ===== DATA FETCHING =====
  
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

        return matchesSearch && matchesStatus
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
  const employeeStats = getEmployeeStats(allEmployees)


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
          <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("role")}>
            <span>Chức vụ</span>
            <SortIcon column="role" activeColumn={sortColumn} direction={sortDirection} />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
          <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("status")}>
            <span>Trạng thái</span>
            <SortIcon column="status" activeColumn={sortColumn} direction={sortDirection} />
          </div>
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
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
            employee.status === 1 || employee.status === "Active"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {employee.status === 1 ? "Hoạt động" : "Ngừng hoạt động"}
        </span>
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
            className="bg-orange-500 hover:bg-orange-600 h-8 px-6 text-white"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4 text-white" />
            Thêm người dùng
          </Button>
        </div>

        {/* ===== STATISTICS SECTION ===== */}
        <AccountStatsChart
          totalUsers={employeeStats.totalUsers}
          activeUsers={employeeStats.activeUsers}
          inactiveUsers={employeeStats.inactiveUsers}
          warehouseManagers={employeeStats.warehouseManagers}
          salesManagers={employeeStats.salesManagers}
          warehouseStaff={employeeStats.warehouseStaff}
          salesStaff={employeeStats.salesStaff}
        />

        {/* ===== SEARCH AND TABLE SECTION ===== */}
        <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
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
            onClearAll={clearAllFilters}
          />

          {/* Table */}
          <div className="w-full">
            <div className="overflow-x-auto">
              <Table className="w-full">
                {renderTableHeader()}
                <TableBody>
                  {filteredEmployees.map((employee, index) => 
                    renderTableRow(employee, index)
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>

        {/* ===== PAGINATION SECTION ===== */}
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
