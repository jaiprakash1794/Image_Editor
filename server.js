require('dotenv').config();
const express = require("express");
const multer = require("multer");
const formidable = require("formidable");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const { PDFDocument, rgb } = require("pdf-lib");
const archiver = require("archiver");
const axios = require("axios");
const FormData = require("form-data");
const { fromPath } = require("pdf2pic");

const app = express();
const port = process.env.PORT || 5000;
const ALLOWED_EXTENSIONS = ["jpeg", "jpg", "png", "webp"];

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const outputDir = path.join(__dirname, "output");
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdir(outputDir, { recursive: true }).catch(console.error);
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const upload = multer({
    dest: uploadsDir,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Unsupported file type. Please upload JPEG, PNG, or WEBP."));
        }
        cb(null, true);
    }
});

const deleteFile = async (filePath) => {
    try {
        const resolvedFilePath = path.resolve(filePath);
        if (resolvedFilePath.startsWith(path.resolve(outputDir)) || resolvedFilePath.startsWith(path.resolve(uploadsDir))) {
            await fs.unlink(resolvedFilePath);
        } else {
            throw new Error("Attempted to delete a file outside of allowed directories.");
        }
    } catch (err) {
        if (err.code === 'EPERM') {
            console.error(`EPERM error deleting file: ${filePath}. Retrying in 1 second.`);
            setTimeout(async () => {
                try {
                    await fs.unlink(filePath);
                } catch (retryErr) {
                    console.error(`Retry failed: ${retryErr.message}`);
                }
            }, 1000);
        } else {
            console.error("Error deleting file:", err.message);
        }
    }
};

const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
};

const validateQuality = (quality) => {
    const qualityValue = parseInt(quality, 10);
    if (isNaN(qualityValue) || qualityValue < 1 || qualityValue > 100) {
        throw new Error("Quality must be an integer between 1 and 100.");
    }
    return qualityValue;
};

const validateMaxFileSize = (maxFileSize) => {
    if (maxFileSize === undefined || maxFileSize === null || String(maxFileSize).trim() === "") {
        return 1024 * 1024; // Default to 1MB
    }
    const maxSizeValue = parseInt(maxFileSize, 10) * 1024;
    if (isNaN(maxSizeValue) || maxSizeValue < 1) {
        throw new Error("Max file size must be a positive integer.");
    }
    return maxSizeValue;
};

const compressImage = async (inputPath, outputPath, quality, fileType) => {
    try {
        await sharp(inputPath)
            .toFormat(fileType, { quality })
            .toFile(outputPath);
    } catch (error) {
        console.error("Error compressing image:", error.message);
        throw error;
    }
};

const compressImageToSize = async (inputPath, outputPath, targetSize, fileType) => {
    let quality = 100;
    while (true) {
        try {
            await compressImage(inputPath, outputPath, quality, fileType);
            const { size } = await fs.stat(outputPath);
            if (size <= targetSize || quality <= 10) {
                break;
            }
            quality -= 10;
        } catch (error) {
            console.error("Error compressing image to size:", error.message);
            break;
        }
    }
};

const validateFileType = (fileType) => {
    if (!ALLOWED_EXTENSIONS.includes(fileType.toLowerCase())) {
        throw new Error("Unsupported file format.");
    }
};

const errorHandler = (err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).send("Server Error. Please try again.");
};

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/compress", (req, res) => {
    res.sendFile(path.join(__dirname, "public/compress.html"));
});

app.get("/compressAndResizer", (req, res) => {
    res.sendFile(path.join(__dirname, "public/compressAndResizer.html"));
});

