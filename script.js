document.addEventListener('DOMContentLoaded', function() {
    // ======================
    // DOM Elements
    // ======================
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
    const classFilter = document.getElementById('class-filter');
    const studentList = document.getElementById('student-list');

    // ======================
    // Sample Data
    // ======================
    const students = [
        { id: 1, name: "John Doe", class: "5A", rollNo: 25 },
        { id: 2, name: "Jane Smith", class: "5A", rollNo: 26 },
        { id: 3, name: "Michael Johnson", class: "5A", rollNo: 27 },
        { id: 4, name: "Emily Davis", class: "5B", rollNo: 15 },
        { id: 5, name: "Robert Wilson", class: "5B", rollNo: 16 },
        { id: 6, name: "Sarah Thompson", class: "5C", rollNo: 8 }
    ];

    // ======================
    // State Variables
    // ======================
    let cropper = null;
    let currentStudentCard = null;
    let currentStream = null;

    // ======================
    // Initialization
    // ======================
    generateStudentCards();
    setupEventListeners();
    checkSavedPhotos();

    // ======================
    // Core Functions
    // ======================
    function generateStudentCards(filterClass = null) {
        studentList.innerHTML = ''; // Clear existing cards
        
        const filteredStudents = filterClass 
            ? students.filter(student => student.class === filterClass)
            : students;
        
        filteredStudents.forEach(student => {
            const savedPhoto = localStorage.getItem(`student-${student.id}`);
            
            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <div class="photo-container">
                    <img src="${savedPhoto || 'placeholder.jpg'}" 
                         alt="Student Photo" 
                         class="student-photo" 
                         id="student-${student.id}">
                    <button class="capture-btn">Take Photo</button>
                </div>
                <div class="student-info">
                    <h3>${student.name}</h3>
                    <p>Class: ${student.class}</p>
                    <p>Roll No: ${student.rollNo}</p>
                </div>
            `;
            
            studentList.appendChild(card);
        });
    }

    function openCameraModal() {
        modal.style.display = 'block';
        resetCameraView();
        startCamera();
    }

    function closeCameraModal() {
        stopCamera();
        destroyCropper();
        modal.style.display = 'none';
    }

    function capturePhoto() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        
        photoToCrop.src = canvas.toDataURL('image/jpeg', 0.9);
        switchToCroppingView();
    }

    function retryPhoto() {
        resetCameraView();
        destroyCropper();
    }

    function initCropper() {
        cropper = new Cropper(photoToCrop, {
            aspectRatio: 3/4,
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true,
            ready: function() {
                cropBtn.style.display = 'none';
                saveBtn.style.display = 'block';
            }
        });
    }

    function savePhoto() {
        if (!currentStudentCard || !cropper) return;
        
        const croppedCanvas = cropper.getCroppedCanvas({
            width: 600,
            height: 800,
            imageSmoothingQuality: 'high',
        });
        
        const imageData = croppedCanvas.toDataURL('image/jpeg', 0.9);
        const studentPhoto = currentStudentCard.querySelector('.student-photo');
        studentPhoto.src = imageData;
        localStorage.setItem(studentPhoto.id, imageData);
        
        closeCameraModal();
    }

    // ======================
    // Helper Functions
    // ======================
    function setupEventListeners() {
        // Delegated event listener for capture buttons
        studentList.addEventListener('click', function(e) {
            if (e.target.classList.contains('capture-btn')) {
                currentStudentCard = e.target.closest('.student-card');
                openCameraModal();
            }
        });

        // Modal controls
        closeBtn.addEventListener('click', closeCameraModal);
        captureBtn.addEventListener('click', capturePhoto);
        retryBtn.addEventListener('click', retryPhoto);
        cropBtn.addEventListener('click', initCropper);
        saveBtn.addEventListener('click', savePhoto);

        // Class filter
        classFilter.addEventListener('change', function() {
            generateStudentCards(this.value || null);
        });
    }

    function resetCameraView() {
        cameraViewContainer.style.display = 'block';
        croppingView.style.display = 'none';
        captureBtn.style.display = 'block';
        retryBtn.style.display = 'none';
        cropBtn.style.display = 'none';
        saveBtn.style.display = 'none';
    }

    function switchToCroppingView() {
        cameraViewContainer.style.display = 'none';
        croppingView.style.display = 'block';
        captureBtn.style.display = 'none';
        retryBtn.style.display = 'block';
        cropBtn.style.display = 'block';
    }

    function startCamera() {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert("Camera API not supported in this browser.");
            return;
        }

        const constraints = {
            video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };
        
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                currentStream = stream;
                video.srcObject = stream;
            })
            .catch(err => {
                console.error("Camera error:", err);
                alert("Could not access the camera. Please check permissions.");
            });
    }

    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
    }

    function destroyCropper() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }

    function checkSavedPhotos() {
        document.querySelectorAll('.student-photo').forEach(photo => {
            const savedPhoto = localStorage.getItem(photo.id);
            if (savedPhoto) photo.src = savedPhoto;
        });
    }
});