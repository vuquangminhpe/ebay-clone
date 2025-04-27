import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Edit,
  Lock,
  UserX,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  ShieldX,
  Building,
  Mail,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { UserRole, UserVerifyStatus } from '@/types/User.type'

// Mock users data for demonstration
const mockUsers = [
  {
    _id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    avatar: '/avatar-1.jpg',
    role: UserRole.BUYER,
    verify: UserVerifyStatus.Verified,
    is_seller_verified: false,
    created_at: '2024-02-10T08:30:00Z',
    updated_at: '2024-02-10T08:30:00Z',
    store_id: null,
    last_login: '2024-04-25T16:45:22Z'
  },
  {
    _id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    avatar: '/avatar-2.jpg',
    role: UserRole.SELLER,
    verify: UserVerifyStatus.Verified,
    is_seller_verified: true,
    created_at: '2024-01-15T12:45:00Z',
    updated_at: '2024-03-20T14:10:30Z',
    store_id: 'store-123',
    last_login: '2024-04-26T09:12:33Z'
  },
  {
    _id: '3',
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    username: 'robertj',
    avatar: '/avatar-3.jpg',
    role: UserRole.BUYER,
    verify: UserVerifyStatus.Unverified,
    is_seller_verified: false,
    created_at: '2024-03-05T09:15:00Z',
    updated_at: '2024-03-05T09:15:00Z',
    store_id: null,
    last_login: '2024-04-20T11:33:45Z'
  },
  {
    _id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    username: 'emilyd',
    avatar: '/avatar-4.jpg',
    role: UserRole.SELLER,
    verify: UserVerifyStatus.Verified,
    is_seller_verified: false,
    created_at: '2024-02-20T15:30:00Z',
    updated_at: '2024-03-18T10:22:15Z',
    store_id: 'store-456',
    last_login: '2024-04-24T14:22:18Z'
  },
  {
    _id: '5',
    name: 'Michael Wilson',
    email: 'michael.wilson@example.com',
    username: 'michaelw',
    avatar: '/avatar-5.jpg',
    role: UserRole.ADMIN,
    verify: UserVerifyStatus.Verified,
    is_seller_verified: false,
    created_at: '2023-11-12T11:20:00Z',
    updated_at: '2024-01-30T16:55:40Z',
    store_id: null,
    last_login: '2024-04-26T10:45:02Z'
  },
  {
    _id: '6',
    name: 'Sarah Brown',
    email: 'sarah.brown@example.com',
    username: 'sarahb',
    avatar: '/avatar-6.jpg',
    role: UserRole.BUYER,
    verify: UserVerifyStatus.Banned,
    is_seller_verified: false,
    created_at: '2024-01-08T14:25:00Z',
    updated_at: '2024-03-15T09:30:20Z',
    store_id: null,
    last_login: '2024-03-15T09:30:20Z'
  },
  {
    _id: '7',
    name: 'David Miller',
    email: 'david.miller@example.com',
    username: 'davidm',
    avatar: '/avatar-7.jpg',
    role: UserRole.SELLER,
    verify: UserVerifyStatus.Verified,
    is_seller_verified: true,
    created_at: '2023-12-18T08:55:00Z',
    updated_at: '2024-02-28T11:15:10Z',
    store_id: 'store-789',
    last_login: '2024-04-25T18:40:12Z'
  },
  {
    _id: '8',
    name: 'Lisa Taylor',
    email: 'lisa.taylor@example.com',
    username: 'lisat',
    avatar: '/avatar-8.jpg',
    role: UserRole.BUYER,
    verify: UserVerifyStatus.Unverified,
    is_seller_verified: false,
    created_at: '2024-03-25T16:40:00Z',
    updated_at: '2024-03-25T16:40:00Z',
    store_id: null,
    last_login: null
  }
]

// Recent registrations for the dashboard section
const recentRegistrations = mockUsers.slice(2, 6)

