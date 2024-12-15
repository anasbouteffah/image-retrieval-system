// src/app/components/image-upload/image-upload.component.ts
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ImageService, Image, Category } from '../../services/image.service';
import { forkJoin } from 'rxjs'; // Import nécessaire pour forkJoin
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LazyLoadImageModule,
  ],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Utilisation de OnPush pour meilleures performances
})
export class ImageUploadComponent implements OnInit {
  selectedFiles: File[] = [];
  uploading: boolean = false;
  uploadProgress: number = 0;
  uploadError: string = '';
  uploadSuccess: boolean = false;
  images: Image[] = [];
  selectedImages: string[] = [];
  categories: Category[] = [];
  categorizedImages: { [key: string]: Image[] } = {};
  dropdowns: { [key: string]: boolean } = {};

  uploadForm: FormGroup;
  activeCategory: string = 'All';

  // Nouvelle propriété pour gérer l'état de rafraîchissement
  refreshing: boolean = false;

  constructor(
    private imageService: ImageService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef // Injection de ChangeDetectorRef
  ) {
    this.uploadForm = this.fb.group({
      category: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fetchCategories();
  }

  // Récupérer les catégories depuis le backend
  fetchCategories(): void {
    this.imageService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.categories;
        this.cdr.markForCheck(); // Forcer Angular à vérifier les changements
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des catégories:', error);
        this.uploadError = 'Erreur lors de la récupération des catégories.';
        this.cdr.markForCheck();
      },
    });
  }

  // Gérer la sélection des fichiers
  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
    this.uploadError = '';
    this.uploadSuccess = false;
  }

  // Télécharger les fichiers sélectionnés
  uploadFiles(): void {
    if (this.selectedFiles.length === 0) return;

    if (this.uploadForm.invalid) {
      this.uploadError = 'Veuillez sélectionner une catégorie.';
      return;
    }

    this.uploading = true;
    const formData = new FormData();
    this.selectedFiles.forEach((file) => formData.append('images', file));
    formData.append('categoryName', this.uploadForm.value.category);

    this.imageService.uploadImage(formData).subscribe({
      next: (response) => {
        this.uploadSuccess = true;
        this.uploading = false;
        this.uploadProgress = 100;

        // Log des nouvelles images
        console.log('Nouvelles images ajoutées:', response.dbRecords);

        this.uploadForm.reset();
        this.selectedFiles = [];
        this.cdr.markForCheck(); // Forcer Angular à vérifier les changements
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement des fichiers:', error);
        this.uploadError =
          'Erreur lors du téléchargement des fichiers. Veuillez réessayer.';
        this.uploading = false;
        this.uploadProgress = 0;
        this.cdr.markForCheck();
      },
    });
  }
}


