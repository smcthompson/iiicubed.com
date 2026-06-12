export function Layout(title: string, content: JSX.Element) {
  return (
    <html data-bs-theme="dark">
      <head>
        <title>{title}</title>

        <script src="https://unpkg.com/htmx.org@2.0.7"></script>

        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"
        />
      </head>

      <body class="container mt-4">{content}</body>
    </html>
  );
}
