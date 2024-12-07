// src/app/components/image-upload/image-upload.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ImageService } from '../../services/image.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Définir les interfaces pour une meilleure sécurité des types
interface Category {
  _id: string;
  name: string;
}

interface Image {
  _id: string;
  filename: string;
  path: string;
  size: number;
  uploadDate: Date;
  category: Category;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css'],
})
export class ImageUploadComponent implements OnInit {
  selectedFiles: File[] = [];
  uploading: boolean = false;
  uploadProgress: number = 0;
  uploadError: string = '';
  uploadSuccess: boolean = false;
  images: Image[] = [];
  selectedImages: string[] = [];
  categories: Category[] = []; // Tableau pour stocker les catégories du backend
  categorizedImages: { [key: string]: Image[] } = {};
  dropdowns: { [key: string]: boolean } = {}; // Suivre l'état des dropdowns par image

  uploadForm: FormGroup;

  // Propriété pour suivre la catégorie active
  activeCategory: string = 'All';

  constructor(private imageService: ImageService, private fb: FormBuilder) {
    this.uploadForm = this.fb.group({
      category: ['', Validators.required], // Rendre la catégorie obligatoire
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
        this.organizeImagesByCategory(); // Organiser les images une fois les catégories récupérées
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des catégories:', error);
      },
    });
  }

  // Gérer la sélection de fichiers
  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
    this.uploadError = '';
    this.uploadSuccess = false;
  }

  // Gérer le téléchargement des fichiers avec la catégorie
  uploadFiles(): void {
    if (this.selectedFiles.length === 0) return;

    if (this.uploadForm.invalid) {
      this.uploadError = 'Veuillez sélectionner une catégorie.';
      return;
    }

    this.uploading = true;
    const formData = new FormData();
    this.selectedFiles.forEach((file) => formData.append('images', file));
    formData.append('categoryName', this.uploadForm.value.category); // Utiliser 'categoryName' selon le backend

    this.imageService.uploadImage(formData).subscribe({
      next: (response) => {
        this.uploadSuccess = true;
        this.uploading = false;
        this.uploadProgress = 100;
        this.updateGallery(response.dbRecords);
        this.uploadForm.reset(); // Réinitialiser le formulaire après le téléchargement
        this.selectedFiles = []; // Vider les fichiers sélectionnés
      },
      error: (error) => {
        this.uploadError =
          'Erreur lors du téléchargement des fichiers. Veuillez réessayer.';
        this.uploading = false;
        this.uploadProgress = 0;
      },
    });
  }

  // Mettre à jour la galerie avec les nouvelles images téléchargées
  updateGallery(newImages: Image[]): void {
    this.images = this.images.concat(newImages);
    this.organizeImagesByCategory();
  }

  // Supprimer une image individuelle
  deleteImage(imageId: string): void {
    this.imageService.deleteImage(imageId).subscribe({
      next: (response) => {
        this.images = this.images.filter((image) => image._id !== imageId);
        this.organizeImagesByCategory();
      },
      error: (error) => {
        this.uploadError =
          "Erreur lors de la suppression de l'image. Veuillez réessayer.";
      },
    });
  }

  // Gérer les changements de checkbox pour sélectionner les images à supprimer
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
      },
      error: (error) => {
        this.uploadError =
          'Erreur lors de la suppression des images sélectionnées. Veuillez réessayer.';
      },
    });
  }

  // Récupérer toutes les images depuis le backend
  fetchImages(): void {
    this.imageService.getImages().subscribe({
      next: (response) => {
        this.images = response.images;
        this.organizeImagesByCategory();
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des images:', error);
      },
    });
  }

  // Télécharger une image
  downloadImage(image: Image): void {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/uploads/${image.filename}`;
    link.download = image.filename;
    link.click();
  }

  // Organiser les images par catégorie
  organizeImagesByCategory(): void {
    this.categorizedImages = {};

    // Initialiser les catégories
    this.categories.forEach((category) => {
      this.categorizedImages[category.name] = [];
    });

    // Assigner les images à leurs catégories respectives
    this.images.forEach((image) => {
      if (image.category && image.category.name) {
        if (!this.categorizedImages[image.category.name]) {
          this.categorizedImages[image.category.name] = [];
        }
        this.categorizedImages[image.category.name].push(image);
      }
    });

    // Assigner la catégorie 'All'
    this.categorizedImages['All'] = this.images;

    console.log('Images catégorisées:', this.categorizedImages);
  }

  // Basculer la visibilité du dropdown de catégorie
  toggleCategoryDropdown(imageId: string): void {
    this.dropdowns[imageId] = !this.dropdowns[imageId];
  }

  // Méthode pour extraire en toute sécurité le type de fichier (extension) en majuscules
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
      return;
    }

    this.imageService.assignCategory(imageId, categoryName).subscribe({
      next: (response: any) => {
        console.log('Assignation de la catégorie réussie:', response);
        const updatedImage: Image = response.updatedImage;
        const index = this.images.findIndex((image) => image._id === imageId);
        if (index !== -1) {
          this.images[index].category = updatedImage.category;
          this.organizeImagesByCategory();
          console.log("Catégorie de l'image mise à jour dans le frontend.");
        }
      },
      error: (error: any) => {
        console.error("Erreur lors de l'assignation de la catégorie:", error);
        this.uploadError =
          "Erreur lors de l'assignation de la catégorie. Veuillez réessayer.";
      },
    });
  }

  // Définir la catégorie active lorsqu'un onglet est cliqué
  setActiveCategory(category: string): void {
    console.log(`Définir la catégorie active sur: ${category}`);
    this.activeCategory = category;
  }
}
