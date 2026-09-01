import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  ImageIcon,
  Quote,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { siteUrl } from "@/core/seo/site";
import { getActivePublicStructure } from "@/features/public/public-structure";
import { webConfigQueries } from "@/features/web-config/queries";
import { PublicBreadcrumb } from "../_components/public-breadcrumb";

/* =========================================================
   ABOUT — CONTENT FALLBACK
   Data aktif dari database / web-config tetap mendapat prioritas.
   Copy di bawah adalah fallback resmi ketika data dinamis belum tersedia.
   ========================================================= */

const DEFAULT_CABINET = {
  name: "Kabinet IKMI",
  period: "2026–2027",
  tagline: "Memayu Ing Jagat",
  vision:
    "Mewujudkan organisasi mahasiswa kedaerahan yang berperan sebagai ruang pengembangan intelektual, penguatan identitas daerah, serta penggerak kesadaran kritis dan kontribusi nyata bagi kemajuan daerah.",
  missions: [
    "Mengembangkan kapasitas intelektual mahasiswa melalui kegiatan diskusi, kajian ilmiah, pelatihan, dan riset yang berpijak pada persoalan daerah.",
    "Menumbuhkan kesadaran historis, sosial, dan kultural terhadap daerah sebagai bagian dari identitas dan tanggung jawab mahasiswa.",
    "Mendorong sikap kritis, progresif, dan solutif dalam merespons isu-isu daerah, nasional, maupun global.",
    "Menjadi wadah konsolidasi mahasiswa daerah untuk membangun jejaring intelektual, sosial, dan advokasi kebijakan yang berpihak pada kepentingan masyarakat daerah.",
    "Mengimplementasikan nilai keilmuan dan pengabdian melalui program pengabdian masyarakat berbasis kebutuhan dan potensi daerah.",
  ],
} as const;

const MISSION_META = [
  {
    title: "Mengembangkan Intelektualitas",
    short:
      "Diskusi, kajian ilmiah, pelatihan, dan riset yang berpijak pada persoalan daerah.",
  },
  {
    title: "Menguatkan Identitas Daerah",
    short:
      "Menumbuhkan kesadaran historis, sosial, dan kultural sebagai tanggung jawab mahasiswa.",
  },
  {
    title: "Menumbuhkan Nalar Kritis",
    short:
      "Mendorong sikap kritis, progresif, dan solutif terhadap isu daerah hingga global.",
  },
  {
    title: "Memperluas Jejaring",
    short:
      "Membangun jejaring intelektual, sosial, dan advokasi yang berpihak pada masyarakat.",
  },
  {
    title: "Menghadirkan Pengabdian",
    short:
      "Menerapkan ilmu dan nilai pengabdian melalui program berbasis kebutuhan daerah.",
  },
] as const;

/**
 * Milestone sejarah sengaja tidak mengarang tahun lain.
 * Fakta eksplisit yang diberikan: IKMI berdiri 1 Desember 1999.
 * Milestone berikutnya menggambarkan prinsip perkembangan organisasi.
 */
const HISTORY_STEPS = [
  {
    meta: "1 Desember 1999",
    title: "IKMI Berdiri",
  },
  {
    meta: "Persatuan",
    title: "Ruang Bersama",
  },
  {
    meta: "Dialektika",
    title: "Keilmuan & Kedaerahan",
  },
  {
    meta: "Regenerasi",
    title: "Lintas Generasi",
  },
  {
    meta: "Kini",
    title: "Melanjutkan Perjalanan",
  },
] as const;

