"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { calculateAttendanceStatus } from "@/lib/attendance-utils"

// Mock data for attendance history - add logbook entries
const mockAttendanceData = [
  {
    id: 1,
    date: "2023-06-08",
    checkInTime: "08:05:23",
    checkOutTime: "17:02:45",
    name: "John Doe",
    userId: "2",
    shift: "Pagi",
    checkInStatus: "Tepat Waktu",
    checkOutStatus: "Tepat Waktu",
    attendanceSheetPhoto: "/placeholder.svg?height=300&width=400",
    selfiePhoto: "/placeholder.svg?height=300&width=300",
    logbook: [
      "Melakukan review kode program untuk fitur login sistem",
      "Menghadiri meeting dengan tim development untuk diskusi sprint planning",
      "Menyelesaikan dokumentasi API untuk modul user management",
      "Testing dan debugging fitur absensi yang baru dikembangkan",
    ],
  },
  {
    id: 2,
    date: "2023-06-07",
    checkInTime: "08:15:10",
    checkOutTime: "17:00:05",
    name: "John Doe",
    userId: "2",
    shift: "Pagi",
    checkInStatus: "Terlambat",
    checkOutStatus: "Tepat Waktu",
    attendanceSheetPhoto: "/placeholder.svg?height=300&width=400",
    selfiePhoto: "/placeholder.svg?height=300&width=300",
    logbook: [
      "Menyelesaikan task pengembangan dashboard admin",
      "Melakukan code review untuk pull request dari rekan kerja",
      "Mengikuti training internal tentang best practices development",
    ],
  },
  {
    id: 3,
    date: "2023-06-06",
    checkInTime: "14:02:33",
    checkOutTime: "22:05:12",
    name: "Admin User",
    userId: "1",
    shift: "Siang",
    checkInStatus: "Tepat Waktu",
    checkOutStatus: "Tepat Waktu",
    attendanceSheetPhoto: "/placeholder.svg?height=300&width=400",
    selfiePhoto: "/placeholder.svg?height=300&width=300",
    logbook: [
      "Monitoring sistem server dan database performance",
      "Melakukan backup data harian dan weekly report",
      "Koordinasi dengan tim IT untuk maintenance server",
      "Review dan approval untuk request akses user baru",
      "Updating security patches untuk aplikasi production",
    ],
  },
  {
    id: 4,
    date: "2023-06-05",
    checkInTime: "22:01:45",
    checkOutTime: "06:03:22",
    name: "John Doe",
    userId: "2",
    shift: "Malam",
    checkInStatus: "Tepat Waktu",
    checkOutStatus: "Tepat Waktu",
    attendanceSheetPhoto: "/placeholder.svg?height=300&width=400",
    selfiePhoto: "/placeholder.svg?height=300&width=300",
    logbook: [
      "Monitoring sistem aplikasi selama jam operasional malam",
      "Menangani incident report dari user dan memberikan solusi",
      "Melakukan maintenance rutin database dan cleanup log files",
    ],
  },
  {
    id: 5,
    date: "2023-06-04",
    checkInTime: "09:00:12",
    checkOutTime: "17:30:00",
    name: "John Doe",
    userId: "2",
    shift: "Reguler",
    checkInStatus: "Tepat Waktu",
    checkOutStatus: "Lembur",
    attendanceSheetPhoto: "/placeholder.svg?height=300&width=400",
    selfiePhoto: "/placeholder.svg?height=300&width=300",
    logbook: [
      "Mengembangkan fitur baru untuk modul reporting",
      "Melakukan testing integration dengan sistem external",
      "Menyelesaikan dokumentasi teknis untuk deployment",
      "Overtime untuk menyelesaikan deadline project yang urgent",
      "Koordinasi dengan client untuk requirement gathering",
    ],
  },
]

