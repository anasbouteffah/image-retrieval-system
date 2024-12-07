import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http'; // Import HttpClient provider
import { provideRouter } from '@angular/router';
import { appRoutes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes), // Add your routes
    provideHttpClient(), // Provide HttpClient
  ],
}).catch((err) => console.error(err));