export const metadata = {
  title: "Tentang IKMI Cirebon",
  description:
    "Profil, sejarah, kabinet, visi dan misi, serta pengurus IKMI Se-Wilayah Cirebon.",
  alternates: {
    canonical: `${siteUrl}/tentang`,
  },
  openGraph: {
    title: "Tentang IKMI Cirebon",
    description:
      "Profil, sejarah, kabinet, visi dan misi, serta pengurus IKMI Se-Wilayah Cirebon.",
    url: `${siteUrl}/tentang`,
    type: "website",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UnknownRecord = Record<string, unknown>;

type CabinetFallback = {
  name?: string;
  period?: string;
  tagline?: string;
  vision?: string;
  missions?: readonly string[];
  logoUrl?: string;
};

type OfficerMember = {
  id: string;
  name: string;
  positionName: string;
  photoUrl: string | null;
};

type OfficerGroup = {
  id: string;
  name: string;
  members: OfficerMember[];
};

const MAIN_UNIT_PREVIEW_POSITION_PATTERN =
  /ketua umum|wakil ketua|sekretaris umum|bendahara umum/i;
const DEPARTMENT_PREVIEW_POSITION_PATTERN =
  /ketua departemen|kepala departemen|sekretaris departemen/i;

type MediaFrameProps = {
  src?: string | null;
  alt: string;
  fallbackLabel: string;
  priority?: boolean;
  variant?: "hero" | "landscape" | "archive";
  className?: string;
};

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as UnknownRecord;
}

function readString(
  record: UnknownRecord | null,
  keys: string[],
): string | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

function readStringArray(
  record: UnknownRecord | null,
  keys: string[],
): string[] | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (!Array.isArray(value)) continue;

    const result = value
      .map((item) => {
        if (typeof item === "string") return item.trim();

        return readString(asRecord(item), [
          "description",
          "text",
          "content",
          "value",
        ]);
      })
      .filter((item): item is string => Boolean(item));

    if (result.length > 0) return result;
  }

  return null;
}

function readMediaUrl(
  record: UnknownRecord | null,
  keys: string[],
): string | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    const nested = asRecord(value);
    const nestedUrl = readString(nested, ["url", "src", "imageUrl", "fileUrl"]);

    if (nestedUrl) return nestedUrl;
  }

  return null;
}

function readMediaArray(
  record: UnknownRecord | null,
  keys: string[],
): string[] | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (!Array.isArray(value)) continue;

    const urls = value
      .map((item) => {
        if (typeof item === "string" && item.trim()) return item.trim();

        const nested = asRecord(item);
        return readString(nested, ["url", "src", "imageUrl", "fileUrl"]);
      })
      .filter((item): item is string => Boolean(item));

    if (urls.length > 0) return urls;
  }

  return null;
}

function normalizeCabinet(
  period: unknown,
  configFallback: CabinetFallback | null,
) {
  const periodRecord = asRecord(period);
  const cabinetRecord = asRecord(periodRecord?.cabinet);
  const fallbackRecord = asRecord(configFallback);

  return {
    periodLabel:
      readString(periodRecord, ["name", "label", "periodName", "periode"]) ??
      readString(fallbackRecord, ["period", "periodLabel"]) ??
      DEFAULT_CABINET.period,

    cabinetName:
      readString(cabinetRecord, ["name", "title"]) ??
      readString(periodRecord, ["cabinetName", "kabinetName", "nameKabinet"]) ??
      readString(fallbackRecord, ["name", "title"]) ??
      DEFAULT_CABINET.name,

    tagline:
      readString(cabinetRecord, ["tagline"]) ??
      readString(periodRecord, ["tagline", "cabinetTagline"]) ??
      readString(fallbackRecord, ["tagline"]) ??
      DEFAULT_CABINET.tagline,

    logoUrl:
      readMediaUrl(cabinetRecord, ["logoUrl", "logo", "imageUrl"]) ??
      readMediaUrl(periodRecord, [
        "cabinetLogoUrl",
        "kabinetLogoUrl",
        "logoKabinet",
      ]) ??
      readMediaUrl(fallbackRecord, ["logoUrl", "logo"]) ??
      null,

    vision:
      readString(cabinetRecord, ["vision", "visi"]) ??
      readString(periodRecord, ["vision", "visi", "cabinetVision"]) ??
      readString(fallbackRecord, ["vision", "visi"]) ??
      DEFAULT_CABINET.vision,

    missions: readStringArray(cabinetRecord, ["missions", "misi"]) ??
      readStringArray(periodRecord, ["missions", "misi", "cabinetMissions"]) ??
      readStringArray(fallbackRecord, ["missions", "misi"]) ?? [
        ...DEFAULT_CABINET.missions,
      ],
  };
}

