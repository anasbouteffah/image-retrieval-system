import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule], // Add CommonModule here
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css'],
})
export class ImageUploadComponent implements OnInit {
  selectedFiles: File[] = [];
  uploading: boolean = false;
  uploadProgress: number = 0;
  uploadError: string = '';
  uploadSuccess: boolean = false;
  images: any[] = [];
  selectedImages: string[] = []; // Store selected image IDs for deletion

  constructor(private imageService: ImageService) {}

  ngOnInit(): void {
    // You can choose to fetch images on component initialization if needed
    // this.fetchImages();  // Commented out because we're fetching only new images now
  }

  // Handle file selection
  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
    this.uploadError = ''; // Reset any previous error message
    this.uploadSuccess = false; // Reset success state
  }

  // Handle file upload
  uploadFiles(): void {
    if (this.selectedFiles.length === 0) return; // Ensure files are selected

    this.uploading = true;
    const formData = new FormData();
    this.selectedFiles.forEach((file) => formData.append('images', file)); // 'images' is the field name in the backend

    this.imageService.uploadImage(formData).subscribe({
      next: (response) => {
        this.uploadSuccess = true;
        this.uploading = false;
        this.uploadProgress = 100;
        this.updateGallery(response.dbRecords); // Update the gallery with the uploaded image(s)
      },
      error: (error) => {
        this.uploadError = 'Error uploading files. Please try again.';
        this.uploading = false;
        this.uploadProgress = 0;
      },
    });
  }

  // Update gallery with the newly uploaded image(s)
  updateGallery(newImages: any[]): void {
    this.images = newImages; // Update the images array with the newly uploaded images
  }

  deleteImage(imageId: string): void {
    this.imageService.deleteImage(imageId).subscribe({
      next: (response) => {
        this.images = this.images.filter((image) => image._id !== imageId); // Remove image from the gallery
      },
      error: (error) => {
        this.uploadError = 'Error deleting image. Please try again.';
      },
    });
  }

  onCheckboxChange(event: any): void {
    const imageId = event.target.value;
    if (event.target.checked) {
      this.selectedImages.push(imageId); // Add to selection
    } else {
      const index = this.selectedImages.indexOf(imageId);
      if (index !== -1) {
        this.selectedImages.splice(index, 1); // Remove from selection
      }
    }
  }

  // Delete selected images
  deleteSelectedImages(): void {
    if (this.selectedImages.length === 0) return;

    this.imageService.deleteMultipleImages(this.selectedImages).subscribe({
      next: (response) => {
        this.images = this.images.filter(
          (image) => !this.selectedImages.includes(image._id)
        ); // Update the gallery
        this.selectedImages = []; // Reset selected images
      },
      error: (error) => {
        this.uploadError = 'Error deleting selected images. Please try again.';
      },
    });
  }

  // Fetch only the latest images from the backend
  fetchImages(): void {
    this.imageService.getImages().subscribe({
      next: (response) => {
        this.images = response.images; // Assuming the response contains the images array
      },
      error: (error) => {
        console.error('Error fetching images:', error);
      },
    });
  }

  // Download image
  downloadImage(image: any): void {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/uploads/${image.filename}`;
    link.download = image.filename;
    link.click();
  }
}
