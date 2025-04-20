document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const modal = document.getElementById('camera-modal');
    const closeBtn = document.querySelector('.close-btn');
    const captureBtn = document.getElementById('capture-btn');
    const retryBtn = document.getElementById('retry-btn');
    const cropBtn = document.getElementById('crop-btn');
    const saveBtn = document.getElementById('save-btn');
    const video = document.getElementById('camera-view');
    const cameraViewContainer = document.getElementById('camera-view-container');
    const croppingView = document.getElementById('cropping-view');
    const photoToCrop = document.getElementById('photo-to-crop');
    
    // Cropper instance
    let cropper = null;
    let currentStudentCard = null;
    let currentStream = null;
    
    // Open camera modal
    document.querySelector('.capture-btn').addEventListener('click', function() {
        currentStudentCard = this.closest('.student-card');
        openCameraModal();
    });
    
    // Close modal
    closeBtn.addEventListener('click', closeCameraModal);
    
    // Capture photo
    captureBtn.addEventListener('click', capturePhoto);
    
    // Retry photo
    retryBtn.addEventListener('click', retryPhoto);
    
    // Crop photo
    cropBtn.addEventListener('click', initCropper);
    
    // Save photo
    saveBtn.addEventListener('click', savePhoto);
    
    function openCameraModal() {
        modal.style.display = 'block';
        
        // Reset views
        cameraViewContainer.style.display = 'block';
        croppingView.style.display = 'none';
        captureBtn.style.display = 'block';
        retryBtn.style.display = 'none';
        cropBtn.style.display = 'none';
        saveBtn.style.display = 'none';
        
        // Start camera with higher quality
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const constraints = {
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                }
            };
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(stream) {
                    currentStream = stream;
                    video.srcObject = stream;
                })
                .catch(function(err) {
                    console.error("Camera error: ", err);
                    // Fallback to lower resolution if needed
                    navigator.mediaDevices.getUserMedia({ video: true })
                        .then(function(stream) {
                            currentStream = stream;
                            video.srcObject = stream;
                        })
                        .catch(function(err) {
                            alert("Could not access the camera: " + err.message);
                        });
                });
        } else {
            alert("Camera API not supported in this browser.");
        }
    }
    
    function closeCameraModal() {
        // Stop camera stream
        if(currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
        
        // Destroy cropper if exists
        if(cropper) {
            cropper.destroy();
            cropper = null;
        }
        
        modal.style.display = 'none';
    }
    
    function capturePhoto() {
        // Create canvas with higher resolution
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to high quality JPEG (90% quality)
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        photoToCrop.src = imageData;
        
        // Switch to cropping view
        cameraViewContainer.style.display = 'none';
        croppingView.style.display = 'block';
        
        // Show controls
        captureBtn.style.display = 'none';
        retryBtn.style.display = 'block';
        cropBtn.style.display = 'block';
    }
    
    function retryPhoto() {
        // Go back to camera view
        cameraViewContainer.style.display = 'block';
        croppingView.style.display = 'none';
        captureBtn.style.display = 'block';
        retryBtn.style.display = 'none';
        cropBtn.style.display = 'none';
        saveBtn.style.display = 'none';
        
        // Destroy cropper if exists
        if(cropper) {
            cropper.destroy();
            cropper = null;
        }
    }
    
    function initCropper() {
        // Initialize cropper with square aspect ratio
        cropper = new Cropper(photoToCrop, {
            aspectRatio: 3/4, // Standard ID photo ratio
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true,
            guides: false,
            center: false,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            ready: function() {
                // Enable save button when cropper is ready
                cropBtn.style.display = 'none';
                saveBtn.style.display = 'block';
            }
        });
    }
    
    function savePhoto() {
        if (!currentStudentCard || !cropper) return;
        
        // Get cropped image (high quality)
        const croppedCanvas = cropper.getCroppedCanvas({
            width: 600, // Output width
            height: 800, // Output height
            minWidth: 256,
            minHeight: 256,
            maxWidth: 2000,
            maxHeight: 2000,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });
        
        // Convert to JPEG with 90% quality
        const imageData = croppedCanvas.toDataURL('image/jpeg', 0.9);
        
        // Get the student photo element in the card
        const studentPhoto = currentStudentCard.querySelector('.student-photo');
        studentPhoto.src = imageData;
        
        // Store in localStorage (temporary)
        const studentId = studentPhoto.id;
        localStorage.setItem(studentId, imageData);
        
        // Close modal
        closeCameraModal();
    }
    
    // Check for saved photos on page load
    function checkSavedPhotos() {
        const studentPhotos = document.querySelectorAll('.student-photo');
        studentPhotos.forEach(photo => {
            const savedPhoto = localStorage.getItem(photo.id);
            if (savedPhoto) {
                photo.src = savedPhoto;
            }
        });
    }
    
    checkSavedPhotos();
});