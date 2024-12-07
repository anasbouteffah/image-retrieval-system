import { Routes } from '@angular/router';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' }, // Default route
  { path: 'upload', component: ImageUploadComponent }, // Upload page
];
