import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { siteUrl } from "@/core/seo/site";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "IKMI Cirebon",
      alternateName: [
        "IKMI Se-Wilayah Cirebon",
        "Ikatan Keluarga Mahasiswa Indramayu",
        "Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon",
      ],
      url: siteUrl,
      logo: `${siteUrl}/ikmi-logo.png`,
      description:
        "Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon adalah organisasi mahasiswa daerah Indramayu di wilayah Cirebon.",
      sameAs: ["https://instagram.com/ikmicirebon"],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "IKMI Cirebon",
      alternateName: "Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon",
      inLanguage: "id-ID",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "IKMI Cirebon",
  title: {
    default: "IKMI Cirebon | Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon",
    template: "%s | IKMI Cirebon",
  },
  description:
    "Website resmi IKMI Cirebon, Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon. Wadah organisasi mahasiswa Indramayu di wilayah Cirebon.",
  keywords: [
    "ikmi cirebon",
    "ikmi sewilayah cirebon",
    "ikatan keluarga mahasiswa indramayu",
    "ikatan keluarga mahasiswa indramayu sewilayah cirebon",
    "organisasi ikmi sewilayah cirebon",
    "mahasiswa Indramayu Cirebon",
    "organisasi mahasiswa daerah Indramayu",
  ],
  authors: [{ name: "IKMI Cirebon" }],
  creator: "IKMI Cirebon",
  publisher: "IKMI Cirebon",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "IKMI Cirebon",
    title: "IKMI Cirebon | Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon",
    description:
      "Website resmi IKMI Cirebon, organisasi Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon.",
    images: [
      {
        url: "/ikmi-logo.png",
        width: 512,
        height: 512,
        alt: "Logo IKMI Cirebon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "IKMI Cirebon",
    description:
      "Website resmi Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon.",
    images: ["/ikmi-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
