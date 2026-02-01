import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
        <Link href="/">
          <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-indigo-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-slate-900">นโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
        </div>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <p className="text-sm text-slate-500">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}</p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. บทนำ</h2>
            <p>
              DreamAI ("เรา") ตระหนักถึงความสำคัญของการคุ้มครองข้อมูลส่วนบุคคลของท่าน 
              ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) นโยบายฉบับนี้อธิบายวิธีการที่เรารวบรวม 
              ใช้ และเปิดเผยข้อมูลของท่าน
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. ข้อมูลที่เราจัดเก็บ</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>ข้อมูลระบุตัวตน:</strong> อีเมล, วันเกิด, เพศ (สำหรับการยืนยันตัวตนและการวิเคราะห์สถิติ)</li>
              <li><strong>ข้อมูลความฝัน:</strong> เนื้อหาความฝันที่ท่านพิมพ์หรือพูด (ถือเป็นข้อมูลอ่อนไหวทางสุขภาพจิต)</li>
              <li><strong>ข้อมูลการใช้งาน:</strong> Logs, IP Address, และประวัติการเข้าใช้งาน</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. วัตถุประสงค์การใช้ข้อมูล</h2>
            <p>เราใช้ข้อมูลของท่านเพื่อ:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>วิเคราะห์และทำนายผลความฝันด้วยระบบ AI (GPT-4o)</li>
              <li>ประมวลผลสถิติสุขภาพจิตส่วนบุคคล</li>
              <li>ปรับปรุงประสิทธิภาพของโมเดลการเรียนรู้ (Machine Learning) ในรูปแบบไม่ระบุตัวตน (Anonymized Data)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. การส่งต่อข้อมูล</h2>
            <p>
              เราอาจส่งข้อมูลเนื้อหาความฝันของท่านไปยัง OpenAI (ผู้ให้บริการ AI) เพื่อทำการประมวลผล 
              โดยข้อมูลจะถูกส่งผ่านช่องทางที่เข้ารหัส (Encryption) และไม่มีการส่งข้อมูลระบุตัวตน (เช่น ชื่อ หรือ อีเมล) ไปยัง OpenAI
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. สิทธิของท่าน</h2>
            <p>ท่านมีสิทธิในการ:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>ขอเข้าถึงหรือขอรับสำเนาข้อมูลส่วนบุคคลของท่าน</li>
              <li>ขอให้ลบหรือทำลายข้อมูลส่วนบุคคลของท่าน (Right to be Forgotten)</li>
              <li>ระงับการใช้ข้อมูลชั่วคราว</li>
            </ul>
            <p className="mt-4 bg-yellow-50 p-4 rounded-lg text-sm border border-yellow-100">
              ท่านสามารถใช้สิทธิเหล่านี้ได้ผ่านเมนู "การตั้งค่า" ในหน้า Dashboard หรือติดต่อผู้ดูแลระบบที่ admin@dreampsyche.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}