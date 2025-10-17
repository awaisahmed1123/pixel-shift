// === 1. ELEMENT SELECTORS ===
const allElements = {
    // Core Elements
    uploadInput: document.getElementById('upload-input'),
    thumbnailsList: document.getElementById('thumbnails-list'),
    fileCountSpan: document.getElementById('file-count'),
    clearBtn: document.getElementById('clear-btn'),
    processBtn: document.getElementById('process-btn'),
    previewCanvas: document.getElementById('preview-canvas'),
    placeholderText: document.getElementById('placeholder-text'),
    notification: document.getElementById('notification'),

    // Toolbar & Panels
    toolsToolbar: document.getElementById('tools-toolbar'),

    // Tool Controls
    formatGrid: document.getElementById('format-grid'),
    compressSlider: document.getElementById('compress-slider'),
    compressValue: document.getElementById('compress-value'),
    widthInput: document.getElementById('width-input'),
    heightInput: document.getElementById('height-input'),
    filtersGrid: document.getElementById('filters-grid'),
    watermarkTypeToggle: document.getElementById('watermark-type-toggle'),
    textOptions: document.getElementById('text-options'),
    imageOptions: document.getElementById('image-options'),
    watermarkText: document.getElementById('watermark-text'),
    colorPicker: document.getElementById('color-picker'),
    fontSelect: document.getElementById('font-select'), // Added Font Select
    logoUploadInput: document.getElementById('logo-upload-input'),
    logoName: document.getElementById('logo-name'),
    opacitySlider: document.getElementById('opacity-slider'),
    opacityValue: document.getElementById('opacity-value'),
    sizeSlider: document.getElementById('size-slider'),
    sizeValue: document.getElementById('size-value'),
    positionGrid: document.getElementById('position-grid'),

    // Progress Modal Elements
    progressModal: document.getElementById('progress-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalStatus: document.getElementById('modal-status'),
    progressBar: document.getElementById('progress-bar'),
    progressPercentage: document.getElementById('progress-percentage'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
};

// === 2. STATE MANAGEMENT ===
let selectedFiles = [], originalImages = [], watermarkLogo = null, currentPreviewIndex = 0;
let options = {
    format: 'source', quality: 80, width: null, height: null, filter: 'original',
    watermark: {
        type: 'text', text: '', color: '#FFFFFF', font: 'Inter', // Added font state
        opacity: 0.5, size: 10, position: 'middle-center'
    }
};

// === 3. UI STATE FUNCTIONS ===
const showPreviewArea = () => { allElements.placeholderText.style.display = 'none'; allElements.previewCanvas.style.display = 'block'; };
const hidePreviewArea = () => { allElements.placeholderText.style.display = 'flex'; allElements.previewCanvas.style.display = 'none'; const ctx = allElements.previewCanvas.getContext('2d'); ctx.clearRect(0, 0, allElements.previewCanvas.width, allElements.previewCanvas.height); };

// === 4. CORE LOGIC ===
const showNotification = (message, isError = false) => {
    allElements.notification.textContent = message;
    allElements.notification.style.backgroundColor = isError ? 'var(--color-danger)' : 'var(--color-accent)';
    allElements.notification.classList.add('show');
    setTimeout(() => { allElements.notification.classList.remove('show'); }, 3000);
};

async function handleFiles(files) {
    const wasEmpty = selectedFiles.length === 0;
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (newFiles.length === 0) return;
    if (selectedFiles.length + newFiles.length > 500) { showNotification(`Maximum 500 images allowed.`, true); return; }
    if (wasEmpty) currentPreviewIndex = 0;
    
    // Show temporary loading notification
    showNotification(`Loading ${newFiles.length} image(s)...`);

    let loadedCount = 0;
    for (const file of newFiles) {
        try {
            // Using FileReader and Image object for potentially better compatibility
            const reader = new FileReader();
            const imgLoadPromise = new Promise((resolve, reject) => {
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = event.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const img = await imgLoadPromise;
            originalImages.push(img); // Store Image objects
            selectedFiles.push(file);
            loadedCount++;

        } catch (error) {
            console.error("Error loading image:", file.name, error);
            showNotification(`Could not load file: ${file.name}`, true);
        }
    }
    
    if (loadedCount > 0) {
       showNotification(`Loaded ${loadedCount} image(s) successfully.`);
       updateThumbnails();
       if (wasEmpty) showPreviewArea();
       updateOptionsAndDraw();
    } else if (newFiles.length > 0) {
        // Handle case where some files were selected but none loaded
        showNotification("Failed to load selected image(s).", true);
    }
}


const updateThumbnails = () => {
    allElements.thumbnailsList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const thumb = document.createElement('div');
        thumb.className = `thumbnail ${index === currentPreviewIndex ? 'active' : ''}`;
        const img = document.createElement('img');
        // Use Image object directly if available, otherwise fallback to createObjectURL
        if (originalImages[index] instanceof Image) {
            img.src = originalImages[index].src;
        } else {
             img.src = URL.createObjectURL(file);
             img.onload = () => URL.revokeObjectURL(img.src); // Revoke only if created here
        }

        thumb.appendChild(img);
        thumb.addEventListener('click', () => { currentPreviewIndex = index; updateThumbnails(); updateOptionsAndDraw(); });
        allElements.thumbnailsList.appendChild(thumb);
    });
    const fileCount = selectedFiles.length;
    allElements.fileCountSpan.textContent = `${fileCount} file${fileCount !== 1 ? 's' : ''} selected`;
    allElements.clearBtn.disabled = fileCount === 0;
    allElements.processBtn.disabled = fileCount === 0;
};


const drawLivePreview = () => {
    if (selectedFiles.length === 0 || !originalImages[currentPreviewIndex]) { hidePreviewArea(); return; }
    // Ensure originalImages[currentPreviewIndex] is an Image object or similar drawable
    const img = originalImages[currentPreviewIndex];
    if (!img || typeof img.width === 'undefined') {
        console.error("Invalid image object for preview:", img);
        hidePreviewArea();
        return;
    }

    const ctx = allElements.previewCanvas.getContext('2d');
    allElements.previewCanvas.width = img.naturalWidth || img.width; // Use naturalWidth if available
    allElements.previewCanvas.height = img.naturalHeight || img.height;

    ctx.clearRect(0, 0, allElements.previewCanvas.width, allElements.previewCanvas.height); // Clear previous drawings

    let filterString = 'none';
    switch(options.filter) {
        case 'grayscale': filterString = 'grayscale(1)'; break; case 'sepia': filterString = 'sepia(1)'; break;
        case 'invert': filterString = 'invert(1)'; break; case 'vintage': filterString = 'sepia(0.5) contrast(1.2) brightness(0.9)'; break;
        case 'cool': filterString = 'contrast(1.1) brightness(1.05)'; break; case 'warm': filterString = 'sepia(0.3) saturate(1.2)'; break;
        case 'dramatic': filterString = 'contrast(1.4) saturate(1.3)'; break;
    }
    ctx.filter = filterString;
    ctx.drawImage(img, 0, 0, allElements.previewCanvas.width, allElements.previewCanvas.height);
    ctx.filter = 'none';
    drawWatermark(ctx, allElements.previewCanvas.width, allElements.previewCanvas.height);
};


const drawWatermark = (ctx, canvasWidth, canvasHeight) => {
    const wm = options.watermark;
    if ((wm.type === 'text' && !wm.text) || (wm.type === 'image' && !watermarkLogo)) return;
    ctx.globalAlpha = wm.opacity;
    let x, y, itemWidth, itemHeight;
    const padding = canvasWidth * 0.02;

    if (wm.type === 'text') {
        const fontSize = Math.max(10, (canvasWidth * wm.size) / 100); // Minimum font size 10px
        ctx.font = `600 ${fontSize}px "${wm.font}", sans-serif`; // Apply selected font
        ctx.fillStyle = wm.color;
        ctx.textAlign = 'left'; // Reset alignment
        ctx.textBaseline = 'bottom'; // Reset baseline
        const textMetrics = ctx.measureText(wm.text);
        itemWidth = textMetrics.width;
        // Approximation for text height based on font size
        itemHeight = fontSize * 1.2;
    } else { // image
        const ratio = watermarkLogo.naturalWidth / watermarkLogo.naturalHeight;
        itemWidth = (canvasWidth * wm.size) / 100;
        itemHeight = itemWidth / ratio;
    }

    const pos = wm.position.split('-');

    // Calculate position based on item dimensions
    if (pos[0] === 'top') {
        y = padding + itemHeight;
        ctx.textBaseline = 'top';
    } else if (pos[0] === 'middle') {
        y = canvasHeight / 2 + itemHeight / 3; // Adjusted for better vertical centering
         ctx.textBaseline = 'middle';
    } else { // bottom
        y = canvasHeight - padding;
        ctx.textBaseline = 'bottom';
    }

    if (pos[1] === 'left') {
        x = padding;
         ctx.textAlign = 'left';
    } else if (pos[1] === 'center') {
        x = (canvasWidth - itemWidth) / 2;
         ctx.textAlign = 'center';
         // Adjust x for canvas text drawing when centered
         if (wm.type === 'text') x = canvasWidth / 2;
    } else { // right
        x = canvasWidth - itemWidth - padding;
         ctx.textAlign = 'right';
         // Adjust x for canvas text drawing when right-aligned
         if (wm.type === 'text') x = canvasWidth - padding;
    }

    if (wm.type === 'text') {
        ctx.fillText(wm.text, x, y);
    } else {
        ctx.drawImage(watermarkLogo, x, y - itemHeight, itemWidth, itemHeight); // y adjusted for image drawing origin
    }
    ctx.globalAlpha = 1.0;
};


const updateOptionsAndDraw = () => {
    options.format = allElements.formatGrid.querySelector('.active').dataset.value;
    options.quality = parseInt(allElements.compressSlider.value);
    options.width = allElements.widthInput.value ? parseInt(allElements.widthInput.value) : null;
    options.height = allElements.heightInput.value ? parseInt(allElements.heightInput.value) : null;
    options.filter = allElements.filtersGrid.querySelector('.active').dataset.filter;
    options.watermark.text = allElements.watermarkText.value;
    options.watermark.color = allElements.colorPicker.value;
    options.watermark.font = allElements.fontSelect.value; // Get selected font
    options.watermark.opacity = parseFloat(allElements.opacitySlider.value);
    options.watermark.size = parseInt(allElements.sizeSlider.value);
    options.watermark.position = allElements.positionGrid.querySelector('.active').dataset.pos;
    drawLivePreview();
};

// --- DOWNLOAD LOGIC ---
async function processImagesAndDownload() {
    if (selectedFiles.length === 0) return;

    // Show Modal
    allElements.modalTitle.textContent = `Processing ${selectedFiles.length} Images...`;
    allElements.modalStatus.textContent = 'Initializing...';
    allElements.progressBar.style.width = '0%';
    allElements.progressPercentage.textContent = '0%';
    allElements.modalCloseBtn.style.display = 'none';
    allElements.progressModal.classList.add('show');

    const zip = new JSZip();
    const processingOptions = { ...options }; // Copy current options

    try {
        for (let i = 0; i < originalImages.length; i++) {
            const img = originalImages[i];
            const file = selectedFiles[i];
            const originalFilename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

            allElements.modalStatus.textContent = `Processing image ${i + 1} of ${selectedFiles.length}: ${file.name}`;

            const offscreenCanvas = document.createElement('canvas');
            const ctx = offscreenCanvas.getContext('2d');

            // --- Apply Resizing ---
            let targetWidth = img.naturalWidth || img.width;
            let targetHeight = img.naturalHeight || img.height;
            if (processingOptions.width || processingOptions.height) {
                 if (processingOptions.width && processingOptions.height) {
                    targetWidth = processingOptions.width;
                    targetHeight = processingOptions.height;
                 } else if (processingOptions.width) {
                    targetHeight = (img.naturalHeight || img.height) * (processingOptions.width / (img.naturalWidth || img.width));
                    targetWidth = processingOptions.width;
                 } else { // Only height is set
                    targetWidth = (img.naturalWidth || img.width) * (processingOptions.height / (img.naturalHeight || img.height));
                    targetHeight = processingOptions.height;
                 }
            }
            offscreenCanvas.width = Math.round(targetWidth);
            offscreenCanvas.height = Math.round(targetHeight);


            // --- Apply Filters ---
            let filterString = 'none';
             switch(processingOptions.filter) {
                case 'grayscale': filterString = 'grayscale(1)'; break; case 'sepia': filterString = 'sepia(1)'; break;
                case 'invert': filterString = 'invert(1)'; break; case 'vintage': filterString = 'sepia(0.5) contrast(1.2) brightness(0.9)'; break;
                case 'cool': filterString = 'contrast(1.1) brightness(1.05)'; break; case 'warm': filterString = 'sepia(0.3) saturate(1.2)'; break;
                case 'dramatic': filterString = 'contrast(1.4) saturate(1.3)'; break;
             }
            ctx.filter = filterString;

            // Draw (potentially resized) image
            ctx.drawImage(img, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
            ctx.filter = 'none'; // Reset filter

            // --- Apply Watermark ---
            drawWatermark(ctx, offscreenCanvas.width, offscreenCanvas.height); // Use current options for watermark

            // --- Determine Output Format and Compression ---
            let outputFormat = processingOptions.format === 'source' ? file.type : processingOptions.format;
            // Fallback for non-standard source types
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(outputFormat)) {
                 outputFormat = 'image/png'; // Default to PNG
            }
            let outputQuality = processingOptions.quality / 100; // Convert to 0-1 range
            let outputFilename = originalFilename;
            let outputExtension = outputFormat.split('/')[1];

            let blob;

            // Use browser-image-compression for JPG/WEBP quality control
             if (outputFormat === 'image/jpeg' || outputFormat === 'image/webp') {
                 try {
                     const tempBlob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, outputFormat, 1.0)); // Get full quality first
                     blob = await imageCompression(new File([tempBlob], file.name, {type: outputFormat}), {
                         maxSizeMB: undefined, // No size limit
                         maxWidthOrHeight: Math.max(offscreenCanvas.width, offscreenCanvas.height), // Keep original dimensions
                         useWebWorker: true,
                         initialQuality: outputQuality,
                         fileType: outputFormat
                     });
                     outputExtension = blob.type.split('/')[1]; // Update extension based on compressed blob type if needed
                 } catch (compressionError) {
                      console.error("Compression failed for", file.name, ":", compressionError);
                      // Fallback to canvas toBlob without compression library quality
                      blob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, outputFormat, outputQuality));
                 }
             } else { // For PNG or other formats
                 blob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, outputFormat));
             }

             if (blob) {
                 outputFilename = `${originalFilename}_processed.${outputExtension}`;
                 zip.file(outputFilename, blob);
             } else {
                 showNotification(`Failed to process: ${file.name}`, true);
             }


            // Update progress
            const progress = Math.round(((i + 1) / selectedFiles.length) * 100);
            allElements.progressBar.style.width = `${progress}%`;
            allElements.progressPercentage.textContent = `${progress}%`;

            // Yield to the event loop occasionally for large batches
            if ((i + 1) % 10 === 0) {
                 await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // --- Generate and Download Zip ---
        allElements.modalStatus.textContent = 'Generating ZIP file...';
        const zipBlob = await zip.generateAsync({ type: "blob" });

        // Trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'pixelshift_processed_images.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        // Update Modal for Completion
        allElements.modalTitle.textContent = 'Processing Complete!';
        allElements.modalStatus.textContent = 'Your images have been processed and downloaded. Thank You!';
        allElements.modalCloseBtn.style.display = 'block';

    } catch (error) {
        console.error("Error during processing:", error);
        allElements.modalTitle.textContent = 'Error!';
        allElements.modalStatus.textContent = `An error occurred during processing: ${error.message}. Please try again.`;
        allElements.progressBar.style.backgroundColor = 'var(--color-danger)'; // Show error in progress bar
        allElements.modalCloseBtn.style.display = 'block';
    }
}


