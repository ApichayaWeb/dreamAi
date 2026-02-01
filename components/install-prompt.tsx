'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Share, PlusSquare } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // เช็คว่าเป็น iOS หรือไม่
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)
    // เช็คว่าติดตั้งแล้วหรือยัง
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // จับ event สำหรับ Android/Desktop
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const installApp = async () => {
    if (isIOS) {
      // iOS ต้องโชว์วิธีทำ Manual
      return 'ios-instruction' 
    }
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  return { isSupported: !!deferredPrompt || isIOS, isInstalled: isStandalone, installApp, isIOS }
}

// Component แจ้งเตือนด้านล่าง (Banner)
export function InstallBanner({ onClose }: { onClose: () => void }) {
  const { installApp, isIOS } = usePWAInstall()
  const [showIOSDialog, setShowIOSDialog] = useState(false)

  const handleInstall = async () => {
    const result = await installApp()
    if (result === 'ios-instruction') {
      setShowIOSDialog(true)
    } else {
      onClose()
    }
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center justify-between animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-bold">ติดตั้ง DreamPsyche</p>
            <p className="text-slate-300 text-xs">ใช้งานได้ลื่นไหลเหมือนแอปจริง</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleInstall} className="text-xs h-8">
            ติดตั้ง
          </Button>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dialog สอนติดตั้งสำหรับ iOS */}
      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>วิธีติดตั้งบน iOS</DialogTitle>
            <DialogDescription>
              เนื่องจากข้อจำกัดของ iOS กรุณาทำตามขั้นตอนดังนี้:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="bg-slate-100 w-8 h-8 flex items-center justify-center rounded-full font-bold">1</span>
              <span>กดปุ่ม <Share className="w-4 h-4 inline mx-1" /> (แชร์) ที่แถบด้านล่าง</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-slate-100 w-8 h-8 flex items-center justify-center rounded-full font-bold">2</span>
              <span>เลือกเมนู <PlusSquare className="w-4 h-4 inline mx-1" /> "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}