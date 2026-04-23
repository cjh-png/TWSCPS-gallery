const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, 'images');
const thumbsDir = path.join(__dirname, 'thumbs');
const audioDir = path.join(__dirname, 'audio');
const outputFile = path.join(__dirname, 'data.js');

let localImages = [];
let localPlaylist = [];

if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

async function buildGallery() {
    console.log("🚀 開始處理圖片與縮圖 (已修正旋轉問題)...");

    if (fs.existsSync(imagesDir)) {
        const items = fs.readdirSync(imagesDir);
        for (const item of items) {
            const itemPath = path.join(imagesDir, item);
            
            if (fs.statSync(itemPath).isDirectory()) {
                const thumbFolderPath = path.join(thumbsDir, item);
                if (!fs.existsSync(thumbFolderPath)) fs.mkdirSync(thumbFolderPath, { recursive: true });

                let monthLabel = "其他";
                const dateMatch = item.match(/(\d{4})[-_.\s]?(\d{2})[-_.\s]?\d{2}/);
                if (dateMatch) monthLabel = `${dateMatch[1]}年${parseInt(dateMatch[2], 10)}月`;

                const files = fs.readdirSync(itemPath);
                for (const file of files) {
                    if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
                        const originalPath = path.join(itemPath, file);
                        const webpFileName = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                        const thumbPath = path.join(thumbFolderPath, webpFileName);

                        try {
                            if (!fs.existsSync(thumbPath)) {
                                console.log(`📸 壓縮並修正旋轉: ${item}/${file}`);
                                await sharp(originalPath)
                                    .rotate() // 🌟 關鍵修正：依照 EXIF 標記，在壓縮前將實體圖片旋轉正！
                                    .resize({ width: 1200, withoutEnlargement: true }) 
                                    .webp({ quality: 80 }) 
                                    .toFile(thumbPath);
                            }

                            localImages.push({
                                folderName: item,
                                monthLabel: monthLabel,
                                highUrl: `./images/${item}/${file}`,      
                                thumbUrl: `./thumbs/${item}/${webpFileName}` 
                            });
                        } catch (error) {
                            console.log(`⚠️ 警告：無法讀取圖片 ${item}/${file}，已自動跳過！`);
                        }
                    }
                }
            }
        }
    }

    if (fs.existsSync(audioDir)) {
        fs.readdirSync(audioDir).forEach(file => {
            if (file.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                let cleanName = file.replace(/\.[^/.]+$/, "").replace(/[\u200B-\u200D\uFEFF\u202A-\u202C]/g, '');
                localPlaylist.push({ name: cleanName, src: `./audio/${file}` });
            }
        });
    }

    const dataJsContent = `// 此檔案由 build.js 自動生成，請勿手動修改
// 生成時間: ${new Date().toLocaleString('zh-TW')}
const eventConfig = { 
    activityName: "慈天相片影展", 
    bannerUrl: "./images/banner.jpg" 
};
const localPlaylist = ${JSON.stringify(localPlaylist, null, 4)};
const localImages = ${JSON.stringify(localImages, null, 4)};`;

    fs.writeFileSync(outputFile, dataJsContent, 'utf8');
    console.log("✅ data.js 更新完畢！");
}

buildGallery();