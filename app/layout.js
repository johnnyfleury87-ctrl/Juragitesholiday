import './globals.css';

export const metadata = {
  title: 'JuraGites - Gîtes de vacances meublés',
  description: 'Découvrez nos gîtes de vacances meublés de luxe dans le Jura',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
