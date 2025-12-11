document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements
    const loadingOverlay = document.getElementById('loadingOverlay');
    const imagePreview = document.getElementById('imagePreview');
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    const downloadLink = document.getElementById('downloadLink');
    const downloadAnchor = document.getElementById('downloadAnchor');

    // Immediately hide loading overlay on startup
    loadingOverlay.style.display = 'none';

    // Compression elements
    const compressButton = document.getElementById('compressButton');
    const qualityRange = document.getElementById('quality');
    const qualityDisplay = document.getElementById('qualityDisplay');
    const maxFileSizeInput = document.getElementById('maxFileSize');
    const fileTypeSelect = document.getElementById('fileType');

    // Resize elements
    const resizeByPixelsButton = document.getElementById('resizeByPixelsButton');
    const resizeByPercentageButton = document.getElementById('resizeByPercentageButton');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const percentageRange = document.getElementById('resizePercentage');
    const percentageDisplay = document.getElementById('percentageDisplay');

    // Initialize UI states
    let currentPreviewUrl = null;
    downloadLink.style.display = 'none';
    imagePreview.style.display = 'none';
    previewPlaceholder.style.display = 'flex';

    // Update displays
    const updateDisplays = () => {
        qualityDisplay.textContent = qualityRange.value;
        percentageDisplay.textContent = percentageRange.value;
    };
    qualityRange.addEventListener('input', updateDisplays);
    percentageRange.addEventListener('input', updateDisplays);
    updateDisplays(); // Initial update

    // File handling
    const createPreview = (file) => {
        if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
        
        const url = URL.createObjectURL(file);
        currentPreviewUrl = url;
        imagePreview.src = url;
        imagePreview.style.display = 'block';
        previewPlaceholder.style.display = 'none';
    };

    // Dropzone setup
    const setupDropZone = (dropZone, input) => {
        const handleFile = (file) => {
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }
            createPreview(file);
        };

        // Drag and drop handlers
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });

        // File input change handler
        input.addEventListener('change', (e) => {
            if (e.target.files[0]) handleFile(e.target.files[0]);
        });
    };

    // Initialize drop zones
    setupDropZone(
        document.getElementById('dropZone'),
        document.getElementById('imageUpload')
    );

    setupDropZone(
        document.getElementById('resizeDropZone'),
        document.getElementById('resizeImageUpload')
    );

    // API request handler
    const handleApiRequest = async (endpoint, formData, fileName) => {
        try {
            loadingOverlay.style.display = 'flex';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Server error');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Update preview and download link
            if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
            currentPreviewUrl = url;
            
            imagePreview.src = url;
            imagePreview.style.display = 'block';
            previewPlaceholder.style.display = 'none';
            
            downloadAnchor.href = url;
            downloadAnchor.download = fileName;
            downloadLink.style.display = 'block';

        } catch (error) {
            console.error('Operation failed:', error);
            alert(`Error: ${error.message}`);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    };

    // Compression handler
    compressButton.addEventListener('click', async () => {
        const fileInput = document.getElementById('imageUpload');
        if (!fileInput.files.length) {
            alert('Please select an image first');
            return;
        }

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('quality', qualityRange.value);
        formData.append('maxFileSize', maxFileSizeInput.value);
        formData.append('fileType', fileTypeSelect.value);

        await handleApiRequest(
            '/compress',
            formData,
            `compressed.${fileTypeSelect.value}`
        );
    });

    // Resize handlers
    const handleResize = async (fileInput, data, fileName) => {
        if (!fileInput.files.length) {
            alert('Please select an image first');
            return;
        }

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value.toString());
        });

        await handleApiRequest('/resize', formData, fileName);
    };

    resizeByPixelsButton.addEventListener('click', () => {
        if (!widthInput.value || !heightInput.value) {
            alert('Please enter both width and height');
            return;
        }

        handleResize(
            document.getElementById('resizeImageUpload'),
            {
                resizeType: 'resizeByPixels',
                width: widthInput.value,
                height: heightInput.value
            },
            'resized.png'
        );
    });

    resizeByPercentageButton.addEventListener('click', () => {
        handleResize(
            document.getElementById('resizeImageUpload'),
            {
                resizeType: 'resizeByPercentage',
                percentage: percentageRange.value
            },
            'resized.png'
        );
    });

    // Theme management
    const initializeTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' 
                ? 'light' 
                : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    };
    initializeTheme();
});