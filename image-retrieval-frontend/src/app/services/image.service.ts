import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Image } from '../models/imageModel';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private apiUrl = 'http://localhost:5000/api/images';

  constructor(private http: HttpClient) {}

  // Upload images
  uploadImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  // Get the list of images
  getImages(): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/list`);
  }

  // Delete a single image
  deleteImage(imageId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${imageId}`);
  }

  // Delete multiple images
  deleteMultipleImages(imageIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete-multiple`, { imageIds });
  }

  // Assigner une catégorie à une image
  assignCategory(imageId: string, category: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign-category`, {
      imageId,
      category,
    });
  }
}
