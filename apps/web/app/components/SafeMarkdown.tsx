import Markdown from 'react-markdown';
export function SafeMarkdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <Markdown
        skipHtml
        allowedElements={[
          'p',
          'strong',
          'em',
          'ul',
          'ol',
          'li',
          'a',
          'br',
          'h2',
          'h3',
          'blockquote',
        ]}
        components={{
          a: ({ children, href }) => (
            <a href={href} rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
