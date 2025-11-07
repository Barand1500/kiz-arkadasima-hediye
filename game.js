// Canvas ve Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Global error catcher - görünür hata olursa console'a yaz ve ekranda göster
window.addEventListener('error', function (e) {
    console.error('Unhandled error:', e.error || e.message, e.filename + ':' + e.lineno);
    try {
        let overlay = document.getElementById('jsErrorOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'jsErrorOverlay';
            overlay.style.position = 'fixed';
            overlay.style.left = '8px';
            overlay.style.right = '8px';
            overlay.style.bottom = '8px';
            overlay.style.zIndex = 99999;
            overlay.style.background = 'rgba(0,0,0,0.85)';
            overlay.style.color = 'white';
            overlay.style.padding = '12px';
            overlay.style.borderRadius = '8px';
            overlay.style.fontFamily = 'monospace';
            overlay.style.fontSize = '13px';
            overlay.style.maxHeight = '40vh';
            overlay.style.overflow = 'auto';
            document.body.appendChild(overlay);
        }
        overlay.textContent = `HATA: ${e.message || e.error || 'Unknown error'} (${e.filename || ''}:${e.lineno || ''})`;
    } catch (ignore) {}
});

// Performance tuning: detect mobile and set caps
const IS_MOBILE = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 480;
const MAX_PARTICLES = IS_MOBILE ? 25 : 120;  // 40'tan 25'e düşürdük - daha az partikül
const MAX_TRAILS = IS_MOBILE ? 2 : 12;       // 4'ten 2'ye düşürdük - daha az iz efekti
const CLOUD_COUNT = IS_MOBILE ? 1 : 3;       // 2'den 1'e düşürdük - daha az bulut

// Frame throttling: mobile -> 45fps (daha akıcı), desktop -> 60fps
const TARGET_FPS = IS_MOBILE ? 45 : 60;      // 30'dan 45'e çıkardık - daha akıcı
const MIN_FRAME_INTERVAL = 1000 / TARGET_FPS;
let lastFrameTime = performance.now();

// Yuvarlak köşeli dikdörtgen çizim fonksiyonu
function roundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

// Oyun Durumları - ÖNCE BUNLAR TANIMLANMALI
let gameState = 'waiting'; // waiting (menüde), start (oyun ekranında ama başlamadı), playing, gameOver
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

// Romantik mesajlar - Bunları kendi mesajlarınla değiştirebilirsin!
const romanticMessages = {
  5:  "💞 5 Puan! Seninle her şey bir anda güzelleşiyor Bahar.",
  10: "💖 10 Puan! Ne yaparsam yapayım aklım hep sende kalıyor.",
  15: "💗 15 Puan! Gülüşünü düşündükçe içim ısınıyor.",
  20: "💓 20 Puan! Seninle olduğum her an gerçek geliyor bana.",
  25: "💞 25 Puan! Seni sevmek dünyanın en doğal şeyi gibi.",
  30: "💝 30 Puan! Kalbimin ritmi bile seninle değişiyor Bahar.",
  35: "💘 35 Puan! Gözlerinin içine her baktığımda yeniden aşık oluyorum.",
  40: "💌 40 Puan! Ne yaşarsak yaşayalım, ben hep seninleyim.",
  45: "💗 45 Puan! Sen yanımdayken dünya susuyor sanki.",
  50: "❤️ 50 Puan! Bahar, sen benim en güzel tesadüfümsün.",
  55: "💞 55 Puan! Her şey karışık olsa bile, seni sevmek hep net.",
  60: "💕 60 Puan! Seninle konuşmak bile kalbimi yumuşatıyor.",
  65: "💖 65 Puan! Her şeyinle özelsin Bahar, bunu hiç unutma.",
  70: "💗 70 Puan! Bazen sadece adını duymak bile yetiyor.",
  75: "💘 75 Puan! Senin varlığın bile bana iyi geliyor.",
  80: "💞 80 Puan! Sen benim sakinliğimsin, fırtınam bile seninle güzel.",
  85: "💖 85 Puan! Bu kalp seni görünce hızlanmayı hiç bırakmadı.",
  90: "💗 90 Puan! Seni seviyorum, hem de anlatamayacağım kadar.",
  100:"🎉 100 PUAN! Bahar, sen benim ilkim, en güzel yanım ve en doğru hisimsin. ❤️"
};

// Oyun bitti mesajları - Komik ve sevimli 😄
const gameOverMessages = [
    "🤦‍♀️ Eşek Bahar!",
    "😤 Bahar Ciddi Oysana!",
    "☕ Canım sen bi mola ver sakinleş",
    "🤨 Bahar????",
    "🙈 Ciddili sen bir maymun olabilirsin",
    "💕 Olsun yine de seni seviyorum!",
    "😘 Hayatım daha dikkatli ol!",
    "🤗 Bir daha dene, bu sefer olacak!"
];

// Çikolata resimleri - Sen ekleyeceksin!
const chocolateImages = [
    'resimler/cikolatalar/patso.png',
    'resimler/cikolatalar/karam.png', 
    'resimler/cikolatalar/wapps.png',
    'resimler/cikolatalar/mantı.png'
    // chocolate5.png kaldırıldı - dosya yok
];


const loadedChocolates = [];
chocolateImages.forEach((imgPath, index) => {
    const img = new Image();
    img.src = imgPath;
    img.onerror = function() {
        console.log(`Çikolata resmi ${index + 1} yüklenemedi: ${imgPath}`);
    };
    loadedChocolates.push(img);
});

// Oyuncu skin sistemi
let currentSkin = localStorage.getItem('playerSkin') || 'player1';
const availableSkins = ['player1', 'player2', 'player3', 'player4'];

// Titreşim ayarı
let vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false'; // Varsayılan açık

// Ses efektleri
const winSound = document.getElementById('winSound');

// Son çalınan kazanma sesi skoru
let lastWinSoundScore = 0;

