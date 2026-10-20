"use client";

import { MainLayout } from "@/components/Layout/MainLayout";
import { RecentMovements } from "@/components/home/recent-movements";
import { FavoriteActions } from "@/components/home/favorite-actions";
import { NoticesCarousel } from "@/components/home/notices-carousel";
import { AssistantChat } from "@/components/home/assistant-chat";
import useAuthStore from "@/store/useAuthStore";
import { CheckInStatus } from "@/components/checkin/checkin-status";

function greeting(hour: number) {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function Home() {
  const { userNameSoter, newUserUsername } = useAuthStore();

  // Algunas cuentas traen el correo como nombre: se usa lo que va antes de "@".
  const rawName = (newUserUsername || userNameSoter || "").trim().split(/\s+/)[0] || "Usuario";
  const firstName = rawName.split("@")[0];
  const now = new Date();
  const date = now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

  return (
    <MainLayout>
      <link rel="icon" href="/favicon.ico" type="image/svg+xml" />
      <div className="min-h-[calc(100vh-4rem)] bg-[#F3F5F8]">
        <div className="w-full max-w-[1600px] mx-auto px-4 py-5 md:px-8 md:py-6 pb-24 flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex flex-col gap-1.5">
              <div className="text-[13px] font-medium text-slate-500 first-letter:uppercase">{date}</div>
              <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-slate-900">
                {greeting(now.getHours())}, {firstName}
              </h1>
              <CheckInStatus.Detail />
            </div>
            <CheckInStatus.Pill />
          </div>

          <div className="flex flex-col lg:flex-row lg:h-[max(600px,calc(100vh-190px))] gap-4">
            <div className="lg:flex-[0_0_clamp(300px,27%,420px)] min-w-0 min-h-0 flex flex-col">
              <RecentMovements className="flex-1" />
            </div>
            <div className="lg:flex-1 min-w-0 min-h-0 flex flex-col gap-4">
              <FavoriteActions className="lg:flex-1 lg:min-h-0" />
              <NoticesCarousel className="lg:flex-[0_0_36%]" />
            </div>
            <div className="lg:flex-[0_0_clamp(300px,27%,420px)] min-w-0 min-h-0 flex flex-col">
              <AssistantChat userName={firstName} className="flex-1" />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