function getDepartmentPriority(name: string) {
  const key = name.toLowerCase();

  if (
    key.includes("badan pengurus harian") ||
    key === "bph" ||
    key.includes("pengurus harian")
  ) {
    return 0;
  }

  if (key.includes("kaderisasi")) return 10;
  if (key.includes("psda") || key.includes("sumber daya anggota")) return 20;
  if (key.includes("advokasi") || key.includes("kajian strategis")) return 30;
  if (key.includes("ekonomi kreatif") || key.includes("ekotif")) return 40;
  if (
    key.includes("komunikasi") ||
    key.includes("digitalisasi") ||
    key.includes("komdigi")
  ) {
    return 50;
  }
  if (
    key.includes("hubungan") ||
    key.includes("pengabdian masyarakat") ||
    key === "hpm"
  ) {
    return 60;
  }

  return 100;
}

function getPositionPriority(name: string) {
  const key = name.toLowerCase();

  if (key.includes("ketua umum")) return 0;
  if (key.includes("wakil ketua")) return 5;
  if (key.includes("sekretaris umum")) return 10;
  if (key.includes("bendahara umum")) return 20;
  if (key.includes("kepala departemen") || key.includes("ketua departemen")) {
    return 30;
  }
  if (key.includes("sekretaris")) return 40;
  if (key.includes("anggota")) return 50;

  return 60;
}

function buildOfficerGroups(
  assignments: Awaited<
    ReturnType<typeof getActivePublicStructure>
  >["assignments"],
): OfficerGroup[] {
  const groups = assignments.reduce<OfficerGroup[]>((result, assignment) => {
    let group = result.find((item) => item.id === assignment.department.id);

    if (!group) {
      group = {
        id: assignment.department.id,
        name: assignment.department.name,
        members: [],
      };
      result.push(group);
    }

    group.members.push({
      id: assignment.id,
      name: assignment.person.name,
      positionName: assignment.position.name,
      photoUrl: assignment.person.photoUrl,
    });

    return result;
  }, []);

  return groups
    .map((group) => ({
      ...group,
      members: [...group.members].sort(
        (a, b) =>
          getPositionPriority(a.positionName) -
            getPositionPriority(b.positionName) ||
          a.name.localeCompare(b.name, "id"),
      ),
    }))
    .sort(
      (a, b) =>
        getDepartmentPriority(a.name) - getDepartmentPriority(b.name) ||
        a.name.localeCompare(b.name, "id"),
    );
}

function buildOfficerPreview(groups: OfficerGroup[]): OfficerGroup[] {
  return groups
    .map((group) => ({
      ...group,
      members:
        getDepartmentPriority(group.name) === 0
          ? group.members.filter((member) =>
              MAIN_UNIT_PREVIEW_POSITION_PATTERN.test(member.positionName),
            )
          : group.members.filter((member) =>
              DEPARTMENT_PREVIEW_POSITION_PATTERN.test(member.positionName),
            ),
    }))
    .filter((group) => group.members.length > 0);
}

function getPublicMissionCopy(
  dynamicMission: string | undefined,
  fallback: string,
) {
  if (!dynamicMission) return fallback;

  const normalized = dynamicMission.replace(/\s+/g, " ").trim();

  // Public About needs concise, scannable mission copy.
  // Short CMS copy remains authoritative; long formal copy falls back
  // to the compact editorial summary used in the mockup.
  return normalized.length <= 135 ? normalized : fallback;
}

function SectionHeading({
  number,
  eyebrow,
  id,
  children,
}: {
  number: string;
  eyebrow: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="about-heading">
      <p className="about-eyebrow">
        <span>{number}</span>
        <span aria-hidden="true">—</span>
        {eyebrow}
      </p>
      <h2 id={id}>{children}</h2>
    </div>
  );
}

