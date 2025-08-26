window.addEventListener('DOMContentLoaded', () => {
    const renderer = new Chartifact.markdown.Renderer(document.getElementById('content'));
    const specs = renderer.hydrateSpecs();
    renderer.hydrate(specs);
});
