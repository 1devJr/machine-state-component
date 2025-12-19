import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'cypress',
      webServerCommands: {
        default: 'nx run demo-app:serve',
        production: 'nx run demo-app:serve:production',
      },
      ciWebServerCommand: 'nx run demo-app:serve-static',
    }),
    baseUrl: 'http://localhost:4200',
  },
});