let lastMessageScore = 0;

// Tema ayarları
const gameThemes = {
    pink: {
        canvas: ['#FFB6C1', '#FFE4E1', '#FFC0CB', '#FFB3D9'],
        pipe: ['#FF1493', '#FF69B4', '#FFB6C1']
    },
    purple: {
        canvas: ['#DDA0DD', '#E6E6FA', '#D8BFD8', '#DDA0DD'],
        pipe: ['#8B008B', '#9370DB', '#BA55D3']
    },
    // blue theme removed
    halloween: {
        canvas: ['#0b0710', '#2b0b17', '#4a1200', '#100306'],
        pipe: ['#5a2b00', '#ff7a00', '#ffb347']
    },
    christmas: {
        canvas: ['#0a1e3d', '#1a4d6e', '#2b5f7f', '#0f2940'],  // Gece gökyüzü (kar için)
        pipe: ['#ff0000', '#ffffff', '#ff0000']  // Kırmızı-beyaz şeker kamışı borular
    }
};

let currentGameTheme = localStorage.getItem('gameTheme') || 'pink';

function updateGameTheme(themeName) {
    currentGameTheme = themeName;
    // Halloween temasına geçildiğinde hayaletleri oluştur
    if (themeName === 'halloween' && typeof createGhosts === 'function') {
        createGhosts(2);
        if (snowflakes) snowflakes.length = 0; // Kar tanelerini temizle
    }
    // Noel temasına geçildiğinde kar tanelerini oluştur
    else if (themeName === 'christmas' && typeof createSnowflakes === 'function') {
        createSnowflakes(30);
        if (ghosts) ghosts.length = 0; // Hayaletleri temizle
    }
    // Diğer temalara geçildiğinde hepsini temizle
    else {
        if (ghosts) ghosts.length = 0;
        if (snowflakes) snowflakes.length = 0;
    }
}

const player = {
    x: 100,
    y: 250,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.4,   // Geri 0.4'e çıkardık - daha hızlı düşüş (mobilde daha dinamik)
    jump: -7.0,     // -8.5'ten -7.0'a düşürdük - daha az zıplama (çok yüksek zıplamayı engelledik)
    rotation: 0,
    image: new Image()
};

// Skin yükleme fonksiyonu
function loadPlayerSkin() {
    player.image.src = `resimler/skins/${currentSkin}.png`;
    player.image.onerror = function() {
        // Eğer resim yüklenemezse varsayılan placeholder kullan
        console.log('Resim yüklenemedi, varsayılan kullanılıyor');
        this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Ccircle cx=%2225%22 cy=%2225%22 r=%2220%22 fill=%22%23FF69B4%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2230%22%3E💕%3C/text%3E%3C/svg%3E';
    };
}

loadPlayerSkin();

// Borular
const pipes = [];
const pipeWidth = 60;
const pipeGap = 280;  // 220'den 280'e çıkardık - çok daha geniş geçiş (mobil için)

// Hız ayarları (default değerler) - MOBİL İÇİN DAHA HIZLI
const BASES = {
    pipeSpeed: 2.2,    // 1.6'dan 2.2'ye çıkardık - mobilde daha hızlı
    groundSpeed: 2.8,  // 2'den 2.8'e çıkardık - mobilde daha hızlı
    playerJump: -7.0   // -8.5'ten -7.0'a düşürdük - daha az zıplama
};

// Aktif hız değişkenleri (uygulama setGameSpeed() ile değişecek)
let pipeSpeed = BASES.pipeSpeed;
let groundSpeed = BASES.groundSpeed;
let playerJump = BASES.playerJump;
let frameCount = 0;

// Zemin
const ground = {
    x: 0,
    y: 550,
    height: 50,
    speed: 2
};

// Partikül sistemi
let particles = [];

class Particle {
    constructor(x, y, color, size = 5, vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = vx || (Math.random() - 0.5) * 6;
        this.vy = vy || (Math.random() - 0.5) * 6 - 2;
        this.life = 1.0;
        this.decay = 0.02;
        this.gravity = 0.15;
    }
    
    update() {
        this.vx *= 0.98;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// Partikül oluşturma fonksiyonları - MOBİLDE DAHA AZ PARTIKÜL
function createScoreParticles(x, y) {
    const colors = ['#FFD700', '#FFA500', '#FF69B4', '#FF1493', '#FF00FF'];
    const count = IS_MOBILE ? 3 : 15;  // 6'dan 3'e düşürdük - daha az partikül
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)], 
            Math.random() * 3 + 2));
    }
}

function createChocolateParticles(x, y) {
    const colors = ['#8B4513', '#D2691E', '#DEB887', '#F4A460', '#FFE4B5'];
    const count = IS_MOBILE ? 2 : 10;  // 5'ten 2'ye düşürdük - daha az partikül
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)],
            Math.random() * 4 + 3));
    }
}

function createJumpParticles(x, y) {
    const colors = ['#87CEEB', '#B0E0E6', '#ADD8E6', '#E0FFFF'];
    const count = IS_MOBILE ? 1 : 8;  // 3'ten 1'e düşürdük - daha az partikül
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)],
            Math.random() * 2 + 1, (Math.random() - 0.5) * 3, Math.random() * 2 + 1));
    }
}

function createCrashParticles(x, y) {
    const colors = ['#FF0000', '#FF4500', '#FF6347', '#DC143C'];
    const count = IS_MOBILE ? 8 : 25;  // 12'den 8'e düşürdük - daha az partikül
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)],
            Math.random() * 5 + 3));
    }
}

function updateParticles() {
    // cap particle updates for performance
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
        // safety cap
        if (particles.length > MAX_PARTICLES) {
            particles.splice(0, particles.length - MAX_PARTICLES);
            break;
        }
    }
}

function drawParticles() {
    particles.forEach(particle => particle.draw());
}

// Skor popup animasyonu
let scorePopups = [];

