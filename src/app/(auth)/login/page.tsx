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
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,0.82fr)_minmax(28rem,1.18fr)]">
      <section className="hidden items-end border-r border-white/10 bg-primary p-10 text-surface lg:flex xl:p-14">
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
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <Card variant="glass" className="w-full max-w-md border-t-2 border-t-accent">
          <CardContent className="space-y-7 p-5 sm:p-7">
            <div className="space-y-3 text-left">
              <Image
                src={IKMI_LOGO_URL}
                alt="Logo IKMI Cirebon"
                width={64}
                height={64}
                className="rounded-md lg:hidden"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Ruang kerja admin</p>
                <h1 className="mt-2 font-heading text-2xl font-bold text-primary sm:text-3xl">
                  Masuk Dashboard
                </h1>
                <p className="mt-1 text-sm text-muted">
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
      </section>
    </main>
  );
}
