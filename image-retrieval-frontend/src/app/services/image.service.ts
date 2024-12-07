// src/app/services/image.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private apiUrl = 'http://localhost:5000/api/images';
  private categoryUrl = 'http://localhost:5000/api/categories';

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
}
