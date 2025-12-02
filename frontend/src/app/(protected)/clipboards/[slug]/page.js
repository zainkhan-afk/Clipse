export default async function ClipboardPage({ params }) {
    const { slug } = await params;


  return <div>Clipboard slug: {slug}</div>;
}