app.post("/compress", upload.single("image"), async (req, res, next) => {
    const { quality, maxFileSize } = req.body;
    const file = req.file;
    const filePath = file.path;
    const fileType = path.extname(file.originalname).substring(1);

    try {
        console.log("Received request to compress image with parameters:", { fileType, quality, maxFileSize });
        if (!filePath || !fileType || (!quality && !maxFileSize)) {
            await deleteFile(filePath);
            return res.status(400).send("Error: Missing required parameters.");
        }

        validateFileType(fileType);
        const validatedQuality = quality ? validateQuality(quality) : null;
        const validatedMaxFileSize = maxFileSize ? validateMaxFileSize(maxFileSize) : null;
        const outputFileName = sanitizeFilename(`compressed_${Date.now()}.${fileType}`);
        const outputPath = path.join(outputDir, outputFileName);

        if (validatedMaxFileSize) {
            await compressImageToSize(filePath, outputPath, validatedMaxFileSize, fileType);
        } else {
            await compressImage(filePath, outputPath, validatedQuality, fileType);
        }

        res.sendFile(outputPath, async (err) => {
            if (err) {
                console.error("Error sending file:", err.message);
            }
            await deleteFile(filePath);
            await deleteFile(outputPath);
        });
    } catch (error) {
        console.error("Error processing the image:", error.message);
        if (filePath) {
            await deleteFile(filePath);
        }
        next(error);
    }
});

app.post("/resize", upload.single("image"), async (req, res, next) => {
    const { resizeType, width, height, percentage } = req.body;
    const filePath = req.file.path;

    try {
        console.log("Received request to resize image with parameters:", { resizeType, width, height, percentage });
        if (!filePath) {
            return res.status(400).send("Error: No file uploaded.");
        }

        const image = sharp(filePath);
        const metadata = await image.metadata();
        const fileExtension = metadata.format;
        const outputFileName = sanitizeFilename(`resized_${Date.now()}.${fileExtension}`);
        const outputPath = path.join(outputDir, outputFileName);

        if (resizeType === "resizeByPixels") {
            if (!width || !height) {
                await deleteFile(filePath);
                return res.status(400).send("Error: Width and height are required.");
            }
            await image.resize({
                width: parseInt(width, 10),
                height: parseInt(height, 10)
            }).toFile(outputPath);
        } else if (resizeType === "resizeByPercentage") {
            const resizePercentage = parseFloat(percentage.replace(',', '.'));
            if (isNaN(resizePercentage) || resizePercentage <= 0 || resizePercentage > 100) {
                await deleteFile(filePath);
                return res.status(400).send("Error: Percentage must be a valid number between 1 and 100.");
            }
            const scaleFactor = resizePercentage / 100;
            await image.resize({
                width: Math.round(metadata.width * scaleFactor),
                height: Math.round(metadata.height * scaleFactor)
            }).toFile(outputPath);
        } else {
            console.error(`Invalid resize type received: ${resizeType}`);
            await deleteFile(filePath);
            return res.status(400).send(`Error: Invalid resize type: ${resizeType}`);
        }
        res.sendFile(outputPath, async (err) => {
            if (err) {
                console.error("Error sending file:", err.message);
            }
            await deleteFile(filePath);
            await deleteFile(outputPath);
        });
    } catch (error) {
        console.error("Error processing the image:", error.message);
        if (filePath) {
            await deleteFile(filePath);
        }
        next(error);
    }
});

app.post("/convert/image-to-pdf", (req, res, next) => {
    const form = new formidable.IncomingForm({ uploadDir: uploadsDir, keepExtensions: true });
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Error parsing the file:", err);
            return res.status(400).send("Error parsing the file.");
        }
        try {
            const filesArray = Array.isArray(files.files) ? files.files : [files.files];
            const pdfDoc = await PDFDocument.create();
            for (const file of filesArray) {
                const imageBuffer = await fs.readFile(file.filepath);
                if (file.originalFilename.endsWith('.jpg') || file.originalFilename.endsWith('.jpeg')) {
                    const image = await pdfDoc.embedJpg(imageBuffer);
                    const page = pdfDoc.addPage([image.width, image.height]);
                    page.drawImage(image, {
                        x: 0,
                        y: 0,
                        width: image.width,
                        height: image.height,
                    });
                } else {
                    await deleteFile(file.filepath);
                    return res.status(400).send("Error: Only JPEG images are supported.");
                }
            }
            const pdfBytes = await pdfDoc.save();
            const outputFilePath = path.join(outputDir, `${Date.now()}.pdf`);
            await fs.writeFile(outputFilePath, pdfBytes);
            res.download(outputFilePath, "converted.pdf", async () => {
                for (const file of filesArray) {
                    await deleteFile(file.filepath);
                }
                await deleteFile(outputFilePath);
            });
        } catch (err) {
            console.error("Error converting image to PDF:", err.message);
            next(err);
        }
    });
});