class ScorePopup {
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.life = 1.0;
        this.decay = 0.015;
        this.vy = -2;
        this.scale = 0.5;
    }
    
    update() {
        this.y += this.vy;
        this.vy *= 0.95;
        this.life -= this.decay;
        
        // Bounce efekti
        if (this.scale < 1.2) {
            this.scale += 0.1;
        } else {
            this.scale = 1.2;
        }
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.font = `bold ${24 * this.scale}px 'Poppins', sans-serif`;
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        
        // Gölge
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

function createScorePopup(x, y, points) {
    scorePopups.push(new ScorePopup(x, y, `+${points}`));
}

function updateScorePopups() {
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        scorePopups[i].update();
        if (scorePopups[i].isDead()) {
            scorePopups.splice(i, 1);
        }
    }
}

function drawScorePopups() {
    scorePopups.forEach(popup => popup.draw());
}

// Trail efekti
let trails = [];

class Trail {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.life = 1.0;
        this.decay = 0.05;
    }
    
    update() {
        this.life -= this.decay;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life * 0.3;
        ctx.drawImage(player.image, this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

function updateTrails() {
    for (let i = trails.length - 1; i >= 0; i--) {
        trails[i].update();
        if (trails[i].isDead()) {
            trails.splice(i, 1);
        }
    }
    if (trails.length > MAX_TRAILS) {
        trails.splice(0, trails.length - MAX_TRAILS);
    }
}

function drawTrails() {
    trails.forEach(trail => trail.draw());
}

// Arka plan bulutları
const clouds = [];
for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * 200,
        width: 80 + Math.random() * 40,
        speed: 0.25 + Math.random() * 0.45
    });
}

// Hayaletler (Cadılar Bayramı için) - ÖNCE TANIMLA
const ghosts = [];
function createGhosts(count = 2) {
    ghosts.length = 0;
    for (let i = 0; i < count; i++) {
        ghosts.push({
            x: Math.random() * canvas.width,
            y: 40 + Math.random() * 140,
            vx: (Math.random() - 0.5) * 0.6,
            vy: 0,
            amp: 10 + Math.random() * 30,
            phase: Math.random() * Math.PI * 2,
            size: 28 + Math.random() * 18
        });
    }
}

function updateGhosts() {
    if (currentGameTheme !== 'halloween') return;
    if (!ghosts || ghosts.length === 0) return; // Güvenlik kontrolü
    ghosts.forEach(g => {
        if (!g) return; // null/undefined kontrol
        g.x += g.vx;
        g.phase += 0.02;
        g.y += Math.sin(g.phase) * 0.3;
        // wrap around
        if (g.x < -50) g.x = canvas.width + 50;
        if (g.x > canvas.width + 50) g.x = -50;
    });
}

function drawGhosts() {
    if (currentGameTheme !== 'halloween') return; // Halloween değilse çizme
    if (!ghosts || ghosts.length === 0) return; // Güvenlik kontrolü
    ctx.save();
    ghosts.forEach(g => {
        if (!g) return; // null/undefined kontrol
        ctx.globalAlpha = 0.9;
        ctx.font = `${g.size}px Arial`;
        ctx.fillText('👻', g.x, g.y);
    });
    ctx.restore();
}

// Kar taneleri (Noel için)
const snowflakes = [];
function createSnowflakes(count = 30) {
    snowflakes.length = 0;
    for (let i = 0; i < count; i++) {
        snowflakes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 2,
            speed: Math.random() * 1 + 0.5,
            drift: (Math.random() - 0.5) * 0.5
        });
    }
}

function updateSnowflakes() {
    if (currentGameTheme !== 'christmas') return;
    if (!snowflakes || snowflakes.length === 0) return;
    snowflakes.forEach(s => {
        if (!s) return;
        s.y += s.speed;
        s.x += s.drift;
        // Kar tanesi aşağı düştüğünde yukarı döndür
        if (s.y > canvas.height) {
            s.y = -10;
            s.x = Math.random() * canvas.width;
        }
        // Yanlara kaçarsa geri getir
        if (s.x < -10) s.x = canvas.width + 10;
        if (s.x > canvas.width + 10) s.x = -10;
    });
}

function drawSnowflakes() {
    if (currentGameTheme !== 'christmas') return;
    if (!snowflakes || snowflakes.length === 0) return;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    snowflakes.forEach(s => {
        if (!s) return;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

// Canvas boyutlarını responsive yap
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Oyun objelerini yeniden konumlandır
    player.x = canvas.width * 0.25;
    player.y = canvas.height * 0.4;
    ground.y = canvas.height - 50;
    // Tema efektlerini yeniden oluştur
    if (currentGameTheme === 'halloween') {
        createGhosts(2);
    } else if (currentGameTheme === 'christmas') {
        createSnowflakes(30);
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// İlk başta tema efektlerini oluştur
if (currentGameTheme === 'halloween') {
    createGhosts(2);
} else if (currentGameTheme === 'christmas') {
    createSnowflakes(30);
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
    }
});

// Masaüstü için tıklama - START ekranında da çalışsın
document.addEventListener('click', (e) => {
    // Menüde veya modaldaysa oyunu etkileme
    if (gameState === 'waiting') return;
    
    if (e.target.id === 'restartBtn') return; // Restart butonuna basıldıysa handleInput'u atlat
    if (e.target.id === 'backToMenuBtn') return; // Ana menü butonuna basıldıysa handleInput'u atlat
    if (e.target.closest('.main-menu')) return; // Ana menüdeyse handleInput'u atlat
    if (e.target.closest('.modal')) return; // Modal açıksa handleInput'u atlat
    if (e.target.closest('.secret-content')) return; // Gizli not açıksa handleInput'u atlat
    
    handleInput();
});

// Mobil için dokunma - START ekranında da çalışsın
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput();
}, { passive: false });

// Restart butonu
document.getElementById('restartBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    resetGame();
});
document.getElementById('restartBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    resetGame();
}, { passive: false });

