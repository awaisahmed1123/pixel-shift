const uploadInput = document.getElementById('upload-input');
const uploadLabel = document.querySelector('.upload-label');
const previewGrid = document.getElementById('preview-grid');
const fileCountSpan = document.getElementById('file-count');
const resizeBtn = document.getElementById('resize-btn');
const notification = document.getElementById('notification');
const clearBtn = document.getElementById('clear-btn');
const previewPlaceholder = document.querySelector('.preview-placeholder');
const widthInput = document.getElementById('width-input');
const heightInput = document.getElementById('height-input');

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
    if (totalFiles > 50) {
        showNotification(`Max 50 images allowed. You have ${selectedFiles.length} already.`, 'error');
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

function resizeFile(file, newWidth, newHeight) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                const mimeType = file.type.startsWith('image/png') ? 'image/png' : 'image/jpeg';
                const fileExtension = mimeType.split('/')[1];

                const resizedDataUrl = canvas.toDataURL(mimeType, 1.0);
                const base64Data = resizedDataUrl.split(',')[1];
                
                resolve({
                    name: file.name.split('.').slice(0, -1).join('.') + `-resized.${fileExtension}`,
                    data: base64Data,
                    mimeType: mimeType
                });
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

resizeBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
        showNotification('Please select images first!', 'error');
        return;
    }
    
    const newWidth = parseInt(widthInput.value, 10);
    const newHeight = parseInt(heightInput.value, 10);

    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) {
        showNotification('Please enter valid width and height!', 'error');
        return;
    }
    
    resizeBtn.disabled = true;
    resizeBtn.textContent = 'Processing...';

    try {
        if (selectedFiles.length === 1) {
            const file = selectedFiles[0];
            const resizedFile = await resizeFile(file, newWidth, newHeight);
            const link = document.createElement('a');
            link.href = `data:${resizedFile.mimeType};base64,${resizedFile.data}`;
            link.download = resizedFile.name;
            link.click();
            showNotification('Image resized successfully!', 'success');
        } else {
            const zip = new JSZip();
            let completed = 0;
            
            for (const file of selectedFiles) {
                completed++;
                resizeBtn.textContent = `Resizing ${completed}/${selectedFiles.length}...`;
                const resizedFile = await resizeFile(file, newWidth, newHeight);
                zip.file(resizedFile.name, resizedFile.data, { base64: true });
            }

            resizeBtn.textContent = 'Zipping...';
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'PixelShift-Resized.zip';
            link.click();
            URL.revokeObjectURL(link.href);
            showNotification('ZIP file downloaded!', 'success');
        }
    } catch (error) {
        showNotification('An error occurred during resizing.', 'error');
        console.error(error);
    } finally {
        resizeBtn.disabled = false;
        resizeBtn.textContent = 'Resize & Download';
    }
});

updatePreviewGrid();