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

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
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
    this.fetchImages();
  }

  // Récupérer les catégories depuis le backend
  fetchCategories(): void {
    this.imageService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.categories;
        this.organizeImagesByCategory();
        this.cdr.markForCheck(); // Forcer Angular à vérifier les changements
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des catégories:', error);
        this.uploadError = 'Erreur lors de la récupération des catégories.';
        this.cdr.markForCheck();
      },
    });
  }

  // Récupérer les images depuis le backend
  fetchImages(): void {
    this.imageService.getImages().subscribe({
      next: (response) => {
        this.images = response.images;
        this.organizeImagesByCategory();
        this.cdr.markForCheck(); // Forcer Angular à vérifier les changements
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des images:', error);
        this.uploadError = 'Erreur lors de la récupération des images.';
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
        this.updateGallery(response.dbRecords);

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

  // Mettre à jour la galerie avec les nouvelles images
  updateGallery(newImages: Image[]): void {
    this.images = [...this.images, ...newImages]; // Mise à jour immuable
    this.organizeImagesByCategory();
    this.cdr.markForCheck(); // Forcer Angular à vérifier les changements
  }

  // Supprimer une image
  deleteImage(imageId: string): void {
    this.imageService.deleteImage(imageId).subscribe({
      next: (response) => {
        this.images = this.images.filter((image) => image._id !== imageId);
        this.organizeImagesByCategory();
        this.cdr.markForCheck(); // Forcer Angular à vérifier les changements
      },
      error: (error) => {
        console.error("Erreur lors de la suppression de l'image:", error);
        this.uploadError =
          "Erreur lors de la suppression de l'image. Veuillez réessayer.";
        this.cdr.markForCheck();
      },
    });
  }

  // Gérer la sélection des images pour suppression
  onCheckboxChange(event: any): void {
    const imageId = event.target.value;
    if (event.target.checked) {
      this.selectedImages.push(imageId);
    } else {
      const index = this.selectedImages.indexOf(imageId);
      if (index !== -1) {
        this.selectedImages.splice(index, 1);
      }
    }
  }

  // Supprimer les images sélectionnées
  deleteSelectedImages(): void {
    if (this.selectedImages.length === 0) return;

    this.imageService.deleteMultipleImages(this.selectedImages).subscribe({
      next: (response) => {
        this.images = this.images.filter(
          (image) => !this.selectedImages.includes(image._id)
        );
        this.selectedImages = [];
        this.organizeImagesByCategory();
        this.cdr.markForCheck(); // Forcer Angular à vérifier les changements
      },
      error: (error) => {
        console.error(
          'Erreur lors de la suppression des images sélectionnées:',
          error
        );
        this.uploadError =
          'Erreur lors de la suppression des images sélectionnées. Veuillez réessayer.';
        this.cdr.markForCheck();
      },
    });
  }

  // Télécharger une image
  downloadImage(image: Image): void {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/uploads/${image.filename}`; // Assurez-vous que l'URL est correcte
    link.download = image.filename;
    link.click();
  }

  // Organiser les images par catégorie
  organizeImagesByCategory(): void {
    this.categorizedImages = {};

    // Initialiser chaque catégorie
    this.categories.forEach((category) => {
      this.categorizedImages[category.name] = [];
    });

    // Assigner chaque image à sa catégorie
    this.images.forEach((image) => {
      if (image.category && image.category.name) {
        const categoryName = image.category.name.trim(); // Supprimer les espaces inutiles
        if (this.categorizedImages[categoryName]) {
          this.categorizedImages[categoryName].push(image);
        } else {
          console.warn(
            `Image avec ID ${image._id} a une catégorie inconnue: ${categoryName}`
          );
        }
      }
    });

    // Assigner la catégorie 'All'
    this.categorizedImages['All'] = [...this.images];

    console.log('Images catégorisées:', this.categorizedImages);
  }

  // Basculer l'état du dropdown pour changer de catégorie
  toggleCategoryDropdown(imageId: string): void {
    this.dropdowns[imageId] = !this.dropdowns[imageId];
  }

  // Obtenir le type de fichier
  getFileType(image: Image): string {
    const parts = image.filename.split('.');
    if (parts.length > 1) {
      const extension = parts.pop();
      return extension ? extension.toUpperCase() : 'UNKNOWN';
    }
    return 'UNKNOWN';
  }

  // Assigner une catégorie à une image
  assignCategory(imageId: string, categoryName: string): void {
    console.log(
      `Assignation de la catégorie '${categoryName}' à l'image ID '${imageId}'`
    );

    if (!categoryName) {
      this.uploadError = 'Veuillez sélectionner une catégorie valide.';
      console.error(this.uploadError);
      this.cdr.markForCheck();
      return;
    }

    this.imageService.assignCategory(imageId, categoryName).subscribe({
      next: (response: any) => {
        console.log('Assignation de la catégorie réussie:', response);
        const updatedImage: Image = response.updatedImage;
        const index = this.images.findIndex((image) => image._id === imageId);
        if (index !== -1) {
          // Mise à jour immuable de l'image
          this.images = [
            ...this.images.slice(0, index),
            updatedImage,
            ...this.images.slice(index + 1),
          ];
          this.organizeImagesByCategory();
          this.cdr.markForCheck(); // Forcer Angular à vérifier les changements
          console.log("Catégorie de l'image mise à jour dans le frontend.");
        }
      },
      error: (error: any) => {
        console.error("Erreur lors de l'assignation de la catégorie:", error);
        this.uploadError =
          "Erreur lors de l'assignation de la catégorie. Veuillez réessayer.";
        this.cdr.markForCheck();
      },
    });
  }

  // Définir la catégorie active (onglet)
  setActiveCategory(category: string): void {
    console.log(`Définir la catégorie active sur: ${category}`);
    this.activeCategory = category;
    this.cdr.markForCheck(); // Forcer Angular à vérifier les changements
  }

  // Fonction de suivi pour *ngFor
  trackByImageId(index: number, image: Image): string {
    return image._id;
  }

  // Gérer les erreurs de chargement d'images
  onImageError(event: any): void {
    event.target.src = 'assets/images/error.jpg'; // Image de remplacement en cas d'erreur
  }

  // Méthode pour rafraîchir la galerie
  refreshGallery(): void {
    this.refreshing = true;
    console.log('Rafraîchissement de la galerie en cours...');

    // Utilisation de forkJoin pour exécuter les appels en parallèle
    forkJoin({
      categoriesResponse: this.imageService.getCategories(),
      imagesResponse: this.imageService.getImages(),
    }).subscribe({
      next: (response) => {
        // Supposons que le backend renvoie { categories: Category[] } pour getCategories()
        // et { images: Image[] } pour getImages()
        this.categories = response.categoriesResponse.categories;
        this.images = response.imagesResponse.images;
        this.organizeImagesByCategory();
        console.log('Galerie rafraîchie.');
        this.refreshing = false;
        this.cdr.markForCheck(); // Forcer Angular à vérifier les changements
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement de la galerie:', error);
        this.uploadError =
          'Erreur lors du rafraîchissement de la galerie. Veuillez réessayer.';
        this.refreshing = false;
        this.cdr.markForCheck();
      },
    });
  }
}
