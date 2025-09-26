// === 1. ELEMENT SELECTORS ===
const allElements = {
    // Left Panel: Image Management
    uploadInput: document.getElementById('upload-input'),
    uploadLabel: document.querySelector('.upload-label'),
    thumbnailsList: document.getElementById('thumbnails-list'),
    fileCountSpan: document.getElementById('file-count'),
    clearBtn: document.getElementById('clear-btn'),
    
    // Left Panel: Processing Controls
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    processBtn: document.getElementById('process-btn'),
    
    // -- Convert Tab
    formatSelect: document.getElementById('format-select'),
    qualityContainer: document.getElementById('quality-container'),
    compressSlider: document.getElementById('compress-slider'),
    compressValue: document.getElementById('compress-value'),
    
    // -- Resize Tab
    widthInput: document.getElementById('width-input'),
    heightInput: document.getElementById('height-input'),
    
    // -- Watermark Tab
    typeTextBtn: document.getElementById('type-text-btn'),
    typeImageBtn: document.getElementById('type-image-btn'),
    textOptions: document.getElementById('text-options'),
    imageOptions: document.getElementById('image-options'),
    watermarkText: document.getElementById('watermark-text'),
    fontSelect: document.getElementById('font-select'),
    colorPicker: document.getElementById('color-picker'),
    logoUploadBtn: document.getElementById('logo-upload-btn'),
    logoUploadInput: document.getElementById('logo-upload-input'),
    logoName: document.getElementById('logo-name'),
    opacitySlider: document.getElementById('opacity-slider'),
    opacityValue: document.getElementById('opacity-value'),
    sizeSlider: document.getElementById('size-slider'),
    sizeValue: document.getElementById('size-value'),
    positionGrid: document.getElementById('position-grid'),

    // Right Panel: Live Preview
    previewCanvas: document.getElementById('preview-canvas'),
    placeholderText: document.getElementById('placeholder-text'),

    // Global Elements
    notification: document.getElementById('notification'),
};

// === 2. STATE MANAGEMENT ===
let selectedFiles = [];
let watermarkLogo = new Image();
let currentPreviewIndex = 0;
let options = {
    format: 'source', // Default to keep original format
    quality: 80,
    width: null,
    height: null,
    watermark: {
        apply: false,
        type: 'text',
        text: '',
        font: 'Inter',
        color: '#FFFFFF',
        opacity: 0.5,
        size: 30, // Percentage
        position: 'middle-center',
        logo: null
    }
};

// === 3. CORE UI FUNCTIONS ===

/** Notifcation dikhanay ka function */
function showNotification(message, isError = false) {
    allElements.notification.textContent = message;
    allElements.notification.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--accent-color)';
    allElements.notification.classList.add('show');
    setTimeout(() => { allElements.notification.classList.remove('show'); }, 3000);
}

/** Upload ki hui images ko handle karna */
function handleFiles(files) {
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (newFiles.length === 0) return;

    if (selectedFiles.length + newFiles.length > 50) {
        showNotification(`You can select a maximum of 50 images.`, true);
        return;
    }
    
    // Agar pehli dafa files add ho rahi hain, to preview pehli image ka hoga
    if (selectedFiles.length === 0) {
        currentPreviewIndex = 0;
    }

    selectedFiles.push(...newFiles);
    updateThumbnails();
    updateOptionsAndDraw(); // To draw the preview of the first image
}

/** Left panel mein thumbnails update karna */
function updateThumbnails() {
    allElements.thumbnailsList.innerHTML = '';
    
    if (selectedFiles.length > 0) {
        selectedFiles.forEach((file, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'thumbnail';
            if (index === currentPreviewIndex) {
                thumb.classList.add('active');
            }
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            thumb.appendChild(img);
            
            thumb.addEventListener('click', () => {
                currentPreviewIndex = index;
                updateThumbnails(); // Active class update ke liye
                updateOptionsAndDraw(); // Live preview update ke liye
            });
            
            allElements.thumbnailsList.appendChild(thumb);
        });
    }
    
    allElements.fileCountSpan.textContent = `${selectedFiles.length} files selected`;
    const hasFiles = selectedFiles.length > 0;
    allElements.clearBtn.disabled = !hasFiles;
    allElements.processBtn.disabled = !hasFiles;
}

/** Right panel mein live preview draw karna */
function drawLivePreview() {
    if (selectedFiles.length === 0 || !selectedFiles[currentPreviewIndex]) {
        allElements.previewCanvas.style.display = 'none';
        allElements.placeholderText.style.display = 'flex';
        return;
    }

    allElements.previewCanvas.style.display = 'block';
    allElements.placeholderText.style.display = 'none';

    const file = selectedFiles[currentPreviewIndex];
    const ctx = allElements.previewCanvas.getContext('2d');
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        // Canvas ko image ke original size par set karein
        allElements.previewCanvas.width = img.naturalWidth;
        allElements.previewCanvas.height = img.naturalHeight;
        
        // Pehle image draw karein
        ctx.drawImage(img, 0, 0);
        
        // Watermark apply karein agar zaroori hai
        if (options.watermark.apply) {
            applyWatermark(ctx, allElements.previewCanvas.width, allElements.previewCanvas.height);
        }
    };
}