function handleInput() {
    if (gameState === 'waiting') {
        // Menüdeyken hiçbir şey yapma
        return;
    } else if (gameState === 'start') {
        startGame();
    } else if (gameState === 'playing') {
        player.velocity = player.jump;
        // Zıplama sesi
        playJumpSound();
        // Zıplama partikülü
        createJumpParticles(player.x + player.width / 2, player.y + player.height);
        // Trail ekle - MOBİLDE DAHA SEYREK (her 6 frame'de 1, masaüstünde her 3'te 1)
        const trailInterval = IS_MOBILE ? 6 : 3;
        if (frameCount % trailInterval === 0) {
            trails.push(new Trail(player.x, player.y, player.width, player.height));
        }
    } else if (gameState === 'gameOver') {
        resetGame();
    }
}

function startGame() {
    gameState = 'playing';
    score = 0;
    lastMessageScore = 0;
    player.x = canvas.width * 0.25;
    player.y = canvas.height * 0.4;
    player.velocity = 0;
    player.rotation = 0;
    pipes.length = 0;
    frameCount = 0;
    
    // Efektleri temizle
    particles = [];
    scorePopups = [];
    trails = [];
    
    // Çalan uzun sesleri durdur
    if (window.AudioManager) {
        AudioManager.stopAllLongSounds();
    }
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('scoreDisplay').textContent = '0';
}

function resetGame() {
    gameState = 'playing';
    score = 0;
    lastMessageScore = 0;
    lastWinSoundScore = 0; // Kazanma sesi sayacını sıfırla
    player.x = canvas.width * 0.25;
    player.y = canvas.height * 0.4;
    player.velocity = 0;
    player.rotation = 0;
    pipes.length = 0;
    frameCount = 0;
    
    // Efektleri temizle
    particles = [];
    scorePopups = [];
    trails = [];
    
    // Çalan uzun sesleri durdur (crash sesi gibi)
    if (window.AudioManager) {
        AudioManager.stopAllLongSounds();
    }
    
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('romanticMessage').classList.add('hidden');
    document.getElementById('scoreDisplay').textContent = '0';
}

// Ana menüye dönerken oyunu tamamen sıfırla
function resetGameCompletely() {
    gameState = 'waiting'; // Menüye dönünce waiting moduna geç
    score = 0;
    lastMessageScore = 0;
    lastWinSoundScore = 0; // Kazanma sesi sayacını sıfırla
    player.x = canvas.width * 0.25;
    player.y = canvas.height * 0.4;
    player.velocity = 0;
    player.rotation = 0;
    pipes.length = 0;
    frameCount = 0;
    
    // Çalan uzun sesleri durdur
    if (window.AudioManager) {
        AudioManager.stopAllLongSounds();
    }
    
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('romanticMessage').classList.add('hidden');
    document.getElementById('scoreDisplay').textContent = '0';
}

// Oyun ekranı açıldığında çağrılacak fonksiyon
function initializeGame() {
    gameState = 'start'; // Oyun ekranı açıldı, başlangıç ekranında bekle
    score = 0;
    lastMessageScore = 0;
    
    // Canvas boyutlarına göre player pozisyonunu ayarla
    resizeCanvas();
    player.x = canvas.width * 0.25;
    player.y = canvas.height * 0.4;
    player.velocity = 0;
    player.rotation = 0;
    
    pipes.length = 0;
    frameCount = 0;
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('romanticMessage').classList.add('hidden');
    document.getElementById('scoreDisplay').textContent = '0';
}

function createPipe() {
    const minHeight = 80;  // 50'den 80'e çıkardık - borular daha ortada
    const maxHeight = canvas.height - ground.height - pipeGap - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight) + minHeight);
    
    // Random çikolata resmi seç
    const randomChocolateIndex = Math.floor(Math.random() * loadedChocolates.length);
    
    pipes.push({
        x: canvas.width,
        topHeight: height,
        bottomY: height + pipeGap,
        scored: false,
        chocolateIndex: randomChocolateIndex, // Her boruya farklı çikolata
        chocolateCollected: false // Çikolata toplandı mı?
    });
}

// Oyun hızı presetleri ve uygulama fonksiyonu
const GAME_SPEEDS = {
    slow: 0.6,   // yavaş modu: %60 hız
    normal: 1.0, // orta
    fast: 1.5    // hızlı: %150
};

function setGameSpeed(key) {
    if (!GAME_SPEEDS[key]) key = 'normal';
    const mult = GAME_SPEEDS[key];
    // apply
    pipeSpeed = BASES.pipeSpeed * mult;
    ground.speed = BASES.groundSpeed * mult;
    player.jump = BASES.playerJump * mult;
    playerJump = BASES.playerJump * mult;
    localStorage.setItem('gameSpeed', key);

    // update UI (if buttons exist)
    try {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active-speed'));
        const btn = document.querySelector(`.speed-btn[data-speed="${key}"]`);
        if (btn) btn.classList.add('active-speed');
    } catch (e) {
        // ignore
    }
}

// Apply saved speed on load (if any)
const savedSpeed = localStorage.getItem('gameSpeed') || 'normal';
setGameSpeed(savedSpeed);

function updatePlayer() {
    if (gameState !== 'playing') return;
    
    player.velocity += player.gravity;
    player.y += player.velocity;
    
    // Rotasyon efekti
    player.rotation = Math.min(Math.max(player.velocity * 3, -30), 90);
    
    // Zemine çarpma kontrolü
    if (player.y + player.height >= ground.y) {
        vibrateDevice(); // Titreşim
        gameOver();
    }
    
    // Tavana çarpma kontrolü
    if (player.y <= 0) {
        player.y = 0;
        vibrateDevice(); // Titreşim
        gameOver();
    }
}

