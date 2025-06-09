"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getTimeRangeDisplay } from "@/lib/attendance-utils"

export default function AttendancePage() {
  const [user, setUser] = useState<{ name: string; id: string } | null>(null)
  const [activeTab, setActiveTab] = useState("check-in")
  const [shift, setShift] = useState("")
  const [backCameraActive, setBackCameraActive] = useState(false)
  const [frontCameraActive, setFrontCameraActive] = useState(false)
  const [backCameraImage, setBackCameraImage] = useState<string | null>(null)
  const [frontCameraImage, setFrontCameraImage] = useState<string | null>(null)
  const [logbookEntries, setLogbookEntries] = useState(["", ""])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [accessSettings, setAccessSettings] = useState({
    requirePhotoForCheckIn: true,
  })
  const [timeSettings, setTimeSettings] = useState<any>(null)

  const backVideoRef = useRef<HTMLVideoElement>(null)
  const frontVideoRef = useRef<HTMLVideoElement>(null)
  const backStreamRef = useRef<MediaStream | null>(null)
  const frontStreamRef = useRef<MediaStream | null>(null)

  const router = useRouter()

  useEffect(() => {
    // Get user data and access settings from localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)

        // Load access settings
        const savedSettings = localStorage.getItem("accessSettings")
        if (savedSettings) {
          setAccessSettings(JSON.parse(savedSettings))
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

  // Clean up camera streams when component unmounts
  useEffect(() => {
    return () => {
      if (backStreamRef.current) {
        backStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (frontStreamRef.current) {
        frontStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startBackCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      if (backVideoRef.current) {
        backVideoRef.current.srcObject = stream
        backStreamRef.current = stream
        setBackCameraActive(true)
      }
    } catch (err) {
      console.error("Error accessing back camera:", err)
      setErrorMessage("Gagal mengakses kamera belakang. Pastikan Anda memberikan izin kamera.")
    }
  }

  const startFrontCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })

      if (frontVideoRef.current) {
        frontVideoRef.current.srcObject = stream
        frontStreamRef.current = stream
        setFrontCameraActive(true)
      }
    } catch (err) {
      console.error("Error accessing front camera:", err)
      setErrorMessage("Gagal mengakses kamera depan. Pastikan Anda memberikan izin kamera.")
    }
  }

  const captureBackCamera = () => {
    if (backVideoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = backVideoRef.current.videoWidth
      canvas.height = backVideoRef.current.videoHeight
      const ctx = canvas.getContext("2d")

      if (ctx) {
        ctx.drawImage(backVideoRef.current, 0, 0, canvas.width, canvas.height)
        const imageDataUrl = canvas.toDataURL("image/png")
        setBackCameraImage(imageDataUrl)
      }

      // Stop the camera stream
      if (backStreamRef.current) {
        backStreamRef.current.getTracks().forEach((track) => track.stop())
        setBackCameraActive(false)
      }
    }
  }

  const captureFrontCamera = () => {
    if (frontVideoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = frontVideoRef.current.videoWidth
      canvas.height = frontVideoRef.current.videoHeight
      const ctx = canvas.getContext("2d")

      if (ctx) {
        ctx.drawImage(frontVideoRef.current, 0, 0, canvas.width, canvas.height)
        const imageDataUrl = canvas.toDataURL("image/png")
        setFrontCameraImage(imageDataUrl)
      }

      // Stop the camera stream
      if (frontStreamRef.current) {
        frontStreamRef.current.getTracks().forEach((track) => track.stop())
        setFrontCameraActive(false)
      }
    }
  }

  const resetBackCamera = () => {
    setBackCameraImage(null)
    if (backStreamRef.current) {
      backStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    setBackCameraActive(false)
  }

  const resetFrontCamera = () => {
    setFrontCameraImage(null)
    if (frontStreamRef.current) {
      frontStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    setFrontCameraActive(false)
  }

  const handleLogbookChange = (index: number, value: string) => {
    const newEntries = [...logbookEntries]
    newEntries[index] = value
    setLogbookEntries(newEntries)
  }

  const addLogbookEntry = () => {
    setLogbookEntries([...logbookEntries, ""])
  }

  const removeLogbookEntry = (index: number) => {
    if (logbookEntries.length <= 2) {
      setErrorMessage("Minimal harus ada 2 entri logbook")
      return
    }

    const newEntries = [...logbookEntries]
    newEntries.splice(index, 1)
    setLogbookEntries(newEntries)
  }

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    // Validate form
    if (!shift) {
      setErrorMessage("Silakan pilih shift terlebih dahulu")
      return
    }

    // Only require photos if setting is enabled
    if (accessSettings.requirePhotoForCheckIn) {
      if (!backCameraImage) {
        setErrorMessage("Silakan ambil foto lembar absensi")
        return
      }

      if (!frontCameraImage) {
        setErrorMessage("Silakan ambil swafoto")
        return
      }
    }

    setIsSubmitting(true)

    try {
      // In a real app, you would send this data to your backend
      // This is a mock submission for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccessMessage("Absen masuk berhasil dicatat!")

      // Reset form after successful submission
      setTimeout(() => {
        setShift("")
        setBackCameraImage(null)
        setFrontCameraImage(null)
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      console.error("Error submitting check-in:", err)
      setErrorMessage("Terjadi kesalahan saat mencatat absen masuk")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    // Validate form
    const emptyEntries = logbookEntries.filter((entry) => !entry.trim())
    if (emptyEntries.length > 0) {
      setErrorMessage("Semua entri logbook harus diisi")
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, you would send this data to your backend
      // This is a mock submission for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Store logbook entries (in a real app, this would be sent to backend)
      const checkOutData = {
        userId: user?.id || "unknown",
        name: user?.name || "Unknown",
        date: new Date().toISOString().split("T")[0],
        checkOutTime: new Date().toLocaleTimeString("id-ID"),
        logbook: logbookEntries.filter((entry) => entry.trim()),
        timestamp: new Date().toISOString(),
      }

      console.log("Check-out data with logbook:", checkOutData)

      setSuccessMessage("Absen keluar berhasil dicatat!")

      // Reset form after successful submission
      setTimeout(() => {
        setLogbookEntries(["", ""])
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      console.error("Error submitting check-out:", err)
      setErrorMessage("Terjadi kesalahan saat mencatat absen keluar")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Absensi</h1>
        <p className="text-muted-foreground">Silakan lakukan absensi masuk atau keluar</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="check-in">Absen Masuk</TabsTrigger>
          <TabsTrigger value="check-out">Absen Keluar</TabsTrigger>
        </TabsList>

        <TabsContent value="check-in">
          <Card>
            <CardHeader>
              <CardTitle>Absen Masuk</CardTitle>
              <CardDescription>Isi form berikut untuk melakukan absen masuk</CardDescription>
            </CardHeader>
            <form onSubmit={handleCheckIn}>
              <CardContent className="space-y-4">
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

                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input id="name" value={user?.name || ""} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift">Shift</Label>
                  <Select value={shift} onValueChange={setShift}>
                    <SelectTrigger id="shift">
                      <SelectValue placeholder="Pilih shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reguler">Reguler</SelectItem>
                      <SelectItem value="Pagi">Pagi</SelectItem>
                      <SelectItem value="Siang">Siang</SelectItem>
                      <SelectItem value="Malam">Malam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {shift && timeSettings && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Informasi Waktu Shift {shift}</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>
                        <span className="font-medium">Tepat Waktu Masuk:</span>{" "}
                        {getTimeRangeDisplay(shift as any, timeSettings).checkInRange}
                      </p>
                      <p>
                        <span className="font-medium">Terlambat Setelah:</span>{" "}
                        {getTimeRangeDisplay(shift as any, timeSettings).lateAfter}
                      </p>
                      <p>
                        <span className="font-medium">Waktu Pulang Normal:</span>{" "}
                        {getTimeRangeDisplay(shift as any, timeSettings).normalCheckOut}
                      </p>
                      <p>
                        <span className="font-medium">Lembur Setelah:</span>{" "}
                        {getTimeRangeDisplay(shift as any, timeSettings).overtimeAfter}
                      </p>
                    </div>
                  </div>
                )}

                {accessSettings.requirePhotoForCheckIn && (
                  <>
                    <div className="space-y-2">
                      <Label>Foto Lembar Absensi (Kamera Belakang)</Label>
                      {!backCameraImage ? (
                        <div className="border rounded-md p-4">
                          {backCameraActive ? (
                            <div className="space-y-4">
                              <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
                                <video ref={backVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                              </div>
                              <div className="flex justify-center">
                                <Button type="button" onClick={captureBackCamera} variant="secondary">
                                  Ambil Foto
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                              <Button type="button" onClick={startBackCamera} variant="secondary">
                                Aktifkan Kamera Belakang
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative aspect-video w-full overflow-hidden rounded-md">
                            <img
                              src={backCameraImage || "/placeholder.svg"}
                              alt="Lembar Absensi"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <Button type="button" onClick={resetBackCamera} variant="outline" className="w-full">
                            Ambil Ulang
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Swafoto (Kamera Depan)</Label>
                      {!frontCameraImage ? (
                        <div className="border rounded-md p-4">
                          {frontCameraActive ? (
                            <div className="space-y-4">
                              <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
                                <video
                                  ref={frontVideoRef}
                                  autoPlay
                                  playsInline
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex justify-center">
                                <Button type="button" onClick={captureFrontCamera} variant="secondary">
                                  Ambil Foto
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                              <Button type="button" onClick={startFrontCamera} variant="secondary">
                                Aktifkan Kamera Depan
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative aspect-video w-full overflow-hidden rounded-md">
                            <img
                              src={frontCameraImage || "/placeholder.svg"}
                              alt="Swafoto"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <Button type="button" onClick={resetFrontCamera} variant="outline" className="w-full">
                            Ambil Ulang
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Memproses..." : "Absen Masuk"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="check-out">
          <Card>
            <CardHeader>
              <CardTitle>Absen Keluar</CardTitle>
              <CardDescription>Isi logbook kegiatan untuk melakukan absen keluar</CardDescription>
            </CardHeader>
            <form onSubmit={handleCheckOut}>
              <CardContent className="space-y-4">
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

                <div className="space-y-2">
                  <Label htmlFor="name-checkout">Nama</Label>
                  <Input id="name-checkout" value={user?.name || ""} disabled />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Logbook Kegiatan</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLogbookEntry}>
                      <Plus className="h-4 w-4 mr-1" /> Tambah Entri
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {logbookEntries.map((entry, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Textarea
                          placeholder={`Kegiatan ${index + 1}`}
                          value={entry}
                          onChange={(e) => handleLogbookChange(index, e.target.value)}
                          className="flex-1"
                        />
                        {logbookEntries.length > 2 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeLogbookEntry(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Memproses..." : "Absen Keluar"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
