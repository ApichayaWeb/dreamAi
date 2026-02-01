import { OpenAI } from 'openai'
import { createClient } from '@/utils/supabase/server' // ✅ Secure Client
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
// ✅ 1. เพิ่ม Regex ตรวจสอบภาษาไทย
const THAI_REGEX = /[\u0E00-\u0E7F]/;

export async function POST(req: Request) {
  try {
    const { dreamText } = await req.json()
    if (!dreamText) return NextResponse.json({ error: 'กรุณาระบุความฝัน' }, { status: 400 })

    // ✅ 2. ตรวจสอบว่าเป็นภาษาไทยหรือไม่
    if (!THAI_REGEX.test(dreamText)) {
        return NextResponse.json({ error: 'ระบบรองรับเฉพาะภาษาไทยครับ' }, { status: 400 })
    }

    // ✅ 3. [สำคัญ] ประกาศตัวแปร analysisMode (ที่หายไป)
    const isSingleWord = dreamText.length < 20 && !dreamText.includes(' ');
    const analysisMode = isSingleWord ? 'single_symbol' : 'full_story';
    const matchThreshold = isSingleWord ? 0.85 : 0.75; 

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    // --- Rate Limit Check ---
    let currentUsageCount = 0;
    if (userId) {
        const today = new Date().toISOString().split('T')[0]
        const { data: usage } = await supabase.from('user_usage').select('request_count').eq('user_id', userId).eq('date', today).single()
        currentUsageCount = usage?.request_count || 0;
        if (currentUsageCount >= 5) return NextResponse.json({ error: 'โควต้าวันนี้เต็มแล้ว (5/5)' }, { status: 429 })
    }

    console.log(`--- Analyzing: ${analysisMode} (User: ${userId || 'Guest'}) ---`)

    // --- Embedding & RAG ---
    const embeddingResponse = await openai.embeddings.create({ model: "text-embedding-3-small", input: dreamText, encoding_format: "float" })
    const embedding = embeddingResponse.data[0].embedding

    const { data: similarDreams } = await supabase.rpc('match_dreams', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: 3,
      user_id_filter: userId 
    })

    // --- Semantic Cache (ตอบทันที) ---
    if (similarDreams && similarDreams.length > 0) {
        const exactMatch = similarDreams.find((d: any) => d.similarity > 0.96);
        if (exactMatch) {
            console.log("⚡ Cache Hit!");
            const { data: cachedInterp } = await supabase.from('interpretations').select('*').eq('dream_id', exactMatch.id).single();
            if (cachedInterp) {
                if (userId) {
                    const today = new Date().toISOString().split('T')[0]
                    await supabase.from('user_usage').upsert({ user_id: userId, date: today, request_count: currentUsageCount + 1 }, { onConflict: 'user_id, date' })
                }
                return NextResponse.json({ analysis: cachedInterp.analysis_text, lucky_numbers: cachedInterp.lucky_numbers?.number_text || "-", is_cached: true })
            }
        }
    }

    // --- Prompt Engineering ---
    const contextText = similarDreams?.length > 0 ? `\n[ประวัติเดิม]: \n${similarDreams.map((d: any) => `- ${d.dream_text}`).join("\n")}` : "";
    
const systemInstruction = isSingleWord 
        ? `คุณคือ ปราชญ์แห่งความฝัน ผู้มีสติปัญญาลุ่มลึกผสมผสานระหว่างโหราศาสตร์ไทยโบราณและหลักจิตวิเคราะห์สมัยใหม่ ภารกิจของคุณคือการตีความความฝันของผู้ใช้ ... (บริบทไทย) ..."
           - ให้ความหมายของสัญลักษณ์ "${dreamText}" ตามหลักจิตวิทยาและโบราณ
           - ไม่ต้องเกริ่นนำ บอกความหมายและเลขมงคลเลย
           - เชื่อมโยงสัญลักษณ์ในฝันเข้ากับชีวิตจริง (การงาน, ความรัก, ความเครียด)
           - หากเป็นคำหยาบ ให้แสดงผลเป็นคำสุภาพ`
        : `คุณคือ "Dream AI" นักจิตวิทยาและโหราศาสตร์
           - วิเคราะห์ความฝันเชื่อมโยงกับอารมณ์ ความเครียด และจิตใต้สำนึก
           - **Dialect:** หากเจอภาษาถิ่น ให้แปลเป็นกลางในใจก่อนวิเคราะห์
           - **Politeness:** แปลงคำหยาบเป็นคำสุภาพเสมอ
           - ใช้ภาษาที่นุ่มนวล ให้กำลังใจ
           ข้อห้ามเด็ดขาด:
- ห้ามทำนายเรื่องความเป็นความตายหรืออุบัติเหตุอย่างฟันธง ให้ใช้การเตือนสติด้วยความระมัดระวังแทน เช่น "ควรเพิ่มความระมัดระวังในการเดินทาง"
- หลีกเลี่ยงหัวข้อที่อ่อนไหว (การเมือง, ศาสนาที่สร้างความขัดแย้ง, การเหยียดเชื้อชาติ) อย่างเคร่งครัด  
          คำสั่งเพิ่มเติม (Research Metrics):
          นอกจากคำทำนายแล้ว จงประเมิน "ระดับสุขภาพจิต" ของผู้ฝันจากเนื้อหาความฝันออกมาเป็นตัวเลข 0-10 (Quantifiable Metrics):
          - stress_score: ความเครียด (0=ผ่อนคลาย, 10=เครียดจัด)
          - anxiety_score: ความกังวล (0=สงบ, 10=วิตกจริต)
          - happiness_score: ความสุข/ความหวัง (0=สิ้นหวัง, 10=เปี่ยมสุข)
          `;

 const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${systemInstruction}
          ${contextText}
          รูปแบบ JSON: { "analysis": "...", "lucky_numbers": "...", "metrics": { "stress": 0, "anxiety": 0, "happiness": 0 }, "tags": ["tag1"] }`
        },
        { role: "user", content: dreamText }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    // --- Save Data ---
    if (userId && !result.analysis.includes("ขออภัย")) {
        const { data: dreamData, error: dreamError } = await supabase.from('dreams').insert({ 
            user_id: userId, 
            dream_text: dreamText, 
            embedding: embedding, 
            tags: result.tags || [] 
        }).select().single()
        
        if (dreamError) console.error("Save Error:", dreamError)

        if (dreamData) {
            await supabase.from('interpretations').insert({
                dream_id: dreamData.id,
                analysis_text: result.analysis,
                lucky_numbers: { number_text: result.lucky_numbers },
                stress_score: result.metrics?.stress || 0,
                anxiety_score: result.metrics?.anxiety || 0,
                happiness_score: result.metrics?.happiness || 0
            })

            const today = new Date().toISOString().split('T')[0]
            await supabase.from('user_usage').upsert({ user_id: userId, date: today, request_count: currentUsageCount + 1 }, { onConflict: 'user_id, date' })
            
            // ✅ จุดที่เคย Error: ตอนนี้ analysisMode มีค่าแล้ว
            await supabase.from('audit_logs').insert({
                user_id: userId,
                action: 'INTERPRET_DREAM',
                details: { 
                    dream_id: dreamData.id, 
                    input_type: analysisMode, // ใช้ตัวแปรที่ประกาศไว้ข้างบน
                    timestamp: new Date().toISOString() 
                }
            })

            if (result.tags) {
                const updates = result.tags.map((tag: string) => supabase.from('symbol_dictionary').upsert({ symbol_word: tag, meaning: `AI Generated`, cultural_context: 'Thai' }, { onConflict: 'symbol_word' }))
                await Promise.all(updates)
            }
        }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}