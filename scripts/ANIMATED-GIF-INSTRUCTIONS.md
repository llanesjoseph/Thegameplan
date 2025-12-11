# Creating an Animated GIF for Email Hero Image

The current email uses a **static 2x2 grid** which looks professional. If you want to upgrade to an **animated GIF** that cycles through the images, follow these steps:

## Quick Method (5 minutes)

### Step 1: Get the Image URLs
Copy these 4 URLs (these are the individual frames):

```
https://res.cloudinary.com/dr0jtjwlh/image/upload/c_fill,w_1200,h_600,g_auto,f_jpg,q_auto/v1761801110/2023_11_ha6dth.jpg

https://res.cloudinary.com/dr0jtjwlh/image/upload/c_fill,w_1200,h_600,g_auto,f_jpg,q_auto/v1761801110/2022_09_santa_clara_rain_uavpsb.jpg

https://res.cloudinary.com/dr0jtjwlh/image/upload/c_fill,w_1200,h_600,g_auto,f_jpg,q_auto/v1761801110/2022_08_2_h0rspg.jpg

https://res.cloudinary.com/dr0jtjwlh/image/upload/c_fill,w_1200,h_600,g_auto,f_jpg,q_auto/v1761801110/2023_11_2_oqbego.jpg
```

### Step 2: Create the Animated GIF

1. Go to **https://ezgif.com/maker**
2. Click "Choose Files" or paste each URL one at a time
3. Click "Upload and make a GIF"
4. **Settings:**
   - Delay time: `100` (100 = 1 second per frame)
   - Check "Don't stack frames"
   - Optional: Check "Crossfade frames" for smooth transitions
5. Click "Make a GIF!"
6. Download the animated GIF

### Step 3: Upload to Cloudinary (Optional)

1. Go to your Cloudinary dashboard
2. Upload the animated GIF
3. Copy the URL

### Step 4: Update the Email Template

Edit `/app/api/admin/send-bulk-invite/route.ts`

Find this line:
```javascript
<img src="https://res.cloudinary.com/dr0jtjwlh/image/upload/w_1200,h_600,c_fill,b_rgb:1a1b22/l_2023_11_ha6dth,w_570,h_285,c_fill,g_auto,x_-305,y_-152/fl_layer_apply/l_2022_09_santa_clara_rain_uavpsb,w_570,h_285,c_fill,g_auto,x_305,y_-152/fl_layer_apply/l_2022_08_2_h0rspg,w_570,h_285,c_fill,g_auto,x_-305,y_152/fl_layer_apply/l_2023_11_2_oqbego,w_570,h_285,c_fill,g_auto,x_305,y_152/fl_layer_apply/f_jpg,q_auto/v1761801110/2023_11_ha6dth.jpg"
```

Replace with your animated GIF URL:
```javascript
<img src="YOUR_ANIMATED_GIF_URL_HERE"
```

### Step 5: Test
1. Commit and push changes
2. Deploy to production
3. Send a test invite
4. The GIF will animate in all email clients!

## Why This Works

- **Animated GIFs are fully supported** in all major email clients (Gmail, Outlook, Apple Mail, Proton Mail, etc.)
- **No JavaScript required** - GIFs are native image format
- **Smooth transitions** - crossfade makes it look professional
- **Reliable** - works everywhere, unlike CSS animations

## Current Setup

The email currently uses a static 2x2 grid which is already beautiful and professional. Upgrade to animated GIF only if you want the extra visual impact!
