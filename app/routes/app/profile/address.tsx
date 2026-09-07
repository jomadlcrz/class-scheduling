import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { ScreenHeader } from "~/components/ui/screen-header";
import { Skeleton } from "~/components/ui/skeleton";
import { profilePhotoService } from "~/services/profile-photo.service";
import type { AddressData } from "~/types/student";

export function meta() {
  return [
    { title: "Registered Address — GWC Class Scheduling" },
    { name: "description", content: "Official residential and postal address of the student." },
  ];
}

function InfoIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

export default function RegisteredAddressRoute() {
  return (
    <RoleGuard allow={["student"]}>
      <RegisteredAddressPage />
    </RoleGuard>
  );
}

function RegisteredAddressPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profilePhotoService
      .getAddress("student")
      .then(setAddress)
      .catch(() => setAddress(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-slate-50 dark:bg-surface">
      {/* Screen Header with Back Navigation */}
      <ScreenHeader
        title="Registered Address"
        showBack
        onBack={() => navigate(-1)}
        className="border-b border-slate-200/90 bg-white dark:border-white/10 dark:bg-surface"
      />

      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Your residential and postal address on official school record.
          </p>

          {loading ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-surface">
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-6 w-1/2 rounded-lg" />
                <Skeleton className="h-6 w-2/3 rounded-lg" />
              </div>
            </div>
          ) : address ? (
            <div className="space-y-4">
              {/* Grouped Content Card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-white/10 dark:bg-surface">
                <div className="divide-y divide-slate-100 p-5 dark:divide-white/5">
                  <div className="flex items-center justify-between pb-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Street
                    </span>
                    <span className="max-w-[65%] text-right text-xs font-bold text-slate-800 dark:text-slate-200">
                      {address.street || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Barangay & city
                    </span>
                    <span className="max-w-[65%] text-right text-xs font-bold text-slate-800 dark:text-slate-200">
                      {[address.barangay, address.cityMunicipality].filter(Boolean).join(", ") || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Province
                    </span>
                    <span className="max-w-[65%] text-right text-xs font-bold text-slate-800 dark:text-slate-200">
                      {address.province || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Postal code
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {address.zipCode || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Region
                    </span>
                    <span className="max-w-[65%] text-right text-xs font-bold text-slate-800 dark:text-slate-200">
                      {address.region || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informative Guidance Box */}
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-4 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                <InfoIcon size={16} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <p className="leading-relaxed">
                  To update your registered address, please present valid proof of residence (such as a Barangay Certificate or Utility Bill) to the Registrar&apos;s Office.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-xs dark:border-white/10 dark:bg-surface">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No home address on record
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Please contact the Registrar&apos;s Office to submit your residential address.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-4 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                <InfoIcon size={16} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <p className="leading-relaxed">
                  Official student records require an active residential address on file.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
