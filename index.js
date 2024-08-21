const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const tokens = ["6046cf8e-2eb8-487d-99a8-e18f62675328",
"20d6877b-f6a2-4501-adee-27cec8206641",
"c7d20e0e-2fe0-4c97-8de2-eb32ba150000",
"2bfd60e8-59e7-4d66-b780-b79b42782175",
"c6d207ff-cb60-48c2-87ae-87009a80cc9c",
"18f97175-6bb1-4b01-b34f-489c81972af3",
"b2bb02b0-1251-452c-a94d-8cc008204555",
"9cb6873c-26b4-4a97-8ff7-31d272fd9a02",
"0f099a24-b967-41a6-9ee4-f9fadcaceafc",
"3315b917-9914-4090-b5bc-d97b4db05284",
"971f948d-2d80-4152-a5a9-b6883378decf"  
];
let tokenIndex = 0; // Initial token index

// Configuration des styles avec des préprompts
const styleConfig = {
  0: {
    preprompt: "masterpiece, best quality, very aesthetic, absurdres",
    negative_prompt: "lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality,censured, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]",
    cfg_scale: ,
    steps: 28
  },
  1: {
    preprompt: "best quality, detailled",
    negative_prompt: "bad quality, bad hands",
    cfg_scale: 1,
    steps: 25
  },
  2: {
    preprompt: "masterpiece, best quality, very aesthetic, absurdres, cinematic photo, 35mm photograph, film, bokeh, professional, 4k, highly detailed",
    negative_prompt: "lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality",
    cfg_scale: 7,
    steps: 28
  },
  3: {
    preprompt: "masterpiece, best quality, very aesthetic, absurdres, anime artwork, anime style, key visual, vibrant, studio anime, highly detailed, <lora:style-enhancer-xl:0.6>",
    negative_prompt: "AissistXLv2-neg, oldest, early, artistic error, scan, [abstract],  photo, black and white, realism, disfigured, low contrast, lipgloss, curly hair, (parted bangs:1.2), sketch,  (nose:0.85), colored inner hair, child, loli, key, forehead,  bangle, sweatband, (nose:0.85), heterochromia, backlighting,  muddy water, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality",
    cfg_scale: 7,
    steps: 28
  },
  4: {
    preprompt: "masterpiece, best quality, very aesthetic, absurdres, manga style, vibrant, high-energy, detailed, iconic, Japanese comic style",
    negative_prompt: "lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality",
    cfg_scale: 8,
    steps: 25
  },
  5: {
    preprompt: "masterpiece, best quality, very aesthetic, absurdres, concept art, digital artwork, illustrative, painterly, matte painting, highly detailed",
    negative_prompt: "lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality",
    cfg_scale: 8,
    steps: 22
  },
  6: {
    preprompt: "masterpiece, best quality, very aesthetic, absurdres, pixel-art, low-res, blocky, pixel art style, 8-bit graphics",
    negative_prompt: "lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality",
    cfg_scale: 8,
    steps: 20
  },
  7: {
    preprompt: "masterpiece, best quality, very aesthetic, absurdres, ethereal fantasy concept art, magnificent, celestial, ethereal, painterly, epic, majestic, magical, fantasy art, cover art, dreamy",
    negative_prompt: "lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality",
    cfg_scale: 8,
    steps: 27
  },
  8: {
    preprompt: "masterpiece, best quality, very aesthetic, absurdres, neonpunk style, cyberpunk, vaporwave, neon, vibes, vibrant, stunningly beautiful, crisp, detailed, sleek, ultramodern, magenta highlights, dark purple shadows, high contrast, cinematic, ultra detailed, intricate, professional",
    negative_prompt: "lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality",
    cfg_scale: 10,
    steps: 30
  },
  9: {
    preprompt: "masterpiece, best quality, very aesthetic, absurdres, professional 3d model, octane render, highly detailed, volumetric, dramatic lighting",
    negative_prompt: "lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality",
    cfg_scale: 7,
    steps: 22
  },
  10: {
    preprompt: "(high quality:1.4), (high resolution:1.3), (incredibly detailed:1.28), cinematic lighting, masterpiece, perfect anatomy, (pov:1.25)",
    negative_prompt: "(worst quality:1.4),(low quality:1.4),(normal quality:1.4),lowres, drop of water,noise,freckles,pubic hair,black hair,hair ornaments,(low quality, worst quality:1.4), bad anatomy, noise, dark skin, extra limbs, missing limb, extra digit, fewer digit, missing digit, missing finger, fused fingers, mutated hands and fingers, animal ears, censored,Penis that is too long,hermaphrodite,Penis grows on women.,too many fingers,",
    cfg_scale: 4,
    steps: 24
  }
};

// Carte des ratios avec les dimensions correspondantes
const ratioMap = {
          '1:1': { width: 1024, height: 1024 },
        '9:7': { width: 1024, height: 798 },
        '7:9': { width: 798, height: 1024 },
        '19:13': { width: 1024, height: 700 },
        '13:19': { width: 700, height: 1024 },
        '7:4': { width: 1024, height: 585 },
        '4:7': { width: 585, height: 1024 },
        '12:5': { width: 1024, height: 426 },
        '5:12': { width: 426, height: 1024 },
        '16:9': { width: 1024, height: 576 },
        '9:16': { width: 576, height: 1024 }
};

app.get('/generate-image', async (req, res) => {
  const { prompt, styleIndex = 1, ratio = '1:1', cfgScale, steps } = req.query;

  if (!prompt) {
    return res.status(400).send('Prompt is required.');
  }

  const style = styleConfig[styleIndex] || styleConfig[0];
  const fullPrompt = `${style.preprompt}, ${prompt}`;
  const dimensions = ratioMap[ratio] || { width: 1024, height: 1024 };
  const cfg_scale = parseFloat(cfgScale) || style.cfg_scale;
  const stepCount = parseInt(steps, 10) || style.steps;

  try {
    let response;
    let success = false;

    // Sélectionner le token actuel
    const currentToken = tokens[tokenIndex];

    while (!success) {
      try {
        response = await axios.post('https://api.visioncraft.top/image/generate', {
          model: 'FluxPony-v1.0',
          prompt: fullPrompt,
          negative_prompt: style.negative_prompt,
          token: currentToken,
          sampler: 'Euler a',
          steps: stepCount,
          width: dimensions.width,
          height: dimensions.height,
          cfg_scale
        }, {
          responseType: 'stream'
        });

        success = true;
      } catch (error) {
        if (error.response && error.response.status === 403) {
          console.log("Retrying Generation...");
        } else {
          throw new Error(error.message);
        }
      }
    }

    if (success) {
      const imagePath = path.join(__dirname, 'cache', 'generated_image.png');
      const imageStream = response.data;
      const fileStream = fs.createWriteStream(imagePath);

      if (!fs.existsSync(path.dirname(imagePath))) {
        fs.mkdirSync(path.dirname(imagePath), { recursive: true });
      }

      imageStream.pipe(fileStream);

      fileStream.on('finish', () => {
        res.sendFile(imagePath);
      });

      fileStream.on('error', (err) => {
        console.error("Stream error:", err);
        res.status(500).send('Error generating image.');
      });
    } else {
      res.status(500).send('Error generating image.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }

  // Passer au token suivant
  tokenIndex = (tokenIndex + 1) % tokens.length;
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
