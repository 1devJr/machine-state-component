## Plan: Nx Angular + zardUi setup

Create an Nx workspace with an Angular app and a companion library using zardUi, showcasing a clean explicit state-machine component API (signals-first), and wire the app to consume the lib.

### Steps

1. Initialize Nx workspace (integrated) with Angular plugin, choose package manager, set default style (e.g., SCSS) in `workspace.json`/`nx.json`.
2. Generate Angular app (e.g., `apps/demo-app`) with routing off, standalone components on; configure base paths/tsconfig and ESLint.
3. Install zardUi latest, set up its global styles/provider in `apps/demo-app/src/main.ts` and `styles.(css|scss)`.
4. Generate Angular lib (e.g., `libs/ui-state`) with standalone components; expose a zardUi-based complex control using explicit state machine + signals; export public API via `libs/ui-state/src/index.ts`.
5. Import and render the lib component inside the app’s root/shell (e.g., `apps/demo-app/src/app/app.component.ts`), providing any required providers/config.
6. Add Nx targets (build/test/lint) for app and lib; ensure workspace scripts (`package.json`) are set for install/build/serve.

### Further Considerations

1. Preferred package manager?
   npm
2. App/lib names and default style choice (SCSS vs CSS)?
   scss
3. Any minimum Angular/Nx version requirements or constraints?
   Latest stable versions.
4. Specific zardUi components or features to highlight in the lib?
   State machine integration with signals.
5. Any additional Nx plugins or configurations needed (e.g., ESLint, Prettier)?
   ESLint, Prettier,husky and lint-staged for git hooks integration.
6. CI/CD setup or deployment targets for the app?
   No specific CI/CD setup required.
7. Testing frameworks or libraries to include for unit/e2e tests?
   vitest for unit tests, Cypress for e2e tests.
8. Any specific folder structure preferences for the lib or app?
   Standard Nx structure with clear separation between apps and libs.
9. Should the lib be published to a private/public npm registry or remain internal?
   Remain internal.
10. Any additional documentation or comments needed in the code?
    Yes, include comments explaining the state machine logic and usage of zardUi components, including examples and edge cases use storybook for documentation and testing.
11. Should the app include any sample data or mock services for demonstration purposes?
    Yes, include mock services to simulate data fetching and state transitions.
12. Any specific accessibility or internationalization requirements?
    no specific requirements, in future we may consider i18n support, but not in this initial setup.
13. Should the project include a README or other documentation files?
    Yes, include a README with setup instructions, usage examples, and contribution guidelines.
14. should best practices for Angular and Nx be enforced via linting or code analysis tools?
    Yes, enforce best practices using ESLint and Nx code analysis tools.

### Final Confirmation
