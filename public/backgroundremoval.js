document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const uploadForm = document.getElementById('uploadForm');
    const downloadBtn = document.getElementById('downloadBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const helpBtn = document.getElementById('helpBtn');
    const cropWidth = document.getElementById('cropWidth');
    const cropHeight = document.getElementById('cropHeight');
    const cropResizeBtn = document.getElementById('cropResizeBtn');
    const grayscaleBtn = document.getElementById('grayscaleBtn');
    const sepiaBtn = document.getElementById('sepiaBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const backgroundColor = document.getElementById('backgroundColor');
    const backgroundImage = document.getElementById('backgroundImage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    let currentImage = null;
    let processedImageUrl = null;
    let originalImageUrl = null;

    // File Input Handler
    fileInput.addEventListener('change', handleFileSelect);
    
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Please select an image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = '';
            currentImage = document.createElement('img');
            currentImage.src = e.target.result;
            currentImage.alt = 'Preview';
            currentImage.classList.add('preview-image');
            preview.appendChild(currentImage);
            
            // Save original image URL
            originalImageUrl = e.target.result;
            
            // Reset download button
            downloadBtn.style.display = 'none';
            processedImageUrl = null;
        };
        reader.readAsDataURL(file);
    }

    // Drag and Drop Functionality
    const uploadArea = document.querySelector('.upload-area');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect({ target: fileInput });
        }
    });
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Form Submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!fileInput.files.length) {
            alert('Please select an image first.');
            return;
        }
        
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        try {
            // Simulate API call (in a real app, this would be a fetch to your backend)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // For demo purposes, we'll just use the original image
            processedImageUrl = originalImageUrl;
            
            // Set up download button
            downloadBtn.href = processedImageUrl;
            downloadBtn.download = 'background-removed-' + Date.now() + '.png';
            downloadBtn.style.display = 'flex';
            
            // Show success message
            alert('Background removed successfully! Click the download button to save your image.');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to process the image. Please try again.');
        } finally {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
        }
    });

    // Edit Functions
    cropResizeBtn.addEventListener('click', () => {
        if (!currentImage) return;
        
        const width = parseInt(cropWidth.value);
        const height = parseInt(cropHeight.value);
        
        if (width && !isNaN(width)) currentImage.style.width = `${width}px`;
        if (height && !isNaN(height)) currentImage.style.height = `${height}px`;
    });

    grayscaleBtn.addEventListener('click', () => {
        if (currentImage) currentImage.style.filter = 'grayscale(100%)';
    });

    sepiaBtn.addEventListener('click', () => {
        if (currentImage) currentImage.style.filter = 'sepia(100%)';
    });

    resetFiltersBtn.addEventListener('click', () => {
        if (currentImage) {
            currentImage.style.filter = '';
            currentImage.style.width = '';
            currentImage.style.height = '';
            cropWidth.value = '';
            cropHeight.value = '';
        }
    });

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', () => {
        document.body.setAttribute('data-theme', 
            document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        
        // Save preference to localStorage
        localStorage.setItem('theme', document.body.getAttribute('data-theme'));
    });

    // Help Button
    helpBtn.addEventListener('click', () => {
        alert('How to use:\n1. Upload an image\n2. Adjust settings as needed\n3. Click "Remove Background"\n4. Download your result!');
    });

    // Initialize dark mode from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
});