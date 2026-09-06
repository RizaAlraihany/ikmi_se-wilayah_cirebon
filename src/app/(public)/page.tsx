import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
  Newspaper,
  UserPlus,
  Users,
} from "lucide-react";

import { postQueries } from "@/features/blog/queries";
import { publicationPath } from "@/features/blog/publication-routes";
import { deriveAgendaStatus } from "@/features/agendas/domain";
import { getActivePublicBanners } from "@/features/homepage-banner/queries";
import { getPublicAgendaOccurrences } from "@/features/public/public-agenda";
import { getPublicPrograms } from "@/features/public/public-program";
import { deriveProgramStatus } from "@/features/programs/domain";
import { webConfigQueries } from "@/features/web-config/queries";
import {
  HeroSlideshow,
  type PublicHeroSlide,
} from "./_components/hero-slideshow";

export const dynamic = "force-dynamic";

type UnknownRecord = Record<string, unknown>;

const quickAccess = [
  {
    href: "/kegiatan",
    label: "Agenda",
    description: "Jadwal terdekat",
    Icon: CalendarDays,
  },
  {
    href: "/kegiatan",
    label: "Program",
    description: "Lihat ruang partisipasi",
    Icon: Users,
  },
  {
    href: "/#gabung",
    label: "Gabung IKMI",
    description: "Pendaftaran anggota",
    Icon: UserPlus,
  },
  {
    href: "/publikasi",
    label: "Publikasi",
    description: "Berita & gagasan",
    Icon: Newspaper,
  },
] as const;

const homeFaqs = [
  {
    question: "Apa itu IKMI Se-Wilayah Cirebon?",
    answer: "IKMI (Ikatan Keluarga Mahasiswa Indramayu) Se-Wilayah Cirebon adalah organisasi kedaerahan mahasiswa asal Indramayu yang menempuh pendidikan di Cirebon. Kami berfungsi sebagai wadah silaturahmi, ruang belajar dan bertumbuh, serta jembatan nyata pengabdian masyarakat guna menghasilkan kader yang kompeten, kritis, dan berkarya nyata.",
    Icon: Users,
  },
  {
    question: "Apa visi dan misi dari organisasi ini?",
    answer: "Napas perjuangan kami berfokus pada dua aspek komitmen integral: keilmuan dan kedaerahan. Melalui landasan falsafah \"Memayu Ing Jagat\", kami berkomitmen merawat persatuan mahasiswa Indramayu, menghidupkan ruang dialektika kritis, serta memberikan kontribusi terbaik demi kemajuan bumi Indramayu tercinta.",
    Icon: Briefcase,
  },
  {
    question: "Kapan organisasi ini didirikan dan bagaimana jajaran pengurus intinya?",
    answer: "IKMI didirikan pada tanggal 1 Desember 1999 sebagai wadah pergerakan intelektual mahasiswa. Secara struktural, roda organisasi IKMI dijalankan secara berkala oleh jajaran Badan Pengurus Harian (BPH) kabinet aktif serta beberapa departemen khusus yang menangani bidang internal, pengembangan potensi, hingga publikasi digital.",
    Icon: Clock3,
  },
  {
    question: "Apa saja program kerja utama tahunan organisasi ini?",
    answer: "IKMI Cirebon menyelenggarakan serangkaian program kerja unggulan tahunan yang dinamis dan berdampak nyata: PRABUMI, IKMI Sosial, IKMI DUGAWE, MAKRAB, CIMANUK & BASKARA, hingga Kunjungan Industri.",
    Icon: CalendarDays,
  },
  {
    question: "Di mana lokasi kantor sekretariat organisasi ini?",
    answer: "Kantor sekretariat resmi IKMI Se-Wilayah Cirebon berlokasi di Komplek Pilang Sari Endah Blok I No. 24, Kabupaten Cirebon. Tempat ini berfungsi sebagai pusat koordinasi administrasi sekaligus rumah bersama bagi seluruh anggota.",
    Icon: Briefcase,
  },
  {
    question: "Siapa yang bisa bergabung dengan IKMI?",
    answer: "Kamu tidak perlu mendaftar dari nol! Berdasarkan aturan dasar organisasi (AD/ART), seluruh mahasiswa aktif asal Kabupaten Indramayu yang sedang menempuh kuliah di wilayah Cirebon secara otomatis adalah anggota biasa IKMI. IKMI adalah rumah bersama kita di perantauan.",
    Icon: Users,
  },
  {
    question: "Bagaimana jika saya ingin menjadi pengurus IKMI?",
    answer: "Untuk kamu yang ingin berkontribusi lebih dalam, mengasah jiwa kepemimpinan, dan mengelola roda organisasi, kamu wajib mengikuti program kaderisasi formal kami yang bernama PRABUMI.",
    Icon: Briefcase,
  },
  {
    question: "Apa itu PRABUMI?",
    answer: "PRABUMI (Penerimaan Anggota Baru IKMI) adalah gerbang kaderisasi resmi sekaligus wadah pembekalan nilai kepemimpinan, pemahaman organisasi, dan tanggung jawab sosial khusus bagi calon pengurus aktif kabinet. Di sini kamu akan dibekali wawasan kepemimpinan dan tanggung jawab sosial untuk daerah.",
    Icon: BookOpen,
  },
  {
    question: "Bagaimana cara mengirim tulisan?",
    answer: "Punya opini, karya sastra, atau liputan menarik? Kamu bisa mengirimkannya lewat menu Kirim Tulisan. Prosesnya kami buat semudah mengunggah tugas kuliah—cukup unggah file dokumen draf tulisanmu (sangat disarankan format .docx) tanpa perlu registrasi akun yang rumit!",
    Icon: FileText,
  },
  {
    question: "Ke mana saya harus menghubungi jika memiliki pertanyaan lain?",
    answer: "Gunakan halaman Kontak untuk melihat kanal resmi organisasi yang sedang dikonfigurasi.",
    Icon: Users,
  },
] as const;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as UnknownRecord;
}
function readString(
  record: UnknownRecord | null,
  keys: readonly string[],
): string | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "Jadwal menyusul";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function formatDateParts(value: Date) {
  const parts = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).formatToParts(value);

  return {
    day: parts.find((part) => part.type === "day")?.value || "--",
    month:
      parts
        .find((part) => part.type === "month")
        ?.value.replace(".", "")
        .toUpperCase() || "---",
    year: parts.find((part) => part.type === "year")?.value || "----",
  };
}