/** Canvas par watermark apply karne ka logic */
function applyWatermark(ctx, canvasWidth, canvasHeight) {
    ctx.globalAlpha = options.watermark.opacity;
    const margin = canvasWidth * 0.02; // 2% margin
    let posX, posY;

    if (options.watermark.type === 'text' && options.watermark.text) {
        const fontSize = (canvasWidth / 100) * (options.watermark.size / 5);
        ctx.font = `bold ${fontSize}px ${options.watermark.font}`;
        ctx.fillStyle = options.watermark.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textMetrics = ctx.measureText(options.watermark.text);
        
        // Position calculations
        if (options.watermark.position.includes('left')) posX = textMetrics.width / 2 + margin;
        else if (options.watermark.position.includes('right')) posX = canvasWidth - textMetrics.width / 2 - margin;
        else posX = canvasWidth / 2;

        if (options.watermark.position.includes('top')) posY = fontSize / 2 + margin;
        else if (options.watermark.position.includes('bottom')) posY = canvasHeight - fontSize / 2 - margin;
        else posY = canvasHeight / 2;

        ctx.fillText(options.watermark.text, posX, posY);

    } else if (options.watermark.type === 'image' && options.watermark.logo && options.watermark.logo.complete) {
        const logoBaseWidth = canvasWidth * (options.watermark.size / 100);
        const logoAspectRatio = options.watermark.logo.naturalHeight / options.watermark.logo.naturalWidth;
        const logoWidth = logoBaseWidth;
        const logoHeight = logoBaseWidth * logoAspectRatio;

        // Position calculations
        if (options.watermark.position.includes('left')) posX = margin;
        else if (options.watermark.position.includes('right')) posX = canvasWidth - logoWidth - margin;
        else posX = (canvasWidth - logoWidth) / 2;

        if (options.watermark.position.includes('top')) posY = margin;
        else if (options.watermark.position.includes('bottom')) posY = canvasHeight - logoHeight - margin;
        else posY = (canvasHeight - logoHeight) / 2;

        ctx.drawImage(options.watermark.logo, posX, posY, logoWidth, logoHeight);
    }
}

// === 4. OPTIONS & EVENT HANDLING ===

/** User ke inputs se 'options' object update karna aur preview refresh karna */
function updateOptionsAndDraw() {
    // Convert & Compress
    options.format = allElements.formatSelect.value;
    options.quality = parseInt(allElements.compressSlider.value);
    allElements.qualityContainer.style.display = (options.format === 'image/jpeg' || options.format === 'image/webp') ? 'flex' : 'none';

    // Resize
    options.width = allElements.widthInput.value ? parseInt(allElements.widthInput.value) : null;
    options.height = allElements.heightInput.value ? parseInt(allElements.heightInput.value) : null;

    // Watermark
    options.watermark.type = allElements.typeTextBtn.classList.contains('active') ? 'text' : 'image';
    options.watermark.text = allElements.watermarkText.value;
    options.watermark.font = allElements.fontSelect.value;
    options.watermark.color = allElements.colorPicker.value;
    options.watermark.opacity = parseFloat(allElements.opacitySlider.value);
    options.watermark.size = parseInt(allElements.sizeSlider.value);
    const activePosBtn = allElements.positionGrid.querySelector('.active');
    if (activePosBtn) {
        options.watermark.position = activePosBtn.dataset.pos;
    }
    
    // Check if watermark should be applied
    const isTextWatermark = options.watermark.type === 'text' && options.watermark.text.trim() !== '';
    const isImageWatermark = options.watermark.type === 'image' && options.watermark.logo;
    options.watermark.apply = isTextWatermark || isImageWatermark;

    drawLivePreview();
}

