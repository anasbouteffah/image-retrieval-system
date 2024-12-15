import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { ImageGalleryComponent } from './components/image-gallery/image-gallery.component';

const routes: Routes = [
  { path: 'upload', component: ImageUploadComponent },
  { path: 'gallery', component: ImageGalleryComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
