export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <p className="text-center text-sm text-muted-foreground">
          Criado por:{' '}
          <a
            href="https://www.prenziersantos.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Prenzier Santos Tecnologia
          </a>
        </p>
      </div>
    </footer>
  );
};
