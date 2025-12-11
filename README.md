# Adarsh Image Tools

Adarsh Image Tools is a web application that provides various image processing tools, including image resizing, compression, background removal, and conversion between image and PDF formats. 

## Features

- **Image Resizers**: Resize images to specific dimensions or by percentage.
- **Image Compression**: Compress images to reduce file size.
- **Image to PDF / PDF to Image Converter**: Convert images to PDF and PDFs to images.
- **Background Removal**: Remove or change the background of images.
- **User Authentication**: Sign up, log in, and reset password functionality.

## File Structure

```
project-root/
├── public/
│   ├── css/
│   │   ├── style.css
│   │   ├── styles.css
│   │   ├── styles1.css
│   │   └── styles2.css
│   ├── js/
│   │   ├── app.js
│   │   ├── backgroundremoval.js
│   │   ├── database.js
│   │   ├── db.js
│   │   ├── imgtopdf.js
│   │   ├── login.js
│   │   ├── script.js
│   │   ├── script1.js
│   │   └── server.js
│   ├── compress.html
│   ├── forgot_password.html
│   ├── imgtopdf.html
│   ├── index.html
│   ├── indexx.html
│   ├── resize.html
│   ├── signup.html
│   └── backgroundremoval.html
├── .env
├── package.json
├── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Adarxh-vis/image-tools.git
    cd image-tools
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add the necessary environment variables:
    ```dotenv
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=root
    DB_NAME=mydatabase
    REMOVE_BG_API_KEY=YOUR_API_KEY_HERE


### Running the Application

1. Start the server:
    ```bash
    npm start
    ```

2. Open your browser and go to `http://localhost:3000`.

## Usage

### Image Resizers

1. Navigate to the Image Resizers page.
2. Upload an image.
3. Choose the resize options (by pixels or by percentage).
4. Click "Resize" to process the image.

### Image Compression

1. Navigate to the Compress page.
2. Upload an image.
3. Set the compression quality and maximum file size.
4. Click "Compress" to process the image.

### Image to PDF / PDF to Image Converter

1. Navigate to the Img to PDF page.
2. Upload one or more images or PDFs.
3. Choose the conversion type (Image to PDF or PDF to Image).
4. Click "Convert" to process the files.

### Background Removal

1. Navigate to the Background Removal page.
2. Upload an image.
3. Optionally, choose a background color or upload a background image.
4. Click "Remove Background" to process the image.

### User Authentication

1. Sign up for a new account or log in with an existing account.
2. Use the forgot password feature to reset your password if needed.

## Contributing

Contributions are welcome! Please read the [contribution guidelines](CONTRIBUTING.md) first.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.