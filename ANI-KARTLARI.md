# 📸 Anı Kartları Sistemi - Kullanım Kılavuzu

## Nasıl Çalışır?

Anı Kartları sistemi, oyunda belirli puanlara ulaştıkça özel fotoğraflarınızı ve anılarınızı açan romantik bir özellik!

## Kart Açılma Sistemi

Her 10 puanda bir yeni kart açılır:

| Puan | Kart | Anı Başlığı |
|------|------|-------------|
| 10 | 📸 Kart 1 | İlk Buluşmamız 💕 |
| 20 | 💕 Kart 2 | İlk Çıkışımız 🌹 |
| 30 | 💖 Kart 3 | Birlikte Güldüğümüz Anlar 😊 |
| 40 | 💗 Kart 4 | İlk Hediyelerimiz 🎁 |
| 50 | 💓 Kart 5 | Birlikte Yemek Yediğimiz Anlar 🍽️ |
| 60 | 💞 Kart 6 | Yürüyüşlerimiz 🚶‍♂️🚶‍♀️ |
| 70 | 💝 Kart 7 | Gün Batımı Anlarımız 🌅 |
| 80 | 💘 Kart 8 | Sürprizlerimiz 🎊 |
| 90 | ❤️ Kart 9 | Özel Anlarımız 🌟 |
| 100 | 👑 Kart 10 | Geleceğimiz 💍 |

## Fotoğrafları Nasıl Eklerim?

### 1. Klasöre Git
`resimler/anilar/` klasörünü aç

### 2. Fotoğrafları Ekle
10 adet fotoğraf ekle ve şu şekilde isimlendir:
- `ani1.jpg` - İlk buluşmanızın fotoğrafı
- `ani2.jpg` - İlk çıkışınızın fotoğrafı
- `ani3.jpg` - Birlikte güldüğünüz bir an
- `ani4.jpg` - İlk hediyeleriniz
- `ani5.jpg` - Birlikte yemek yediğiniz an
- `ani6.jpg` - Yürüyüş anınız
- `ani7.jpg` - Gün batımı fotoğrafı
- `ani8.jpg` - Sürpriz anınız
- `ani9.jpg` - Özel bir anınız
- `ani10.jpg` - Geleceğe dair bir fotoğraf (nişan, düğün, vb.)

### 3. Fotoğraf Önerileri
- **Format:** JPG veya PNG
- **Boyut:** 800x800 piksel (kare format en iyi görünür)
- **Kalite:** Yüksek çözünürlük kullanın (fotoğraf büyütülecek)
- **Tip:** Romantik, özel anlarınızı yansıtan fotoğraflar

## Kullanım

### Ana Menüden Erişim
1. Ana menüde **"📸 Anı Kartları"** butonuna tıkla
2. Şu ana kadar açılan kartları gör
3. Henüz kilitli olanlar için gerekli puanı gör

### Kartlar Sayfasında
- **Kilitli Kartlar:** Siyah-beyaz görünür, 🔒 simgesi ve gerekli puan gösterilir
- **Açık Kartlar:** Renkli görünür, tıklanabilir
- **Hover Efekti:** Açık kartların üzerine gelindiğinde yakınlaştırma efekti

### Fotoğraf Büyütme
1. Açık bir karta tıkla
2. Fotoğraf tam ekranda büyür
3. Başlık ve mesajı oku
4. Kapatmak için:
   - ✖ butonuna tıkla
   - Siyah alana tıkla

### Kart Açılma Animasyonu
- Yeni bir kart açıldığında özel 3D dönüş animasyonu oynar
- Kilit simgesi kaybolur
- Kart renkli hale gelir

## Özellikler

### ✨ Otomatik Açılma
- Yüksek skorunuz arttıkça kartlar otomatik açılır
- Oyun bittiğinde yeni açılan kartlar varsa özel animasyonla gösterilir

### 💾 Otomatik Kaydetme
- Açılan kartlar localStorage'da saklanır
- Sayfa yenilendiğinde kartlar açık kalır
- İlerlemeniz hiç kaybolmaz

### 📱 Responsive Tasarım
- Mobilde 1 kolon
- Tablet'te 2 kolon
- Masaüstünde 3 kolon
- Her ekranda güzel görünür

### 🎨 Güzel Animasyonlar
- Kart açılma: 3D flip efekti
- Hover: Yakınlaştırma ve yükselme
- Modal: Zoom-in efekti
- Kapanma: Fade-out efekti

## Placeholder Sistem

Eğer fotoğrafları henüz eklemediniz:
- Pembe arka planlı placeholder gösterilir
- Her kartın kendi emojisi görünür
- Fotoğrafları ekledikçe otomatik değişir

## Tips

### 🎯 Oyunu Oynamadan Önce
Önce oyunu oynamadan fotoğrafları ekleyin, böylece sevgiliniz kartları açarken sürprizle karşılaşır!

### 💡 Fotoğraf Seçimi
- Her kartın temasına uygun fotoğraflar seçin
- İlk kartlar daha eski anılar olabilir
- Son kartlar geleceğe dair olabilir

### 🎁 Mesajları Özelleştir
`index.html` dosyasında her kartın `<h3>` ve `<p>` etiketlerini değiştirerek mesajları kişiselleştirebilirsiniz!

---

**Önemli Not:** Bu sistem sevgilinize vereceğiniz hediyenin en özel kısmı! Fotoğrafları özenle seçin ve romantik anlarınızı paylaşın! ❤️
