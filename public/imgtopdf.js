document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const convertBtn = document.getElementById('convertBtn');
    const conversionType = document.getElementById('conversionType');
    const uploadForm = document.getElementById('uploadForm');
    const downloadSingleBtn = document.getElementById('downloadSingleBtn');
    const downloadZipBtn = document.getElementById('downloadZipBtn');
    const uploadArea = document.getElementById('uploadArea');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // File Input Handler
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and Drop Functionality
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

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        preview.innerHTML = '';
        
        if (files.length === 0) return;
        
        files.forEach((file, index) => {
            const filePreview = document.createElement('div');
            filePreview.classList.add('file-preview');
            
            // Check if file is PDF
            if (file.type === 'application/pdf') {
                filePreview.innerHTML = `
                    <i class="fas fa-file-pdf" style="font-size: 3rem; color: #e74c3c; margin-bottom: 0.5rem;"></i>
                    <p>${file.name}</p>
                    <button class="remove-btn" data-index="${index}">Remove</button>
                `;
                preview.appendChild(filePreview);
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    filePreview.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <p>${file.name}</p>
                        <button class="remove-btn" data-index="${index}">Remove</button>
                    `;
                    preview.appendChild(filePreview);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Remove file handler
    preview.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const index = e.target.dataset.index;
            const files = Array.from(fileInput.files);
            files.splice(index, 1);
            
            // Update file input
            const dataTransfer = new DataTransfer();
            files.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files;
            
            // Update preview
            handleFileSelect({ target: fileInput });
        }
    });

    // Convert button handler
    convertBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!fileInput.files.length) {
            alert('Please select files first.');
            return;
        }
        
        loadingOverlay.style.display = 'flex';
        
        try {
            // Simulate conversion delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Create a dummy file based on conversion type
            if (conversionType.value === 'image-to-pdf') {
                // Create a dummy PDF
                const pdfBlob = new Blob(['This would be a PDF file in a real application'], 
                    { type: 'application/pdf' });
                const pdfUrl = URL.createObjectURL(pdfBlob);
                
                downloadSingleBtn.href = pdfUrl;
                downloadSingleBtn.download = 'converted.pdf';
                downloadSingleBtn.style.display = 'flex';
                downloadZipBtn.style.display = 'none';
            } else {
                // Create a dummy ZIP with images
                const zipBlob = new Blob(['This would be a ZIP file with images in a real application'], 
                    { type: 'application/zip' });
                const zipUrl = URL.createObjectURL(zipBlob);
                
                downloadZipBtn.href = zipUrl;
                downloadZipBtn.download = 'converted-images.zip';
                downloadZipBtn.style.display = 'flex';
                downloadSingleBtn.style.display = 'none';
            }
            
            alert('Conversion complete! Click the download button to get your files.');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to convert files. Please try again.');
        } finally {
            loadingOverlay.style.display = 'none';
        }
    });
});