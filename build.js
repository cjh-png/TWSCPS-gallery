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
    console.log("🚀 開始處理圖片與縮圖 (WebP 高效模式)...");

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
                        
                        // 🌟 關鍵修正：將縮圖檔名強制改為 .webp
                        const webpFileName = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                        const thumbPath = path.join(thumbFolderPath, webpFileName);

                        try {
                            if (!fs.existsSync(thumbPath)) {
                                console.log(`📸 壓縮中: ${item}/${webpFileName}`);
                                await sharp(originalPath)
                                    .resize({ width: 1200, withoutEnlargement: true }) // 1200px 高清解析度
                                    .webp({ quality: 80 }) // 轉為 WebP，品質 80
                                    .toFile(thumbPath);
                            }

                            localImages.push({
                                folderName: item,
                                monthLabel: monthLabel,
                                highUrl: `./images/${item}/${file}`,      // 本地看原圖 (保留原始檔名)
                                thumbUrl: `./thumbs/${item}/${webpFileName}` // 線上看縮圖 (使用 WebP 檔名)
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

    const dataJsContent = `// 此檔案由 build.js 自動生成
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