import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

export const appConfig = {
  providers: [provideRouter(appRoutes)],
};
