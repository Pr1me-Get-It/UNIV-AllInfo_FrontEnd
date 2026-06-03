const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'src', 'assets');
const ICONS = ['icon.png', 'adaptive-icon.png'];

async function processIcon(filename) {
  const filePath = path.join(ASSETS_DIR, filename);
  const backupPath = path.join(ASSETS_DIR, filename.replace('.png', '-backup.png'));

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  // 백업 파일 생성 (이미 백업이 없다면)
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup: ${backupPath}`);
  } else {
    console.log(`Backup already exists: ${backupPath}, using backup as source.`);
    fs.copyFileSync(backupPath, filePath); // 백업을 원본으로 복구하여 재작업 방지
  }

  try {
    const originalBuffer = fs.readFileSync(filePath);
    const image = sharp(originalBuffer);
    const metadata = await image.metadata();

    // 원본 이미지의 좌측 상단 (0,0) 픽셀의 색상을 배경색으로 추출
    const { data } = await image
      .extract({ left: 0, top: 0, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // 추출된 색상 (RGBA)
    const bgColor = {
      r: data[0],
      g: data[1],
      b: data[2],
      alpha: data.length > 3 ? data[3] / 255 : 1
    };

    console.log(`Extracted background color for ${filename}: rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`);
    
    // 안드로이드 Safe Zone을 위해 60% 크기로 줄임
    const targetSize = Math.floor(metadata.width * 0.60);
    
    // 상하좌우 여백 계산
    const padX = Math.floor((metadata.width - targetSize) / 2);
    const padY = Math.floor((metadata.height - targetSize) / 2);

    const resizedBuffer = await image
      .resize(targetSize, targetSize, {
        fit: 'contain',
        background: bgColor
      })
      .extend({
        top: padY,
        bottom: metadata.height - targetSize - padY,
        left: padX,
        right: metadata.width - targetSize - padX,
        background: bgColor
      })
      .png()
      .toBuffer();

    fs.writeFileSync(filePath, resizedBuffer);
    console.log(`Successfully padded: ${filename}`);
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
  }
}

async function main() {
  for (const icon of ICONS) {
    await processIcon(icon);
  }
  console.log('Done!');
}

main();
