"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, Trash2, UserPlus, Clock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for users
const mockUsers = [
  {
    id: "1",
    name: "Admin User",
    username: "admin",
    role: "admin",
    email: "admin@example.com",
  },
  {
    id: "2",
    name: "Regular User",
    username: "user",
    role: "user",
    email: "user@example.com",
  },
  {
    id: "3",
    name: "John Doe",
    username: "johndoe",
    role: "user",
    email: "john@example.com",
  },
  {
    id: "4",
    name: "Jane Smith",
    username: "janesmith",
    role: "user",
    email: "jane@example.com",
  },
]

type User = {
  id: string
  name: string
  username: string
  role: string
  email: string
}

type ShiftTimeSettings = {
  checkInStart: string
  checkInEnd: string
  checkOutStart: string
  checkOutEnd: string
  overtimeThreshold: string
}

type TimeSettings = {
  Reguler: ShiftTimeSettings
  Pagi: ShiftTimeSettings
  Siang: ShiftTimeSettings
  Malam: ShiftTimeSettings
}

const defaultTimeSettings: TimeSettings = {
  Reguler: {
    checkInStart: "08:00",
    checkInEnd: "08:15",
    checkOutStart: "17:00",
    checkOutEnd: "17:30",
    overtimeThreshold: "17:30",
  },
  Pagi: {
    checkInStart: "06:00",
    checkInEnd: "06:15",
    checkOutStart: "14:00",
    checkOutEnd: "14:30",
    overtimeThreshold: "14:30",
  },
  Siang: {
    checkInStart: "14:00",
    checkInEnd: "14:15",
    checkOutStart: "22:00",
    checkOutEnd: "22:30",
    overtimeThreshold: "22:30",
  },
  Malam: {
    checkInStart: "22:00",
    checkInEnd: "22:15",
    checkOutStart: "06:00",
    checkOutEnd: "06:30",
    overtimeThreshold: "06:30",
  },
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "user",
  })
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [accessSettings, setAccessSettings] = useState({
    allowEmployeeDashboardAccess: true,
    allowEmployeeViewAllRecords: false,
    requirePhotoForCheckIn: true,
    allowLogbookEdit: true,
  })

  const [timeSettings, setTimeSettings] = useState<TimeSettings>(defaultTimeSettings)
  const [isAccessSettingsChanged, setIsAccessSettingsChanged] = useState(false)
  const [isTimeSettingsChanged, setIsTimeSettingsChanged] = useState(false)

  const handleSaveAccessSettings = () => {
    // In a real app, you would save these settings to your backend
    localStorage.setItem("accessSettings", JSON.stringify(accessSettings))
    setSuccessMessage("Pengaturan akses berhasil disimpan")
    setIsAccessSettingsChanged(false)
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleSaveTimeSettings = () => {
    // Validate time settings
    const isValid = Object.entries(timeSettings).every(([shiftName, settings]) => {
      const checkInStart = new Date(`2000-01-01T${settings.checkInStart}:00`)
      const checkInEnd = new Date(`2000-01-01T${settings.checkInEnd}:00`)
      const checkOutStart = new Date(`2000-01-01T${settings.checkOutStart}:00`)
      const checkOutEnd = new Date(`2000-01-01T${settings.checkOutEnd}:00`)

      // For night shift, handle day crossing
      if (shiftName === "Malam") {
        const checkOutStartNext = new Date(`2000-01-02T${settings.checkOutStart}:00`)
        const checkOutEndNext = new Date(`2000-01-02T${settings.checkOutEnd}:00`)
        return checkInStart < checkInEnd && checkOutStartNext < checkOutEndNext
      }

      return checkInStart < checkInEnd && checkOutStart < checkOutEnd
    })

    if (!isValid) {
      setErrorMessage("Pastikan waktu mulai lebih awal dari waktu akhir untuk setiap shift")
      return
    }

    localStorage.setItem("timeSettings", JSON.stringify(timeSettings))
    setSuccessMessage("Pengaturan waktu berhasil disimpan")
    setIsTimeSettingsChanged(false)
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleAccessSettingChange = (key: string, value: boolean) => {
    setAccessSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
    setIsAccessSettingsChanged(true)
  }

  const handleTimeSettingChange = (shift: keyof TimeSettings, field: keyof ShiftTimeSettings, value: string) => {
    setTimeSettings((prev) => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        [field]: value,
      },
    }))
    setIsTimeSettingsChanged(true)
  }

  useEffect(() => {
    // Get current user data from localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setCurrentUser(userData)
        setUsers(mockUsers)

        // Load access settings
        const savedAccessSettings = localStorage.getItem("accessSettings")
        if (savedAccessSettings) {
          setAccessSettings(JSON.parse(savedAccessSettings))
        }

        // Load time settings
        const savedTimeSettings = localStorage.getItem("timeSettings")
        if (savedTimeSettings) {
          setTimeSettings(JSON.parse(savedTimeSettings))
        }
      } catch (e) {
        console.error("Error parsing user data:", e)
      }
    }
  }, [])

  const handleAddUser = () => {
    // Validate form
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      setErrorMessage("Semua field harus diisi")
      return
    }

    // Check if username already exists
    if (users.some((user) => user.username === newUser.username)) {
      setErrorMessage("Username sudah digunakan")
      return
    }

    // Add new user
    const newId = (Math.max(...users.map((user) => Number.parseInt(user.id))) + 1).toString()
    const userToAdd = {
      id: newId,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    }

    setUsers([...users, userToAdd])
    setIsAddDialogOpen(false)
    setNewUser({
      name: "",
      username: "",
      email: "",
      password: "",
      role: "user",
    })
    setSuccessMessage("Pengguna berhasil ditambahkan")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleEditUser = () => {
    if (!editUser) return

    // Validate form
    if (!editUser.name || !editUser.username || !editUser.email) {
      setErrorMessage("Semua field harus diisi")
      return
    }

    // Check if username already exists (excluding the current user)
    if (users.some((user) => user.username === editUser.username && user.id !== editUser.id)) {
      setErrorMessage("Username sudah digunakan")
      return
    }

    // Update user
    const updatedUsers = users.map((user) => (user.id === editUser.id ? editUser : user))

    setUsers(updatedUsers)
    setIsEditDialogOpen(false)
    setEditUser(null)
    setSuccessMessage("Pengguna berhasil diperbarui")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleDeleteUser = () => {
    if (!deleteUserId) return

    // Delete user
    const updatedUsers = users.filter((user) => user.id !== deleteUserId)
    setUsers(updatedUsers)
    setIsDeleteDialogOpen(false)
    setDeleteUserId(null)
    setSuccessMessage("Pengguna berhasil dihapus")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const openEditDialog = (user: User) => {
    setEditUser(user)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (userId: string) => {
    setDeleteUserId(userId)
    setIsDeleteDialogOpen(true)
  }

  // Check if current user is admin
  if (currentUser?.role !== "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola pengaturan aplikasi</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Akses Terbatas</CardTitle>
            <CardDescription>Anda tidak memiliki akses ke halaman ini</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Hanya administrator yang dapat mengakses halaman pengaturan.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengguna dan pengaturan aplikasi</p>
      </div>

      <Tabs defaultValue="access" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="access">Hak Akses</TabsTrigger>
          <TabsTrigger value="time">Pengaturan Waktu</TabsTrigger>
          <TabsTrigger value="users">Manajemen User</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Hak Akses</CardTitle>
              <CardDescription>Kelola hak akses pengguna dalam aplikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Akses Dashboard untuk Pegawai</Label>
                    <p className="text-sm text-muted-foreground">Izinkan pegawai mengakses halaman dashboard</p>
                  </div>
                  <Switch
                    checked={accessSettings.allowEmployeeDashboardAccess}
                    onCheckedChange={(checked) => handleAccessSettingChange("allowEmployeeDashboardAccess", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Lihat Semua Riwayat Absensi</Label>
                    <p className="text-sm text-muted-foreground">
                      Izinkan pegawai melihat riwayat absensi semua karyawan (jika dinonaktifkan, pegawai hanya bisa
                      melihat riwayat pribadi)
                    </p>
                  </div>
                  <Switch
                    checked={accessSettings.allowEmployeeViewAllRecords}
                    onCheckedChange={(checked) => handleAccessSettingChange("allowEmployeeViewAllRecords", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Wajib Foto saat Absen Masuk</Label>
                    <p className="text-sm text-muted-foreground">
                      Wajibkan pengambilan foto lembar absensi dan swafoto saat absen masuk
                    </p>
                  </div>
                  <Switch
                    checked={accessSettings.requirePhotoForCheckIn}
                    onCheckedChange={(checked) => handleAccessSettingChange("requirePhotoForCheckIn", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Edit Logbook</Label>
                    <p className="text-sm text-muted-foreground">
                      Izinkan pegawai mengedit logbook setelah absen keluar
                    </p>
                  </div>
                  <Switch
                    checked={accessSettings.allowLogbookEdit}
                    onCheckedChange={(checked) => handleAccessSettingChange("allowLogbookEdit", checked)}
                  />
                </div>
              </div>

              {isAccessSettingsChanged && (
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveAccessSettings}>Simpan Pengaturan Akses</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pengaturan Waktu Absensi
              </CardTitle>
              <CardDescription>Atur rentang waktu tepat waktu dan keterlambatan untuk setiap shift</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {successMessage && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                {Object.entries(timeSettings).map(([shiftName, settings]) => (
                  <Card key={shiftName} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="text-lg">Shift {shiftName}</CardTitle>
                      <CardDescription>Pengaturan waktu untuk shift {shiftName.toLowerCase()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Check-in Settings */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-green-700">Pengaturan Absen Masuk</h4>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`${shiftName}-checkin-start`}>Waktu Mulai Tepat Waktu</Label>
                              <Input
                                id={`${shiftName}-checkin-start`}
                                type="time"
                                value={settings.checkInStart}
                                onChange={(e) =>
                                  handleTimeSettingChange(
                                    shiftName as keyof TimeSettings,
                                    "checkInStart",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`${shiftName}-checkin-end`}>Batas Waktu Tepat Waktu</Label>
                              <Input
                                id={`${shiftName}-checkin-end`}
                                type="time"
                                value={settings.checkInEnd}
                                onChange={(e) =>
                                  handleTimeSettingChange(shiftName as keyof TimeSettings, "checkInEnd", e.target.value)
                                }
                              />
                              <p className="text-xs text-muted-foreground">Setelah waktu ini dianggap terlambat</p>
                            </div>
                          </div>
                        </div>

                        {/* Check-out Settings */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-blue-700">Pengaturan Absen Keluar</h4>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`${shiftName}-checkout-start`}>Waktu Mulai Absen Keluar</Label>
                              <Input
                                id={`${shiftName}-checkout-start`}
                                type="time"
                                value={settings.checkOutStart}
                                onChange={(e) =>
                                  handleTimeSettingChange(
                                    shiftName as keyof TimeSettings,
                                    "checkOutStart",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`${shiftName}-checkout-end`}>Waktu Normal Pulang</Label>
                              <Input
                                id={`${shiftName}-checkout-end`}
                                type="time"
                                value={settings.checkOutEnd}
                                onChange={(e) =>
                                  handleTimeSettingChange(
                                    shiftName as keyof TimeSettings,
                                    "checkOutEnd",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`${shiftName}-overtime`}>Batas Waktu Lembur</Label>
                              <Input
                                id={`${shiftName}-overtime`}
                                type="time"
                                value={settings.overtimeThreshold}
                                onChange={(e) =>
                                  handleTimeSettingChange(
                                    shiftName as keyof TimeSettings,
                                    "overtimeThreshold",
                                    e.target.value,
                                  )
                                }
                              />
                              <p className="text-xs text-muted-foreground">Setelah waktu ini dianggap lembur</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Time Range Summary */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-sm mb-2">Ringkasan Waktu:</h5>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Tepat Waktu Masuk:</span> {settings.checkInStart} -{" "}
                            {settings.checkInEnd}
                          </p>
                          <p>
                            <span className="font-medium">Terlambat:</span> Setelah {settings.checkInEnd}
                          </p>
                          <p>
                            <span className="font-medium">Normal Keluar:</span> {settings.checkOutStart} -{" "}
                            {settings.checkOutEnd}
                          </p>
                          <p>
                            <span className="font-medium">Lembur:</span> Setelah {settings.overtimeThreshold}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {isTimeSettingsChanged && (
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveTimeSettings}>Simpan Pengaturan Waktu</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manajemen Pengguna</CardTitle>
                <CardDescription>Kelola pengguna yang dapat mengakses aplikasi</CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Tambah Pengguna
              </Button>
            </CardHeader>
            <CardContent>
              {successMessage && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role === "admin" ? "Administrator" : "Pegawai"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(user.id)}
                              disabled={user.id === currentUser?.role}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna</DialogTitle>
            <DialogDescription>Tambahkan pengguna baru ke sistem</DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="user">Pegawai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddUser}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>Edit informasi pengguna</DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {editUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama</Label>
                <Input
                  id="edit-name"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editUser.username}
                  onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value })}>
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="user">Pegawai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditUser}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
