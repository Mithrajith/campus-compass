let isUploading = false;

function toggleSidebar() {
    document.querySelector('.container').classList.toggle('sidebar-hidden');
}

async function loadImages(event) {
    if (isUploading) return;
    isUploading = true;

    const files = event.target.files;
    if (!files.length) {
        isUploading = false;
        return;
    }

    const imageArea = document.getElementById('image-upload-area');
    imageArea.innerHTML = '<p>Uploading images...</p>';

    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('images', file);
    });

    try {
        const response = await fetch('http://127.0.0.1:5000/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.files) {
            displayImages(result.files);
        }
    } catch (error) {
        console.error('Error uploading images:', error);
        imageArea.innerHTML = '<p>Error uploading images. Please try again.</p>';
    } finally {
        isUploading = false;
    }
}

function displayImages(images) {
    const imageArea = document.getElementById('image-upload-area');
    imageArea.innerHTML = '';

    images.forEach(image => {
        const container = document.createElement('div');
        container.className = 'image-container';

        const img = document.createElement('img');
        img.src = `http://127.0.0.1:5000/uploads/${image}`;
        img.alt = 'Campus photo';
        img.loading = 'lazy';

        container.appendChild(img);
        imageArea.appendChild(container);
    });
}

async function searchImages(query) {
    if (!query.trim()) return;

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/search-images?query=${encodeURIComponent(query)}`);
        const result = await response.json();
        
        if (result.images?.length) {
            displayImages(result.images);
        } else {
            document.getElementById('image-upload-area').innerHTML = 
                '<p>No images found matching your search.</p>';
        }
    } catch (error) {
        console.error('Error searching images:', error);
    }
}

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const review = document.getElementById('review').value;
    const uploadedImages = Array.from(document.querySelectorAll('.image-container img'))
        .map(img => img.src.split('/').pop());

    const reviewData = {
        name,
        review,
        images: uploadedImages
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/api/submit-review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        });

        const result = await response.json();
        if (result.message) {
            alert('Review submitted successfully!');
            e.target.reset();
            document.getElementById('image-upload-area').innerHTML = 
                '<p>No images uploaded yet.</p>';
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Error submitting review. Please try again.');
    }
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchImages(e.target.value);
    }
});