function updatePipes() {
    if (gameState !== 'playing') return;
    
    // Yeni boru oluştur - Daha uzak aralıklarla (120 -> 140)
    if (frameCount % 140 === 0) {
        createPipe();
    }
    
    // Boruları güncelle
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;
        
        // Çikolata toplama kontrolü
        if (!pipes[i].chocolateCollected) {
            const chocolateSize = 40;
            const chocolateX = pipes[i].x + (pipeWidth / 2) - (chocolateSize / 2);
            const chocolateY = pipes[i].topHeight + (pipeGap / 2) - (chocolateSize / 2);
            
            // Player ile çikolata çarpışma kontrolü
            if (player.x + player.width > chocolateX &&
                player.x < chocolateX + chocolateSize &&
                player.y + player.height > chocolateY &&
                player.y < chocolateY + chocolateSize) {
                // Çikolatayı topladı!
                pipes[i].chocolateCollected = true;
                // Çikolata toplama sesi
                playCollectSound();
                // Çikolata toplama efektleri
                createChocolateParticles(chocolateX + chocolateSize / 2, chocolateY + chocolateSize / 2);
            }
        }
        
        // Skor artır
        if (!pipes[i].scored && pipes[i].x + pipeWidth < player.x) {
            pipes[i].scored = true;
            score++;
            document.getElementById('scoreDisplay').textContent = score;
            
            // Skor sesi: her 5 puanda bir çal
            if (score % 5 === 0) {
                playScoreSound();
            }
            
            // Skor efektleri
            createScoreParticles(pipes[i].x + pipeWidth / 2, canvas.height / 2);
            createScorePopup(canvas.width / 2, canvas.height / 3, '1');
            
            // Her 10 puanda kazanma sesi çal
            if (score % 10 === 0 && score !== lastWinSoundScore) {
                playWinSound();
                lastWinSoundScore = score;
            }
            
            // Romantik mesaj göster
            showRomanticMessage(score);
        }
        
        // Ekrandan çıkan boruları sil
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
        
        // Çarpışma kontrolü
        if (checkCollision(pipes[i])) {
            gameOver();
        }
    }
}

// Titreşim fonksiyonu
function vibrateDevice() {
    if (vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate(200); // 200ms titreşim
    }
}

// Kazanma sesi çalma fonksiyonu
function playWinSound() {
    if (winSound) {
        // Use AudioManager to play without interrupting other sounds
        AudioManager.playSfxById('winSound', 0.9);
    }
}

// Yeni ses fonksiyonları
// Lightweight AudioManager to control music vs SFX volumes and clone-play SFX
const AudioManager = (function() {
    const settings = {
        master: 1.0,
        music: 0.25, // background music level (lower so it doesn't drown SFX)
        sfx: 0.9     // overall SFX multiplier
    };
    
    // Track active long sounds (crash) so we can stop them
    let activeLongSounds = [];

    function getSrcFromElement(el) {
        if (!el) return null;
        if (el.currentSrc) return el.currentSrc;
        const srcEl = el.querySelector && el.querySelector('source');
        return (srcEl && srcEl.src) || el.src || null;
    }

    function playSfxSrc(src, multiplier = 1, maxDuration = null) {
        if (!src) return;
        try {
            const a = new Audio(src);
            a.volume = Math.max(0, Math.min(1, settings.master * settings.sfx * multiplier));
            
            // Eğer uzun ses ise (crash gibi), takip et (ama sınırlama)
            if (maxDuration !== null) {
                activeLongSounds.push(a);
                // Ses bitince listeden çıkar
                a.addEventListener('ended', () => {
                    const index = activeLongSounds.indexOf(a);
                    if (index > -1) activeLongSounds.splice(index, 1);
                });
            }
            
            // short sounds shouldn't block, let them play
            a.play().catch(e => {
                // ignore user gesture restrictions; attempt again on interaction if needed
                // console.log('SFX play failed', e);
            });
        } catch (e) {
            console.log('SFX oluşturulamadı:', e);
        }
    }

    return {
        settings,
        activeLongSounds,
        // play by audio element id
        playSfxById(id, multiplier = 1, maxDuration = null) {
            const el = document.getElementById(id);
            const src = getSrcFromElement(el);
            playSfxSrc(src, multiplier, maxDuration);
        },
        // stop all long sounds (crash etc)
        stopAllLongSounds() {
            activeLongSounds.forEach(sound => {
                sound.pause();
                sound.currentTime = 0;
            });
            activeLongSounds = [];
        },
        // play background music element (single instance)
        setMusicVolume(multiplier) {
            const el = document.getElementById('backgroundMusic');
            settings.music = multiplier;
            if (el) {
                el.volume = Math.max(0, Math.min(1, settings.master * settings.music));
            }
        },
        setMasterVolume(v) {
            settings.master = v;
            // update music immediately
            this.setMusicVolume(settings.music);
        },
        setSfxVolume(v) {
            settings.sfx = v;
        }
    };
})();

// Initialize background music volume to sensible default
// Expose globally so index.html can access it before or after game.js loads
window.AudioManager = AudioManager;

// If user previously set volumes, apply them
const savedMusicVol = parseFloat(localStorage.getItem('musicVolume'));
const savedSfxVol = parseFloat(localStorage.getItem('sfxVolume'));
if (!isNaN(savedMusicVol)) AudioManager.setMusicVolume(savedMusicVol / 100);
else AudioManager.setMusicVolume(AudioManager.settings.music);
if (!isNaN(savedSfxVol)) AudioManager.setSfxVolume(savedSfxVol / 100);


function playJumpSound() {
    // jump is soft and very short: keep very low so it doesn't annoy
    AudioManager.playSfxById('jumpSound', 0.25); // 0.15'ten 0.25'e çıkardık - daha duyulur
}

function playScoreSound() {
    // score ping (used every 5 points)
    AudioManager.playSfxById('scoreSound', 0.6);
}

function playCollectSound() {
    AudioManager.playSfxById('collectSound', 0.8);
}

