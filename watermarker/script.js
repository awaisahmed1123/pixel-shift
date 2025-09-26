const imageUploadBtn = document.getElementById('image-upload-btn');
const imageUploadInput = document.getElementById('image-upload-input');
const logoUploadBtn = document.getElementById('logo-upload-btn');
const logoUploadInput = document.getElementById('logo-upload-input');

const typeTextBtn = document.getElementById('type-text-btn');
const typeImageBtn = document.getElementById('type-image-btn');
const textOptions = document.getElementById('text-options');
const imageOptions = document.getElementById('image-options');

const textInput = document.getElementById('text-input');
const colorPicker = document.getElementById('color-picker');
const fontSelect = document.getElementById('font-select');
const opacitySlider = document.getElementById('opacity-slider');
const sizeSlider = document.getElementById('size-slider');
const positionGrid = document.getElementById('position-grid');
const downloadBtn = document.getElementById('download-btn');

const canvas = document.getElementById('preview-canvas');
const placeholder = document.getElementById('canvas-placeholder');
const ctx = canvas.getContext('2d');
const notification = document.getElementById('notification');

let mainImage = new Image();
let watermarkLogo = new Image();
let state = {
    watermarkType: 'text',
    text: 'Pixel Shift',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    opacity: 0.5,
    size: 50,
    position: 'middle-center'
};

function showNotification(message, type) {
    notification.textContent = message;
    notification.className = type;
    notification.classList.add('show');
    setTimeout(() => { notification.classList.remove('show'); }, 3000);
}

function drawCanvas() {
    if (!mainImage.src) return;

    placeholder.style.display = 'none';
    canvas.style.display = 'block';

    const hRatio = canvas.parentElement.offsetWidth / mainImage.width;
    const vRatio = canvas.parentElement.offsetHeight / mainImage.height;
    const ratio = Math.min(hRatio, vRatio, 1);
    
    canvas.width = mainImage.width;
    canvas.height = mainImage.height;
    
    canvas.style.width = (mainImage.width * ratio) + 'px';
    canvas.style.height = (mainImage.height * ratio) + 'px';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mainImage, 0, 0);
    
    ctx.globalAlpha = state.opacity;

    let posX = canvas.width / 2;
    let posY = canvas.height / 2;
    const margin = 20;

    if (state.watermarkType === 'text') {
        const fontSize = state.size * (canvas.width / 1000);
        ctx.font = `bold ${fontSize}px ${state.fontFamily}`;
        ctx.fillStyle = state.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textMetrics = ctx.measureText(state.text);
        const textWidth = textMetrics.width;
        const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;


        if (state.position.includes('left')) { posX = textWidth / 2 + margin; }
        if (state.position.includes('right')) { posX = canvas.width - textWidth / 2 - margin; }
        if (state.position.includes('top')) { posY = textHeight / 2 + margin; }
        if (state.position.includes('bottom')) { posY = canvas.height - textHeight / 2 - margin; }

        ctx.fillText(state.text, posX, posY);
    } else if (watermarkLogo.src) {
        const logoWidth = watermarkLogo.width * (state.size / 500); // Adjusted for better logo scaling
        const logoHeight = watermarkLogo.height * (state.size / 500);

        if (state.position.includes('left')) { posX = margin; }
        if (state.position.includes('right')) { posX = canvas.width - logoWidth - margin; }
        if (state.position.includes('top')) { posY = margin; }
        if (state.position.includes('bottom')) { posY = canvas.height - logoHeight - margin; }
        if (state.position.startsWith('middle')) { posY = (canvas.height - logoHeight) / 2; }
        if (state.position.endsWith('center')) { posX = (canvas.width - logoWidth) / 2; }

        ctx.drawImage(watermarkLogo, posX, posY, logoWidth, logoHeight);
    }
}

imageUploadBtn.addEventListener('click', () => imageUploadInput.click());
imageUploadInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        mainImage.src = URL.createObjectURL(e.target.files[0]);
        mainImage.onload = drawCanvas;
    }
});

logoUploadBtn.addEventListener('click', () => logoUploadInput.click());
logoUploadInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        watermarkLogo.src = URL.createObjectURL(e.target.files[0]);
        watermarkLogo.onload = drawCanvas;
    }
});

typeTextBtn.addEventListener('click', () => {
    state.watermarkType = 'text';
    typeTextBtn.classList.add('active');
    typeImageBtn.classList.remove('active');
    textOptions.style.display = 'block';
    imageOptions.style.display = 'none';
    drawCanvas();
});

typeImageBtn.addEventListener('click', () => {
    state.watermarkType = 'image';
    typeImageBtn.classList.add('active');
    typeTextBtn.classList.remove('active');
    imageOptions.style.display = 'block';
    textOptions.style.display = 'none';
    drawCanvas();
});

textInput.addEventListener('input', (e) => { state.text = e.target.value; drawCanvas(); });
colorPicker.addEventListener('input', (e) => { state.color = e.target.value; drawCanvas(); });
fontSelect.addEventListener('change', (e) => { state.fontFamily = e.target.value; drawCanvas(); });
opacitySlider.addEventListener('input', (e) => { state.opacity = parseFloat(e.target.value); drawCanvas(); });
sizeSlider.addEventListener('input', (e) => { state.size = parseInt(e.target.value); drawCanvas(); });

positionGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('pos-btn')) {
        positionGrid.querySelector('.active').classList.remove('active');
        e.target.classList.add('active');
        state.position = e.target.dataset.pos;
        drawCanvas();
    }
});

downloadBtn.addEventListener('click', () => {
    if (!mainImage.src) {
        showNotification('Please upload an image first.', 'error');
        return;
    }
    const link = document.createElement('a');
    link.download = 'watermarked-image.png';
    link.href = canvas.toDataURL();
    link.click();
    showNotification('Image downloaded successfully!', 'success');
});