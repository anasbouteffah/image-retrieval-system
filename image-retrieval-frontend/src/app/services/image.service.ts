// src/app/services/image.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  _id: string;
  name: string;
}

export interface Image {
  _id: string;
  filename: string;
  path: string;
  size: number;
  uploadDate: Date;
  category: Category;
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private apiUrl = 'http://localhost:5000/api/images';
  private categoryUrl = 'http://localhost:5000/api/categories';
  private flaskApi = 'http://localhost:5001/api';

  constructor(private http: HttpClient) {}

  // Upload images
  uploadImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  // Get the list of images, optionally filtered by category
  getImages(category: string = 'All'): Observable<any> {
    if (category === 'All') {
      return this.http.get<any[]>(`${this.apiUrl}/list`);
    } else {
      return this.http.get<any[]>(`${this.apiUrl}/list?category=${category}`);
    }
  }

  // Get the list of categories
  getCategories(): Observable<any> {
    return this.http.get<any[]>(`${this.categoryUrl}`);
  }

  // Delete a single image
  deleteImage(imageId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${imageId}`);
  }

  // Delete multiple images
  deleteMultipleImages(imageIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete-multiple`, { imageIds });
  }

  // Assign category to an image
  assignCategory(imageId: string, categoryName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign-category`, {
      imageId,
      categoryName,
    });
  }

  // Transform an existing image
  transformImage(imageId: string, transformations: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transform`, {
      imageId,
      transformations,
    });
  }

  computeDescriptors(payload: { filename: string }): Observable<any> {
    return this.http.post(`${this.flaskApi}/descriptors/compute`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  getVisualizations(payload: { filename: string }): Observable<any> {
    return this.http.post(`${this.flaskApi}/visualizations`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  simpleSearch(payload: { query_descriptors: any }): Observable<any> {
    return this.http.post(
      `${this.flaskApi}/descriptors/simple-search`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  submitFeedback(payload: {
    image_id: string;
    feedback: string;
  }): Observable<any> {
    const url = 'http://localhost:5001/api/descriptors/feedback';
    return this.http.post(url, payload);
  }

  feedbackSearch(payload: any) {
    const url = 'http://localhost:5001/api/descriptors/feedback-search';
    return this.http.post<any>(url, payload);
  }
}