/** Sab event listeners ko setup karna */
function initializeEventListeners() {
    // File Upload
    allElements.uploadInput.addEventListener('change', (e) => handleFiles(e.target.files));
    allElements.uploadLabel.addEventListener('dragover', (e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); });
    allElements.uploadLabel.addEventListener('dragleave', (e) => e.currentTarget.classList.remove('dragover'));
    allElements.uploadLabel.addEventListener('drop', (e) => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });

    // Clear All Button
    allElements.clearBtn.addEventListener('click', () => {
        selectedFiles = [];
        currentPreviewIndex = 0;
        allElements.uploadInput.value = ''; // Reset file input
        updateThumbnails();
        updateOptionsAndDraw();
    });

    // Tab Switching
    allElements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            allElements.tabBtns.forEach(b => b.classList.remove('active'));
            allElements.tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Option Inputs
    const inputsToTrack = [
        allElements.formatSelect, allElements.compressSlider, allElements.widthInput,
        allElements.heightInput, allElements.watermarkText, allElements.fontSelect,
        allElements.colorPicker, allElements.opacitySlider, allElements.sizeSlider
    ];
    inputsToTrack.forEach(input => input.addEventListener('input', updateOptionsAndDraw));
    
    // Sliders ke value text update karna
    allElements.compressSlider.addEventListener('input', (e) => allElements.compressValue.textContent = `${e.target.value}%`);
    allElements.opacitySlider.addEventListener('input', (e) => allElements.opacityValue.textContent = `${Math.round(e.target.value * 100)}%`);
    allElements.sizeSlider.addEventListener('input', (e) => allElements.sizeValue.textContent = `${e.target.value}%`);
    
    // Watermark Type Toggle
    allElements.typeTextBtn.addEventListener('click', () => {
        allElements.typeTextBtn.classList.add('active');
        allElements.typeImageBtn.classList.remove('active');
        allElements.textOptions.style.display = 'block';
        allElements.imageOptions.style.display = 'none';
        updateOptionsAndDraw();
    });
    allElements.typeImageBtn.addEventListener('click', () => {
        allElements.typeImageBtn.classList.add('active');
        allElements.typeTextBtn.classList.remove('active');
        allElements.imageOptions.style.display = 'block';
        allElements.textOptions.style.display = 'none';
        updateOptionsAndDraw();
    });

    // Watermark Logo Upload
    allElements.logoUploadBtn.addEventListener('click', () => allElements.logoUploadInput.click());
    allElements.logoUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            watermarkLogo = new Image();
            watermarkLogo.src = URL.createObjectURL(file);
            watermarkLogo.onload = () => {
                options.watermark.logo = watermarkLogo;
                allElements.logoName.textContent = file.name;
                updateOptionsAndDraw();
            };
        }
    });

    // Watermark Position Grid
    allElements.positionGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('pos-btn')) {
            allElements.positionGrid.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            updateOptionsAndDraw();
        }
    });
    
    // Main Process Button
    allElements.processBtn.addEventListener('click', processAndDownload);
}

// === 5. FILE PROCESSING & DOWNLOADING ===

async function processAndDownload() {
    if (selectedFiles.length === 0) {
        showNotification('Please select some images first.', true);
        return;
    }

    allElements.processBtn.disabled = true;
    const originalBtnHTML = allElements.processBtn.innerHTML;
    const zip = new JSZip();
    let completed = 0;

    try {
        for (const file of selectedFiles) {
            allElements.processBtn.innerHTML = `<span>Processing ${++completed}/${selectedFiles.length}...</span>`;
            const result = await processFile(file);
            zip.file(result.name, result.data, { base64: true });
        }

        allElements.processBtn.innerHTML = `<span>Zipping files...</span>`;
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'PixelShift_Suite_Images.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        showNotification('Success! Your images have been downloaded.');

    } catch (error) {
        console.error('Processing Error:', error);
        showNotification('An error occurred during processing.', true);
    } finally {
        allElements.processBtn.disabled = false;
        allElements.processBtn.innerHTML = originalBtnHTML;
    }
}

function processFile(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onerror = reject;
        img.onload = async () => {
            let processedFile = file;
            const originalType = file.type;
            const targetFormat = options.format === 'source' ? originalType : options.format;
            const needsCompression = (targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && options.quality < 100;
            
            // Step 1: Compress if needed (using library for better quality)
            if (needsCompression) {
                try {
                    processedFile = await imageCompression(file, {
                        maxSizeMB: 20, // High limit
                        useWebWorker: true,
                        quality: options.quality / 100,
                        fileType: targetFormat
                    });
                } catch (e) {
                    console.error('Compression failed:', e);
                    // Fallback to original file if compression fails
                }
            }

            // Step 2: Draw to canvas for resizing and watermarking
            const tempImg = new Image();
            tempImg.src = URL.createObjectURL(processedFile);
            tempImg.onerror = reject;
            tempImg.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = options.width || tempImg.naturalWidth;
                canvas.height = options.height || tempImg.naturalHeight;

                ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
                
                if (options.watermark.apply) {
                    applyWatermark(ctx, canvas.width, canvas.height);
                }

                // Step 3: Get final image data from canvas
                canvas.toBlob(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64Data = reader.result.split(',')[1];
                        const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
                        const extension = targetFormat.split('/')[1];
                        resolve({
                            name: `${originalName}-processed.${extension}`,
                            data: base64Data
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }, targetFormat, options.quality / 100);
            };
        };
    });
}


// === 6. INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateThumbnails(); // Initial UI state
    updateOptionsAndDraw(); // Initial preview state
});