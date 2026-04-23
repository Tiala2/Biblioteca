type InternalPdfReaderPanelProps = {
  bookTitle: string;
  internalPdfUrl: string | null;
};

export function InternalPdfReaderPanel({ bookTitle, internalPdfUrl }: InternalPdfReaderPanelProps) {
  return (
    <article className="card">
      <div className="section-head">
        <h3>Leitor interno</h3>
        <span className="kpi">PDF local</span>
      </div>
      {internalPdfUrl ? (
        <>
          <div className="external-reader-wrap">
            <iframe
              title={`Leitor PDF - ${bookTitle}`}
              src={internalPdfUrl}
              className="external-reader-frame"
              loading="lazy"
            />
          </div>
          <div className="card-actions">
            <a className="btn-muted btn-link" href={internalPdfUrl} target="_blank" rel="noreferrer">
              Abrir em nova aba
            </a>
            <a className="btn-muted btn-link" href={`${internalPdfUrl}?download=true`}>
              Baixar PDF
            </a>
          </div>
        </>
      ) : (
        <p className="section-sub">
          O PDF deste livro existe, mas a URL de leitura ainda nao esta disponivel. Tente novamente em instantes.
        </p>
      )}
    </article>
  );
}
