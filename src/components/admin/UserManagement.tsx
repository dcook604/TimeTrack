"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  Shield,
  Mail,
  Calendar,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, ApiResponse } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  createdAt: string;
  profile: {
    id: string;
    fullName: string;
    province: string;
    vacationBalance: number;
    accruedDays: number;
    usedDays: number;
  };
  _count: {
    timesheets: number;
    vacationRequests: number;
  };
}

interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  province: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  vacationBalance: number;
}

interface UpdateUserData {
  email?: string;
  fullName?: string;
  province?: string;
  role?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  vacationBalance?: number;
}

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'EMPLOYEE' | 'MANAGER' | 'ADMIN'>('ALL');

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.profile.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile.province.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const [createFormData, setCreateFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    fullName: '',
    province: '',
    role: 'EMPLOYEE',
    vacationBalance: 15
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateUserData>({
    email: '',
    fullName: '',
    province: '',
    role: 'EMPLOYEE',
    vacationBalance: 15
  });

  // Form validation functions
  const validateCreateForm = () => {
    const errors: string[] = [];
    
    if (!createFormData.email) errors.push('Email is required');
    if (!createFormData.password) errors.push('Password is required');
    if (createFormData.password.length < 6) errors.push('Password must be at least 6 characters');
    if (!createFormData.fullName) errors.push('Full name is required');
    if (!createFormData.province) errors.push('Province is required');
    if (createFormData.vacationBalance < 0) errors.push('Vacation balance must be non-negative');
    
    return errors;
  };

  const validateUpdateForm = () => {
    const errors: string[] = [];
    
    if (updateFormData.email && !updateFormData.email.includes('@')) {
      errors.push('Please enter a valid email address');
    }
    if (updateFormData.fullName && updateFormData.fullName.trim().length === 0) {
      errors.push('Full name cannot be empty');
    }
    if (updateFormData.province && updateFormData.province.trim().length === 0) {
      errors.push('Province cannot be empty');
    }
    if (updateFormData.vacationBalance !== undefined && updateFormData.vacationBalance < 0) {
      errors.push('Vacation balance must be non-negative');
    }
    
    return errors;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getUsers();
      
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError(response.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error while fetching users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    // Validate form
    const validationErrors = validateCreateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createUser(createFormData);
      
      if (response.success && response.data) {
        setSuccessMessage('User created successfully!');
        setShowCreateDialog(false);
        setCreateFormData({
          email: '',
          password: '',
          fullName: '',
          province: '',
          role: 'EMPLOYEE',
          vacationBalance: 15
        });
        fetchUsers(); // Refresh the list
      } else {
        setError(response.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error while creating user');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    // Validate form
    const validationErrors = validateUpdateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.updateUser(editingUser.id, updateFormData);
      
      if (response.success && response.data) {
        setSuccessMessage('User updated successfully!');
        setEditingUser(null);
        setUpdateFormData({
          email: '',
          fullName: '',
          province: '',
          role: 'EMPLOYEE',
          vacationBalance: 15
        });
        fetchUsers(); // Refresh the list
      } else {
        setError(response.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Network error while updating user');
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.deleteUser(deletingUser.id);
      
      if (response.success) {
        setSuccessMessage('User deleted successfully!');
        setDeletingUser(null);
        fetchUsers(); // Refresh the list
      } else {
        setError(response.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error while deleting user');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setUpdateFormData({
      email: user.email,
      fullName: user.profile.fullName,
      province: user.profile.province,
      role: user.role,
      vacationBalance: user.profile.vacationBalance
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'MANAGER':
        return <Badge className="bg-blue-100 text-blue-800">Manager</Badge>;
      case 'EMPLOYEE':
        return <Badge className="bg-green-100 text-green-800">Employee</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading users...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage system users and their roles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchUsers} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system with their role and profile information.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fullName" className="text-right">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={createFormData.fullName}
                      onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="province" className="text-right">
                      Province
                    </Label>
                    <Input
                      id="province"
                      value={createFormData.province}
                      onChange={(e) => setCreateFormData({ ...createFormData, province: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select
                      value={createFormData.role}
                      onValueChange={(value: 'EMPLOYEE' | 'MANAGER' | 'ADMIN') =>
                        setCreateFormData({ ...createFormData, role: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vacationBalance" className="text-right">
                      Vacation Days
                    </Label>
                    <Input
                      id="vacationBalance"
                      type="number"
                      value={createFormData.vacationBalance}
                      onChange={(e) => setCreateFormData({ ...createFormData, vacationBalance: parseInt(e.target.value) })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={loading}>
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <UserCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              System Users ({filteredUsers.length} of {users.length})
            </CardTitle>
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users by name, email, or province..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value: 'ALL' | 'EMPLOYEE' | 'MANAGER' | 'ADMIN') => setRoleFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="EMPLOYEE">Employees</SelectItem>
                  <SelectItem value="MANAGER">Managers</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {users.length === 0 ? 'No users found' : 'No users match your search'}
                </h3>
                <p className="text-muted-foreground">
                  {users.length === 0 ? 'Create your first user to get started.' : 'Try adjusting your search or filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Province</TableHead>
                      <TableHead>Vacation Balance</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.profile.fullName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>{user.profile.province}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{user.profile.vacationBalance} days</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{user._count.timesheets}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{user._count.vacationRequests}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingUser(user)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={updateFormData.email}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-fullName" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="edit-fullName"
                  value={updateFormData.fullName}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, fullName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-province" className="text-right">
                  Province
                </Label>
                <Input
                  id="edit-province"
                  value={updateFormData.province}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, province: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Role
                </Label>
                <Select
                  value={updateFormData.role}
                  onValueChange={(value: 'EMPLOYEE' | 'MANAGER' | 'ADMIN') =>
                    setUpdateFormData({ ...updateFormData, role: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-vacationBalance" className="text-right">
                  Vacation Days
                </Label>
                <Input
                  id="edit-vacationBalance"
                  type="number"
                  value={updateFormData.vacationBalance}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, vacationBalance: parseInt(e.target.value) })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {deletingUser?.profile.fullName}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingUser(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserManagement; 