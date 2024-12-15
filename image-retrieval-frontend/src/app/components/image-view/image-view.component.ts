import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class ImageViewComponent implements OnInit {
  filename: string = '';
  visualizations: string[] = []; // Array to store visualization image URLs
  descriptorsCalculated: boolean = false; // Track if descriptors are calculated
  descriptors: any = null;
  array = Array; // Store descriptors after computation
  similarImages: any[] = []; // Store similar images from simple search

  constructor(
    private route: ActivatedRoute,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Get the filename from the route parameter
    this.filename = this.route.snapshot.paramMap.get('filename') || '';
  }

  computeDescriptors(image: string): void {
    const payload = { filename: image };

    this.imageService.computeDescriptors(payload).subscribe({
      next: (response) => {
        console.log('Descriptors fetched successfully:', response.descriptors);
        this.descriptors = response.descriptors; // Store the descriptors
        this.descriptorsCalculated = true; // Set flag to true
        alert('Descriptors calculated successfully!');
      },
      error: (err) => {
        console.error('Error fetching descriptors:', err);
        alert('Failed to compute descriptors. Please try again.');
      },
    });
  }

  listVisualizations(): void {
    const payload = { filename: this.filename };

    this.imageService.getVisualizations(payload).subscribe({
      next: (response) => {
        console.log(
          'Visualizations fetched successfully:',
          response.visualizations
        );

        const baseURL = 'http://localhost:5001';
        const visualizationPaths = Object.values(
          response.visualizations
        ) as string[];
        this.visualizations = visualizationPaths.map(
          (path) => `${baseURL}/${path.replace(/\\/g, '/')}`
        );
      },
      error: (err) => {
        console.error('Error fetching visualizations:', err);
        alert('Failed to fetch visualizations. Please try again.');
      },
    });
  }
  simpleSearch(): void {
    const payload = {
      query_descriptors: this.descriptors, // Use current image descriptors as query
    };

    this.imageService.simpleSearch(payload).subscribe({
      next: (response) => {
        console.log('Similar images found:', response.results);
        this.similarImages = response.results; // Store the similar images
      },
      error: (err) => {
        console.error('Error during simple search:', err);
        alert('Failed to perform simple search. Please try again.');
      },
    });
  }
  markFeedback(imageId: string, feedback: string): void {
    const payload = {
      image_id: imageId,
      feedback: feedback,
    };

    this.imageService.submitFeedback(payload).subscribe({
      next: (response) => {
        console.log('Feedback submitted successfully:', response);
        alert('Feedback saved successfully!');
      },
      error: (err) => {
        console.error('Error submitting feedback:', err);
        alert('Failed to submit feedback. Please try again.');
      },
    });
  }
  feedbackSearch(): void {
    const payload = {
      query_descriptors: this.descriptors,
    };

    this.imageService.feedbackSearch(payload).subscribe({
      next: (response) => {
        console.log('Feedback-based similar images found:', response.results);
        this.similarImages = response.results; // Store the refined results
        alert('Feedback-based search completed successfully!');
      },
      error: (err) => {
        console.error('Error during feedback search:', err);
        alert('Failed to perform feedback-based search. Please try again.');
      },
    });
  }

  // Utility function to expose object keys
  objectKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj);
  }
}