export default function Dashboard() {
  const [user, setUser] = useState<{ name: string; role?: string; id?: string } | null>(null)
  const [attendanceData, setAttendanceData] = useState(mockAttendanceData)
  const [filterShift, setFilterShift] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false)
  const [logbookViewerOpen, setLogbookViewerOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string
    title: string
    date: string
    name: string
  } | null>(null)
  const [selectedLogbook, setSelectedLogbook] = useState<{
    entries: string[]
    date: string
    name: string
    shift: string
    checkInTime: string
    checkOutTime: string
  } | null>(null)
  const [timeSettings, setTimeSettings] = useState<any>(null)

  useEffect(() => {
    // Get user data from localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
      } catch (e) {
        console.error("Error parsing user data:", e)
      }
    }

    // Load time settings
    const savedTimeSettings = localStorage.getItem("timeSettings")
    if (savedTimeSettings) {
      setTimeSettings(JSON.parse(savedTimeSettings))
    }
  }, [])

  // Filter attendance data based on user role, shift and search query
  useEffect(() => {
    // Calculate dynamic status based on time settings
    const processedAttendanceData = mockAttendanceData.map((item) => {
      if (timeSettings) {
        const status = calculateAttendanceStatus(item.checkInTime, item.checkOutTime, item.shift as any, timeSettings)
        return {
          ...item,
          checkInStatus: status.checkInStatus,
          checkOutStatus: status.checkOutStatus,
        }
      }
      return item
    })

    let filteredData = processedAttendanceData

    // Filter by user role - regular users can only see their own data
    if (user?.role === "user") {
      filteredData = filteredData.filter((item) => item.userId === user.id)
    }

    if (filterShift !== "all") {
      filteredData = filteredData.filter((item) => item.shift === filterShift)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredData = filteredData.filter(
        (item) =>
          item.date.includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.shift.toLowerCase().includes(query),
      )
    }

    setAttendanceData(filteredData)
  }, [filterShift, searchQuery, user, timeSettings])

  // Format date to Indonesian format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return new Date(dateString).toLocaleDateString("id-ID", options)
  }

  const openPhotoViewer = (photoUrl: string, title: string, date: string, name: string) => {
    setSelectedPhoto({
      url: photoUrl,
      title,
      date,
      name,
    })
    setPhotoViewerOpen(true)
  }

  const closePhotoViewer = () => {
    setPhotoViewerOpen(false)
    setSelectedPhoto(null)
  }

  const openLogbookViewer = (item: (typeof mockAttendanceData)[0]) => {
    setSelectedLogbook({
      entries: item.logbook,
      date: item.date,
      name: item.name,
      shift: item.shift,
      checkInTime: item.checkInTime,
      checkOutTime: item.checkOutTime,
    })
    setLogbookViewerOpen(true)
  }

  const closeLogbookViewer = () => {
    setLogbookViewerOpen(false)
    setSelectedLogbook(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang, {user?.name || "Pegawai"}! Berikut adalah riwayat absensi Anda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Absensi</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAttendanceData.length}</div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tepat Waktu</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAttendanceData.filter((item) => item.checkInStatus === "Tepat Waktu").length}
            </div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAttendanceData.filter((item) => item.checkInStatus === "Terlambat").length}
            </div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lembur</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAttendanceData.filter((item) => item.checkOutStatus === "Lembur").length}
            </div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Absensi</CardTitle>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari absensi..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterShift} onValueChange={setFilterShift}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Shift</SelectItem>
                <SelectItem value="Reguler">Reguler</SelectItem>
                <SelectItem value="Pagi">Pagi</SelectItem>
                <SelectItem value="Siang">Siang</SelectItem>
                <SelectItem value="Malam">Malam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Tanggal</TableHead>
                  <TableHead className="min-w-[100px]">Jam Masuk</TableHead>
                  <TableHead className="min-w-[100px]">Jam Keluar</TableHead>
                  {user?.role === "admin" && <TableHead className="min-w-[120px]">Nama</TableHead>}
                  <TableHead className="min-w-[80px]">Shift</TableHead>
                  <TableHead className="min-w-[120px]">Status Masuk</TableHead>
                  <TableHead className="min-w-[120px]">Status Keluar</TableHead>
                  <TableHead className="min-w-[100px]">Foto Absen</TableHead>
                  <TableHead className="min-w-[80px]">Swafoto</TableHead>
                  <TableHead className="min-w-[100px]">Logbook</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.length > 0 ? (
                  attendanceData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                      <TableCell>{item.checkInTime}</TableCell>
                      <TableCell>{item.checkOutTime}</TableCell>
                      {user?.role === "admin" && <TableCell>{item.name}</TableCell>}
                      <TableCell>
                        <Badge variant="outline">{item.shift}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.checkInStatus === "Tepat Waktu" ? "default" : "destructive"}>
                          {item.checkInStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.checkOutStatus === "Lembur" ? "secondary" : "default"}>
                          {item.checkOutStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openPhotoViewer(item.attendanceSheetPhoto, "Foto Lembar Absensi", item.date, item.name)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPhotoViewer(item.selfiePhoto, "Swafoto", item.date, item.name)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openLogbookViewer(item)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={user?.role === "admin" ? 10 : 9} className="text-center">
                      Tidak ada data absensi yang ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Photo Viewer Dialog */}
      <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.title}</DialogTitle>
            <DialogDescription>
              {selectedPhoto?.name} - {selectedPhoto?.date && formatDate(selectedPhoto.date)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedPhoto && (
              <img
                src={selectedPhoto.url || "/placeholder.svg"}
                alt={selectedPhoto.title}
                className="max-w-full max-h-96 object-contain rounded-md"
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={closePhotoViewer}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logbook Viewer Dialog */}
      <Dialog open={logbookViewerOpen} onOpenChange={setLogbookViewerOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Logbook Kegiatan
            </DialogTitle>
            <DialogDescription>
              {selectedLogbook?.name} - {selectedLogbook?.date && formatDate(selectedLogbook.date)}
            </DialogDescription>
          </DialogHeader>

          {selectedLogbook && (
            <div className="space-y-4">
              {/* Attendance Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-500">Shift</p>
                  <Badge variant="outline">{selectedLogbook.shift}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Jam Masuk</p>
                  <p className="text-sm font-semibold">{selectedLogbook.checkInTime}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Jam Keluar</p>
                  <p className="text-sm font-semibold">{selectedLogbook.checkOutTime}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Kegiatan</p>
                  <p className="text-sm font-semibold">{selectedLogbook.entries.length} item</p>
                </div>
              </div>

              {/* Logbook Entries */}
              <div>
                <h4 className="font-medium mb-3">Daftar Kegiatan:</h4>
                <ScrollArea className="h-[300px] w-full">
                  <div className="space-y-3">
                    {selectedLogbook.entries.map((entry, index) => (
                      <div key={index} className="flex gap-3 p-3 border rounded-lg bg-white">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 leading-relaxed">{entry}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeLogbookViewer}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