function playCrashSound() {
    // Crash sesi tamamen çalsın, sadece reset'te kesilsin (maxDuration parametresiyle takip et)
    AudioManager.playSfxById('crashSound', 1.0, true);
}

function checkCollision(pipe) {
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;
    
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipeWidth;
    
    // Yatay çakışma kontrolü
    if (playerRight > pipeLeft && playerLeft < pipeRight) {
        // Üst boruya çarpma
        if (playerTop < pipe.topHeight) {
            vibrateDevice(); // Titreşim
            return true;
        }
        // Alt boruya çarpma
        if (playerBottom > pipe.bottomY) {
            vibrateDevice(); // Titreşim
            return true;
        }
    }
    
    return false;
}

function showRomanticMessage(currentScore) {
    // Eğer bu skor için bir mesaj varsa ve daha önce gösterilmediyse
    if (romanticMessages[currentScore] && currentScore !== lastMessageScore) {
        const messageDiv = document.getElementById('romanticMessage');
        messageDiv.textContent = romanticMessages[currentScore];
        messageDiv.classList.remove('hidden');
        
        lastMessageScore = currentScore;
        
        // 3 saniye sonra mesajı gizle
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 3000);
    }
}

function gameOver() {
    gameState = 'gameOver';
    
    // Çarpma sesi
    playCrashSound();
    
    // Çarpışma partikülü
    createCrashParticles(player.x + player.width / 2, player.y + player.height / 2);
    
    // Random komik mesaj seç
    const randomMessage = gameOverMessages[Math.floor(Math.random() * gameOverMessages.length)];
    
    // Yüksek skoru güncelle
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        
        // Anı kartlarını kontrol et ve aç
        if (typeof window.checkAndUnlockCards === 'function') {
            window.checkAndUnlockCards();
        }
    }
    
    // Game Over ekranını güncelle
    document.querySelector('#gameOverScreen h1').textContent = randomMessage;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('romanticMessage').classList.add('hidden');
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width / 3, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width / 3, cloud.y - 10, cloud.width / 2.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width / 1.5, cloud.y, cloud.width / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Bulutları hareket ettir
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
            cloud.y = Math.random() * 200;
        }
    });
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // Daha yumuşak rotasyon - velocity'ye göre
    let rotation = 0;
    if (player.velocity < -3) {
        // Yukarı giderken (zıplarken) - yukarı bak
        rotation = -25;
    } else if (player.velocity < 0) {
        // Hafif yukarı
        rotation = -15;
    } else if (player.velocity < 3) {
        // Normal düşüş
        rotation = 0;
    } else if (player.velocity < 6) {
        // Orta hızda düşüş
        rotation = 15;
    } else {
        // Hızlı düşüş - aşağı bak
        rotation = Math.min(player.velocity * 5, 50);
    }
    
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Zıplama animasyonu için scale efekti
    let scale = 1;
    if (player.velocity < -5) {
        // Yukarı zıplarken hafif büyüt
        scale = 1 + Math.abs(player.velocity) * 0.008;
    } else if (player.velocity > 5) {
        // Hızlı düşerken hafif küçült
        scale = 1 - (player.velocity * 0.003);
    }
    scale = Math.max(0.9, Math.min(1.15, scale)); // Limit koy
    
    // Hafif sallanma efekti (sinüs dalgası)
    const wobble = Math.sin(frameCount * 0.1) * 2;
    
    if (player.image.complete && player.image.naturalHeight !== 0) {
        // Resim yüklendiyse, resmi çiz (scale ve wobble ile)
        const drawWidth = player.width * scale;
        const drawHeight = player.height * scale;
        
        ctx.drawImage(
            player.image, 
            -drawWidth / 2, 
            -drawHeight / 2 + wobble, 
            drawWidth, 
            drawHeight
        );
        
        // Resmin etrafına hafif parlama efekti (zıplarken)
        if (player.velocity < -4) {
            ctx.shadowColor = 'rgba(255, 105, 180, 0.6)';
            ctx.shadowBlur = 15;
            ctx.drawImage(
                player.image, 
                -drawWidth / 2, 
                -drawHeight / 2 + wobble, 
                drawWidth, 
                drawHeight
            );
            ctx.shadowBlur = 0;
        }
    } else {
        // Resim yüklenmediyse, kalp şekli çiz
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        const width = player.width * scale;
        const height = player.height * scale;
        const x = -width / 2;
        const y = -height / 2 + wobble;
        ctx.moveTo(x + width / 2, y + height / 4);
        ctx.bezierCurveTo(x + width / 2, y, x, y, x, y + height / 2);
        ctx.bezierCurveTo(x, y + height, x + width / 2, y + height * 1.2, x + width / 2, y + height);
        ctx.bezierCurveTo(x + width / 2, y + height * 1.2, x + width, y + height, x + width, y + height / 2);
        ctx.bezierCurveTo(x + width, y, x + width / 2, y, x + width / 2, y + height / 4);
        ctx.fill();
    }
    
    ctx.restore();
}

