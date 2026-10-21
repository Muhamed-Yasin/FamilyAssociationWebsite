// Add your Cloudinary Cloud Name here
const cloudName = 'hgnumqmy';
const tag = 'family-album'; 

// The auto-generated JSON list of all images with this tag
const listUrl = `https://res.cloudinary.com/${cloudName}/image/list/${tag}.json`;

let albumImages = [];
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const galleryGrid = document.querySelector('.gallery-grid');
    const modal = document.getElementById('mediaModal');
    const modalContent = document.getElementById('modalContent');
    const closeBtn = document.querySelector('.close-modal');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Loading family memories...</p>';

    try {
        // Fetch the list of images from Cloudinary
        const response = await fetch(listUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        albumImages = data.resources; // Array of image objects from Cloudinary
        galleryGrid.innerHTML = ''; 

        // 1. Generate the Grid with Compressed Thumbnails
        albumImages.forEach((imgData, index) => {
            // Request a compressed, auto-formatted 400x300 thumbnail
            const thumbUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_400,h_300,q_auto,f_auto/${imgData.public_id}.jpg`;
            
            const imgElement = document.createElement('img');
            imgElement.src = thumbUrl;
            imgElement.alt = `Family Event`;
            imgElement.addEventListener('click', () => openModal(index));
            
            galleryGrid.appendChild(imgElement);
        });
    } catch (error) {
        console.error('Error fetching album:', error);
        galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Failed to load the album. Please check your Cloudinary settings.</p>';
    }

    // 2. Modal Logic for High-Resolution Images
    function openModal(index) {
        currentIndex = index;
        modal.style.display = 'flex';
        updateModalContent();
    }

    function closeModal() {
        modal.style.display = 'none';
        modalContent.innerHTML = ''; 
    }

    function updateModalContent() {
        modalContent.innerHTML = ''; 
        const imgData = albumImages[currentIndex];
        
        // Request the full-screen image, optimized for the browser
        const fullResUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${imgData.public_id}.jpg`;
        
        const imgElement = document.createElement('img');
        imgElement.src = fullResUrl;
        
        modalContent.appendChild(imgElement);
    }

    function changeMedia(direction) {
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = albumImages.length - 1;
        if (currentIndex >= albumImages.length) currentIndex = 0;
        updateModalContent();
    }

    // 3. Event Listeners for Controls
    closeBtn.addEventListener('click', closeModal);
    prevBtn.addEventListener('click', () => changeMedia(-1));
    nextBtn.addEventListener('click', () => changeMedia(1));

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'flex') {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') changeMedia(-1);
            if (e.key === 'ArrowRight') changeMedia(1);
        }
    });

    // --- SCROLL TO TOP LOGIC ---
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});