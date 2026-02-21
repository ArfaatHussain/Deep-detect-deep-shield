import multer from "multer";
import path from "path";

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // save files to uploads folder
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

// File filter (images, PDFs, DWG, videos)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf|dwg|mp4|mov|avi|mkv/; // added common video formats
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images, PDFs, DWG files or videos are allowed"));
  }
};

// Max file size 100MB (increase for videos)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

export default upload;
