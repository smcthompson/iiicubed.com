import { Layout } from '@/components';

export function HomePage() {
  const appName: string = process.env.APP_NAME || 'QA Dashboard';
  return Layout(appName,
    <main>
      <h1>{appName}</h1>

      <button class="btn btn-primary" hx-get="/build-status" hx-target="#results">
        Load Build Status
      </button>

      <div id="results"></div>
    </main>
  );
}