function MediaFrame({
  src,
  alt,
  fallbackLabel,
  priority = false,
  variant = "landscape",
  className = "",
}: MediaFrameProps) {
  if (!src) {
    return (
      <div
        className={[
          "about-media",
          `about-media--${variant}`,
          "about-media--empty",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        role="img"
        aria-label={`${fallbackLabel}. Dokumentasi belum tersedia.`}
      >
        <ImageIcon aria-hidden="true" />
        <span>Dokumentasi belum tersedia</span>
      </div>
    );
  }

  return (
    <figure
      className={["about-media", `about-media--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={
          variant === "hero"
            ? "(min-width: 1024px) 58vw, 100vw"
            : variant === "archive"
              ? "(min-width: 1024px) 140px, 42vw"
              : "(min-width: 1024px) 42vw, 100vw"
        }
        className="about-media-image"
      />
    </figure>
  );
}

function OfficerAvatar({ src, name }: { src: string | null; name: string }) {
  if (!src) {
    return (
      <span className="about-officer-avatar" aria-hidden="true">
        <UserRound />
      </span>
    );
  }

  return (
    <span className="about-officer-avatar about-officer-avatar--photo">
      <Image src={src} alt={`Foto ${name}`} fill sizes="40px" />
    </span>
  );
}

export default async function TentangPage() {
  const [structure, webConfig] = await Promise.all([
    getActivePublicStructure(),
    webConfigQueries.getMergedWebConfig(),
  ]);

  const { period, assignments } = structure;

  const aboutRecord = asRecord(webConfig.about_page_extended);
  const mediaRecord = asRecord(aboutRecord?.media);
  const fallbackCabinet = asRecord(
    aboutRecord?.fallbackCabinet,
  ) as CabinetFallback | null;

  const cabinet = normalizeCabinet(period, fallbackCabinet);

  const heroImage =
    readMediaUrl(mediaRecord, [
      "heroImageUrl",
      "heroImage",
      "hero",
      "coverImageUrl",
    ]) ??
    readMediaUrl(aboutRecord, ["heroImageUrl", "heroImage", "hero"]) ??
    webConfig.landing_hero?.slides?.[0]?.url ??
    "https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210005/BPHU_rkqdtg.png";

  const profileImage =
    readMediaUrl(mediaRecord, ["profileImageUrl", "profileImage", "profile"]) ??
    readMediaUrl(aboutRecord, ["profileImageUrl", "profileImage", "profile"]);

  const cabinetImage =
    readMediaUrl(mediaRecord, [
      "cabinetImageUrl",
      "cabinetImage",
      "cabinetPhotoUrl",
      "cabinet",
    ]) ??
    readMediaUrl(aboutRecord, [
      "cabinetImageUrl",
      "cabinetImage",
      "cabinetPhotoUrl",
    ]);

  const historyImages =
    readMediaArray(mediaRecord, [
      "historyImages",
      "historyImageUrls",
      "archiveImages",
    ]) ??
    readMediaArray(aboutRecord, [
      "historyImages",
      "historyImageUrls",
      "archiveImages",
    ]) ??
    [];

  const officerGroups = buildOfficerGroups(assignments);
  const officerPreviewGroups = buildOfficerPreview(officerGroups);

  const showCabinetIdentity =
    Boolean(cabinet.logoUrl) ||
    (cabinet.cabinetName.trim() !== "" &&
      cabinet.cabinetName !== DEFAULT_CABINET.name);

  return (
    <main className="about public-page-root" id="tentang-page">
      {/* =====================================================
          HERO / PROFILE INTRO
          ===================================================== */}
      <header className="about-hero" id="profil">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="about-hero-image"
          aria-hidden="true"
        />
        <div className="about-hero-overlay" aria-hidden="true" />
        <div className="about-container about-hero-inner">
          <div className="about-reveal about-hero-copy">
            <PublicBreadcrumb items={[{ label: "Tentang" }]} tone="inverse" />
            <h1>
              Rumah Mahasiswa
              <span>Indramayu di Cirebon</span>
            </h1>

            <p className="about-hero-lead">
              IKMI Se-Wilayah Cirebon adalah ruang bagi mahasiswa asal Indramayu
              di Cirebon untuk bersilaturahmi, bertumbuh, dan bergerak bersama.
              Di sini, kekeluargaan bertemu dengan pengembangan potensi dan
              kontribusi nyata bagi daerah.
            </p>

            <p className="about-motto">
              <span aria-hidden="true" />
              Memayu Ing Jagat
              <span aria-hidden="true" />
            </p>

            <Link href="#sejarah" className="public-text-link about-action">
              Selengkapnya tentang IKMI
              <ArrowDown aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================
          01 — PROFIL
          ===================================================== */}
      <section
        className="about-section about-section--profile"
        aria-labelledby="profil-title"
      >
        <div className="about-container about-profile-grid">
          <div className="about-reveal about-section-media">
            <MediaFrame
              src={profileImage}
              alt="Dokumentasi kebersamaan mahasiswa IKMI"
              fallbackLabel="Foto profil kebersamaan IKMI"
            />
          </div>

          <div className="about-reveal about-copy">
            <SectionHeading number="01" eyebrow="Profil" id="profil-title">
              Rumah Mahasiswa Indramayu
            </SectionHeading>

            <p>
              IKMI adalah ruang bagi mahasiswa Indramayu untuk bertemu,
              bertumbuh, dan bergerak bersama melalui ikatan kekeluargaan,
              menjaga identitas, menebar kebaikan, dan menyiapkan aksi nyata
              untuk daerah.
            </p>

            <blockquote className="about-quote">
              <Quote aria-hidden="true" />
              <p>
                Dari tanah rantau, kami belajar.
                <br />
                Untuk Indramayu, kami bergerak.
              </p>
            </blockquote>

            <Link href="#sejarah" className="public-text-link about-action">
              Kenali Perjalanan IKMI
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 02 — SEJARAH */}
      <section
        className="about-section about-section--history"
        id="sejarah"
        aria-labelledby="sejarah-title"
      >
        <div className="about-container about-history-grid">
          <div className="about-reveal about-copy about-history-copy">
            <SectionHeading number="02" eyebrow="Sejarah" id="sejarah-title">
              <>
                <span className="about-history-title-line">
                  Lahir dari Ruang,
                </span>
                <span className="about-history-title-line">
                  Tumbuh dalam Perjuangan
                </span>
              </>
            </SectionHeading>

            <p>
              IKMI berdiri pada <strong>1 Desember 1999</strong> dari semangat
              mahasiswa Indramayu di Cirebon untuk memiliki ruang bersama.
              Berawal dari obrolan sederhana di warung kopi, lahirlah organisasi
              kedaerahan sebagai wadah silaturahmi dan persatuan mahasiswa
              Indramayu.
            </p>

            <p>
              Sejak itu, IKMI tumbuh dengan dua komitmen utama:
              <strong> keilmuan dan kedaerahan</strong>.
            </p>

            <blockquote className="about-quote">
              <Quote aria-hidden="true" />
              <p>
                Dari percakapan sederhana,
                <br />
                lahir perjalanan lintas generasi.
              </p>
            </blockquote>

            <Link href="#kabinet" className="public-text-link about-action">
              Lihat Perjalanan Organisasi
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="about-reveal about-history-board">
            <div className="about-history-board-label">
              <span>Arsip Perjalanan</span>
              <span>1999 — kini</span>
            </div>

            <div
              className="about-history-track"
              aria-label="Garis perjalanan IKMI"
            >
              {HISTORY_STEPS.map((step, index) => (
                <article
                  className="about-history-step"
                  key={`${step.meta}-${step.title}`}
                >
                  <MediaFrame
                    src={historyImages[index]}
                    alt={`Dokumentasi ${step.title} IKMI`}
                    fallbackLabel={`Dokumentasi ${step.title}`}
                    variant="archive"
                  />

                  <span className="about-history-node" aria-hidden="true" />

                  <div className="about-history-caption">
                    <p>{step.meta}</p>
                    <h3>{step.title}</h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          03 — KABINET
          ===================================================== */}
      <section
        className="about-section about-section--cabinet"
        id="kabinet"
        aria-labelledby="kabinet-title"
      >
        <div className="about-container about-cabinet-grid">
          <div className="about-reveal about-section-media about-cabinet-media-wrap">
            <span className="about-cabinet-period-badge">
              Periode {cabinet.periodLabel}
            </span>

            <MediaFrame
              src={cabinetImage}
              alt={`Dokumentasi Kabinet IKMI periode ${cabinet.periodLabel}`}
              fallbackLabel={`Foto Kabinet periode ${cabinet.periodLabel}`}
            />

            {cabinet.logoUrl ? (
              <div className="about-cabinet-logo">
                <Image
                  src={cabinet.logoUrl}
                  alt={`Logo ${cabinet.cabinetName}`}
                  width={56}
                  height={56}
                  sizes="56px"
                />
              </div>
            ) : null}
          </div>

          <div className="about-reveal about-copy">
            <SectionHeading
              number="03"
              eyebrow={`Kabinet periode ${cabinet.periodLabel}`}
              id="kabinet-title"
            >
              Satu Arah, Banyak Gerak
            </SectionHeading>

            {showCabinetIdentity ? (
              <p className="about-cabinet-name">{cabinet.cabinetName}</p>
            ) : null}

            <p>
              Kabinet IKMI Se-Wilayah Cirebon periode {cabinet.periodLabel}{" "}
              membawa budaya kerja yang{" "}
              <strong>terorganisir, kolaboratif, dan proaktif</strong>. Fokusnya
              adalah memperkuat tata kelola, menjaga transparansi, mengembangkan
              kapasitas anggota, serta membangun kemandirian organisasi secara
              intelektual maupun ekonomi.
            </p>

            <blockquote className="about-quote">
              <Quote aria-hidden="true" />
              <p>
                Bekerja bersama,
                <br />
                bertumbuh bersama.
              </p>
            </blockquote>

            <Link href="#visi-misi" className="public-text-link about-action">
              Kenali Arah Kabinet
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          04 — VISI & MISI KABINET
          ===================================================== */}
      <section
        className="about-section about-section--direction"
        id="visi-misi"
        aria-labelledby="visi-misi-title"
      >
        <div className="about-container">
          <div className="about-reveal">
            <SectionHeading
              number="04"
              eyebrow="Visi & Misi Kabinet"
              id="visi-misi-title"
            >
              Dari Gagasan Menjadi Dampak
            </SectionHeading>
          </div>

          <div className="about-direction-grid">
            <div className="about-reveal about-vision-card">
              <div className="about-card-label">
                <Target aria-hidden="true" />
                <span>Visi</span>
              </div>

              <p>{cabinet.vision}</p>
            </div>

            <div className="about-missions" aria-label="Daftar misi kabinet">
              {MISSION_META.map((mission, index) => (
                <div className="about-reveal about-mission" key={mission.title}>
                  <span className="about-mission-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <h3>{mission.title}</h3>
                    <p>
                      {getPublicMissionCopy(
                        cabinet.missions[index],
                        mission.short,
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="about-reveal">
              <blockquote className="about-impact-quote">
                <Quote aria-hidden="true" />
                <p>
                  Berpikir kritis adalah awal.
                  <br />
                  Memberi dampak adalah tujuannya.
                </p>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          05 — PROFIL PENGURUS
          ===================================================== */}
      <section
        className="about-section about-section--officers"
        id="pengurus"
        aria-labelledby="pengurus-title"
      >
        <div className="about-container">
          <div className="about-reveal">
            <SectionHeading
              number="05"
              eyebrow="Profil Pengurus"
              id="pengurus-title"
            >
              Mereka yang Menjaga Roda Organisasi
            </SectionHeading>
          </div>

          <div className="about-reveal">
            <p className="about-officers-intro">
              {period
                ? `Pimpinan BPH serta ketua dan sekretaris setiap departemen untuk periode ${period.name}.`
                : "Perwakilan pengurus akan ditampilkan berdasarkan periode kepengurusan aktif."}
            </p>
          </div>

          {officerPreviewGroups.length > 0 ? (
            <div className="about-officer-grid">
              {officerPreviewGroups.map((group) => (
                <div
                  className="about-reveal about-officer-group"
                  key={group.id}
                >
                  <h3 title={group.name}>{group.name}</h3>

                  <div className="about-officer-list">
                    {group.members.map((member) => (
                      <article className="about-officer-card" key={member.id}>
                        <OfficerAvatar
                          src={member.photoUrl}
                          name={member.name}
                        />

                        <div>
                          <h4 title={member.name}>{member.name}</h4>
                          <p>{member.positionName}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="about-reveal about-officers-empty" role="status">
              <h3>Data pengurus belum tersedia</h3>
              <p>
                Susunan pengurus akan tampil setelah penugasan periode aktif
                disimpan melalui dashboard organisasi.
              </p>
            </div>
          )}

          <div className="about-reveal about-closing">
            <div className="about-closing-icon" aria-hidden="true">
              <UsersRound />
            </div>

            <div>
              <h2>Berbeda Peran, Satu Tujuan</h2>
              <p>
                Setiap departemen mempunyai fokus yang berbeda. Namun semuanya
                bergerak menuju arah yang sama: membangun organisasi yang kuat,
                anggota yang berkembang, dan kontribusi yang terasa bagi
                masyarakat.
              </p>
            </div>

            <Link
              href="/struktur"
              className="public-text-link about-closing-action"
            >
              Lihat Seluruh Pengurus
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
