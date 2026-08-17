import Link from "next/link";
import Image from "next/image";
import { LineChart, Radar, RefreshCcw, TrendingUp } from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import heroImage from "../../public/hero-dashboard.jpg";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
            <Image src={heroImage} alt="" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-background/70" />
          </div>

          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Disease trend forecasting for the Kenya Medical Supplies Authority
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                DawAI tracks HIV, TB, and Malaria case trends across
                Kenya&apos;s eight regions and forecasts where disease
                activity is heading next &mdash; giving KEMSA an early,
                region-by-region view of rising disease burden before it
                becomes a crisis.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                  Get started
                </Link>
                <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  I already have an account
                </Link>
              </div>
            </div>

            {/* Feature cards */}
            <div className="mt-16 grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <LineChart className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-2">Case forecasting</CardTitle>
                  <CardDescription>
                    Monthly case-burden forecasts per region and disease,
                    generated from historical patterns with a confidence range.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-2">Regional comparison</CardTitle>
                  <CardDescription>
                    See which of Kenya&apos;s eight regions carry the greatest
                    current disease burden, ranked at a glance.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <RefreshCcw className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-2">Seasonal patterns</CardTitle>
                  <CardDescription>
                    Recurring seasonal peaks and troughs are surfaced per
                    disease, so rising activity doesn&apos;t come as a surprise.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Radar className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-2">Early trend signals</CardTitle>
                  <CardDescription>
                    Regions with a sustained rise in cases are flagged early,
                    instead of relying on retrospective monthly reports.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t border-border mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Explore the disease forecast dashboard
          </h2>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Create an account
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
              I already have an account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          DawAI &mdash; disease surveillance and forecasting for the Kenya
          Medical Supplies Authority.
        </div>
      </footer>
    </div>
  );
}
