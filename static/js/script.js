function loadImages(event) {
    const imageArea = document.getElementById('image-upload-area');
    imageArea.innerHTML = ''; // Clear the area before showing new images
    
    const files = event.target.files;
    if (files.length === 0) {
        imageArea.innerHTML = '<p>No images uploaded yet.</p>';
        return;
    }
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = `Image ${i + 1}`;
        imageContainer.appendChild(img);

        imageArea.appendChild(imageContainer);
    }
}

function toggleSidebar() {
    const container = document.querySelector('.container');
    const toggleBtn = document.getElementById('toggleBtn');
    
    container.classList.toggle('sidebar-hidden');

    // Change the arrow direction depending on the state
    if (container.classList.contains('sidebar-hidden')) {
        toggleBtn.innerHTML = '&#8594;'; // Right arrow when sidebar is hidden
    } else {
        toggleBtn.innerHTML = '&#8592;'; // Left arrow when sidebar is shown
    }
}

// Function to handle image uploads
async function loadImages(event) {
    const files = event.target.files;
    const formData = new FormData();
    
    for (let file of files) {
        formData.append('images', file);
    }
    
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
    }
}

// Function to display images
function displayImages(images) {
    const imageArea = document.getElementById('image-upload-area');
    imageArea.innerHTML = '';
    
    images.forEach(image => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-container';
        
        const img = document.createElement('img');
        img.src = `/uploads/${image}`;
        img.alt = 'Uploaded image';
        
        imgContainer.appendChild(img);
        imageArea.appendChild(imgContainer);
    });
}

// Function to handle image search
async function searchImages(query) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/search-images?query=${encodeURIComponent(query)}`);
        const result = await response.json();
        if (result.images) {
            displayImages(result.images);
        } else {
            // Clear the image area if no images were found
            document.getElementById('image-upload-area').innerHTML = '<p>No images found with the specified name.</p>';
        }
    } catch (error) {
        console.error('Error searching images:', error);
    }
}

// Function to handle form submission
async function submitReview() {
    const name = document.getElementById('name').value;
    const review = document.getElementById('review').value;
    const uploadedImages = Array.from(document.querySelectorAll('.image-container img'))
        .map(img => img.src.split('/').pop());
    
    if (!name || !review) {
        alert('Please fill in all required fields');
        return;
    }
    
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
            // Clear the form
            document.getElementById('name').value = '';
            document.getElementById('review').value = '';
            document.getElementById('image-upload-area').innerHTML = '<p>No images uploaded yet.</p>';
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Error submitting review. Please try again.');
    }
}

// Add event listeners
document.querySelector('.submit-btn').addEventListener('click', submitReview);

// Add search functionality to the comment box, only triggering on "Enter" key press
document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchImages(e.target.value);
    }
});
