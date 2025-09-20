const uploadInput = document.getElementById('upload-input');
const uploadLabel = document.querySelector('.upload-label');
const previewGrid = document.getElementById('preview-grid');
const fileCountSpan = document.getElementById('file-count');
const qualityContainer = document.getElementById('quality-container');
const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');
const convertBtn = document.getElementById('convert-btn');
const notification = document.getElementById('notification');
const formatSelectBtn = document.getElementById('format-select-btn');
const formatModalOverlay = document.getElementById('format-modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalOptions = document.querySelectorAll('.modal-option');
const clearBtn = document.getElementById('clear-btn');
const previewPlaceholder = document.querySelector('.preview-placeholder');

let selectedFiles = [];
let currentFormat = 'jpeg';

function showNotification(message, type) {
    notification.textContent = message;
    notification.className = type;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function handleFiles(files) {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (newFiles.length === 0) {
        showNotification('No valid image files selected.', 'error');
        return;
    }
    const totalFiles = selectedFiles.length + newFiles.length;
    if (totalFiles > 50) {
        showNotification(`Max 50 images allowed. You have ${selectedFiles.length} already.`, 'error');
        return;
    }
    selectedFiles.push(...newFiles);
    updatePreviewGrid();
    showNotification(`${newFiles.length} image(s) added.`, 'success');
}

function updatePreviewGrid() {
    if (selectedFiles.length === 0) {
        previewGrid.innerHTML = '';
        previewGrid.appendChild(previewPlaceholder);
        fileCountSpan.textContent = '0 files';
        clearBtn.style.display = 'none';
        return;
    }

    previewGrid.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const container = document.createElement('div');
        container.className = 'thumbnail-container';
        const img = document.createElement('img');
        img.className = 'thumbnail-img';
        img.src = URL.createObjectURL(file);
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            selectedFiles.splice(index, 1);
            updatePreviewGrid();
        });
        container.appendChild(img);
        container.appendChild(removeBtn);
        previewGrid.appendChild(container);
    });

    fileCountSpan.textContent = `${selectedFiles.length} files`;
    clearBtn.style.display = 'inline-block';
}

uploadInput.addEventListener('change', (event) => handleFiles(event.target.files));
uploadLabel.addEventListener('dragover', (event) => { event.preventDefault(); uploadLabel.classList.add('dragover'); });
uploadLabel.addEventListener('dragleave', () => uploadLabel.classList.remove('dragover'));
uploadLabel.addEventListener('drop', (event) => { event.preventDefault(); uploadLabel.classList.remove('dragover'); handleFiles(event.dataTransfer.files); });

qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = `${qualitySlider.value}%`;
});

formatSelectBtn.addEventListener('click', () => formatModalOverlay.classList.add('visible'));
closeModalBtn.addEventListener('click', () => formatModalOverlay.classList.remove('visible'));
formatModalOverlay.addEventListener('click', (event) => {
    if (event.target === formatModalOverlay) {
        formatModalOverlay.classList.remove('visible');
    }
});

modalOptions.forEach(option => {
    option.addEventListener('click', () => {
        currentFormat = option.dataset.format;
        formatSelectBtn.querySelector('span').textContent = currentFormat.toUpperCase();
        modalOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        qualityContainer.style.display = (currentFormat === 'jpeg' || currentFormat === 'webp') ? 'block' : 'none';
        formatModalOverlay.classList.remove('visible');
    });
});

clearBtn.addEventListener('click', () => {
    selectedFiles = [];
    uploadInput.value = '';
    updatePreviewGrid();
    showNotification('All images cleared.', 'success');
});

function convertFile(file, format, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const mimeType = `image/${format}`;
                const convertedDataUrl = canvas.toDataURL(mimeType, quality);
                const base64Data = convertedDataUrl.split(',')[1];
                resolve({
                    name: file.name.split('.').slice(0, -1).join('.') + `.${format}`,
                    data: base64Data
                });
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

convertBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
        showNotification('Please select images first!', 'error');
        return;
    }
    
    convertBtn.disabled = true;
    const originalBtnText = convertBtn.textContent;
    convertBtn.textContent = 'Processing...';

    const quality = qualitySlider.value / 100;
    
    try {
        if (selectedFiles.length === 1) {
            const file = selectedFiles[0];
            const convertedFile = await convertFile(file, currentFormat, quality);
            const link = document.createElement('a');
            link.href = `data:image/${currentFormat};base64,${convertedFile.data}`;
            link.download = convertedFile.name;
            link.click();
            showNotification('Image converted successfully!', 'success');
        } else {
            const zip = new JSZip();
            const conversionPromises = selectedFiles.map(file => convertFile(file, currentFormat, quality));
            
            let completed = 0;
            conversionPromises.forEach(p => {
                p.then(() => {
                    completed++;
                    convertBtn.textContent = `Converting ${completed}/${selectedFiles.length}...`;
                });
            });

            const convertedFiles = await Promise.all(conversionPromises);
            
            convertBtn.textContent = 'Zipping...';
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'PixelShift-Images.zip';
            link.click();
            URL.revokeObjectURL(link.href);
            showNotification('ZIP file downloaded!', 'success');
        }
    } catch (error) {
        showNotification('An error occurred during conversion.', 'error');
        console.error(error);
    } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = originalBtnText;
    }
});

updatePreviewGrid();