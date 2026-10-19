import sharp from 'sharp';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dir='tests/fixtures/media-optimization/';
await sharp({create:{width:600,height:300,channels:3,background:'#b45a17'}}).jpeg().withMetadata({orientation:6}).toFile(dir+'portrait.jpg');
await sharp({create:{width:400,height:200,channels:4,background:{r:20,g:90,b:150,alpha:0.3}}}).png().toFile(dir+'alpha.png');
await sharp({create:{width:100,height:50,channels:3,background:'#29a'}}).png().toFile(dir+'small.png');
const pixels=Buffer.from([...Array(6).fill([255,0,0]).flat(),...Array(6).fill([0,0,255]).flat()]);
await sharp(pixels,{raw:{width:3,height:4,channels:3,pageHeight:2}}).webp({loop:0,delay:[100,100]}).toFile(dir+'animated.webp');
let doc=`# Media optimization fixtures\n\nlarge-photo.jpg: Fronalpstock, Switzerland, by Hannes Röst. Source verified 2026-10-19: https://commons.wikimedia.org/wiki/File:Fronalpstock_big.jpg . Licensed CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/). This checked-in derivative is Wikimedia's 3840 × 1725 thumbnail, downloaded from https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Fronalpstock_big.jpg/3840px-Fronalpstock_big.jpg ; resizing is the modification. Distributed under CC BY-SA 3.0. Original panorama is 10109 × 4542 and exceeds the pipeline pixel bound; it is not used.\n\nOther fixtures are original synthetic pixels authored for these tests and available under CC0 (https://creativecommons.org/publicdomain/zero/1.0/). Recipe with Sharp 0.35.5: portrait = 600×300 RGB #b45a17 JPEG with EXIF orientation 6; alpha = 400×200 RGBA (20,90,150,0.3) PNG; small = 100×50 RGB #29a PNG; animated = stacked 3×2 solid red/blue frames encoded WebP loop 0 delay [100,100]. No business-reference media used.\n\nSHA-256 recorded before test use:\n\n`;
for(const name of ['large-photo.jpg','portrait.jpg','alpha.png','small.png','animated.webp']) {const b=await readFile(dir+name);doc+=`- ${name}: ${createHash('sha256').update(b).digest('hex')} (${b.length} bytes)\n`;}
await writeFile(dir+'README.md',doc);
