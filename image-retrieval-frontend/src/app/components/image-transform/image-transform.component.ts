// src/app/components/image-transform/image-transform.component.ts

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { ImageService, Image, Category } from '../../services/image.service';

@Component({
  selector: 'app-image-transform',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperModule],
  templateUrl: './image-transform.component.html',
  styleUrls: ['./image-transform.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageTransformComponent implements OnInit {
  images: Image[] = [];
  categories: Category[] = [];
  selectedImageId: string = '';
  selectedImage: Image | null = null;

  // Cropper variables
  imageChangedEvent: any = '';
  croppedImage: any = '';
  transformedImageData: any = '';

  // Transformation options
  resizeWidth: number = 0;
  rotateAngle: number = 0;
  selectedCategory: string = '';

  // Status flags
  uploading: boolean = false;
  transformationSuccess: boolean = false;
  transformationError: string = '';

  constructor(
    private imageService: ImageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchImages();
  }

  // Fetch categories
  fetchCategories(): void {
    this.imageService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.categories;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error fetching categories:', error);
        this.transformationError = 'Error fetching categories.';
        this.cdr.markForCheck();
      },
    });
  }

  // Fetch images
  fetchImages(): void {
    this.imageService.getImages().subscribe({
      next: (response) => {
        this.images = response.images;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error fetching images:', error);
        this.transformationError = 'Error fetching images.';
        this.cdr.markForCheck();
      },
    });
  }

  // Handle image selection from dropdown
  onImageSelect(): void {
    this.selectedImage =
      this.images.find((img) => img._id === this.selectedImageId) || null;
    this.croppedImage = '';
    this.transformedImageData = '';
    this.cdr.markForCheck();
  }

  // Handle file input change for cropping
  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }

  // Handle image cropping
  onImageCropped(event: ImageCroppedEvent): void {
    this.croppedImage = event.base64;
    this.transformedImageData = event.base64;
    this.cdr.markForCheck();
  }

  onImageLoaded(): void {
    // Image loaded into cropper
  }

  onCropperReady(): void {
    // Cropper ready
  }

  onLoadImageFailed(): void {
    this.transformationError = 'Failed to load image for cropping.';
    this.cdr.markForCheck();
  }

  // Submit transformations
  submitTransformation(): void {
    if (!this.selectedImage) {
      this.transformationError = 'No image selected.';
      return;
    }

    const transformations: any = {};

    if (this.resizeWidth > 0) {
      transformations.width = this.resizeWidth;
    }

    if (this.rotateAngle !== 0) {
      transformations.rotate = this.rotateAngle;
    }

    if (this.croppedImage) {
      // Since the transformation is handled server-side, send crop parameters instead
      // For simplicity, we'll assume cropping to the center with specific dimensions
      const cropDimensions = this.getCropDimensions();
      if (cropDimensions) {
        transformations.crop = cropDimensions;
      }
    }

    if (this.selectedCategory) {
      transformations.categoryName = this.selectedCategory;
    }

    this.uploading = true;
    this.transformationError = '';
    this.transformationSuccess = false;
    this.cdr.markForCheck();

    this.imageService
      .transformImage(this.selectedImageId, transformations)
      .subscribe({
        next: (response) => {
          this.transformationSuccess = true;
          this.uploading = false;
          this.fetchImages(); // Refresh images
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error transforming image:', error);
          this.transformationError = 'Failed to transform image.';
          this.uploading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // Example method to get crop dimensions
  getCropDimensions(): any {
    if (!this.selectedImage) return null;

    // Calculate crop dimensions based on croppedImage data
    // This is a placeholder. In a real scenario, you'd extract actual crop parameters.
    return {
      mode: 'center',
      width: 800, // Example width
      height: 600, // Example height
    };
  }
}
