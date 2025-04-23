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
    const addStudentBtn = document.getElementById('add-student');
    const exportBtn = document.getElementById('export-data');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');

    // ======================
    // Sample Data
    // ======================
    let students = [
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
    let currentEditStudent = null;

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
                    <button class="edit-btn">Edit Details</button>
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

    function showEditModal(student = null) {
        currentEditStudent = student;
        
        if(student) {
            document.getElementById('edit-name').value = student.name;
            document.getElementById('edit-class').value = student.class;
            document.getElementById('edit-roll').value = student.rollNo;
        } else {
            editForm.reset();
        }
        
        editModal.style.display = 'block';
    }

    function closeEditModal() {
        editModal.style.display = 'none';
        currentEditStudent = null;
    }

    function handleEditSubmit(e) {
        e.preventDefault();
        
        const updatedStudent = {
            name: document.getElementById('edit-name').value.trim(),
            class: document.getElementById('edit-class').value,
            rollNo: parseInt(document.getElementById('edit-roll').value)
        };
        
        if (!updatedStudent.name || isNaN(updatedStudent.rollNo)) {
            alert('Please fill all required fields with valid values');
            return;
        }

        if(currentEditStudent) {
            // Update existing student
            Object.assign(currentEditStudent, updatedStudent);
        } else {
            // Add new student
            updatedStudent.id = students.length + 1;
            students.push(updatedStudent);
        }
        
        generateStudentCards(classFilter.value || null);
        closeEditModal();
    }

    function exportToCSV() {
        const csvContent = [
            ['ID', 'Name', 'Class', 'Roll Number', 'Photo URL'],
            ...students.map(student => [
                student.id,
                `"${student.name}"`,
                student.class,
                student.rollNo,
                localStorage.getItem(`student-${student.id}`) || 'No Photo'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'students.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ======================
    // Helper Functions
    // ======================
    function setupEventListeners() {
        // Student list interactions
        studentList.addEventListener('click', function(e) {
            const card = e.target.closest('.student-card');
            if (!card) return;

            if (e.target.classList.contains('capture-btn')) {
                currentStudentCard = card;
                openCameraModal();
            }
            
            if (e.target.classList.contains('edit-btn')) {
                const studentId = parseInt(card.querySelector('.student-photo').id.split('-')[1]);
                const student = students.find(s => s.id === studentId);
                showEditModal(student);
            }
        });

        // Camera modal controls
        closeBtn.addEventListener('click', closeCameraModal);
        captureBtn.addEventListener('click', capturePhoto);
        retryBtn.addEventListener('click', retryPhoto);
        cropBtn.addEventListener('click', initCropper);
        saveBtn.addEventListener('click', savePhoto);

        // Class filter
        classFilter.addEventListener('change', function() {
            generateStudentCards(this.value || null);
        });

        // Edit modal controls
        addStudentBtn.addEventListener('click', () => showEditModal());
        exportBtn.addEventListener('click', exportToCSV);
        editForm.addEventListener('submit', handleEditSubmit);
        document.querySelector('.cancel-btn').addEventListener('click', closeEditModal);
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