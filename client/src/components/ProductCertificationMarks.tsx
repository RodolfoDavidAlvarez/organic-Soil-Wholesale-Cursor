import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import {
  getOmriCertificate,
  isOmriCertLabel,
  isUsccCertLabel,
  OMRI_LOGO_SRC,
  USCC_LOGO_SRC,
  type OmriCertificate,
} from "@/data/omriCertifications";
import { cn } from "@/lib/utils";

type Props = {
  certifications: string[];
  productSlug?: string | null;
  productId?: number | null;
  /** Compact logos for cards; detail shows larger logos + certificate photo */
  variant?: "detail" | "card";
  className?: string;
};

export function ProductCertificationMarks({
  certifications,
  productSlug,
  productId,
  variant = "detail",
  className,
}: Props) {
  const omriDoc = getOmriCertificate({ slug: productSlug, productId });
  const hasOmriLabel = certifications.some(isOmriCertLabel) || Boolean(omriDoc);
  const hasUsccLabel = certifications.some(isUsccCertLabel);
  const otherCerts = certifications.filter((c) => !isOmriCertLabel(c) && !isUsccCertLabel(c));

  if (!hasOmriLabel && !hasUsccLabel && otherCerts.length === 0) return null;

  if (variant === "card") {
    if (!hasOmriLabel) return null;
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-white/95 px-1.5 py-0.5 shadow ring-1 ring-black/5 backdrop-blur-sm",
          className,
        )}
      >
        <img src={OMRI_LOGO_SRC} alt="OMRI Listed" className="h-5 w-auto sm:h-6" loading="lazy" />
      </span>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 sm:gap-2.5", className)}>
      {hasOmriLabel && <OmriLogoLink certificate={omriDoc} />}
      {hasUsccLabel && (
        <img
          src={USCC_LOGO_SRC}
          alt="US Compost Council"
          className="h-9 w-auto sm:h-10"
          loading="lazy"
        />
      )}
      {otherCerts.map((cert) => (
        <Badge key={cert} className="border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
          <ShieldCheck className="mr-1 h-3 w-3" />
          {cert}
        </Badge>
      ))}
    </div>
  );
}

function OmriLogoLink({ certificate }: { certificate?: OmriCertificate }) {
  const img = (
    <img
      src={OMRI_LOGO_SRC}
      alt="OMRI Listed"
      className="h-9 w-auto sm:h-10"
      loading="lazy"
    />
  );
  if (!certificate) return img;
  return (
    <a href={certificate.pdf} target="_blank" rel="noopener noreferrer" title="View OMRI certificate PDF">
      {img}
    </a>
  );
}
