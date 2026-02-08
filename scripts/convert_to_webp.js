const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../src/assets');
const filesToConvert = ['cow.png', 'knu.png', 'map.png', 'user.png'];

async function convert() {
    for (const file of filesToConvert) {
        const inputPath = path.join(assetsDir, file);
        const outputPath = path.join(assetsDir, file.replace('.png', '.webp'));

        if (fs.existsSync(inputPath)) {
            try {
                await sharp(inputPath)
                    .webp({ quality: 80 })
                    .toFile(outputPath);
                console.log(`Converted: ${file} -> ${path.basename(outputPath)}`);

                // Optional: Delete original file after successful conversion
                // fs.unlinkSync(inputPath); 
                // console.log(`Deleted original: ${file}`);
            } catch (error) {
                console.error(`Error converting ${file}:`, error);
            }
        } else {
            console.warn(`File not found: ${file}`);
        }
    }
}

convert();
