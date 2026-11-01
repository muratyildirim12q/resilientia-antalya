import pptx
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
import os
import shutil

src_pptx = r'C:\Users\sy827\.gemini\antigravity\scratch\resilientia-antalya\template.pptx'

logo_path = r'C:\Users\sy827\.gemini\antigravity\scratch\resilientia-antalya\resilientia_logo_transparent.png'
user_photo = r'C:\Users\sy827\.gemini\antigravity\brain\3793f3e7-f3a6-4de2-b3e8-5065a64f8737\.user_uploaded\media_1793549730653_425f6615.png'
screenshot_fresh = r'C:\Users\sy827\.gemini\antigravity\scratch\resilientia-antalya\game_screenshot_fresh.png'
video_cover = r'C:\Users\sy827\.gemini\antigravity\scratch\resilientia-antalya\video_player_cover.png'
video_file = r'C:\Users\sy827\.gemini\antigravity\scratch\resilientia-antalya\gameplay_video.mp4'

DRIVE_VIDEO_URL = 'https://drive.google.com/file/d/1OJIaaDKy74bi-f7sUYUExSnKnAuJ9S4Y/view?usp=sharing'
VERCEL_URL = 'https://resilientia-antalya.vercel.app'
GITHUB_URL = 'https://github.com/muratyildirim12q/resilientia-antalya'

DARK_NAVY = RGBColor(0x1e, 0x29, 0x3b)
TEXT_MUTED = RGBColor(0x47, 0x55, 0x69)
CYAN_ACCENT = RGBColor(0x02, 0x84, 0xc7)
EMERALD_GREEN = RGBColor(0x05, 0x96, 0x69)

def set_text(shape, text, font_size=20, bold=False, color=DARK_NAVY, align=PP_ALIGN.LEFT, link=None):
    tf = shape.text_frame
    tf.word_wrap = True
    tf.clear()
    p = tf.paragraphs[0]
    p.text = text
    p.alignment = align
    if p.runs:
        run = p.runs[0]
        run.font.name = 'Arial'
        run.font.size = Pt(font_size)
        run.font.bold = bold
        run.font.color.rgb = color
        if link:
            run.hyperlink.address = link
    return p

def set_multiline(shape, lines):
    tf = shape.text_frame
    tf.word_wrap = True
    tf.clear()
    for i, line_data in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        
        p.text = line_data.get('text', '')
        p.alignment = line_data.get('align', PP_ALIGN.LEFT)
        if p.runs:
            run = p.runs[0]
            run.font.name = 'Arial'
            run.font.size = Pt(line_data.get('size', 14))
            run.font.bold = line_data.get('bold', False)
            run.font.color.rgb = line_data.get('color', TEXT_MUTED)
            if line_data.get('link'):
                run.hyperlink.address = line_data.get('link')

