const uploadInput = document.getElementById('upload-input');
const uploadLabel = document.querySelector('.upload-label');
const previewGrid = document.getElementById('preview-grid');
const fileCountSpan = document.getElementById('file-count');
const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');
const compressBtn = document.getElementById('compress-btn');
const notification = document.getElementById('notification');
const clearBtn = document.getElementById('clear-btn');
const previewPlaceholder = document.querySelector('.preview-placeholder');
const resultsArea = document.getElementById('results-area');

let selectedFiles = [];

function showNotification(message, type) {
    notification.textContent = message;
    notification.className = type;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function updatePreviewGrid() {
    if (selectedFiles.length === 0) {
        previewGrid.innerHTML = '';
        previewGrid.appendChild(previewPlaceholder);
        fileCountSpan.textContent = '0 files';
        clearBtn.style.display = 'none';
        resultsArea.innerHTML = '';
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

function handleFiles(files) {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (newFiles.length === 0) {
        showNotification('No valid image files selected.', 'error');
        return;
    }
    const totalFiles = selectedFiles.length + newFiles.length;
    if (totalFiles > 500) {
        showNotification(`You can only select up to 500 images. You have ${selectedFiles.length} already.`, 'error');
        return;
    }
    selectedFiles.push(...newFiles);
    updatePreviewGrid();
    showNotification(`${newFiles.length} image(s) added.`, 'success');
}

uploadInput.addEventListener('change', (event) => handleFiles(event.target.files));
uploadLabel.addEventListener('dragover', (event) => { event.preventDefault(); uploadLabel.classList.add('dragover'); });
uploadLabel.addEventListener('dragleave', () => uploadLabel.classList.remove('dragover'));
uploadLabel.addEventListener('drop', (event) => { event.preventDefault(); uploadLabel.classList.remove('dragover'); handleFiles(event.dataTransfer.files); });

clearBtn.addEventListener('click', () => {
    selectedFiles = [];
    uploadInput.value = '';
    updatePreviewGrid();
    showNotification('All images cleared.', 'success');
});

qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = `${qualitySlider.value}%`;
});

async function compressFile(file, options) {
    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to compress ${file.name}`);
    }
}

compressBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
        showNotification('Please select images first!', 'error');
        return;
    }
    
    compressBtn.disabled = true;
    compressBtn.textContent = 'Processing...';
    resultsArea.innerHTML = '';

    const quality = 1 - (qualitySlider.value / 100);
    const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: quality
    };

    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    try {
        if (selectedFiles.length === 1) {
            const file = selectedFiles[0];
            totalOriginalSize = file.size;
            compressBtn.textContent = `Compressing ${file.name}...`;
            const compressedFile = await compressFile(file, options);
            totalCompressedSize = compressedFile.size;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(compressedFile);
            const originalName = file.name.split('.').slice(0, -1).join('.');
            link.download = `${originalName}-compressed.jpg`;
            link.click();
            URL.revokeObjectURL(link.href);
            showNotification('Image compressed successfully!', 'success');
        } else {
            const zip = new JSZip();
            let completed = 0;
            
            for (const file of selectedFiles) {
                totalOriginalSize += file.size;
                const compressedFile = await compressFile(file, options);
                totalCompressedSize += compressedFile.size;
                const originalName = compressedFile.name.split('.').slice(0, -1).join('.');
                zip.file(`${originalName}-compressed.jpg`, compressedFile);
                completed++;
                compressBtn.textContent = `Compressing ${completed}/${selectedFiles.length}...`;
            }

            compressBtn.textContent = 'Zipping...';
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'PixelShift-Compressed.zip';
            link.click();
            URL.revokeObjectURL(link.href);
            showNotification('ZIP file downloaded!', 'success');
        }

        const savings = 100 - (totalCompressedSize / totalOriginalSize * 100);
        resultsArea.innerHTML = `
            Original: <span>${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB</span> | 
            Compressed: <span>${(totalCompressedSize / 1024 / 1024).toFixed(2)} MB</span> | 
            Savings: <span>${savings.toFixed(1)}%</span>
        `;

    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        compressBtn.disabled = false;
        compressBtn.textContent = 'Compress & Download';
    }
});

updatePreviewGrid();