export function Layout(title: string, content: JSX.Element) {
  return (
    <html data-bs-theme="dark">
      <head>
        <title>{title}</title>

        <script src="https://unpkg.com/htmx.org@2.0.7"></script>
        {process.env.NODE_ENV === 'development' && (
          <script src="/__dev/reload-client.js"></script>
        )}

        <link
          rel="stylesheet"
          type="text/css"
          href="/css/the-purple-haze.min.css"
        />
      </head>

      <body class="container mt-4">{content}</body>
    </html>
  );
}
