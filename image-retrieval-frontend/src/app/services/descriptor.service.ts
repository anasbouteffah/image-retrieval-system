import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DescriptorService {
  private apiUrl = 'http://127.0.0.1:5001'; // Flask API base URL

  constructor(private http: HttpClient) {}

  uploadImage(imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post(`${this.apiUrl}/compute-descriptors`, formData);
  }

  getVisualization(filename: string): string {
    return `${this.apiUrl}/visualizations/${filename}`;
  }
}