def build_presentation(embed_video=False):
    prs = pptx.Presentation(src_pptx)

    # === SLIDE 1: KAPAK (LOGO SOLDA) ===
    s1 = prs.slides[0]
    shapes_to_remove_s1 = [s for s in s1.shapes if s.name == 'Grafik 8']
    for s in shapes_to_remove_s1:
        s1.shapes._spTree.remove(s._element)

    for shape in s1.shapes:
        if shape.name == 'Metin kutusu 10':
            shape.left = Emu(5800000)
            shape.top = Emu(2400000)
            shape.width = Emu(6000000)
            shape.height = Emu(900000)
            set_text(shape, 'RESILIENTIA: ANTALYA 2031', font_size=30, bold=True, color=DARK_NAVY)
        elif shape.name == 'Metin kutusu 11':
            shape.left = Emu(5800000)
            shape.top = Emu(3450000)
            shape.width = Emu(6000000)
            shape.height = Emu(1400000)
            set_text(shape, 'Akdeniz Havzası için 3B İklim Dirençli Sünger Şehir ve Kentsel Dayanıklılık Simülasyonu', font_size=18, bold=False, color=TEXT_MUTED)

    if os.path.exists(logo_path):
        s1.shapes.add_picture(logo_path, Emu(1000000), Emu(1650000), width=Emu(3800000), height=Emu(3800000))

    # === SLIDE 2: ODAK TEMA ===
    s2 = prs.slides[1]
    for shape in s2.shapes:
        if shape.name == 'Metin kutusu 5':
            lines = [
                {'text': 'Projede Bütünleştirilen Hackathon Temaları:', 'size': 16, 'bold': True, 'color': CYAN_ACCENT},
                {'text': '', 'size': 6},
                {'text': '1. İklim Dirençli Şehirler (Ana Odak):', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': 'Ani sağanak ve taşkınlara karşı sünger parklar, yağmur hendekleri ve aşırı sıcak dalgalarını kırıcı yeşil koridorlar.', 'size': 12, 'bold': False, 'color': TEXT_MUTED},
                {'text': '', 'size': 5},
                {'text': '2. Sıfır Atık (Kentsel Hijyen ve Drenaj):', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': 'Mazgalların ve su kanallarının tıkanmasını önleyen 2 personelli sokak çöp toplama ve döngüsel atık yönetimi.', 'size': 12, 'bold': False, 'color': TEXT_MUTED},
                {'text': '', 'size': 5},
                {'text': '3. Okyanuslar ve Denizler (Kıyı Koruma):', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': 'Akdeniz kıyısında deniz çöplerini toplayan otonom güneş enerjili katamaran ve Caretta Caretta yaşam alanları.', 'size': 12, 'bold': False, 'color': TEXT_MUTED},
                {'text': '', 'size': 5},
                {'text': '4. Yenilenebilir Enerji & İklim Eğitimi:', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': 'Güneş enerjili saha operasyonları ve Danışman Murat Bey rehberliğinde interaktif kentsel iklim bilinci.', 'size': 12, 'bold': False, 'color': TEXT_MUTED}
            ]
            shape.left = Emu(793214)
            shape.top = Emu(1700000)
            shape.width = Emu(5400000)
            shape.height = Emu(4800000)
            set_multiline(shape, lines)

    # === SLIDE 3: OYUN HİKAYESİ ===
    s3 = prs.slides[2]
    for shape in s3.shapes:
        if shape.name == 'Metin kutusu 5':
            lines = [
                {'text': 'Antalya Afet Koordinasyon Merkezi (AKOM) Görevde:', 'size': 16, 'bold': True, 'color': CYAN_ACCENT},
                {'text': '', 'size': 6},
                {'text': 'Yıl 2031. Akdeniz Havzası\'nda iklim krizi etkisini artırmış, rekor sıcak dalgaları ve ani sağanak yağışlar Antalya\'yı tehdit etmektedir.', 'size': 13, 'bold': False, 'color': DARK_NAVY},
                {'text': '', 'size': 5},
                {'text': 'Oyuncu, kentin AKOM kriz yönetiminin başına geçer. Şehir Danışmanı Murat Bey\'in bilimsel yönlendirmeleri doğrultusunda:', 'size': 13, 'bold': False, 'color': DARK_NAVY},
                {'text': '• Beton zeminleri yağmur suyunu emen sünger parklara dönüştürür.', 'size': 12, 'bold': False, 'color': TEXT_MUTED},
                {'text': '• Karadaki çöp toplama ekipleriyle mazgalların açık kalmasını sağlar.', 'size': 12, 'bold': False, 'color': TEXT_MUTED},
                {'text': '• Güneş enerjili deniz katamaranıyla körfezi temizler.', 'size': 12, 'bold': False, 'color': TEXT_MUTED},
                {'text': '', 'size': 5},
                {'text': 'Hedef: Kenti sıfır can kaybı ve minimum hasarla COP31 Zirvesi\'nin örnek dirençli model şehrine dönüştürmektir.', 'size': 13, 'bold': True, 'color': EMERALD_GREEN}
            ]
            shape.left = Emu(793214)
            shape.top = Emu(1700000)
            shape.width = Emu(5400000)
            shape.height = Emu(4800000)
            set_multiline(shape, lines)

    # === SLIDE 4: OYUN TÜRÜ ===
    s4 = prs.slides[3]
    for shape in s4.shapes:
        if shape.name == 'Metin kutusu 5':
            lines = [
                {'text': 'Tür: 3B İzometrik Kentsel Strateji & İklim Simülasyonu', 'size': 16, 'bold': True, 'color': CYAN_ACCENT},
                {'text': '', 'size': 6},
                {'text': 'Özgün Değerimiz ve Mekanikler:', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': 'Klasik "bina yap ve bekle" modellerinin aksine, oyuncunun her kentsel hamlesinin anlık hidrolojik ve çevresel sonuç doğurduğu yaşayan bir sistem.', 'size': 13, 'bold': False, 'color': TEXT_MUTED},
                {'text': '', 'size': 5},
                {'text': '• Dinamik Taşkın Fiziği: Yükselen sel sularında araçlar yolda durur, dörtlü flaşör yakar; sünger parklar ve mazgallar suyu tahliye eder.', 'size': 12, 'bold': False, 'color': DARK_NAVY},
                {'text': '', 'size': 5},
                {'text': '• Canlı Saha Ekipleri: Karada 2 personelli sokak çöp kamyonu, denizde otonom güneş enerjili temizlik katamaranı.', 'size': 12, 'bold': False, 'color': DARK_NAVY},
                {'text': '', 'size': 5},
                {'text': '• Sezgisel Yönetim: Tek tıkla afet yönetimi, sol tıkla serbest kamera kontrolü ve interaktif danışman sistemi.', 'size': 12, 'bold': False, 'color': DARK_NAVY}
            ]
            shape.left = Emu(793214)
            shape.top = Emu(1700000)
            shape.width = Emu(5300000)
            shape.height = Emu(4800000)
            set_multiline(shape, lines)

    # === SLIDE 5: OYUN OYNANIŞ VİDEOSU ===
    s5 = prs.slides[4]
    for shape in s5.shapes:
        if shape.name == 'Metin kutusu 5':
            lines = [
                {'text': 'RESILIENTIA: ANTALYA 2031 — Oynanış Demosu', 'size': 17, 'bold': True, 'color': DARK_NAVY, 'align': PP_ALIGN.CENTER},
                {'text': 'Oynanış Videosunu İzle (Google Drive 1080p 60fps)', 'size': 14, 'bold': True, 'color': CYAN_ACCENT, 'align': PP_ALIGN.CENTER, 'link': DRIVE_VIDEO_URL},
                {'text': 'Canlı Oyun (Vercel): ' + VERCEL_URL + '  |  GitHub: ' + GITHUB_URL, 'size': 12, 'bold': False, 'color': DARK_NAVY, 'align': PP_ALIGN.CENTER},
                {'text': '(İpucu: Videoyu açmak için görselin veya bağlantının üzerine tıklayabilirsiniz.)', 'size': 11, 'bold': False, 'color': TEXT_MUTED, 'align': PP_ALIGN.CENTER}
            ]
            shape.top = Emu(5300000)
            shape.left = Emu(1000000)
            shape.width = Emu(10200000)
            shape.height = Emu(1300000)
            set_multiline(shape, lines)

    # Video area: Either embed actual movie or place interactive clickable player cover
    video_left, video_top = Emu(2000000), Emu(1650000)
    video_w, video_h = Emu(8200000), Emu(3550000)

    if embed_video and os.path.exists(video_file) and os.path.exists(video_cover):
        s5.shapes.add_movie(video_file, video_left, video_top, video_w, video_h, poster_frame_image=video_cover, mime_type='video/mp4')
    elif os.path.exists(video_cover):
        pic = s5.shapes.add_picture(video_cover, video_left, video_top, width=video_w, height=video_h)
        pic.click_action.hyperlink.address = DRIVE_VIDEO_URL

    # === SLIDE 6: OYUNUMUZDAN SAHNELER ===
    s6 = prs.slides[5]
    shapes_to_remove_s6 = [s for s in s6.shapes if s.name == 'Resim 4']
    for s in shapes_to_remove_s6:
        s6.shapes._spTree.remove(s._element)

    for shape in s6.shapes:
        if shape.name == 'Metin kutusu 20':
            lines = [
                {'text': 'Canlı Simülasyon Özellikleri:', 'size': 16, 'bold': True, 'color': CYAN_ACCENT},
                {'text': '', 'size': 5},
                {'text': '• 3B Düşük Poligonlu Akdeniz Şehri', 'size': 13, 'bold': False, 'color': DARK_NAVY},
                {'text': '• Dinamik Su Seviyesi & Taşkın Fiziği', 'size': 13, 'bold': False, 'color': DARK_NAVY},
                {'text': '• Sünger Parklar ve Yağmur Mazgalları', 'size': 13, 'bold': False, 'color': DARK_NAVY},
                {'text': '• 2 Personelli Sokak Çöp Kamyonu', 'size': 13, 'bold': False, 'color': DARK_NAVY},
                {'text': '• Otonom Güneş Enerjili Katamaran', 'size': 13, 'bold': False, 'color': DARK_NAVY},
                {'text': '• Caretta Carettalar & Kıyı Ekolojisi', 'size': 13, 'bold': False, 'color': DARK_NAVY},
                {'text': '• Danışman Murat Bey Erken Uyarıları', 'size': 13, 'bold': False, 'color': DARK_NAVY}
            ]
            shape.left = Emu(752272)
            shape.top = Emu(1700000)
            shape.width = Emu(3600000)
            shape.height = Emu(4500000)
            set_multiline(shape, lines)

    if os.path.exists(screenshot_fresh):
        s6.shapes.add_picture(screenshot_fresh, Emu(4500000), Emu(1700000), width=Emu(7200000), height=Emu(4050000))

    # === SLIDE 7: EKİP ===
    s7 = prs.slides[6]
    dummy_shape_names = [
        'Grafik 21', 'Grafik 22', 'Grafik 23', 'Grafik 24',
        'Metin kutusu 12', 'Metin kutusu 14', 'Metin kutusu 16',
        'Metin kutusu 18', 'Metin kutusu 19', 'Metin kutusu 20'
    ]
    shapes_to_remove_s7 = [s for s in s7.shapes if s.name in dummy_shape_names]
    for s in shapes_to_remove_s7:
        s7.shapes._spTree.remove(s._element)

    if os.path.exists(user_photo):
        s7.shapes.add_picture(user_photo, Emu(1200000), Emu(1750000), width=Emu(3000000), height=Emu(3000000))

    for shape in s7.shapes:
        if shape.name == 'Metin kutusu 13':
            shape.left = Emu(4600000)
            shape.top = Emu(1750000)
            shape.width = Emu(6800000)
            shape.height = Emu(800000)
            set_text(shape, 'Murat Yıldırım', font_size=26, bold=True, color=DARK_NAVY)
        elif shape.name == 'Metin kutusu 17':
            shape.left = Emu(4600000)
            shape.top = Emu(2550000)
            shape.width = Emu(6800000)
            shape.height = Emu(3800000)
            lines = [
                {'text': 'Solo Oyun Geliştirici & Tasarımcı', 'size': 16, 'bold': True, 'color': CYAN_ACCENT},
                {'text': '', 'size': 6},
                {'text': 'Öğrenim: İstanbul Üniversitesi — Web Tasarım ve Programlama (Ön Lisans)', 'size': 14, 'bold': False, 'color': DARK_NAVY},
                {'text': 'Deneyim & Etkinlikler: ÜretJam Katılımcısı', 'size': 14, 'bold': False, 'color': DARK_NAVY},
                {'text': '', 'size': 6},
                {'text': 'Projedeki Sorumluluklar:', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': '• Oyun Tasarımı, Seviye Mimarisi ve İklim Senaryoları', 'size': 13, 'bold': False, 'color': TEXT_MUTED},
                {'text': '• Three.js ile 3B WebGL Kentsel Simülasyon Motoru Kodlaması', 'size': 13, 'bold': False, 'color': TEXT_MUTED},
                {'text': '• Hidrolojik Su Fiziği, Çöp Kamyonu ve Katamaran Operasyon Mekanikleri', 'size': 13, 'bold': False, 'color': TEXT_MUTED},
                {'text': '• UI / UX Arayüz Tasarımı ve Web Dağıtımı (Vercel & GitHub)', 'size': 13, 'bold': False, 'color': TEXT_MUTED}
            ]
            set_multiline(shape, lines)

    # === SLIDE 8: GELECEK PLANLARINIZ ===
    s8 = prs.slides[7]
    for shape in s8.shapes:
        if shape.name == 'Metin kutusu 25':
            lines = [
                {'text': 'Aşama 1 (1 - 2 Ay) — Mobil Dokunmatik Arayüz & Cilalama:', 'size': 14, 'bold': True, 'color': CYAN_ACCENT},
                {'text': '• Tablet ve mobil cihazlar için optimize edilmiş dokunmatik kamera kontrolleri.', 'size': 12, 'bold': False, 'color': DARK_NAVY},
                {'text': '• Dinamik ortam ses efektleri (yağmur, fırtına, araç kornası, dalga sesleri).', 'size': 12, 'bold': False, 'color': DARK_NAVY},
                {'text': '', 'size': 5},
                {'text': 'Aşama 2 (2 - 4 Ay) — Antalya İlçe Senaryoları & Afet Çeşitliliği:', 'size': 14, 'bold': True, 'color': CYAN_ACCENT},
                {'text': '• Konyaaltı Falez Erozyonu ve deniz seviyesi yükselmesi senaryosu.', 'size': 12, 'bold': False, 'color': DARK_NAVY},
                {'text': '• Alanya / Manavgat bölgesi için orman yangını sonrası ani sel rehabilitasyonu.', 'size': 12, 'bold': False, 'color': DARK_NAVY},
                {'text': '', 'size': 5},
                {'text': 'Aşama 3 (4 - 6 Ay) — Bağımsız Dağıtım & Eğitim Modülü:', 'size': 14, 'bold': True, 'color': CYAN_ACCENT},
                {'text': '• Itch.io ve bağımsız web portallarında genel oyuncu kitlesine ücretsiz erişim.', 'size': 12, 'bold': False, 'color': DARK_NAVY},
                {'text': '• Okullar ve belediyeler için kentsel iklim bilinci atölye simülasyon kiti.', 'size': 12, 'bold': False, 'color': DARK_NAVY}
            ]
            shape.left = Emu(793215)
            shape.top = Emu(1700000)
            shape.width = Emu(5800000)
            shape.height = Emu(4800000)
            set_multiline(shape, lines)

    # === SLIDE 9: OYUNA İLİŞKİN LİNKLER & KAYNAKLAR ===
    s9 = prs.slides[8]
    for shape in s9.shapes:
        if shape.name == 'Metin kutusu 4':
            lines = [
                {'text': 'Proje Bağlantıları ve Teknolojik Altyapı:', 'size': 16, 'bold': True, 'color': CYAN_ACCENT},
                {'text': '', 'size': 6},
                {'text': 'Oynanış Videosu (Google Drive 1080p 60fps):', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': DRIVE_VIDEO_URL, 'size': 12, 'bold': False, 'color': CYAN_ACCENT, 'link': DRIVE_VIDEO_URL},
                {'text': '', 'size': 5},
                {'text': 'Canlı Web Oyunu (Vercel):', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': VERCEL_URL, 'size': 12, 'bold': False, 'color': CYAN_ACCENT, 'link': VERCEL_URL},
                {'text': '', 'size': 5},
                {'text': 'GitHub Kaynak Kod Deposu:', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': GITHUB_URL, 'size': 12, 'bold': False, 'color': CYAN_ACCENT, 'link': GITHUB_URL},
                {'text': '', 'size': 5},
                {'text': 'Geliştirme Ortamı & Yapay Zeka Destekleri:', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': 'Google Antigravity Agentic IDE (Claude 3.5 Sonnet, Gemini 3.8 Flash, Gemini 4 Argon).', 'size': 12, 'bold': False, 'color': TEXT_MUTED},
                {'text': '', 'size': 5},
                {'text': 'Motor, Kütüphaneler & Varlıklar:', 'size': 14, 'bold': True, 'color': DARK_NAVY},
                {'text': 'Three.js (WebGL), Vite, Vanilla ES6 JavaScript, Kenney Low-Poly 3D Asset Paketi (%100 İstemci Taraflı 60 FPS).', 'size': 12, 'bold': False, 'color': TEXT_MUTED}
            ]
            shape.left = Emu(793215)
            shape.top = Emu(1700000)
            shape.width = Emu(5500000)
            shape.height = Emu(4800000)
            set_multiline(shape, lines)

    # === SLIDE 10: İLETİŞİM / KAPANIŞ ===
    s10 = prs.slides[9]
    for shape in s10.shapes:
        if shape.name == 'Metin kutusu 10':
            set_text(shape, 'Murat Yıldırım', font_size=26, bold=True, color=DARK_NAVY)
        elif shape.name == 'Metin kutusu 11':
            set_text(shape, 'Solo Oyun Geliştirici & Tasarımcı', font_size=16, bold=False, color=TEXT_MUTED)
        elif shape.name == 'Metin kutusu 8':
            shape.width = Emu(5000000)
            set_text(shape, 'sy827338@gmail.com', font_size=16, bold=True, color=CYAN_ACCENT)

    if os.path.exists(logo_path):
        s10.shapes.add_picture(logo_path, Emu(9600000), Emu(3800000), width=Emu(2200000), height=Emu(2200000))

    return prs

# 1. Build standard lightweight presentation (Interactive video cover + clickable Google Drive link)
print('Generating standard presentation...')
prs_standard = build_presentation(embed_video=False)
out_std = r'C:\Users\sy827\.gemini\antigravity\scratch\resilientia-antalya\RESILIENTIA_ANTALYA_2031_SUNUM.pptx'
out_std_downloads = r'C:\Users\sy827\Downloads\RESILIENTIA_ANTALYA_2031_SUNUM.pptx'
out_std_downloads_v2 = r'C:\Users\sy827\Downloads\RESILIENTIA_ANTALYA_2031_GUNCEL_SUNUM.pptx'

prs_standard.save(out_std)
try:
    shutil.copy2(out_std, out_std_downloads)
    print(f'Saved standard to Downloads: {out_std_downloads}')
except Exception as e:
    print('Notice for standard downloads copy:', e)

try:
    shutil.copy2(out_std, out_std_downloads_v2)
    print(f'Saved standard to Downloads v2: {out_std_downloads_v2}')
except Exception as e:
    pass

# 2. Build embedded video presentation (Full MP4 directly embedded inside slide 5)
if os.path.exists(video_file):
    print('Generating embedded video presentation...')
    prs_embedded = build_presentation(embed_video=True)
    out_embed = r'C:\Users\sy827\.gemini\antigravity\scratch\resilientia-antalya\RESILIENTIA_ANTALYA_2031_VIDEO_GOMULU.pptx'
    out_embed_downloads = r'C:\Users\sy827\Downloads\RESILIENTIA_ANTALYA_2031_VIDEO_GOMULU.pptx'

    prs_embedded.save(out_embed)
    try:
        shutil.copy2(out_embed, out_embed_downloads)
        print(f'Saved embedded video presentation to Downloads: {out_embed_downloads}')
    except Exception as e:
        print('Notice for embedded downloads copy:', e)

print('All presentations generated successfully!')