function initializeEventListeners() {
    allElements.uploadInput.addEventListener('change', (e) => handleFiles(e.target.files));
    allElements.clearBtn.addEventListener('click', () => { selectedFiles = []; originalImages = []; currentPreviewIndex = 0; watermarkLogo = null; allElements.uploadInput.value = ''; updateThumbnails(); hidePreviewArea(); });

    // --- Tool Control Listeners ---
    const inputsToTrack = [allElements.compressSlider, allElements.widthInput, allElements.heightInput, allElements.watermarkText, allElements.colorPicker, allElements.fontSelect, allElements.opacitySlider, allElements.sizeSlider];
    inputsToTrack.forEach(input => { if (input) input.addEventListener('input', updateOptionsAndDraw); });

    allElements.compressSlider.addEventListener('input', e => allElements.compressValue.textContent = `${e.target.value}%`);
    allElements.opacitySlider.addEventListener('input', e => allElements.opacityValue.textContent = `${Math.round(e.target.value * 100)}%`);
    allElements.sizeSlider.addEventListener('input', e => allElements.sizeValue.textContent = `${e.target.value}%`);

    ['formatGrid', 'filtersGrid', 'positionGrid'].forEach(id => {
        if (!allElements[id]) return; // Add check
        allElements[id].addEventListener('click', e => {
            const btnClass = id === 'formatGrid' ? 'format-btn' : (id === 'filtersGrid' ? 'filter-btn' : 'pos-btn');
            const clickedButton = e.target.closest(`.${btnClass}`); // Use closest
            if (clickedButton) {
                allElements[id].querySelector('.active')?.classList.remove('active'); // Use optional chaining
                clickedButton.classList.add('active');
                updateOptionsAndDraw();
            }
        });
    });


    allElements.watermarkTypeToggle.addEventListener('click', (e) => {
         const clickedButton = e.target.closest('.toggle-btn');
         if (!clickedButton) return;

         const btnType = clickedButton.dataset.type;
         options.watermark.type = btnType;
         allElements.watermarkTypeToggle.classList.toggle('image-active', btnType === 'image');
         allElements.watermarkTypeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
         clickedButton.classList.add('active');

         // Use flex for display to potentially fix layout issues vs block
         allElements.textOptions.style.display = btnType === 'text' ? 'flex' : 'none';
         allElements.imageOptions.style.display = btnType === 'image' ? 'flex' : 'none';
         updateOptionsAndDraw();
    });


    allElements.logoUploadInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = event => {
                const img = new Image();
                img.onload = () => { watermarkLogo = img; allElements.logoName.textContent = file.name; updateOptionsAndDraw(); };
                img.onerror = () => showNotification("Could not load logo file.", true);
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else { // Reset if no file selected
             watermarkLogo = null;
             allElements.logoName.textContent = "Upload Logo";
             updateOptionsAndDraw();
        }
    });

    // Toolbar logic
    allElements.toolsToolbar.addEventListener('click', e => {
        const clickedBtn = e.target.closest('.toolbar-btn');
        if (!clickedBtn) return;
        allElements.toolsToolbar.querySelector('.active')?.classList.remove('active');
        document.querySelector('.tool-panel.active')?.classList.remove('active');
        const toolName = clickedBtn.dataset.tool;
        clickedBtn.classList.add('active');
        const targetPanel = document.getElementById(`${toolName}-panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    });

    // Process Button Listener
    allElements.processBtn.addEventListener('click', processImagesAndDownload);

    // Modal Close Button Listener
    allElements.modalCloseBtn.addEventListener('click', () => {
        allElements.progressModal.classList.remove('show');
        // Reset progress bar color just in case it was set to error
        allElements.progressBar.style.backgroundColor = 'var(--color-accent)';
    });
}

document.addEventListener('DOMContentLoaded', () => { initializeEventListeners(); hidePreviewArea(); });