function formatTimeRange(start: Date, end: Date | null | undefined) {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  });

  const startLabel = formatter.format(start).replace(".", ":");
  const endLabel = end ? formatter.format(end).replace(".", ":") : null;

  return endLabel ? `${startLabel} WIB – ${endLabel} WIB` : `${startLabel} WIB`;
}

function stripHtml(value: string | null | undefined) {
  return value?.replace(/<[^>]+>/g, "").trim() || "";
}

function activityStateLabel(status: ReturnType<typeof deriveProgramStatus>) {
  if (status === "ONGOING") return "Sedang Berjalan";
  if (status === "COMPLETED") return "Selesai";

  return "Akan Datang";
}

function activityStateClass(status: ReturnType<typeof deriveProgramStatus>) {
  if (status === "ONGOING") return "is-live";
  if (status === "COMPLETED") return "is-completed";

  return "is-upcoming";
}




export default async function Home() {
  const now = new Date();

  const [activeCampaigns, agendas, programs, posts, webConfig] =
    await Promise.all([
      getActivePublicBanners(),
      getPublicAgendaOccurrences(),
      getPublicPrograms(),
      postQueries.getPublishedPosts(4),
      webConfigQueries.getMergedWebConfig(),
    ]);

  const hero = webConfig.landing_hero;
  const landingSections = webConfig.landing_sections;

  /*
   * Hero sekarang hanya memakai foto dokumentasi.
   * Campaign BEFORE / ONGOING / AFTER tidak lagi mengubah copy hero.
   */
  const heroSlides: PublicHeroSlide[] = hero.slides
    .filter((slide) => Boolean(slide.url))
    .map((slide, index) => ({
      id: `hero-photo-${index + 1}`,
      desktopImage: slide.url,
      mobileImage: slide.url,
      alt: `Dokumentasi IKMI Cirebon ${index + 1}`,
    }));

  const aboutImage =
    landingSections.aboutImageUrl?.trim() ||
    heroSlides[0]?.desktopImage ||
    heroSlides[0]?.mobileImage ||
    "https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210005/BPHU_rkqdtg.png";
  const aboutImageAlt =
    landingSections.aboutImageAlt?.trim() ||
    "Dokumentasi kebersamaan IKMI Cirebon";

  /*
   * Agenda Beranda mengikuti bulan berjalan di zona waktu Asia/Jakarta.
   * Agenda batal tidak ditampilkan pada ringkasan homepage.
   */
  const nearestAgendas = agendas
    .filter(
      (agenda) =>
        deriveAgendaStatus(
          {
            startDatetime: agenda.start,
            endDatetime: agenda.end,
            status: agenda.status,
            scheduleType: agenda.scheduleType,
          },
          now,
        ) === "AKAN_DATANG",
    )
    .sort((left, right) => left.start.getTime() - right.start.getTime())
    .slice(0, 3);

  /*
   * Banner Kegiatan Terdekat:
   * 1. prioritaskan program yang sedang berjalan;
   * 2. jika tidak ada, ambil upcoming paling dekat;
   * 3. jika tidak ada, tampilkan program selesai terbaru sebagai AFTER state.
   */
  const programStates = programs.map((program) => ({
    program,
    status: deriveProgramStatus(program, now),
  }));

  const ongoingProgram =
    programStates
      .filter(({ status }) => status === "ONGOING")
      .sort((left, right) => {
        const a = left.program.plannedStart?.getTime() ?? 0;
        const b = right.program.plannedStart?.getTime() ?? 0;
        return b - a;
      })[0] ?? null;

  const upcomingProgram =
    programStates
      .filter(({ status }) => status === "UPCOMING")
      .sort((left, right) => {
        const a =
          left.program.plannedStart?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const b =
          right.program.plannedStart?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return a - b;
      })[0] ?? null;

  const completedProgram =
    programStates
      .filter(({ status }) => status === "COMPLETED")
      .sort((left, right) => {
        const a =
          left.program.plannedEnd?.getTime() ??
          left.program.plannedStart?.getTime() ??
          0;
        const b =
          right.program.plannedEnd?.getTime() ??
          right.program.plannedStart?.getTime() ??
          0;
        return b - a;
      })[0] ?? null;

  const featuredActivity =
    ongoingProgram ?? upcomingProgram ?? completedProgram ?? null;

  const featuredCampaign = featuredActivity
    ? (activeCampaigns.find((campaign) => {
        const campaignSlug = campaign.program?.slug;
        const campaignName = campaign.program?.name;

        return (
          (campaignSlug &&
            featuredActivity.program.slug &&
            campaignSlug === featuredActivity.program.slug) ||
          (campaignName && campaignName === featuredActivity.program.name)
        );
      }) ?? null)
    : null;

  const campaignRecord = asRecord(featuredCampaign);
  const featuredImage = readString(campaignRecord, [
    "desktopImage",
    "mobileImage",
  ]);

  const campaignCtaLabel =
    readString(campaignRecord, ["ctaLabel"]) ||
    (featuredActivity?.status === "COMPLETED"
      ? "Lihat Jejak Kegiatan"
      : "Lihat Detail Kegiatan");

  const configuredCampaignCtaHref =
    readString(campaignRecord, ["ctaUrl"]) ||
    (featuredActivity?.program.slug
      ? `/program/${featuredActivity.program.slug}`
      : "/program");

  const campaignCtaHref = /^\/program(?:\/|$)/.test(configuredCampaignCtaHref)
    ? "/kegiatan"
    : configuredCampaignCtaHref;

  return (
    <main id="view-beranda" className="home-page">
      <HeroSlideshow
        slides={heroSlides}
        eyebrow="IKMI CIREBON"
        title="Rumah Kedua Mahasiswa Indramayu"
        description="Ruang bertemu, bertumbuh, dan bergerak bagi mahasiswa Indramayu di Cirebon—merawat identitas daerah, menguatkan intelektualitas, dan menghadirkan kontribusi nyata."
        motto="Memayu Ing Jagat"
        primaryCta={{
          label: "Lihat Agenda Terdekat",
          href: "#agenda-terdekat",
        }}
        secondaryCta={{
          label: "Kenal IKMI",
          href: "/tentang",
        }}
      />

      {/* QUICK ACCESS */}
      <nav
        id="quick-access"
        className="quick-access-wrap"
        aria-label="Akses cepat"
      >
        <div className="quick-access-shell">
          {quickAccess.map(({ href, label, description, Icon }) => (
            <Link key={href} href={href} className="quick-link">
              <span className="quick-icon" aria-hidden="true">
                <Icon />
              </span>

              <span className="quick-copy">
                <strong>{label}</strong>
                <small>{description}</small>
              </span>

              <ArrowRight className="quick-arrow" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </nav>

      {/* TENTANG */}
      <section
        className="home-profile-section"
        aria-labelledby="tentang-heading"
      >
        <div className="home-container home-profile-layout">
          <div className="home-profile-copy">
            <p className="home-section-eyebrow">
              <span>TENTANG IKMI</span>
            </p>
            <h2 id="home-profile-heading">Belajar dari Rantau, Bergerak untuk Daerah</h2>
            <p className="hm-subhead">
              Rumah kedua yang hangat untuk belajar, bersilaturahmi, dan berkolaborasi di tanah rantau.
            </p>

            <div className="home-profile-description">
              <p>
                IKMI bukan sekadar organisasi kedaerahan biasa, melainkan tempat berkumpulnya mahasiswa Indramayu di Cirebon untuk bersama-sama mengasah daya kritis, merawat kebersamaan, dan berkarya nyata demi kemajuan daerah.
              </p>
            </div>

            <blockquote className="home-profile-quote">
              <div className="home-profile-quote-content">
                <span aria-hidden="true" className="home-profile-quote-mark">
                  “
                </span>
                <p className="home-profile-quote-text">Memayu Ing Jagat</p>
              </div>
              <Link href="/tentang" className="home-profile-quote-link">
                Selengkapnya tentang IKMI <ArrowRight aria-hidden="true" />
              </Link>
            </blockquote>
          </div>

          <div
            className={`home-profile-media${
              aboutImage ? " home-profile-media--with-image" : ""
            }`}
          >
            {aboutImage ? (
              <>
                <Image
                  src={aboutImage}
                  alt={aboutImageAlt}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="home-cover-image"
                />
                <span className="home-profile-photo-blend" aria-hidden="true" />
              </>
            ) : (
              <div className="home-profile-placeholder">
                <strong>Ruang dokumentasi IKMI</strong>
                <span>Foto akan diperbarui melalui dashboard.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AGENDA DAN KEGIATAN */}
      <section
        className="hm-section hm-agenda-section"
        aria-labelledby="home-activities-heading"
        id="agenda-terdekat"
      >
        <div className="home-container">
          <header className="hm-section-header">
            <div>
              <p className="hm-eyebrow">
                <span>AGENDA DAN KEGIATAN</span>
              </p>
              <h2 id="home-activities-heading">Agenda dan Kegiatan Terdekat</h2>
              <p className="hm-subhead">Dari ruang dialektika yang hangat hingga aksi pengabdian masyarakat—inilah denyut nadi aktivitas kami.</p>
            </div>
          </header>

          <div className="hm-split-grid">
            {/* KIRI — Agenda List */}
            <div className="hm-col-agenda">
              <p className="hm-col-label">Agenda Terdekat</p>

              {nearestAgendas.length ? (
                <ol className="hm-agenda-list" aria-label="Daftar agenda terdekat">
                  {nearestAgendas.map((agenda) => {
                    const date = formatDateParts(agenda.start);

                    return (
                      <li key={agenda.id}>
                        <Link
                          href="/kegiatan"
                          className="hm-agenda-row"
                        >
                          <time
                            dateTime={agenda.start.toISOString()}
                            className="hm-agenda-date"
                          >
                            <strong>{date.day}</strong>
                            <span>{date.month}</span>
                          </time>

                          <span className="hm-agenda-body">
                            <strong>{agenda.name}</strong>
                            <small>
                              <Clock3 aria-hidden="true" />
                              {formatTimeRange(agenda.start, agenda.end)}
                            </small>
                          </span>

                          <ArrowRight
                            className="hm-agenda-arrow"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="hm-empty-row">
                  <CalendarDays aria-hidden="true" />
                  <span>Jadwal akan muncul ketika tersedia.</span>
                </div>
              )}

              <Link href="/kegiatan" className="hm-text-link">
                Lihat Semua Agenda
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>

            {/* KANAN — Featured Program */}
            <div className="hm-col-program">
              <p className="hm-col-label">Kegiatan Terdekat</p>

              {featuredActivity ? (
                <div className="hm-program-card">
                  <div className="hm-program-media">
                    {featuredImage ? (
                      <Image
                        src={featuredImage}
                        alt={`Dokumentasi ${featuredActivity.program.name}`}
                        fill
                        sizes="(min-width: 1024px) 28vw, 100vw"
                        className="hm-cover-img"
                      />
                    ) : (
                      <div className="hm-media-empty" aria-hidden="true" />
                    )}
                    <span
                      className={`hm-status-badge hm-status-${activityStateClass(featuredActivity.status)}`}
                    >
                      {activityStateLabel(featuredActivity.status)}
                    </span>
                  </div>

                  <div className="hm-program-body">
                    <h3>{featuredActivity.program.name}</h3>

                    <p className="hm-program-meta">
                      <CalendarDays aria-hidden="true" />
                      <time
                        dateTime={
                          featuredActivity.program.plannedStart?.toISOString() ||
                          undefined
                        }
                      >
                        {formatDate(featuredActivity.program.plannedStart)}
                      </time>
                    </p>

                    <p className="hm-program-desc">
                      {stripHtml(featuredActivity.program.description) ||
                        "Informasi kegiatan akan diperbarui oleh pengurus IKMI Cirebon."}
                    </p>

                    <Link
                      href={campaignCtaHref}
                      className="hm-text-link"
                    >
                      {campaignCtaLabel}
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="hm-empty-row">
                  <FileText aria-hidden="true" />
                  <span>Program terbaru akan ditampilkan ketika dipublikasikan.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PUBLIKASI */}
      <section
        className="hm-section hm-pub-section"
        aria-labelledby="publikasi-heading"
      >
        <div className="home-container">
          <header className="hm-section-header hm-pub-header">
            <div>
              <p className="hm-eyebrow">
                <span>PUBLIKASI</span>
              </p>
              <h2 id="publikasi-heading">Publikasi Terbaru</h2>
              <p className="hm-subhead">
                Esai kritis, opini tajam, dan kabar hangat yang kami terbitkan untuk terus merawat tradisi literasi di tanah perantauan.
              </p>
            </div>

            <Link href="/publikasi" className="hm-text-link hm-header-action">
              Lihat Semua Publikasi
              <ArrowRight aria-hidden="true" />
            </Link>
          </header>

          {posts.length ? (
            <div className="hm-pub-clean-grid">
              {/* Hero Article (Kiri) */}
              <Link
                href={publicationPath(posts[0].slug)}
                className="hm-pub-hero"
              >
                <div className="hm-pub-hero-media">
                  {posts[0].thumbnailUrl ? (
                    <Image
                      src={posts[0].thumbnailUrl}
                      alt={posts[0].title}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="hm-cover-img"
                    />
                  ) : (
                    <div className="hm-media-empty" aria-hidden="true">
                      <Newspaper aria-hidden="true" />
                    </div>
                  )}
                  <span className="hm-pub-cat">{posts[0].category.name}</span>
                </div>
                <div className="hm-pub-hero-copy">
                  <time className="hm-pub-date">
                    {formatDate(posts[0].publishedAt)}
                  </time>
                  <h3>{posts[0].title}</h3>
                  <p>{posts[0].excerpt || stripHtml(posts[0].content)}</p>
                  <span className="hm-text-link hm-pub-read-more" aria-hidden="true">
                    Baca Selengkapnya
                    <ArrowRight aria-hidden="true" />
                  </span>
                </div>
              </Link>

              {/* Daftar Opini / Artikel (Kanan) */}
              <div className="hm-pub-opini-list">
                {posts.slice(1, 4).map((post) => (
                  <Link
                    key={post.id}
                    href={publicationPath(post.slug)}
                    className="hm-pub-opini-item"
                  >
                    <div className="hm-pub-opini-thumb">
                      {post.thumbnailUrl ? (
                        <Image
                          src={post.thumbnailUrl}
                          alt={post.title}
                          fill
                          sizes="(min-width: 640px) 150px, 100px"
                          className="hm-cover-img"
                        />
                      ) : (
                        <div className="hm-media-empty" aria-hidden="true">
                          <Newspaper aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="hm-pub-opini-body">
                      <div className="hm-pub-opini-top">
                        <span className="hm-pub-item-cat">{post.category.name}</span>
                        <time className="hm-pub-item-date">{formatDate(post.publishedAt)}</time>
                      </div>
                      <h4>{post.title}</h4>
                      <p>{post.excerpt || stripHtml(post.content)}</p>
                      <span className="hm-pub-opini-link" aria-hidden="true">
                        <span>Baca Opini</span>
                        <ArrowRight aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <EmptyEditorial
              title="Belum ada publikasi"
              description="Berita, opini, artikel, dan kajian yang terbit akan ditampilkan di sini."
              actionHref="/publikasi"
              actionLabel="Kunjungi publikasi"
            />
          )}
        </div>
      </section>

      {/* FAQ */}
      <section
        className="hm-section hm-faq-section"
        id="faq"
        aria-labelledby="home-faq-heading"
      >
        <div className="home-container">
          <header className="hm-faq-header-rubric">
            <p className="hm-eyebrow">
              <span>FAQ</span>
            </p>
            <h2 id="home-faq-heading">Pertanyaan yang Sering Ditanyakan</h2>
            <p className="hm-subhead">
              Punya keraguan atau ingin tahu lebih banyak? Temukan rangkuman jawaban cepat tentang IKMI di sini.
            </p>
          </header>

          <div className="hm-faq-open-grid">
            {homeFaqs.map((item, index) => {
              const numStr = (index + 1).toString().padStart(2, "0");

              return (
                <details key={item.question} className="hm-faq-rubric-item">
                  <summary>
                    <div className="hm-faq-q-inline">
                      <span className="hm-faq-rubric-num" aria-hidden="true">
                        {numStr}
                      </span>
                      <span className="hm-faq-q-text">
                        {item.question}
                      </span>
                    </div>
                    <ChevronDown
                      className="hm-faq-chevron"
                      aria-hidden="true"
                    />
                  </summary>

                  <div className="hm-faq-rubric-body">
                    <p className="hm-faq-answer">{item.answer}</p>
                  </div>
                </details>
              );
            })}
          </div>

          <div className="about-reveal about-closing hm-faq-closing" id="gabung">
            <div className="about-closing-icon" aria-hidden="true">
              <UserPlus />
            </div>

            <div>
              <h2>Siap Bertumbuh Bersama IKMI?</h2>
              <p>
                Mari bergabung dengan keluarga besar IKMI Se-Wilayah Cirebon untuk
                menjalin silaturahmi erat, mengasah potensi diri, serta berproses
                bersama menghadirkan kontribusi nyata bagi bumi Indramayu.
              </p>
            </div>

            <Link
              href="/gabung"
              className="public-text-link about-closing-action"
            >
              Gabung IKMI Sekarang
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}



function EmptyEditorial({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="home-empty-editorial">
      <h3>{title}</h3>
      <p>{description}</p>

      <Link href={actionHref} className="home-text-action">
        {actionLabel}
        <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}
