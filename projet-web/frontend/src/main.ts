import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './apps/frigiderrrr/app.config';
import { App } from './app/frigiderrrr/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
