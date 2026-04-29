import { platformBrowser } from '@angular/platform-browser';

import { AppModule } from './app/app.module';

import { defineCustomElements } from '@ionic/pwa-elements/loader';


platformBrowser().bootstrapModule(AppModule)
  .catch(err => console.log(err));

defineCustomElements(window);
