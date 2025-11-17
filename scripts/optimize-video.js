#!/usr/bin/env node

/**
 * Video Optimization Script
 *
 * This script helps optimize videos for web delivery using FFmpeg.
 * Run with: node scripts/optimize-video.js input.mp4
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("❌ Please provide an input video file");
  console.log("Usage: node scripts/optimize-video.js input.mp4");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error("❌ Input file does not exist:", inputFile);
  process.exit(1);
}

const outputDir = "public/videos/optimized/";

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function optimizeVideo() {
  console.log("🎥 Starting video optimization...\n");

  const baseName = path.basename(inputFile, path.extname(inputFile));

  // Video optimization presets
  const presets = [
    {
      name: "mobile",
      resolution: "1280x720",
      bitrate: "1M",
      maxBitrate: "1.5M",
      description: "Mobile optimized (720p)",
    },
    {
      name: "desktop",
      resolution: "1920x1080",
      bitrate: "2M",
      maxBitrate: "3M",
      description: "Desktop optimized (1080p)",
    },
    {
      name: "thumbnail",
      resolution: "640x360",
      bitrate: "500k",
      maxBitrate: "800k",
      description: "Thumbnail/Preview (360p)",
    },
  ];

  for (const preset of presets) {
    console.log(`📱 Creating ${preset.description}...`);

    const outputFile = `${outputDir}${baseName}-${preset.name}.mp4`;

    const ffmpegCommand = [
      "ffmpeg",
      "-i",
      inputFile,
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "23",
      "-maxrate",
      preset.maxBitrate,
      "-bufsize",
      `${parseInt(preset.maxBitrate) * 2}k`,
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-s",
      preset.resolution,
      "-y", // Overwrite output file
      outputFile,
    ].join(" ");

    try {
      const { stdout, stderr } = await execAsync(ffmpegCommand);

      if (fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`✅ ${preset.name}: ${fileSizeMB}MB - ${outputFile}`);
      } else {
        console.log(`❌ Failed to create ${preset.name} version`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${preset.name} version:`, error.message);
    }
  }

  console.log("\n🎉 Video optimization complete!");
  console.log("\n📊 Optimization Summary:");
  console.log("┌─────────────┬──────────────┬─────────────────┐");
  console.log("│ Version     │ Resolution   │ Typical Size    │");
  console.log("├─────────────┼──────────────┼─────────────────┤");
  console.log("│ Mobile      │ 1280x720     │ 5-15MB          │");
  console.log("│ Desktop     │ 1920x1080    │ 10-25MB         │");
  console.log("│ Thumbnail   │ 640x360      │ 1-5MB           │");
  console.log("└─────────────┴──────────────┴─────────────────┘");

  console.log("\n🚀 Usage in your React components:");
  console.log(`
// For responsive video
<VideoPlayer
  src="/videos/optimized/${baseName}-mobile.mp4"
  className="md:hidden"
/>

<VideoPlayer
  src="/videos/optimized/${baseName}-desktop.mp4"
  className="hidden md:block"
/>

// Or with a single responsive source
<VideoPlayer
  src="/videos/optimized/${baseName}-desktop.mp4"
  poster="/videos/optimized/${baseName}-thumbnail.mp4"
/>
  `);

  console.log("\n💡 Tips:");
  console.log("• Use mobile version for phones and tablets");
  console.log("• Use desktop version for larger screens");
  console.log("• Use thumbnail version for posters/previews");
  console.log("• All videos are optimized with faststart for quick loading");
  console.log("• Consider using a CDN for even faster delivery");
}

// Check if FFmpeg is available
async function checkFFmpeg() {
  try {
    await execAsync("ffmpeg -version");
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const ffmpegAvailable = await checkFFmpeg();

  if (!ffmpegAvailable) {
    console.error("❌ FFmpeg is not installed or not in PATH");
    console.log("\n📥 Install FFmpeg:");
    console.log("• macOS: brew install ffmpeg");
    console.log("• Windows: Download from https://ffmpeg.org/download.html");
    console.log("• Ubuntu: sudo apt install ffmpeg");
    process.exit(1);
  }

  await optimizeVideo();
}

main().catch(console.error);




