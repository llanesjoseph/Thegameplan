/**
 * Script to create an animated GIF hero image from 4 Cloudinary images
 * Uses Cloudinary's transformation API to create an animated GIF
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// The 4 source images from Cloudinary
const imageIds = [
  '2023_11_ha6dth',
  '2022_09_santa_clara_rain_uavpsb',
  '2022_08_2_h0rspg',
  '2023_11_2_oqbego'
];

const cloudName = 'dr0jtjwlh';

/**
 * Method 1: Use Cloudinary's Multi-Image overlay feature to create an animated GIF
 * This generates a URL that Cloudinary will render as an animated GIF on-the-fly
 */
function generateCloudinaryAnimatedGifUrl() {
  // Cloudinary can create animated GIFs using the fl_animated flag
  // We'll create a layered approach with delays

  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Create a simple cycling animation URL
  // Format: base image with overlays that cycle
  const animatedUrl = `${baseUrl}/fl_animated,dl_200/` +
    `l_${imageIds[0]},w_1.0,c_fill,g_auto/fl_layer_apply,e_loop:4/` +
    `l_${imageIds[1]},w_1.0,c_fill,g_auto/fl_layer_apply,e_loop:4/` +
    `l_${imageIds[2]},w_1.0,c_fill,g_auto/fl_layer_apply,e_loop:4/` +
    `l_${imageIds[3]},w_1.0,c_fill,g_auto/fl_layer_apply,e_loop:4/` +
    `w_1200,h_600,c_fill,g_auto,f_gif,q_auto/v1761801110/${imageIds[0]}.jpg`;

  console.log('\n🎬 Method 1: Cloudinary Animated GIF URL (on-the-fly):');
  console.log(animatedUrl);
  console.log('\nNote: This might not work as expected. See Method 2 below.\n');

  return animatedUrl;
}

/**
 * Method 2: Create sprite sheet and convert to GIF
 * This is more reliable - we'll create instructions for a simple approach
 */
function generateSpriteSheetInstructions() {
  console.log('\n📋 Method 2: Simple Animated GIF using Cloudinary (RECOMMENDED)\n');
  console.log('Cloudinary can create an animated GIF from multiple images using their Upload API.');
  console.log('\nHere\'s the easiest approach:\n');

  console.log('1️⃣  Use this Cloudinary transformation URL to create a collage/montage:');

  // Create a 2x2 grid that will be one frame
  const gridUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_600,h_600,c_fill/` +
    `l_${imageIds[0]},w_300,h_300,c_fill,g_auto,x_-150,y_-150/` +
    `l_${imageIds[1]},w_300,h_300,c_fill,g_auto,x_150,y_-150/` +
    `l_${imageIds[2]},w_300,h_300,c_fill,g_auto,x_-150,y_150/` +
    `l_${imageIds[3]},w_300,h_300,c_fill,g_auto,x_150,y_150/` +
    `v1761801110/${imageIds[0]}.jpg`;

  console.log(gridUrl);

  console.log('\n2️⃣  Or use individual hero images that transition:');
  console.log('\nOption A - Single rotating hero image:');
  imageIds.forEach((id, idx) => {
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_1200,h_600,g_auto,f_jpg,q_auto/v1761801110/${id}.jpg`;
    console.log(`   Frame ${idx + 1}: ${url}`);
  });

  console.log('\n3️⃣  Use an online tool to combine them:');
  console.log('   • Go to: https://ezgif.com/maker');
  console.log('   • Upload the 4 images above');
  console.log('   • Set delay: 100 (1 second per image)');
  console.log('   • Add "crossfade" effect for smooth transitions');
  console.log('   • Download the animated GIF');
  console.log('   • Upload to Cloudinary or use directly\n');
}

/**
 * Method 3: Download images and create GIF locally (requires additional packages)
 */
async function downloadAndCreateGif() {
  console.log('\n📦 Method 3: Create GIF locally (requires npm packages)\n');
  console.log('To create a GIF programmatically, you would need to:');
  console.log('1. npm install gifencoder canvas');
  console.log('2. Download all 4 images');
  console.log('3. Use gifencoder to create an animated GIF');
  console.log('\nThis is more complex. I recommend Method 2 (online tool) for now.\n');

  console.log('If you want to proceed with this method, let me know and I\'ll create the full implementation.\n');
}

/**
 * Method 4: Simple single hero image approach (no animation, but clean)
 */
function generateStaticHeroUrl() {
  console.log('\n🖼️  Method 4: Static Hero Image (no animation, but looks great)\n');
  console.log('If you want a clean, professional look without animation:');

  // Create a 2x2 grid as a single static image
  const staticGridUrl = `https://res.cloudinary.com/${cloudName}/image/upload/` +
    `w_1200,h_600,c_fill,b_rgb:1a1b22/` +
    `l_${imageIds[0]},w_570,h_285,c_fill,g_auto,x_-305,y_-152/fl_layer_apply/` +
    `l_${imageIds[1]},w_570,h_285,c_fill,g_auto,x_305,y_-152/fl_layer_apply/` +
    `l_${imageIds[2]},w_570,h_285,c_fill,g_auto,x_-305,y_152/fl_layer_apply/` +
    `l_${imageIds[3]},w_570,h_285,c_fill,g_auto,x_305,y_152/fl_layer_apply/` +
    `f_jpg,q_auto/v1761801110/${imageIds[0]}.jpg`;

  console.log(staticGridUrl);
  console.log('\nThis creates a nice 2x2 grid as a single static image.\n');

  return staticGridUrl;
}

// Run all methods
console.log('\n' + '='.repeat(80));
console.log('🎨 ANIMATED HERO IMAGE GENERATOR FOR ATHLEAP EMAIL');
console.log('='.repeat(80));

generateCloudinaryAnimatedGifUrl();
generateSpriteSheetInstructions();
downloadAndCreateGif();
const staticUrl = generateStaticHeroUrl();

console.log('\n' + '='.repeat(80));
console.log('✅ RECOMMENDATION:');
console.log('='.repeat(80));
console.log('\nFor the BEST result with ACTUAL ANIMATION in emails:');
console.log('1. Copy the 4 frame URLs from "Option A" above');
console.log('2. Go to https://ezgif.com/maker');
console.log('3. Upload each URL');
console.log('4. Set delay to 100, enable crossfade');
console.log('5. Download the GIF');
console.log('6. Upload to Cloudinary');
console.log('7. Use that GIF URL in the email template\n');

console.log('For a QUICK STATIC solution that looks professional:');
console.log('Use this URL for a 2x2 grid hero image:');
console.log(staticUrl);
console.log('\n' + '='.repeat(80) + '\n');
