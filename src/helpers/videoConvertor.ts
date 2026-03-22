import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import os from "os";

ffmpeg.setFfmpegPath(ffmpegPath as string);

export const convertToMp4 = async (buffer: Buffer): Promise<Buffer> => {
  const inputPath = path.join(os.tmpdir(), `input-${Date.now()}.mov`);
  const outputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

  // 1️⃣ write buffer to temp file
  fs.writeFileSync(inputPath, buffer);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-c:a aac",
        "-movflags +faststart",
      ])
      .format("mp4")
      .on("end", () => {
        try {
          const data = fs.readFileSync(outputPath);

          // cleanup
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);

          resolve(data);
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => {
        console.error("❌ FFMPEG ERROR:", err.message);

        // cleanup
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        reject(err);
      })
      .save(outputPath);
  });
};