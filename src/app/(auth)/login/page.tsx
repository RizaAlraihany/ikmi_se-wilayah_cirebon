import Image from "next/image";
import { Metadata } from "next";
import { LoginForm } from "./login-form";
import { Card, CardContent } from "@/components/ui/card";
import { IKMI_LOGO_URL } from "@/core/brand/assets";

export const metadata: Metadata = {
  title: "Login | Sistem Informasi Terpadu IKMI Cirebon",
  description: "Login aman untuk administrator IKMI Cirebon.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-background">
      <div className="mx-auto grid min-h-dvh w-full max-w-[120rem] lg:grid-cols-[minmax(20rem,0.82fr)_minmax(30rem,1.18fr)]">
      <section className="relative hidden overflow-hidden bg-primary p-10 text-surface lg:flex lg:items-end xl:p-14">
        <div className="pointer-events-none absolute -right-28 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-white/10" aria-hidden="true" />
        <div className="max-w-lg border-t border-white/30 pt-7">
          <Image
            src={IKMI_LOGO_URL}
            alt="Logo IKMI Cirebon"
            width={72}
            height={72}
            className="rounded-md"
            priority
          />
          <div className="mt-7 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/65">Ruang kerja internal</p>
            <p className="font-heading text-3xl font-bold leading-tight xl:text-4xl">
              Pengelolaan organisasi dalam satu alur kerja yang jelas.
            </p>
            <p className="max-w-md text-sm leading-7 text-white/78">
              Ruang kerja internal untuk mengelola Program, Agenda,
              keanggotaan, publikasi, dan layanan digital organisasi.
            </p>
          </div>
          <p className="relative mt-10 text-xs font-medium uppercase tracking-[0.12em] text-white/50">Sistem Informasi Terpadu IKMI Cirebon</p>
        </div>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-8 lg:min-h-0 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Image src={IKMI_LOGO_URL} alt="Logo IKMI Cirebon" width={48} height={48} className="rounded-md" priority />
            <div>
              <p className="font-heading text-base font-bold text-primary">IKMI Cirebon</p>
              <p className="text-xs text-muted">Ruang kerja internal</p>
            </div>
          </div>
        <Card className="w-full border-border/80 border-t-2 border-t-accent bg-surface shadow-lg">
          <CardContent className="space-y-7 p-5 sm:p-8">
            <div className="space-y-3 text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Ruang kerja admin</p>
                <h1 className="mt-2 font-heading text-2xl font-bold text-primary sm:text-3xl">
                  Masuk Dashboard
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Gunakan akun pengurus yang sudah terdaftar.
                </p>
              </div>
            </div>
            <LoginForm />
            <p className="border-t border-border pt-5 text-sm leading-6 text-text-secondary">
              Hubungi Super Admin untuk mendapatkan akses.
            </p>
          </CardContent>
        </Card>
        </div>
      </section>
      </div>
    </main>
  );
}
