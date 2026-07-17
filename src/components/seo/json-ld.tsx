type Props = {
  data: Array<Record<string, unknown> | null | undefined> | Record<string, unknown>;
};

export function JsonLd({ data }: Props) {
  const items = Array.isArray(data) ? data.filter(Boolean) : [data];
  if (!items.length) return null;

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