app.post("/convert/pdf-to-image", (req, res, next) => {
    const form = new formidable.IncomingForm({ uploadDir: uploadsDir, keepExtensions: true });
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Error parsing the file:", err);
            return res.status(400).send("Error parsing the file.");
        }
        try {
            const file = files.files[0];
            if (!file || !file.filepath) {
                console.error("File path is undefined. Parsed files object:", files);
                return res.status(400).send("Error: File path is undefined.");
            }
            const pdfPath = file.filepath;
            const options = {
                density: 300,
                saveFilename: file.newFilename,
                savePath: outputDir,
                format: "png",
                width: 1200,
                height: 1500
            };
            const convert = fromPath(pdfPath, options);
            const images = [];
            let pageIndex = 1;
            while (true) {
                const result = await convert(pageIndex);
                if (!result) break;
                images.push(result.path);
                pageIndex++;
            }
            const archive = archiver("zip", {
                zlib: { level: 9 }
            });
            res.attachment("converted-images.zip");
            archive.on("error", (err) => {
                throw err;
            });
            archive.pipe(res);
            images.forEach((filePath) => {
                archive.file(filePath, { name: path.basename(filePath) });
            });
            archive.finalize();
            archive.on("end", async () => {
                await deleteFile(file.filepath);
                for (const imagePath of images) {
                    await deleteFile(imagePath);
                }
            });
        } catch (err) {
            console.error("Error converting PDF to image:", err.message);
            next(err);
        }
    });
});

app.post("/remove-background", (req, res, next) => {
    const form = new formidable.IncomingForm({ uploadDir: uploadsDir, keepExtensions: true });
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Error parsing the file:", err);
            return res.status(400).send("Error parsing the file.");
        }
        try {
            const file = files.file[0];
            console.log("Parsed files object:", files);
            if (!file || !file.filepath) {
                console.error("File path is undefined. Parsed files object:", files);
                return res.status(400).send("Error: File path is undefined.");
            }
            const formData = new FormData();
            formData.append("image_file", require('fs').createReadStream(file.filepath));
            formData.append("size", "auto");
            const response = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
                headers: {
                    ...formData.getHeaders(),
                    "X-Api-Key":process.env.REMOVE_BG_API_KEY,
                },
                responseType: "arraybuffer",
            });
            if (response.status === 403) {
                throw new Error("Forbidden: Invalid API key or insufficient permissions.");
            }
            const sanitizedFilename = sanitizeFilename(path.basename(file.newFilename, path.extname(file.newFilename)));
            const outputFilePath = path.join(outputDir, `${sanitizedFilename}-no-bg.png`);
            await fs.writeFile(outputFilePath, response.data);
            res.download(outputFilePath, "no-bg.png", async () => {
                await deleteFile(file.filepath);
                await deleteFile(outputFilePath);
            });
        } catch (err) {
            if (err.response && err.response.status === 403) {
                console.error("Error removing background from image: Invalid API key or insufficient permissions.");
                res.status(403).send("Error: Invalid API key or insufficient permissions.");
            } else {
                console.error("Error removing background from image:", err.message);
                next(err);
            }
        }
    });
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).send("Multer Error: " + err.message);
    } else if (err.message === "Unsupported file type. Please upload JPEG, PNG, or WEBP.") {
        return res.status(400).send(err.message);
    }
    res.status(500).send("Server Error. Please try again.");
});

app.listen(port, () => {
    console.log(` Server is running at: http://localhost:${port}`);
});