function drawPipes() {
    // Seçili temaya göre boru renkleri
    const theme = gameThemes[currentGameTheme];
    
    pipes.forEach(pipe => {
        // Gölge efekti
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Noel temasında şeker kamışı çizgili borular
        if (currentGameTheme === 'christmas') {
            // Üst boru - şeker kamışı deseni
            ctx.save();
            roundRect(ctx, pipe.x, 0, pipeWidth, pipe.topHeight, 10);
            ctx.clip();
            
            // Kırmızı-beyaz çizgiler
            const stripeWidth = 15;
            for (let i = 0; i < pipe.topHeight + pipeWidth; i += stripeWidth * 2) {
                ctx.fillStyle = i % (stripeWidth * 4) === 0 ? '#ff0000' : '#ffffff';
                ctx.beginPath();
                ctx.moveTo(pipe.x, i);
                ctx.lineTo(pipe.x + pipeWidth, i - pipeWidth);
                ctx.lineTo(pipe.x + pipeWidth, i - pipeWidth + stripeWidth);
                ctx.lineTo(pipe.x, i + stripeWidth);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            
            // Üst boru çerçeve
            ctx.strokeStyle = '#cc0000';
            ctx.lineWidth = 3;
            roundRect(ctx, pipe.x, 0, pipeWidth, pipe.topHeight, 10);
            ctx.stroke();
            
            // Alt boru - şeker kamışı deseni
            ctx.save();
            roundRect(ctx, pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY, 10);
            ctx.clip();
            
            for (let i = 0; i < (canvas.height - pipe.bottomY) + pipeWidth; i += stripeWidth * 2) {
                ctx.fillStyle = i % (stripeWidth * 4) === 0 ? '#ff0000' : '#ffffff';
                ctx.beginPath();
                ctx.moveTo(pipe.x, pipe.bottomY + i);
                ctx.lineTo(pipe.x + pipeWidth, pipe.bottomY + i - pipeWidth);
                ctx.lineTo(pipe.x + pipeWidth, pipe.bottomY + i - pipeWidth + stripeWidth);
                ctx.lineTo(pipe.x, pipe.bottomY + i + stripeWidth);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            
            // Alt boru çerçeve
            ctx.strokeStyle = '#cc0000';
            ctx.lineWidth = 3;
            roundRect(ctx, pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY, 10);
            ctx.stroke();
            
            // Boru başlıkları - altın rengi
            ctx.fillStyle = '#ffd700';
            roundRect(ctx, pipe.x - 8, pipe.topHeight - 25, pipeWidth + 16, 25, 8);
            ctx.fill();
            ctx.strokeStyle = '#b8860b';
            ctx.stroke();
            
            roundRect(ctx, pipe.x - 8, pipe.bottomY, pipeWidth + 16, 25, 8);
            ctx.fill();
            ctx.stroke();
        } else {
            // Diğer temalar için normal gradient borular
            const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
            gradient.addColorStop(0, theme.pipe[0]);
            gradient.addColorStop(0.5, theme.pipe[1]);
            gradient.addColorStop(1, theme.pipe[2]);
            
            ctx.fillStyle = gradient;
            ctx.strokeStyle = theme.pipe[0];
            ctx.lineWidth = 2;
            
            // Üst boru - yuvarlak köşeli
            roundRect(ctx, pipe.x, 0, pipeWidth, pipe.topHeight, 10);
            ctx.fill();
            ctx.stroke();
            
            // Üst boru başlığı - daha büyük ve şık
            const capGradient = ctx.createLinearGradient(pipe.x - 8, 0, pipe.x + pipeWidth + 8, 0);
            capGradient.addColorStop(0, theme.pipe[1]);
            capGradient.addColorStop(0.5, theme.pipe[0]);
            capGradient.addColorStop(1, theme.pipe[1]);
            ctx.fillStyle = capGradient;
            roundRect(ctx, pipe.x - 8, pipe.topHeight - 25, pipeWidth + 16, 25, 8);
            ctx.fill();
            ctx.stroke();
            
            // Parlama efekti
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            roundRect(ctx, pipe.x + 5, 0, 8, pipe.topHeight - 25, 3);
            ctx.fill();
            
            // Alt boru - yuvarlak köşeli
            ctx.shadowBlur = 10;
            ctx.fillStyle = gradient;
            roundRect(ctx, pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY, 10);
            ctx.fill();
            ctx.stroke();
            
            // Alt boru başlığı
            ctx.fillStyle = capGradient;
            roundRect(ctx, pipe.x - 8, pipe.bottomY, pipeWidth + 16, 25, 8);
            ctx.fill();
            ctx.stroke();
            
            // Alt boru parlama efekti
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            roundRect(ctx, pipe.x + 5, pipe.bottomY + 25, 8, canvas.height - pipe.bottomY - 25, 3);
            ctx.fill();
        }
        
        // Gölgeyi sıfırla
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Boruların arasına çikolata veya temaya göre balkabağı/örümcek çiz (sadece toplanmadıysa)
        if (!pipe.chocolateCollected) {
            const chocolateSize = 40; // ikon boyutu
            const chocolateX = pipe.x + (pipeWidth / 2) - (chocolateSize / 2);
            const chocolateY = pipe.topHeight + (pipeGap / 2) - (chocolateSize / 2);

            if (currentGameTheme === 'halloween') {
                // Cadılar Bayramı modu: balkabağı emoji
                ctx.font = `${chocolateSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('🎃', chocolateX + chocolateSize / 2, chocolateY + chocolateSize / 2 + 12);
                ctx.textAlign = 'left';

                // Örümcek ağı sembolü biraz üstte
                ctx.font = '18px Arial';
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.fillText('🕸️', pipe.x + 8, Math.max(8, pipe.topHeight - 10));
                ctx.fillStyle = '#000';
            } else if (currentGameTheme === 'christmas') {
                // Noel modu: cüce emoji
                ctx.font = `${chocolateSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('🧝', chocolateX + chocolateSize / 2, chocolateY + chocolateSize / 2 + 12);
                ctx.textAlign = 'left';
                
                // Hediye paketi sembolü biraz üstte
                ctx.font = '20px Arial';
                ctx.fillText('🎁', pipe.x + 8, Math.max(8, pipe.topHeight - 10));
            } else {
                const chocolateImg = loadedChocolates[pipe.chocolateIndex];
                if (chocolateImg && chocolateImg.complete && chocolateImg.naturalHeight !== 0) {
                    // Resim yüklendiyse çiz
                    ctx.drawImage(chocolateImg, chocolateX, chocolateY, chocolateSize, chocolateSize);
                } else {
                    // Resim yüklenmediyse emoji çiz (varsayılan)
                    ctx.font = '35px Arial';
                    ctx.fillStyle = '#8B4513';
                    ctx.textAlign = 'center';
                    ctx.fillText('🍫', chocolateX + chocolateSize/2, chocolateY + chocolateSize/2 + 10);
                    ctx.textAlign = 'left';
                }
            }
        }
    });
}

function drawGround() {
    // Gelişmiş zemin tasarımı
    
    // Ana zemin gradient
    const groundGradient = ctx.createLinearGradient(0, ground.y, 0, ground.y + ground.height);
    groundGradient.addColorStop(0, '#6B8E23'); // Koyu yeşil
    groundGradient.addColorStop(0.3, '#556B2F'); // Daha koyu
    groundGradient.addColorStop(1, '#3D5229'); // En koyu
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, ground.y, canvas.width, ground.height);
    
    // Parlak çim üstü
    const grassGradient = ctx.createLinearGradient(0, ground.y, 0, ground.y + 15);
    grassGradient.addColorStop(0, '#7FFF00'); // Chartreuse - parlak yeşil
    grassGradient.addColorStop(0.5, '#32CD32'); // Lime yeşil
    grassGradient.addColorStop(1, '#228B22'); // Orman yeşili
    
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, ground.y, canvas.width, 15);
    
    // Çim detayları - çizgiler
    ctx.strokeStyle = 'rgba(34, 139, 34, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 8) {
        const offset = (ground.x % 16);
        const x = i + offset;
        const height = Math.sin(i * 0.5) * 3 + 5;
        
        ctx.beginPath();
        ctx.moveTo(x, ground.y);
        ctx.lineTo(x, ground.y + height);
        ctx.stroke();
    }
    
    // Çiçekler (küçük renkli noktalar)
    ctx.fillStyle = '#FF69B4'; // Pembe çiçekler
    for (let i = 0; i < canvas.width; i += 50) {
        const flowerX = (i + (ground.x * 0.5) % 50);
        const flowerY = ground.y + 8;
        
        // Çiçek merkezi
        ctx.beginPath();
        ctx.arc(flowerX, flowerY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Çiçek yaprakları (küçük)
        ctx.fillStyle = '#FFB6C1';
        for (let j = 0; j < 4; j++) {
            const angle = (Math.PI / 2) * j;
            const px = flowerX + Math.cos(angle) * 3;
            const py = flowerY + Math.sin(angle) * 3;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#FF69B4';
    }
    
    // Zemin pattern (taş dokusu)
    ctx.strokeStyle = 'rgba(101, 67, 33, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 25) {
        const patternOffset = (ground.x % 50);
        ctx.beginPath();
        ctx.moveTo(i + patternOffset, ground.y + 15);
        ctx.lineTo(i + patternOffset, ground.y + ground.height);
        ctx.stroke();
    }
    
    // Yatay çizgiler (katmanlar)
    ctx.strokeStyle = 'rgba(101, 67, 33, 0.2)';
    ctx.lineWidth = 1;
    for (let y = ground.y + 20; y < ground.y + ground.height; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Alt gölge efekti
    const shadowGradient = ctx.createLinearGradient(0, ground.y + ground.height - 10, 0, ground.y + ground.height);
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(0, ground.y + ground.height - 10, canvas.width, 10);
    
    // Zemin hareketi
    if (gameState === 'playing') {
        ground.x -= ground.speed;
    }
}

function draw() {
    // Seçili temaya göre arka plan renkleri
    const theme = gameThemes[currentGameTheme];
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, theme.canvas[0]);
    gradient.addColorStop(0.3, theme.canvas[1]);
    gradient.addColorStop(0.6, theme.canvas[2]);
    gradient.addColorStop(1, theme.canvas[3]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Arka planda tema efektleri
    if (currentGameTheme === 'halloween') {
        // halloween: hayaletleri çiz
        drawGhosts();
    } else if (currentGameTheme === 'christmas') {
        // Noel: kar taneleri ve Noel Baba/geyik emojileri
        drawSnowflakes();
        // Arka planda uçan Noel Baba ve geyikler
        ctx.font = '24px Arial';
        for (let i = 0; i < 3; i++) {
            const x = (frameCount * 0.4 + i * 150) % (canvas.width + 80) - 80;
            const y = 60 + i * 100;
            if (i === 0) {
                ctx.fillText('🎅', x, y);
            } else {
                ctx.fillText('🦌', x, y);
            }
        }
    } else {
        // Diğer temalar: uçan kalpler
        ctx.font = '20px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 5; i++) {
            const x = (frameCount * 0.5 + i * 100) % (canvas.width + 50) - 50;
            const y = 50 + i * 80;
            ctx.fillText('💕', x, y);
        }
    }
    
    // Çiz
    drawClouds();
    drawPipes();
    drawGround();
    
    // Trail efektlerini oyuncudan önce çiz (arkada kalması için)
    drawTrails();
    
    drawPlayer();
    
    // Partikül ve popup efektlerini en üstte çiz
    drawParticles();
    drawScorePopups();
}

function gameLoop(timestamp) {
    // frame throttling
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < MIN_FRAME_INTERVAL) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastFrameTime = timestamp;

    // Sadece menüde değilse çiz
    if (gameState !== 'waiting') {
        if (gameState === 'playing') {
            frameCount++;
            updatePlayer();
            updatePipes();
            updateGhosts();
            updateSnowflakes(); // Kar tanelerini güncelle
            // Efektleri güncelle
            updateParticles();
            updateScorePopups();
            updateTrails();
        }

        draw();
    }

    requestAnimationFrame(gameLoop);
}

// Skin değiştirme fonksiyonu
function changeSkin(skinName) {
    currentSkin = skinName;
    localStorage.setItem('playerSkin', skinName);
    loadPlayerSkin();
}

// Titreşim ayarı değiştirme
function toggleVibration(enabled) {
    vibrationEnabled = enabled;
    localStorage.setItem('vibrationEnabled', enabled);
}

// Oyunu başlat
document.getElementById('highScore').textContent = highScore;
requestAnimationFrame(gameLoop);
