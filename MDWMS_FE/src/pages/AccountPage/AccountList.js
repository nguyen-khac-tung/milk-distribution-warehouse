"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { UserStatsChart } from "../../components/AccountComponents/user-stats-chart"
import { CreateAccountForm } from "../../components/AccountComponents/CreateAccountForm"
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Settings,
  Download,
  UserPlus,
  Shield,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "../../components/ui/icons"

const allEmployees = [
  // Quản lý kho (4 người)
  {
    id: 1,
    email: "nguyen.van.a@example.com",
    name: "Nguyễn Văn A",
    role: "Quản lý kho",
    department: "Quản lý",
    status: "Active",
    phone: "0987654321",
    joinedDate: "13/09/2025",
  },
  {
    id: 2,
    email: "tran.thi.b@example.com",
    name: "Trần Thị B",
    role: "Quản lý kho",
    department: "Quản lý",
    status: "Active",
    phone: "0976543210",
    joinedDate: "12/09/2025",
  },
  {
    id: 3,
    email: "le.van.c@example.com",
    name: "Lê Văn C",
    role: "Quản lý kho",
    department: "Quản lý",
    status: "Active",
    phone: "0965432109",
    joinedDate: "10/09/2025",
  },
  {
    id: 4,
    email: "pham.thi.d@example.com",
    name: "Phạm Thị D",
    role: "Quản lý kho",
    department: "Quản lý",
    status: "Inactive",
    phone: "0954321098",
    joinedDate: "08/09/2025",
  },
  // Nhân viên kho (5 người)
  {
    id: 5,
    email: "hoang.van.e@example.com",
    name: "Hoàng Văn E",
    role: "Nhân viên kho",
    department: "Nhân viên kho",
    status: "Active",
    phone: "0901234567",
    joinedDate: "01/08/2025",
  },
  {
    id: 6,
    email: "vo.thi.f@example.com",
    name: "Võ Thị F",
    role: "Nhân viên kho",
    department: "Nhân viên kho",
    status: "Active",
    phone: "0912345678",
    joinedDate: "15/07/2025",
  },
  {
    id: 7,
    email: "dang.van.g@example.com",
    name: "Đặng Văn G",
    role: "Nhân viên kho",
    department: "Nhân viên kho",
    status: "Active",
    phone: "0923456789",
    joinedDate: "20/06/2025",
  },
  {
    id: 8,
    email: "bui.thi.h@example.com",
    name: "Bùi Thị H",
    role: "Nhân viên kho",
    department: "Nhân viên kho",
    status: "Inactive",
    phone: "0934567890",
    joinedDate: "10/05/2025",
  },
  {
    id: 9,
    email: "ngo.van.i@example.com",
    name: "Ngô Văn I",
    role: "Nhân viên kho",
    department: "Nhân viên kho",
    status: "Active",
    phone: "0945678901",
    joinedDate: "25/08/2025",
  },
]

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const filterAndSortEmployees = (department) => {
    return allEmployees
      .filter((employee) => {
        const matchesDepartment = employee.department === department
        const matchesSearch =
          employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.role.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesDepartment && matchesSearch
      })
      .sort((a, b) => {
        if (!sortColumn) return 0
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        if (sortDirection === "asc") {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
  }

  const managementEmployees = filterAndSortEmployees("Quản lý")
  const warehouseEmployees = filterAndSortEmployees("Nhân viên kho")
  
  // Count employees by category
  const employeeCounts = {
    sales: 0, // Nhân viên kinh doanh
    salesManager: 0, // Quản lý kinh doanh
    warehouse: warehouseEmployees.length, // Nhân viên kho
    warehouseManager: managementEmployees.length, // Quản lý kho
    enterprise: 0, // Cao doanh nghiệp
    users: allEmployees.length // Tổng người sử dụng
  }

  const SortIcon = ({
    column,
    activeColumn,
    direction,
  }) => {
    if (activeColumn !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />
    }
    return direction === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary" />
    )
  }

  const EmployeeTable = ({ employees, title }) => (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{employees.length}</span> người dùng
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:from-primary/10 hover:via-primary/5 hover:to-transparent border-b-2 border-primary/20">
                <TableHead
                  className="text-foreground font-bold text-sm h-12 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center">
                    Email
                    <SortIcon column="email" activeColumn={sortColumn} direction={sortDirection} />
                  </div>
                </TableHead>
                <TableHead
                  className="text-foreground font-bold text-sm cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Tên nhân viên
                    <SortIcon column="name" activeColumn={sortColumn} direction={sortDirection} />
                  </div>
                </TableHead>
                <TableHead
                  className="text-foreground font-bold text-sm cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center">
                    Chức vụ
                    <SortIcon column="role" activeColumn={sortColumn} direction={sortDirection} />
                  </div>
                </TableHead>
                <TableHead className="text-foreground font-bold text-sm">Số điện thoại</TableHead>
                <TableHead
                  className="text-foreground font-bold text-sm cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Trạng thái
                    <SortIcon column="status" activeColumn={sortColumn} direction={sortDirection} />
                  </div>
                </TableHead>
                <TableHead
                  className="text-foreground font-bold text-sm cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort("joinedDate")}
                >
                  <div className="flex items-center">
                    Ngày tạo
                    <SortIcon column="joinedDate" activeColumn={sortColumn} direction={sortDirection} />
                  </div>
                </TableHead>
                <TableHead className="text-foreground font-bold text-sm text-right">Hoạt động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee, index) => (
                <TableRow
                  key={employee.id}
                  className={`
                    border-border/30 
                    hover:bg-primary/5 
                    transition-all 
                    duration-200 
                    hover:shadow-sm
                    ${index % 2 === 0 ? "bg-muted/20" : "bg-card"}
                  `}
                >
                  <TableCell className="font-medium text-foreground py-4">{employee.email}</TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {employee.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.phone}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        employee.status === "Active"
                          ? "bg-chart-1/20 text-chart-1 border border-chart-1/40"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.joinedDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/15 transition-all duration-200 hover:scale-105"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/15 transition-all duration-200 hover:scale-105"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-105"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-foreground">Quản lý người dùng</h1>
          <Button 
            className="bg-[#237486] hover:bg-[#1e5f6b] h-11 px-6 text-white"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Button>
        </div>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm nhân viên (tên, email, chức vụ)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats and Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart Card - Takes 2/3 of the width */}
          <Card className="xl:col-span-2 bg-card border-border/50">
            <CardContent className="p-0">
              <UserStatsChart />
            </CardContent>
          </Card>

          {/* Action Buttons - Takes 1/3 of the width */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-foreground">Tổng người dùng: {allEmployees.length}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group">
                <div className="flex items-center">
                  <UserPlus className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground">Nhân viên kinh doanh</span>
                </div>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {employeeCounts.sales}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground">Quản lý kinh doanh</span>
                </div>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {employeeCounts.salesManager}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group">
                <div className="flex items-center">
                  <Download className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground">Nhân viên kho</span>
                </div>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {employeeCounts.warehouse}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group">
                <div className="flex items-center">
                  <Settings className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground">Quản lý kho</span>
                </div>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {employeeCounts.warehouseManager}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group">
                <div className="flex items-center">
                  <Download className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground">Chủ doanh nghiệp</span>
                </div>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {employeeCounts.enterprise}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground">Người sử dụng</span>
                </div>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {employeeCounts.users}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <EmployeeTable employees={managementEmployees} title="Danh sách Quản lý" />
        <EmployeeTable employees={warehouseEmployees} title="Danh sách Nhân viên kho" />
      </div>

      {/* Create Account Modal */}
      {isCreateModalOpen && (
        <CreateAccountForm
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            // Có thể thêm logic refresh data ở đây
            console.log("Account created successfully");
          }}
        />
      )}
    </div>
  )
}