export default function AdminUserManagement() {
  const [users, setUsers] = useState(mockUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Modals state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format time since registration
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge className='bg-purple-100 text-purple-800 border-purple-200'>
            <ShieldCheck className='mr-1 h-3 w-3' />
            Admin
          </Badge>
        )
      case UserRole.SELLER:
        return (
          <Badge className='bg-blue-100 text-blue-800 border-blue-200'>
            <Building className='mr-1 h-3 w-3' />
            Seller
          </Badge>
        )
      case UserRole.BUYER:
        return (
          <Badge variant='outline' className='bg-gray-100 text-gray-800 border-gray-200'>
            Buyer
          </Badge>
        )
      default:
        return <Badge variant='outline'>{role}</Badge>
    }
  }

  // Get status badge
  const getStatusBadge = (status: UserVerifyStatus) => {
    switch (status) {
      case UserVerifyStatus.Verified:
        return (
          <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
            <CheckCircle className='mr-1 h-3 w-3' />
            Verified
          </Badge>
        )
      case UserVerifyStatus.Unverified:
        return (
          <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
            <AlertCircle className='mr-1 h-3 w-3' />
            Unverified
          </Badge>
        )
      case UserVerifyStatus.Banned:
        return (
          <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200'>
            <ShieldX className='mr-1 h-3 w-3' />
            Banned
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  // Filter users based on search query and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    const matchesStatus = statusFilter === 'all' || user.verify.toString() === statusFilter

    // Filter by active tab
    if (activeTab === 'all') {
      return matchesSearch && matchesRole && matchesStatus
    } else if (activeTab === 'buyers') {
      return matchesSearch && user.role === UserRole.BUYER && matchesStatus
    } else if (activeTab === 'sellers') {
      return matchesSearch && user.role === UserRole.SELLER && matchesStatus
    } else if (activeTab === 'admins') {
      return matchesSearch && user.role === UserRole.ADMIN && matchesStatus
    } else if (activeTab === 'unverified') {
      return matchesSearch && user.verify === UserVerifyStatus.Unverified && matchesRole
    } else if (activeTab === 'banned') {
      return matchesSearch && user.verify === UserVerifyStatus.Banned && matchesRole
    }

    return false
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Filtering is already handled by the filteredUsers variable
    // Reset to first page when searching
    setPage(1)
  }

  // Handle user edit
  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  // Handle user ban/unban
  const handleBanUser = (user: any) => {
    setSelectedUser(user)
    setIsBanDialogOpen(true)
  }

  // Handle password reset
  const handleResetPassword = (user: any) => {
    setSelectedUser(user)
    setIsResetPasswordDialogOpen(true)
  }

  // Handle user deletion
  const handleDeleteUser = (user: any) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  // Handle user verification
  const handleVerifyUser = (user: any) => {
    setSelectedUser(user)
    setIsVerifyDialogOpen(true)
  }

  // Mock functions for actions
  const mockSaveEdit = () => {
    toast.success(`User ${selectedUser.name} updated successfully`)
    setIsEditDialogOpen(false)
  }

  const mockResetPassword = () => {
    toast.success(`Password reset email sent to ${selectedUser.email}`)
    setIsResetPasswordDialogOpen(false)
  }

  const mockBanUser = () => {
    // Update the user's status in the state
    const updatedUsers = users.map((user) => {
      if (user._id === selectedUser._id) {
        return {
          ...user,
          verify: user.verify === UserVerifyStatus.Banned ? UserVerifyStatus.Verified : UserVerifyStatus.Banned
        }
      }
      return user
    })

    setUsers(updatedUsers)

    toast.success(
      selectedUser.verify === UserVerifyStatus.Banned
        ? `User ${selectedUser.name} has been unbanned`
        : `User ${selectedUser.name} has been banned`
    )
    setIsBanDialogOpen(false)
  }

  const mockDeleteUser = () => {
    // Remove the user from the state
    const updatedUsers = users.filter((user) => user._id !== selectedUser._id)
    setUsers(updatedUsers)

    toast.success(`User ${selectedUser.name} deleted successfully`)
    setIsDeleteDialogOpen(false)
  }

  const mockVerifyUser = () => {
    // Update the user's status in the state
    const updatedUsers = users.map((user) => {
      if (user._id === selectedUser._id) {
        return {
          ...user,
          verify: UserVerifyStatus.Verified
        }
      }
      return user
    })

    setUsers(updatedUsers)

    toast.success(`User ${selectedUser.name} has been verified`)
    setIsVerifyDialogOpen(false)
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold flex items-center'>
            <Users className='mr-2 h-6 w-6' />
            User Management
          </h1>
          <p className='text-gray-600'>Manage and monitor all users in the system</p>
        </div>

        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => window.location.reload()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          <Button>
            <UserPlus className='mr-2 h-4 w-4' />
            Add User
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-gray-500'>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center'>
              <Users className='h-5 w-5 text-blue-500 mr-1' />
              <p className='text-2xl font-bold'>{users.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-gray-500'>Buyers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center'>
              <Users className='h-5 w-5 text-gray-500 mr-1' />
              <p className='text-2xl font-bold'>{users.filter((user) => user.role === UserRole.BUYER).length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-gray-500'>Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center'>
              <Building className='h-5 w-5 text-indigo-500 mr-1' />
              <p className='text-2xl font-bold'>{users.filter((user) => user.role === UserRole.SELLER).length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-gray-500'>Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center'>
              <ShieldCheck className='h-5 w-5 text-purple-500 mr-1' />
              <p className='text-2xl font-bold'>{users.filter((user) => user.role === UserRole.ADMIN).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
          <CardDescription>New users that recently joined the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {recentRegistrations.map((user) => (
              <div key={user._id} className='border rounded-lg p-4 flex flex-col'>
                <div className='flex items-center mb-3'>
                  <Avatar className='h-10 w-10 mr-3'>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{user.name}</p>
                    <p className='text-sm text-gray-500'>{user.email}</p>
                  </div>
                </div>
                <div className='flex justify-between items-center mt-auto'>
                  <div>{getRoleBadge(user.role)}</div>
                  <div className='text-xs text-gray-500'>{getTimeSince(user.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all users, their roles, and permissions</CardDescription>
            </div>

            <div className='flex flex-col sm:flex-row gap-4'>
              <form className='flex gap-2' onSubmit={handleSearch}>
                <div className='relative flex-1'>
                  <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
                  <Input
                    type='text'
                    placeholder='Search users...'
                    className='pl-8'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type='submit'>Search</Button>
              </form>

              <div className='flex gap-2'>
                <div className='flex items-center gap-2'>
                  <Filter className='h-4 w-4' />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className='w-[130px]'>
                      <SelectValue placeholder='Filter by role' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Roles</SelectItem>
                      <SelectItem value={UserRole.BUYER}>Buyers</SelectItem>
                      <SelectItem value={UserRole.SELLER}>Sellers</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center gap-2'>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='w-[130px]'>
                      <SelectValue placeholder='Filter by status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value={UserVerifyStatus.Verified.toString()}>Verified</SelectItem>
                      <SelectItem value={UserVerifyStatus.Unverified.toString()}>Unverified</SelectItem>
                      <SelectItem value={UserVerifyStatus.Banned.toString()}>Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className='mt-2'>
            <TabsList>
              <TabsTrigger value='all'>All Users</TabsTrigger>
              <TabsTrigger value='buyers'>Buyers</TabsTrigger>
              <TabsTrigger value='sellers'>Sellers</TabsTrigger>
              <TabsTrigger value='admins'>Admins</TabsTrigger>
              <TabsTrigger value='unverified'>Unverified</TabsTrigger>
              <TabsTrigger value='banned'>Banned</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {paginatedUsers.length === 0 ? (
            <div className='text-center py-12'>
              <Users className='h-12 w-12 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-1'>No users found</h3>
              <p className='text-gray-500'>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className='flex items-center'>
                            <Avatar className='h-8 w-8 mr-2'>
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className='font-medium'>{user.name}</div>
                              <div className='text-sm text-gray-500'>{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.verify)}</TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>{formatDate(user.last_login)}</TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' className='h-8 w-8 p-0'>
                                <span className='sr-only'>Open menu</span>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className='mr-2 h-4 w-4' />
                                Edit User
                              </DropdownMenuItem>

                              {user.verify === UserVerifyStatus.Unverified && (
                                <DropdownMenuItem onClick={() => handleVerifyUser(user)}>
                                  <CheckCircle className='mr-2 h-4 w-4' />
                                  Verify User
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                <Lock className='mr-2 h-4 w-4' />
                                Reset Password
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleBanUser(user)}>
                                {user.verify === UserVerifyStatus.Banned ? (
                                  <>
                                    <CheckCircle className='mr-2 h-4 w-4' />
                                    Unban User
                                  </>
                                ) : (
                                  <>
                                    <UserX className='mr-2 h-4 w-4' />
                                    Ban User
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem onClick={() => handleDeleteUser(user)} className='text-red-600'>
                                <Trash2 className='mr-2 h-4 w-4' />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className='flex items-center justify-between mt-4'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm text-gray-500'>Items per page</p>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className='w-[70px]'>
                      <SelectValue placeholder={itemsPerPage.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='5'>5</SelectItem>
                      <SelectItem value='10'>10</SelectItem>
                      <SelectItem value='20'>20</SelectItem>
                      <SelectItem value='50'>50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Simple pagination logic for 5 pages max visibility
                      let pageNum = i + 1
                      if (totalPages > 5) {
                        if (page > 3) {
                          pageNum = page - 3 + i
                        }
                        if (pageNum > totalPages) {
                          pageNum = totalPages - (4 - i)
                        }
                      }

                      return (
                        <PaginationItem key={i}>
                          <PaginationLink onClick={() => setPage(pageNum)} isActive={page === pageNum}>
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Make changes to the user's information and role.</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className='grid gap-4 py-4'>
              <div className='flex items-center gap-4'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>
                    {selectedUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='font-medium'>Current role: {selectedUser.role}</h3>
                  <p className='text-sm text-gray-500'>
                    Status:{' '}
                    {selectedUser.verify === UserVerifyStatus.Verified
                      ? 'Verified'
                      : selectedUser.verify === UserVerifyStatus.Unverified
                        ? 'Unverified'
                        : 'Banned'}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='name' className='text-right'>
                  Name
                </Label>
                <Input id='name' defaultValue={selectedUser.name} className='col-span-3' />
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='username' className='text-right'>
                  Username
                </Label>
                <Input id='username' defaultValue={selectedUser.username} className='col-span-3' />
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='email' className='text-right'>
                  Email
                </Label>
                <Input id='email' defaultValue={selectedUser.email} className='col-span-3' />
              </div>

              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='role' className='text-right'>
                  Role
                </Label>
                <Select defaultValue={selectedUser.role}>
                  <SelectTrigger className='col-span-3'>
                    <SelectValue placeholder='Select a role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.BUYER}>Buyer</SelectItem>
                    <SelectItem value={UserRole.SELLER}>Seller</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedUser.role === UserRole.SELLER && (
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='sellerVerified' className='text-right'>
                    Verified Seller
                  </Label>
                  <div className='col-span-3 flex items-center space-x-2'>
                    <Switch id='sellerVerified' defaultChecked={selectedUser.is_seller_verified} />
                    <Label htmlFor='sellerVerified'>{selectedUser.is_seller_verified ? 'Yes' : 'No'}</Label>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={mockSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Send a password reset email to this user.</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className='grid gap-4 py-4'>
              <div className='flex items-center gap-4'>
                <Mail className='h-12 w-12 text-blue-500' />
                <div>
                  <h3 className='font-medium'>{selectedUser.name}</h3>
                  <p className='text-sm text-gray-500'>{selectedUser.email}</p>
                </div>
              </div>

              <div className='bg-blue-50 text-blue-800 p-4 rounded-md text-sm'>
                <p>
                  A password reset link will be sent to this user's email address. The link will expire in 24 hours.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={mockResetPassword}>Send Reset Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>{selectedUser?.verify === UserVerifyStatus.Banned ? 'Unban User' : 'Ban User'}</DialogTitle>
            <DialogDescription>
              {selectedUser?.verify === UserVerifyStatus.Banned
                ? "This will restore the user's access to the platform."
                : 'This will prevent the user from accessing the platform.'}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className='grid gap-4 py-4'>
              <div className='flex items-center gap-4'>
                {selectedUser.verify === UserVerifyStatus.Banned ? (
                  <CheckCircle className='h-12 w-12 text-green-500' />
                ) : (
                  <UserX className='h-12 w-12 text-red-500' />
                )}
                <div>
                  <h3 className='font-medium'>{selectedUser.name}</h3>
                  <p className='text-sm text-gray-500'>{selectedUser.email}</p>
                </div>
              </div>

              {selectedUser.verify !== UserVerifyStatus.Banned && (
                <div className='bg-red-50 text-red-800 p-4 rounded-md text-sm'>
                  <p>
                    Banned users will not be able to log in or use any features of the platform. This action can be
                    reversed later.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.verify === UserVerifyStatus.Banned ? 'default' : 'destructive'}
              onClick={mockBanUser}
            >
              {selectedUser?.verify === UserVerifyStatus.Banned ? 'Unban User' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The user and all associated data will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className='grid gap-4 py-4'>
              <div className='flex items-center gap-4'>
                <Trash2 className='h-12 w-12 text-red-500' />
                <div>
                  <h3 className='font-medium'>{selectedUser.name}</h3>
                  <p className='text-sm text-gray-500'>{selectedUser.email}</p>
                </div>
              </div>

              <div className='bg-red-50 text-red-800 p-4 rounded-md text-sm'>
                <p>This will permanently delete the user account, including:</p>
                <ul className='list-disc ml-5 mt-2'>
                  <li>Personal information</li>
                  <li>Order history</li>
                  <li>Reviews and feedback</li>
                  {selectedUser.role === UserRole.SELLER && <li>Store and product listings</li>}
                </ul>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox id='confirm-delete' />
                <Label htmlFor='confirm-delete'>I understand this action cannot be undone</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={mockDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify User Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Verify User</DialogTitle>
            <DialogDescription>Manually verify this user's account.</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className='grid gap-4 py-4'>
              <div className='flex items-center gap-4'>
                <CheckCircle className='h-12 w-12 text-green-500' />
                <div>
                  <h3 className='font-medium'>{selectedUser.name}</h3>
                  <p className='text-sm text-gray-500'>{selectedUser.email}</p>
                </div>
              </div>

              <div className='bg-green-50 text-green-800 p-4 rounded-md text-sm'>
                <p>
                  This user account is currently unverified. By manually verifying it, the user will gain full access to
                  all platform features.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={mockVerifyUser}>Verify User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
