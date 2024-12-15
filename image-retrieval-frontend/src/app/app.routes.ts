import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { ImageGalleryComponent } from './components/image-gallery/image-gallery.component'; // Import the new component
import { Routes } from '@angular/router';
import { ImageViewComponent } from './components/image-view/image-view.component';

export const appRoutes: Routes = [
  /* { path: '', redirectTo: '/upload', pathMatch: 'full' },  */ // Default route
  { path: 'upload', component: ImageUploadComponent }, // Upload page
  { path: 'gallery', component: ImageGalleryComponent }, // Gallery page route
  { path: 'image-view/:filename', component: ImageViewComponent },
];
