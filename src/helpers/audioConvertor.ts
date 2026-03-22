// helpers/audioConverter.ts

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

ffmpeg.setFfmpegPath(ffmpegPath!);

export const convertToMp3 = (buffer: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const inputPath = path.join(__dirname, `${uuid()}.webm`);
    const outputPath = path.join(__dirname, `${uuid()}.mp3`);

    fs.writeFileSync(inputPath, buffer);

    ffmpeg(inputPath)
      .toFormat("mp3")
      .on("end", () => {
        const data = fs.readFileSync(outputPath);

        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        resolve(data);
      })
      .on("error", reject)
      .save(outputPath);
  });
};