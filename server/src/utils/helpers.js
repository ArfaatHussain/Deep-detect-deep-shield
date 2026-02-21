import path from "path";
import crypto from "crypto";
import fs from "fs/promises";
import {
  createImage,
  decodeImage,
  embedTextInImage,
  encodeImage, extractTextFromImage,

} from "@pinta365/steganography";

export function generateHash(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
}

export const embedSteg = async (imagePath, text) => {
  const imageBuffer = await fs.readFile(imagePath);
  const image = await decodeImage(imageBuffer);
  const modifiedData = embedTextInImage(image.data, text);
  const stegaImage = createImage(image.width, image.height, modifiedData);

  const outputBuffer = await encodeImage(stegaImage, "png");

  const outPath = path.join("uploads", `protected-${Date.now()}.png`);

  await fs.writeFile(outPath, outputBuffer);

  return outPath;
};

export const extractSteg = async (imagePath) => {
  const imageBuffer = await fs.readFile(imagePath);

  const image = await decodeImage(imageBuffer);

  const message = extractTextFromImage(image.data);

  return message;
};