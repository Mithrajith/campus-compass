let isUploading = false;

function toggleToUpload() {
    document.getElementById('formSection').classList.add('hidden');
    document.getElementById('uploadSection').classList.remove('hidden');
}

function toggleToForm() {
    document.getElementById('formSection').classList.remove('hidden');
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('reviewForm').reset();
}

document.getElementById('reviewForm').addEventListener('submit', (e) => {
    e.preventDefault();
    toggleToUpload();
});

async function loadImages(event) {
    const files = event.target.files;
    if (!files.length || isUploading) return;

    isUploading = true;
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('images', file));

    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    const result = await response.json();
    displayImages(result.files);
    isUploading = false;
}

function displayImages(images) {
    const imageArea = document.getElementById('image-upload-area');
    imageArea.innerHTML = images.map(img => `<img src="/uploads/${img}" alt="Uploaded Image">`).join('');
}
